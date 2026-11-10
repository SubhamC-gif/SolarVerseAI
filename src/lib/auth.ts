import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "homeowner" | "operator";

export async function getMyRole(): Promise<AppRole | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).maybeSingle();
  return (data?.role as AppRole | undefined) ?? null;
}

export const homeFor = (role: AppRole) => (role === "operator" ? "/operator" : "/homeowner");

/** Route guard: send users without a role to onboarding and users of the other role to their own dashboard. */
export async function requireRole(role: AppRole) {
  const mine = await getMyRole();
  if (!mine) throw redirect({ to: "/onboarding" });
  if (mine !== role) throw redirect({ to: homeFor(mine) });
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/** Switch the signed-in user's role (homeowner / operator) and refresh. */
export async function setMyRole(role: AppRole) {
  const id = await currentUserId();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: id, role }, { onConflict: "user_id" });
  if (error) throw error;
}
