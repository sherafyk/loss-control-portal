"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createOrRotateVesselKey, deactivateVesselKey } from "@/lib/actions/vessels";

type KeyRow = {
  vessel_code: string;
  active: boolean;
  rotated_at: string | null;
  created_at: string | null;
};

export function VesselKeysClient({
  vesselCodes,
  keys
}: {
  vesselCodes: string[];
  keys: KeyRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [lastGenerated, setLastGenerated] = useState<{ vesselCode: string; key: string } | null>(
    null
  );
  const keyMap = useMemo(() => {
    const m = new Map<string, KeyRow>();
    keys.forEach((k) => m.set(k.vessel_code, k));
    return m;
  }, [keys]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {lastGenerated ? (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-semibold">
            New key for {lastGenerated.vesselCode} (copy this now — it won’t be shown again):
          </div>
          <div className="mt-2 rounded bg-white p-3 font-mono text-sm break-all">
            {lastGenerated.key}
          </div>
          <div className="mt-2 text-xs text-emerald-900">
            Client link example: <span className="font-mono">/v/{lastGenerated.vesselCode}?k=KEY</span>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Vessel</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Status</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Rotated</th>
              <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vesselCodes.map((code) => {
              const k = keyMap.get(code);
              return (
                <tr key={code}>
                  <td className="border border-slate-300 px-3 py-2 font-medium">{code}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    {k ? (k.active ? "Active" : "Inactive") : "No key yet"}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{k?.rotated_at ?? ""}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const key = await createOrRotateVesselKey(code);
                            setLastGenerated({ vesselCode: code, key });
                          });
                        }}
                      >
                        {k ? "Rotate Key" : "Generate Key"}
                      </Button>

                      {k && k.active ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              await deactivateVesselKey(code);
                              setLastGenerated(null);
                              // Force refresh
                              window.location.reload();
                            });
                          }}
                        >
                          Deactivate
                        </Button>
                      ) : null}

                      <a
                        className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        href={`/v/${encodeURIComponent(code)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open vessel page
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}

            {vesselCodes.length === 0 ? (
              <tr>
                <td className="border border-slate-300 px-3 py-3 text-slate-500" colSpan={4}>
                  No vessel codes found yet (create a job first).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
