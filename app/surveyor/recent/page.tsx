import { supabaseServer } from "@/lib/supabase/server";

function formatDate(d: string): string {
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return d;
  }
}

export default async function RecentJobsPage() {
  const supabase = supabaseServer();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id,job_code,delivery_date,vessel_code,client_po,updated_at,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Recent Jobs (last 7 days)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Click a job to add uploads or update notes.
      </p>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load jobs: {error.message}
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Job</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Delivery Date</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Vessel</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Client PO</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map((j) => (
              <tr key={j.id}>
                <td className="border border-slate-300 px-3 py-2">
                  <a href={`/surveyor/jobs/${encodeURIComponent(j.job_code)}`} className="font-medium">
                    {j.job_code}
                  </a>
                </td>
                <td className="border border-slate-300 px-3 py-2">{j.delivery_date}</td>
                <td className="border border-slate-300 px-3 py-2">{j.vessel_code}</td>
                <td className="border border-slate-300 px-3 py-2">{j.client_po ?? ""}</td>
                <td className="border border-slate-300 px-3 py-2">{formatDate(j.updated_at ?? j.created_at)}</td>
              </tr>
            ))}
            {(jobs ?? []).length === 0 ? (
              <tr>
                <td className="border border-slate-300 px-3 py-3 text-slate-500" colSpan={5}>
                  No jobs found in the last 7 days (or you don’t have access).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
