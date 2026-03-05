import { getUserAndProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function hasAdminSession(): Promise<boolean> {
  const u = await getUserAndProfile();
  return u?.profile?.role === "admin";
}

export async function verifyVesselAccessOrAdmin(params: {
  vesselCode: string;
  accessKey: string | null | undefined;
}): Promise<{ ok: boolean; reason?: string }> {
  if (await hasAdminSession()) return { ok: true };

  const key = params.accessKey?.trim();
  if (!key) return { ok: false, reason: "Missing access key (?k=...)" };

  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("verify_vessel_access_key", {
    p_vessel_code: params.vesselCode,
    p_key: key
  });

  if (error) return { ok: false, reason: `Verification error: ${error.message}` };
  if (data !== true) return { ok: false, reason: "Invalid access key" };

  return { ok: true };
}
