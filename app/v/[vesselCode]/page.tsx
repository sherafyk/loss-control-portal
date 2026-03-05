import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyVesselAccessOrAdmin } from "@/lib/vesselAccess";

function prettyDate(yyyymmdd: string): string {
  // Expects YYYY-MM-DD
  try {
    const d = new Date(yyyymmdd + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return yyyymmdd;
  }
}

export default async function VesselPage({
  params,
  searchParams
}: {
  params: { vesselCode: string };
  searchParams: { k?: string };
}) {
  const vesselCode = params.vesselCode.toUpperCase();
  const accessKey = searchParams.k ?? null;

  const access = await verifyVesselAccessOrAdmin({ vesselCode, accessKey });
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
              /v/{vesselCode}?k=YOUR_VESSEL_KEY
            </div>
          </div>
        </div>
      </div>
    );
  }

  const admin = supabaseAdmin();

  const { data: jobs, error } = await admin
    .from("jobs")
    .select("job_code,delivery_date,vessel_code")
    .eq("vessel_code", vesselCode)
    .order("delivery_date", { ascending: false });

  const keySuffix = accessKey ? `?k=${encodeURIComponent(accessKey)}` : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Vessel {vesselCode}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Historical jobs / reports for this vessel code.
        </p>
        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Failed to load: {error.message}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Reports</h2>
        <div className="mt-3 space-y-2">
          {(jobs ?? []).map((j) => (
            <a
              key={j.job_code}
              className="block rounded border border-slate-200 px-4 py-3 hover:bg-slate-50"
              href={`/r/${encodeURIComponent(j.job_code)}${keySuffix}`}
            >
              <div className="font-medium">{j.job_code}</div>
              <div className="text-xs text-slate-500">{prettyDate(j.delivery_date)}</div>
            </a>
          ))}
          {(jobs ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No reports found.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
