import { supabaseServer } from "@/lib/supabase/server";
import { VesselKeysClient } from "@/components/admin/VesselKeysClient";

export default async function AdminVesselsPage() {
  const supabase = supabaseServer();

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("vessel_code")
    .order("vessel_code", { ascending: true });

  const vesselCodes = Array.from(new Set((jobRows ?? []).map((r) => r.vessel_code))).filter(Boolean);

  const { data: keys } = await supabase
    .from("vessel_access_keys")
    .select("vessel_code,active,rotated_at,created_at")
    .order("vessel_code", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Vessel Access Keys</h1>
        <p className="mt-2 text-sm text-slate-700">
          Clients access vessel history and reports with a long shared key (no client logins).
          Generate / rotate the key per vessel code.
        </p>
      </div>

      <VesselKeysClient vesselCodes={vesselCodes} keys={keys ?? []} />
    </div>
  );
}
