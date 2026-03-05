"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDriveFolderId, uploadToDrive, driveFileWebViewLink } from "@/lib/drive";

function yyyymmddFromDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date.");
  const yyyy = d.getFullYear().toString().padStart(4, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function normalizeVesselCode(code: string): string {
  const up = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(up)) throw new Error("Vessel code must be exactly 3 letters (A-Z).");
  return up;
}

function safeExt(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "bin";
  const ext = parts[parts.length - 1]?.toLowerCase() ?? "bin";
  // allow common types
  if (!/^[a-z0-9]{1,10}$/.test(ext)) return "bin";
  return ext;
}

const createJobSchema = z.object({
  delivery_date: z.string().min(1),
  client_po: z.string().optional().nullable(),
  vessel_name: z.string().optional().nullable(),
  vessel_code: z.string().min(3),
  barge_name: z.string().optional().nullable(),
  tankerman_name: z.string().optional().nullable(),
  tankerman_phone: z.string().optional().nullable(),
  q1_nothing: z.string().optional().nullable(),
  q1_response: z.string().optional().nullable(),
  q2_nothing: z.string().optional().nullable(),
  q2_response: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function createJobWithOpeningUpload(formData: FormData) {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect("/auth/login");
  }

  const parsed = createJobSchema.parse({
    delivery_date: formData.get("delivery_date"),
    client_po: formData.get("client_po"),
    vessel_name: formData.get("vessel_name"),
    vessel_code: formData.get("vessel_code"),
    barge_name: formData.get("barge_name"),
    tankerman_name: formData.get("tankerman_name"),
    tankerman_phone: formData.get("tankerman_phone"),
    q1_nothing: formData.get("q1_nothing"),
    q1_response: formData.get("q1_response"),
    q2_nothing: formData.get("q2_nothing"),
    q2_response: formData.get("q2_response"),
    notes: formData.get("notes")
  });

  const vesselCode = normalizeVesselCode(parsed.vessel_code);
  const yyyymmdd = yyyymmddFromDate(parsed.delivery_date);
  const jobCode = `${yyyymmdd}-${vesselCode}`;

  const file = formData.get("opening_file");
  if (!(file instanceof File)) {
    throw new Error("Opening Figures file is required.");
  }

  // Prevent duplicate job codes.
  const existing = await supabase
    .from("jobs")
    .select("id,job_code")
    .eq("job_code", jobCode)
    .maybeSingle();

  if (existing.data?.id) {
    // Redirect to update flow instead of creating a duplicate.
    redirect(`/surveyor/jobs/${encodeURIComponent(jobCode)}?error=job_exists`);
  }

  const folderId = getDriveFolderId();
  const ext = safeExt(file.name);
  const seqNo = 1;
  const driveFileName = `${jobCode}-${seqNo}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  // Upload to Drive first; if this fails, we don't create a DB row.
  const driveRes = await uploadToDrive({
    folderId,
    fileName: driveFileName,
    mimeType,
    buffer
  });

  const driveLink = driveRes.webViewLink ?? driveFileWebViewLink(driveRes.id);

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      job_code: jobCode,
      delivery_date: parsed.delivery_date,
      client_po: parsed.client_po ?? null,
      vessel_name: parsed.vessel_name ?? null,
      vessel_code: vesselCode,
      barge_name: parsed.barge_name ?? null,
      tankerman_name: parsed.tankerman_name ?? null,
      tankerman_phone: parsed.tankerman_phone ?? null,
      q1_nothing_to_report: !!parsed.q1_nothing,
      q1_response: parsed.q1_response ?? null,
      q2_nothing_to_report: !!parsed.q2_nothing,
      q2_response: parsed.q2_response ?? null,
      notes: parsed.notes ?? null,
      created_by: user.id,
      updated_by: user.id
    })
    .select("id,job_code")
    .single();

  if (jobErr) {
    throw new Error(`Failed to create job: ${jobErr.message}`);
  }

  const { error: fileErr } = await supabase.from("job_files").insert({
    job_id: job.id,
    kind: "OPENING_FIGURES",
    sequence_no: seqNo,
    drive_file_id: driveRes.id,
    drive_file_name: driveRes.name,
    drive_web_view_link: driveLink,
    mime_type: mimeType,
    uploaded_by: user.id
  });

  if (fileErr) {
    throw new Error(`Job created but file record failed: ${fileErr.message}`);
  }

  revalidatePath("/surveyor/recent");
  redirect(`/surveyor/jobs/${encodeURIComponent(jobCode)}`);
}

export async function updateJobMeta(jobId: string, formData: FormData) {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth/login");

  const parsed = createJobSchema
    .omit({ delivery_date: true, vessel_code: true })
    .parse({
      client_po: formData.get("client_po"),
      vessel_name: formData.get("vessel_name"),
      barge_name: formData.get("barge_name"),
      tankerman_name: formData.get("tankerman_name"),
      tankerman_phone: formData.get("tankerman_phone"),
      q1_nothing: formData.get("q1_nothing"),
      q1_response: formData.get("q1_response"),
      q2_nothing: formData.get("q2_nothing"),
      q2_response: formData.get("q2_response"),
      notes: formData.get("notes")
    });

  const { error } = await supabase
    .from("jobs")
    .update({
      client_po: parsed.client_po ?? null,
      vessel_name: parsed.vessel_name ?? null,
      barge_name: parsed.barge_name ?? null,
      tankerman_name: parsed.tankerman_name ?? null,
      tankerman_phone: parsed.tankerman_phone ?? null,
      q1_nothing_to_report: !!parsed.q1_nothing,
      q1_response: parsed.q1_response ?? null,
      q2_nothing_to_report: !!parsed.q2_nothing,
      q2_response: parsed.q2_response ?? null,
      notes: parsed.notes ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to update job: ${error.message}`);

  revalidatePath(`/surveyor/jobs`);
  revalidatePath(`/surveyor/recent`);
}

export async function uploadAdditionalJobFile(jobId: string, kind: string, formData: FormData) {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth/login");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("File is required.");
  }

  // Fetch job_code for naming
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("job_code")
    .eq("id", jobId)
    .single();

  if (jobErr) throw new Error(`Job not found: ${jobErr.message}`);

  // Determine next sequence number
  const { data: maxRow, error: maxErr } = await supabase
    .from("job_files")
    .select("sequence_no")
    .eq("job_id", jobId)
    .order("sequence_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw new Error(`Failed to determine next sequence: ${maxErr.message}`);

  const nextSeq = (maxRow?.sequence_no ?? 0) + 1;

  const folderId = getDriveFolderId();
  const ext = safeExt(file.name);
  const driveFileName = `${job.job_code}-${nextSeq}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const driveRes = await uploadToDrive({
    folderId,
    fileName: driveFileName,
    mimeType,
    buffer
  });
  const driveLink = driveRes.webViewLink ?? driveFileWebViewLink(driveRes.id);

  const { error: insErr } = await supabase.from("job_files").insert({
    job_id: jobId,
    kind,
    sequence_no: nextSeq,
    drive_file_id: driveRes.id,
    drive_file_name: driveRes.name,
    drive_web_view_link: driveLink,
    mime_type: mimeType,
    uploaded_by: user.id
  });

  if (insErr) throw new Error(`Failed to save file record: ${insErr.message}`);

  // Touch job updated_at
  await supabase
    .from("jobs")
    .update({ updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  revalidatePath(`/surveyor/jobs/${encodeURIComponent(job.job_code)}`);
}
