import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyVesselAccessOrAdmin } from "@/lib/vesselAccess";
import { ReportRenderer, type ReportBlock } from "@/components/ReportRenderer";

function prettyDate(yyyymmdd: string): string {
  try {
    const d = new Date(yyyymmdd + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return yyyymmdd;
  }
}

export default async function ReportPage({
  params,
  searchParams
}: {
  params: { jobCode: string };
  searchParams: { k?: string };
}) {
  const accessKey = searchParams.k ?? null;
  const admin = supabaseAdmin();

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id,job_code,delivery_date,vessel_code,vessel_name,client_po")
    .eq("job_code", params.jobCode)
    .single();

  if (jobErr || !job) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Report not found: {jobErr?.message ?? "Unknown error"}
      </div>
    );
  }

  const access = await verifyVesselAccessOrAdmin({ vesselCode: job.vessel_code, accessKey });
  if (!access.ok) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Access denied: {access.reason}
        </div>
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-700">
          <div className="font-semibold">How to access</div>
          <div className="mt-1">
            Use the vessel link with the shared key:
            <div className="mt-2 rounded bg-slate-100 p-3 font-mono text-xs break-all">
              /v/{job.vessel_code}?k=YOUR_VESSEL_KEY
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: blocks } = await admin
    .from("report_blocks")
    .select("id,sort_order,block_type,heading_level,title,table_type,markdown")
    .eq("job_id", job.id)
    .order("sort_order", { ascending: true });

  const { data: history } = await admin
    .from("jobs")
    .select("job_code,delivery_date")
    .eq("vessel_code", job.vessel_code)
    .order("delivery_date", { ascending: false });

  const keySuffix = accessKey ? `?k=${encodeURIComponent(accessKey)}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4 h-fit lg:sticky lg:top-6">
        <div className="text-sm font-semibold">Vessel {job.vessel_code}</div>
        <div className="mt-1 text-xs text-slate-500">
          {job.vessel_name ? job.vessel_name : "—"}
        </div>

        <div className="mt-4 text-xs font-semibold text-slate-600">Reports</div>
        <div className="mt-2 space-y-1">
          {(history ?? []).map((h) => (
            <a
              key={h.job_code}
              href={`/r/${encodeURIComponent(h.job_code)}${keySuffix}`}
              className={
                "block rounded px-2 py-2 text-sm hover:bg-slate-50 " +
                (h.job_code === job.job_code ? "bg-slate-100 font-medium" : "")
              }
            >
              <div>{h.job_code}</div>
              <div className="text-[11px] text-slate-500">{prettyDate(h.delivery_date)}</div>
            </a>
          ))}
        </div>

        <div className="mt-4">
          <a
            className="inline-flex rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            href={`/v/${encodeURIComponent(job.vessel_code)}${keySuffix}`}
          >
            View vessel index
          </a>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{job.job_code}</h1>
              <div className="mt-1 text-sm text-slate-600">
                {prettyDate(job.delivery_date)} • Vessel: {job.vessel_code}
              </div>
              {job.client_po ? (
                <div className="mt-1 text-sm text-slate-600">Client PO: {job.client_po}</div>
              ) : null}
            </div>
          </div>
        </div>

        {(blocks ?? []).length > 0 ? (
          <ReportRenderer blocks={blocks as any as ReportBlock[]} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No report content yet. (Admin needs to paste Markdown tables in the report editor.)
          </div>
        )}
      </section>
    </div>
  );
}
