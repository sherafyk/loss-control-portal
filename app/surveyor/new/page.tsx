import { supabaseServer } from "@/lib/supabase/server";
import { createJobWithOpeningUpload } from "@/lib/actions/jobs";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

function uniq(values: (string | null)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = (v ?? "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export default async function NewJobPage() {
  const supabase = supabaseServer();

  // Pull a small recent sample to populate dropdown suggestions (datalist).
  const { data: recent } = await supabase
    .from("jobs")
    .select("vessel_name,vessel_code,barge_name,tankerman_name,tankerman_phone")
    .order("created_at", { ascending: false })
    .limit(200);

  const vesselNames = uniq((recent ?? []).map((r) => r.vessel_name));
  const vesselCodes = uniq((recent ?? []).map((r) => r.vessel_code));
  const bargeNames = uniq((recent ?? []).map((r) => r.barge_name));
  const tankermanNames = uniq((recent ?? []).map((r) => r.tankerman_name));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">New Job (creates on first upload)</h1>

        <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Upstream audit surveys are performed by the Client Representative.</div>
          <div className="mt-1">
            This form is completed by the field surveyor to enhance chain-of-custody communication for
            documents, measurements, correspondence, and delivery paperwork—supporting loss control.
          </div>
        </div>

        <form className="mt-6 space-y-6" action={createJobWithOpeningUpload}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Bunker Delivery Date</label>
              <Input type="date" name="delivery_date" required />
              <p className="mt-1 text-xs text-slate-500">Used to generate the job code: YYYYMMDD-ABC.</p>
            </div>

            <div>
              <label className="text-sm font-medium">Client PO</label>
              <Input name="client_po" placeholder="PO12345" />
            </div>

            <div>
              <label className="text-sm font-medium">Vessel Name (dropdown + type)</label>
              <Input name="vessel_name" placeholder="(Optional display name)" list="vessel_names" />
              <datalist id="vessel_names">
                {vesselNames.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">Suggestions are based on recent jobs.</p>
            </div>

            <div>
              <label className="text-sm font-medium">Vessel Three Letter Code</label>
              <Input name="vessel_code" placeholder="MTC" required maxLength={3} list="vessel_codes" />
              <datalist id="vessel_codes">
                {vesselCodes.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">Exactly 3 letters (A–Z).</p>
            </div>

            <div>
              <label className="text-sm font-medium">Barge Name (dropdown + type)</label>
              <Input name="barge_name" placeholder="(Barge name)" list="barge_names" />
              <datalist id="barge_names">
                {bargeNames.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-sm font-medium">Barge POI First Name + Last Initial (Tankerman)</label>
              <Input name="tankerman_name" placeholder="Nathan S." list="tankerman_names" />
              <datalist id="tankerman_names">
                {tankermanNames.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-sm font-medium">Barge POI Contact (Tankerman Phone)</label>
              <Input name="tankerman_phone" placeholder="+1 (555) 555-5555" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">
                  Q1: Was the barge POI transparent and communicating within a reasonable timeframe?
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" name="q1_nothing" value="1" />
                  Nothing to report
                </label>
              </div>
              <Textarea
                name="q1_response"
                className="mt-2"
                rows={4}
                placeholder="Required unless 'Nothing to report' is checked."
              />
              <p className="mt-1 text-xs text-slate-500">
                Make sure either the checkbox is checked or a note is entered (admin can validate later).
              </p>
            </div>

            <div className="rounded border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">
                  Q2: Any issues with delivery operations, documents, or paperwork?
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" name="q2_nothing" value="1" />
                  Nothing to report
                </label>
              </div>
              <Textarea
                name="q2_response"
                className="mt-2"
                rows={4}
                placeholder="Required unless 'Nothing to report' is checked."
              />
              <p className="mt-1 text-xs text-slate-500">
                Make sure either the checkbox is checked or a note is entered (admin can validate later).
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <label className="text-sm font-medium">Upload: Initial Opening Figures (Image or PDF)</label>
            <input className="mt-2 block w-full text-sm" type="file" name="opening_file" required />
            <p className="mt-1 text-xs text-slate-500">
              This creates the job and uploads the file to the configured Google Drive folder.
            </p>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea name="notes" className="mt-2" rows={4} placeholder="Any extra context..." />
          </div>

          <Button type="submit">Create Job</Button>
        </form>
      </div>
    </div>
  );
}
