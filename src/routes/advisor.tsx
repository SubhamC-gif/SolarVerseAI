import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import "./advisor.css";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteNav, SiteFooter, DemoBadge } from "@/components/brand";
import { ASSUMPTIONS, recommend, monthlySeries, annualYieldPerKw, inr, fmt, type AdvisorInput } from "@/lib/solar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Home Solar Advisor — SolarVerse AI" },
      { name: "description", content: "Estimate the right rooftop solar size, cost, savings and payback for your Indian home." },
      { property: "og:title", content: "Home Solar Advisor — SolarVerse AI" },
      { property: "og:description", content: "A step-by-step rooftop solar assessment with three configurations to compare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Advisor,
});

const STEPS = ["Location", "Consumption", "Rooftop", "Preferences", "Results"];
const STATES = ["Delhi", "Gujarat", "Karnataka", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={cn("advisor-chip rounded-md border px-3 py-1.5 text-sm transition-colors", value === o ? "is-selected" : "")}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

function Advisor() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    state: "West Bengal", city: "Kolkata", pin: "", units: "350", bill: "", tariff: String(ASSUMPTIONS.tariff),
    roof: "600", direction: "South", tilt: "15", shading: "None", roofType: "RCC flat",
    budget: "300000", battery: "No", grid: "Grid-connected", goal: "Bill savings",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const tariff = Number(f.tariff) || ASSUMPTIONS.tariff;
  const units = Number(f.units) || (Number(f.bill) ? Number(f.bill) / tariff : 0);

  const input: AdvisorInput = { monthlyUnits: units, roofSqft: Number(f.roof) || 0, direction: f.direction, shading: f.shading, budget: Number(f.budget) || 0, battery: f.battery === "Yes", tariff };
  const valid = [f.state && f.city, units > 0, input.roofSqft >= 100, true][step] ?? true;
  const rec = useMemo(() => recommend(input), [JSON.stringify(input)]);

  return (
    <div className="advisor-page" style={{ ["--advisor-wallpaper" as string]: "url(https://cdn.builder.io/api/v1/image/assets%2F93aaeeb2b96346949a27773e04861c15%2Feff5404fe08d44b9a751232fefb3afc9?format=webp&width=800&height=1200)" }}>
      <SiteNav />
      <main className="advisor-main mx-auto max-w-5xl px-6 py-12">
        <p className="advisor-eyebrow eyebrow">Home Solar Advisor</p>
        <h1 className="advisor-title mt-2 text-4xl font-light">Discover your home's solar potential.</h1>

        <ol className="advisor-progress mt-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="advisor-progress-step flex flex-1 items-center gap-2">
              <span className={cn("advisor-progress-number flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs tnum", i < step ? "is-complete" : i === step ? "is-active" : "is-upcoming")}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("advisor-progress-label hidden text-sm sm:inline", i === step ? "is-active" : "")}>{s}</span>
              {i < STEPS.length - 1 && <span className={cn("advisor-progress-line h-px flex-1", i < step ? "is-complete" : "")} />}
            </li>
          ))}
        </ol>

        <div key={step} className="advisor-step-card mt-8 rounded-xl border p-8 shadow-soft">
          {step === 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Country"><Input value="India" disabled /></Field>
              <Field label="State"><select className="advisor-select h-9 w-full rounded-md border px-3 text-sm" value={f.state} onChange={(e) => set("state")(e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="City"><Input value={f.city} onChange={(e) => set("city")(e.target.value)} /></Field>
              <Field label="Postal code (optional)"><Input value={f.pin} maxLength={6} onChange={(e) => set("pin")(e.target.value.replace(/\D/g, ""))} /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Monthly units (kWh)" hint="Found on your electricity bill."><Input type="number" value={f.units} onChange={(e) => set("units")(e.target.value)} /></Field>
              <Field label="Or monthly bill (₹)" hint="Used only if units are empty."><Input type="number" value={f.bill} onChange={(e) => set("bill")(e.target.value)} /></Field>
              <Field label="Tariff (₹/kWh)"><Input type="number" value={f.tariff} onChange={(e) => set("tariff")(e.target.value)} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Shadow-free roof area (sq ft)" hint={`About ${ASSUMPTIONS.sqftPerKw} sq ft is needed per kW.`}><Input type="number" value={f.roof} onChange={(e) => set("roof")(e.target.value)} /></Field>
                <Field label="Roof tilt (°)"><Input type="number" value={f.tilt} onChange={(e) => set("tilt")(e.target.value)} /></Field>
              </div>
              <Field label="Roof direction" hint="South-facing roofs collect the most sun in India."><Chips options={["South", "South-East", "South-West", "East", "West", "North", "Flat"]} value={f.direction} onChange={set("direction")} /></Field>
              <Field label="Shading" hint="Trees, water tanks or nearby buildings reduce output."><Chips options={["None", "Partial", "Heavy"]} value={f.shading} onChange={set("shading")} /></Field>
              <Field label="Roof type"><Chips options={["RCC flat", "Sloped tile", "Metal sheet"]} value={f.roofType} onChange={set("roofType")} /></Field>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <Field label="Installation budget (₹)"><Input type="number" value={f.budget} onChange={(e) => set("budget")(e.target.value)} /></Field>
              <Field label="Battery backup"><Chips options={["No", "Yes"]} value={f.battery} onChange={set("battery")} /></Field>
              <Field label="System type"><Chips options={["Grid-connected", "Hybrid"]} value={f.grid} onChange={set("grid")} /></Field>
              <Field label="Primary objective"><Chips options={["Bill savings", "Energy independence", "Backup"]} value={f.goal} onChange={set("goal")} /></Field>
            </div>
          )}
          {step === 4 && <Results rec={rec} input={input} city={f.city} />}
        </div>

        <div className="advisor-actions mt-6 flex justify-between">
          <Button className="advisor-secondary" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft /> Back</Button>
          {step < 4 ? <Button className="advisor-primary" disabled={!valid} onClick={() => setStep(step + 1)}>{step === 3 ? "See results" : "Continue"} <ArrowRight /></Button>
            : <Button className="advisor-secondary" variant="outline" onClick={() => setStep(0)}>Start over</Button>}
        </div>
      </main>
      <div className="advisor-footer"><SiteFooter /></div>
    </div>
  );
}

function Results({ rec, input, city }: { rec: ReturnType<typeof recommend>; input: AdvisorInput; city: string }) {
  const [pick, setPick] = useState<"budget" | "balanced" | "high">("balanced");
  const s = rec[pick];
  const data = monthlySeries(s.kw, annualYieldPerKw(input.direction, input.shading), input.monthlyUnits);
  const opts = [["budget", "Budget-Friendly"], ["balanced", "Balanced Recommendation"], ["high", "Higher-Capacity"]] as const;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-light text-forest">Your assessment for {city}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DemoBadge label="Preliminary estimate" />
          <SaveAssessment s={s} input={input} city={city} />
        </div>
      </div>
      <div className="advisor-recommendations grid gap-4 md:grid-cols-3">
        {opts.map(([k, l]) => {
          const o = rec[k];
          return (
            <button key={k} onClick={() => setPick(k)} className={cn("advisor-recommendation rounded-lg border p-5 text-left transition-all", pick === k ? "is-selected" : "")}>
              <p className="advisor-recommendation-label eyebrow">{l}</p>
              <p className="advisor-capacity mt-2 font-display text-3xl font-light tnum">{fmt(o.kw, 1)} kW</p>
              <div className="advisor-recommendation-details mt-3 space-y-1 text-sm tnum">
                <p>{inr(o.cost)} est. cost</p>
                <p>{inr(o.savings)}/yr savings</p>
                <p>{isFinite(o.payback) ? `${fmt(o.payback, 1)} yr payback` : "—"}</p>
              </div>
              {!o.fitsRoof && <p className="mt-2 text-xs text-warning">Exceeds stated roof area</p>}
            </button>
          );
        })}
      </div>
      <div className="advisor-metrics grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
        {[["Panels", `${s.panels} × ${ASSUMPTIONS.panelWatt} W`], ["Roof area", `${fmt(s.area)} sq ft`], ["Monthly gen.", `${fmt(s.monthly)} kWh`], ["Annual gen.", `${fmt(s.annual)} kWh`], ["Install cost", inr(s.cost)], ["Annual savings", inr(s.savings)], ["Battery", s.batteryKwh ? `${s.batteryKwh} kWh` : "None"], ["CO₂ avoided", `${fmt(s.co2, 1)} t/yr`]].map(([l, v]) => (
          <div key={l} className="advisor-metric p-4"><p className="text-xs">{l}</p><p className="mt-1 font-medium tnum">{v}</p></div>
        ))}
      </div>
      <div>
        <p className="advisor-chart-title mb-3 text-sm font-medium">Typical-year monthly generation vs. consumption (kWh)</p>
        <div className="advisor-chart h-64">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="expected" name="Generation" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumption" name="Consumption" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <details className="advisor-assumptions rounded-lg p-5 text-sm">
        <summary className="cursor-pointer font-medium text-forest">Assumptions used</summary>
        <ul className="mt-3 grid gap-1 text-muted-foreground md:grid-cols-2">
          <li>Typical-year yield: {ASSUMPTIONS.specificYield} kWh/kWp/yr, adjusted for direction & shading</li>
          <li>Indicative cost: {inr(ASSUMPTIONS.costPerKw)}/kW; battery {inr(ASSUMPTIONS.batteryCostPerKwh)}/kWh</li>
          <li>Tariff: ₹{input.tariff}/kWh; savings capped near your usage</li>
          <li>Grid emission factor: {ASSUMPTIONS.emissionFactor} kg CO₂/kWh (configurable)</li>
          <li>Subsidies are not included — verify current scheme amounts officially</li>
          <li>Not a site survey. Actual results depend on equipment, installation and net-metering rules.</li>
        </ul>
      </details>
    </div>
  );
}

function SaveAssessment({ s, input, city }: { s: ReturnType<typeof recommend>["balanced"]; input: AdvisorInput; city: string }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "signin">("idle");
  const save = async () => {
    setState("saving");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setState("signin");
    const { error } = await supabase.from("assessments").insert({
      user_id: u.user.id, title: `${fmt(s.kw, 1)} kW · ${city}`, city, capacity_kw: s.kw, annual_kwh: Math.round(s.annual),
      annual_savings: Math.round(s.savings), cost: Math.round(s.cost), payback_years: isFinite(s.payback) ? +s.payback.toFixed(1) : null, inputs: input,
    });
    if (error) { toast.error("Could not save. Please try again."); return setState("idle"); }
    toast.success("Saved to your dashboard"); setState("saved");
  };
  if (state === "signin") return <Button className="advisor-primary" asChild size="sm"><Link to="/auth">Sign in to save</Link></Button>;
  return <Button className="advisor-primary" size="sm" onClick={save} disabled={state !== "idle"}>{state === "saved" ? "Saved" : state === "saving" ? "Saving…" : "Save to dashboard"}</Button>;
}
