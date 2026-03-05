"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeVesselCode(code: string): string {
  const up = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(up)) throw new Error("Vessel code must be exactly 3 letters (A-Z).");
  return up;
}

export async function createOrRotateVesselKey(vesselCode: string) {
  await requireAdmin();

  const code = normalizeVesselCode(vesselCode);
  const admin = supabaseAdmin();

  const { data, error } = await admin.rpc("create_vessel_access_key", {
    p_vessel_code: code
  });

  if (error) throw new Error(error.message);

  // Returns the plain-text key ONCE so you can copy/share it.
  return z.string().parse(data);
}

export async function deactivateVesselKey(vesselCode: string) {
  await requireAdmin();
  const code = normalizeVesselCode(vesselCode);
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("vessel_access_keys")
    .update({ active: false })
    .eq("vessel_code", code);

  if (error) throw new Error(error.message);
}
