import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "surveyor" | "admin";
};

export async function getUserAndProfile(): Promise<
  | { userId: string; email: string | null; profile: Profile | null }
  | null
> {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile: (profile as any) ?? null };
}

export async function requireUser() {
  const result = await getUserAndProfile();
  if (!result) redirect("/auth/login");
  return result;
}

export async function requireAdmin() {
  const result = await requireUser();
  if (result.profile?.role !== "admin") {
    redirect("/surveyor");
  }
  return result;
}
