import { supabaseServer } from "@/lib/supabase/server";
import { updateJobMeta, uploadAdditionalJobFile } from "@/lib/actions/jobs";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

function kindLabel(kind: string): string {
  switch (kind) {
    case "OPENING_FIGURES":
      return "Initial Opening Figures";
    case "BOL":
      return "Final Barge Inventory Sheet (BOL)";
    case "BDN":
      return "Final Bunker Delivery Note (BDN)";
    case "OTHER":
      return "Other / Supporting Doc";
    default:
      return kind;
  }
}

export default async function SurveyorJobPage({
  params,
  searchParams
}: {
  params: { jobCode: string };
  searchParams: { error?: string };
}) {
  const supabase = supabaseServer();

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("job_code", params.jobCode)
    .single();

  if (jobErr || !job) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Job not found or not accessible: {jobErr?.message ?? "Unknown error"}
      </div>
    );
  }

  const { data: files } = await supabase
    .from("job_files")
    .select("id,kind,sequence_no,drive_file_name,drive_web_view_link,uploaded_at")
    .eq("job_id", job.id)
    .order("sequence_no", { ascending: true });

  return (
    <div className="space-y-6">
      {searchParams.error === "job_exists" ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A job with this code already exists. You can update it here.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{job.job_code}</h1>
            <div className="text-sm text-slate-600">
              Delivery Date: {job.delivery_date} • Vessel: {job.vessel_code}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href={`/admin/jobs/${encodeURIComponent(job.job_code)}/report`}
            >
              Admin: Edit Report (Markdown)
            </a>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-semibold">Uploaded Files</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">#</th>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Kind</th>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Drive File</th>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {(files ?? []).map((f) => (
                <tr key={f.id}>
                  <td className="border border-slate-300 px-3 py-2">{f.sequence_no}</td>
                  <td className="border border-slate-300 px-3 py-2">{kindLabel(f.kind)}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    {f.drive_web_view_link ? (
                      <a href={f.drive_web_view_link} target="_blank" rel="noreferrer">
                        {f.drive_file_name}
                      </a>
                    ) : (
                      f.drive_file_name
                    )}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{f.uploaded_at}</td>
                </tr>
              ))}
              {(files ?? []).length === 0 ? (
                <tr>
                  <td className="border border-slate-300 px-3 py-3 text-slate-500" colSpan={4}>
                    No files yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-lg font-semibold">Update Job Info / Notes</h2>
        <form className="mt-3 space-y-4" action={updateJobMeta.bind(null, job.id)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Client PO</label>
              <Input name="client_po" defaultValue={job.client_po ?? ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Vessel Name (optional)</label>
              <Input name="vessel_name" defaultValue={job.vessel_name ?? ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Barge Name</label>
              <Input name="barge_name" defaultValue={job.barge_name ?? ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Tankerman Name</label>
              <Input name="tankerman_name" defaultValue={job.tankerman_name ?? ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Tankerman Phone</label>
              <Input name="tankerman_phone" defaultValue={job.tankerman_phone ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">
                  Q1: POI communication transparency / timeframe
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" name="q1_nothing" value="1" defaultChecked={!!job.q1_nothing_to_report} />
                  Nothing to report
                </label>
              </div>
              <Textarea name="q1_response" className="mt-2" rows={4} defaultValue={job.q1_response ?? ""} />
            </div>

            <div className="rounded border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Q2: Issues with delivery/paperwork</label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" name="q2_nothing" value="1" defaultChecked={!!job.q2_nothing_to_report} />
                  Nothing to report
                </label>
              </div>
              <Textarea name="q2_response" className="mt-2" rows={4} defaultValue={job.q2_response ?? ""} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea name="notes" className="mt-2" rows={4} defaultValue={job.notes ?? ""} />
          </div>

          <Button type="submit" variant="secondary">
            Save Updates
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Add Uploads</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each new upload gets the next sequential filename in Drive, like <code>{job.job_code}-2.jpg</code>, <code>{job.job_code}-3.pdf</code>, etc.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-slate-200 p-4">
            <div className="font-medium">Upload: Final Barge Inventory Sheet (BOL)</div>
            <form className="mt-3 space-y-3" action={uploadAdditionalJobFile.bind(null, job.id, "BOL")}>
              <input className="block w-full text-sm" type="file" name="file" />
              <Button type="submit">Upload BOL</Button>
            </form>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <div className="font-medium">Upload: Final Bunker Delivery Note (BDN)</div>
            <form className="mt-3 space-y-3" action={uploadAdditionalJobFile.bind(null, job.id, "BDN")}>
              <input className="block w-full text-sm" type="file" name="file" />
              <Button type="submit">Upload BDN</Button>
            </form>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <div className="font-medium">Upload: Additional Opening Figures (optional)</div>
            <form className="mt-3 space-y-3" action={uploadAdditionalJobFile.bind(null, job.id, "OPENING_FIGURES")}>
              <input className="block w-full text-sm" type="file" name="file" />
              <Button type="submit">Upload Opening Figures</Button>
            </form>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <div className="font-medium">Upload: Other / Supporting Document</div>
            <form className="mt-3 space-y-3" action={uploadAdditionalJobFile.bind(null, job.id, "OTHER")}>
              <input className="block w-full text-sm" type="file" name="file" />
              <Button type="submit">Upload Other</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
