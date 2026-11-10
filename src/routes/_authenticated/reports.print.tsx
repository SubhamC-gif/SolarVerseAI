import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DemoBadge, Logo } from "@/components/brand";
import { inr, fmt, fmtDate } from "@/lib/solar";

export const Route = createFileRoute("/_authenticated/reports/print")({
  head: () => ({
    meta: [
      { title: "Print report — SolarVerse AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : "",
  }),
  component: PrintReport,
});

function PrintReport() {
  const { id } = Route.useSearch();
  const printed = useRef(false);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["assessment", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Open the browser's print view once, as soon as the report is available.
  useEffect(() => {
    if (!report || printed.current) return;
    printed.current = true;
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [report]);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading report…</div>;
  }

  if (isError || !report) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            This report could not be found, or it belongs to another account.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/homeowner">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const inputs = (report.inputs ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === "" ? null : Number(v));

  const details: [string, string][] = [];
  const direction = inputs["direction"];
  if (typeof direction === "string") details.push(["Roof direction", direction]);
  const shading = inputs["shading"];
  if (typeof shading === "string") details.push(["Shading", shading]);
  const roof = num(inputs["roofSqft"]);
  if (roof != null) details.push(["Shadow-free roof area", `${fmt(roof)} sq ft`]);
  const units = num(inputs["monthlyUnits"]);
  if (units != null) details.push(["Monthly usage", `${fmt(units)} kWh`]);
  const tariff = num(inputs["tariff"]);
  if (tariff != null) details.push(["Electricity tariff", `₹${fmt(tariff, 2)}/kWh`]);
  const battery = inputs["battery"];
  if (typeof battery === "boolean") details.push(["Battery backup", battery ? "Yes" : "No"]);

  const figures: [string, string][] = [
    ["System size", `${fmt(report.capacity_kw, 1)} kW`],
    ["Annual generation", `${fmt(report.annual_kwh)} kWh`],
    ["Estimated annual savings", inr(report.annual_savings)],
    ["Estimated system cost", inr(report.cost)],
    ["Payback period", report.payback_years == null ? "—" : `${fmt(report.payback_years, 1)} years`],
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link to="/homeowner">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>

        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <Logo />
            <h1 className="mt-5 text-2xl font-light text-forest">{report.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solar assessment report · {fmtDate(report.created_at)}
              {report.city ? ` · ${report.city}` : ""}
            </p>
          </div>
          <DemoBadge label="Preliminary estimate" />
        </header>

        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          {figures.map(([label, value]) => (
            <div key={label} className="border-b pb-3">
              <p className="eyebrow">{label}</p>
              <p className="mt-1 font-display text-2xl font-light text-forest tnum">{value}</p>
            </div>
          ))}
        </div>

        {details.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-forest">Assessment inputs</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum text-forest">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <footer className="mt-10 border-t pt-4 text-xs italic text-muted-foreground">
          Figures are illustrative estimates based on typical Indian rooftop assumptions — not a quotation, a site survey or a
          guaranteed return. Actual results depend on equipment, installation and net-metering rules. Generated by SolarVerse AI
          on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.
        </footer>
      </div>
    </div>
  );
}
