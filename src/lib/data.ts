import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Plant = Tables<"plants">;
export type Task = Tables<"maintenance_tasks">;
export type Inspection = Tables<"inspections">;
export type Assessment = Tables<"assessments">;

async function rows<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>) {
  const { data, error } = await p;
  if (error) throw error;
  return data ?? [];
}

export const plantsQuery = queryOptions({
  queryKey: ["plants"],
  queryFn: () => rows<Plant>(supabase.from("plants").select("*").order("created_at")),
});
export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: () => rows<Task>(supabase.from("maintenance_tasks").select("*").order("done").order("due_on", { nullsFirst: false })),
});
export const inspectionsQuery = (kind: "fault" | "soiling") =>
  queryOptions({
    queryKey: ["inspections", kind],
    queryFn: () => rows<Inspection>(supabase.from("inspections").select("*").eq("kind", kind).order("created_at", { ascending: false }).limit(30)),
  });
export const assessmentsQuery = queryOptions({
  queryKey: ["assessments"],
  queryFn: () => rows<Assessment>(supabase.from("assessments").select("*").order("created_at", { ascending: false })),
});
export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    return { email: u.user.email ?? "", ...(data ?? { id: u.user.id, display_name: null, city: null, state: null }) };
  },
});

/** Deterministic illustrative daily curve for a plant (MW), clearly demo data. */
export function plantDay(capacityKw: number, pr = 80) {
  const mw = capacityKw / 1000;
  return Array.from({ length: 15 }, (_, i) => {
    const h = i + 5;
    const irr = Math.max(0, Math.sin(((h - 6) / 13) * Math.PI)) * 950;
    const exp = (irr / 1000) * mw * 0.85;
    return { hour: `${h}:00`, expected: +exp.toFixed(3), actual: +(exp * (pr / 85) * (0.96 + ((i * 7) % 5) / 100)).toFixed(3), irradiance: Math.round(irr) };
  });
}
