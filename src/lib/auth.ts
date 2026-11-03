import { supabase } from "@/integrations/supabase/client";

export type AppRole = "homeowner" | "operator";

export async function getMyRole(): Promise<AppRole | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).maybeSingle();
  return (data?.role as AppRole | undefined) ?? null;
}

export const homeFor = (role: AppRole) => (role === "operator" ? "/operator" : "/homeowner");
