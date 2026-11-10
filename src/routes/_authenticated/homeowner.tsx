import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutGrid, Sun, Settings2, LineChart, IndianRupee, Battery, Leaf, FileText, Settings, ScanSearch, Cloud, CloudRain, LogOut, Plus, Trash2, Eye, Printer, Check, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell, Panel, Empty } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ASSUMPTIONS, MONTHS, monthlySeries, inr, fmt, fmtDate } from "@/lib/solar";
import { assessmentsQuery, profileQuery, type Assessment } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FaultDetectionUI } from "@/components/fault-detection-ui";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/homeowner")({
  beforeLoad: () => requireRole("homeowner"),
  head: () => ({
    meta: [
      { title: "Homeowner Dashboard — SolarVerse AI" },
      { name: "description", content: "Your rooftop solar overview: generation, savings, and environmental impact." },
      { property: "og:title", content: "Homeowner Dashboard — SolarVerse AI" },
      { property: "og:description", content: "Track rooftop solar generation, savings and impact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Homeowner,
});

const NAV = [
  { icon: LayoutGrid, label: "Overview", to: "/homeowner", exact: true },
  { icon: Sun, label: "Solar Potential", to: "/homeowner" },
  { icon: ScanSearch, label: "Fault Detection", to: "/homeowner" },
  { icon: Settings2, label: "System Planner", to: "/homeowner" },
  { icon: LineChart, label: "Energy Forecast", to: "/homeowner" },
  { icon: IndianRupee, label: "Savings & ROI", to: "/homeowner" },
  { icon: Battery, label: "Battery Planner", to: "/homeowner" },
  { icon: Leaf, label: "Environmental Impact", to: "/homeowner" },
  { icon: FileText, label: "My Reports", to: "/homeowner" },
  { icon: Settings, label: "Settings", to: "/homeowner" },
];

function Homeowner() {
  const [view, setView] = useState("Overview");

  const nav = NAV.map(n => ({
    ...n,
    active: n.label === view,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      setView(n.label);
    }
  }));

  return (
    <DashboardShell 
      nav={nav} 
      active={view} 
      title={view === "Overview" ? "Good morning! Let's make your home solar-ready." : view} 
      subtitle={
        view === "Overview"
          ? "Bengaluru, Karnataka · South-facing RCC roof · 600 sq ft"
          : view === "Settings"
            ? "Manage your profile, tariff and account"
            : "Personalized solar intelligence for your home"
      }
    >
      {view === "Overview" ? (
        <Overview onNavigate={setView} />
      ) : view === "Fault Detection" ? (
        <FaultDetectionUI />
      ) : view === "Savings & ROI" ? (
        <SavingsRoi />
      ) : view === "Solar Potential" ? (
        <SolarPotentialView />
      ) : view === "System Planner" ? (
        <SystemPlanner />
      ) : view === "Energy Forecast" ? (
        <EnergyForecast />
      ) : view === "Battery Planner" ? (
        <BatteryPlanner />
      ) : view === "Environmental Impact" ? (
        <EnvironmentalImpact />
      ) : view === "Settings" ? (
        <SettingsView />
      ) : view === "My Reports" ? (
        <MyReports />
      ) : (
        <Panel title={view}>
          <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
            <Sun className="h-12 w-12 opacity-20" />
            <p className="mt-4 italic">This section is currently under development.</p>
          </div>
        </Panel>
      )}
    </DashboardShell>
  );
}

// Sample values shown on the Overview when the signed-in homeowner has no saved
// profile / assessment yet. Clearly labelled as sample data in the UI.
const SAMPLE_OVERVIEW = { kw: 3, city: "Bengaluru" };

const QUICK_LINKS = [
  { icon: Sun, label: "Solar Potential", desc: "Check your roof's capacity" },
  { icon: Settings2, label: "System Planner", desc: "Plan panels, inverter and cost" },
  { icon: IndianRupee, label: "Savings & ROI", desc: "See payback and 25-year return" },
  { icon: Battery, label: "Battery Planner", desc: "Size backup for power cuts" },
];

function Overview({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { data: profile } = useQuery(profileQuery);
  const { data: assessments = [] } = useQuery(assessmentsQuery);
  const latest = assessments[0] ?? null;

  const saved = latest !== null;
  const kw = latest?.capacity_kw ?? SAMPLE_OVERVIEW.kw;
  const annualKwh = latest?.annual_kwh ?? kw * ASSUMPTIONS.specificYield;
  const annualSavings = latest?.annual_savings ?? annualKwh * ASSUMPTIONS.tariff;
  const co2 = (annualKwh * ASSUMPTIONS.emissionFactor) / 1000; // tonnes/yr
  const perKw = kw > 0 ? annualKwh / kw : ASSUMPTIONS.specificYield;
  const series = monthlySeries(kw, perKw, 0);

  const city = latest?.city ?? profile?.city ?? SAMPLE_OVERVIEW.city;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="System size"
          value={fmt(kw, 1)}
          unit="kW"
          hint={saved ? "From your latest saved assessment" : "Sample value"}
        />
        <Metric
          label="Yearly generation"
          value={fmt(annualKwh)}
          unit="kWh"
          hint={saved ? "Estimated for your saved system" : `Sample estimate at ${fmt(ASSUMPTIONS.specificYield)} kWh/kWp`}
        />
        <Metric
          label="Yearly savings"
          value={inr(annualSavings)}
          hint={`at ₹${ASSUMPTIONS.tariff}/kWh`}
        />
        <Metric
          label="CO₂ avoided"
          value={fmt(co2, 2)}
          unit="t/yr"
          hint={`Grid factor ${ASSUMPTIONS.emissionFactor} kg/kWh`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ icon: I, label, desc }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(label)}
            className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-soft transition-colors hover:border-primary hover:bg-muted"
          >
            <I className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-forest">{label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      <Panel title="Monthly generation estimate (kWh)">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={series}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="expected" name="Monthly generation" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {saved
            ? `Based on your latest saved assessment for ${city}.`
            : `Showing clearly-labelled sample values for ${city} — save an assessment to personalise this summary.`}
        </p>
      </Panel>
    </div>
  );
}

function RoiField({ id, label, value, onChange, step = 1, hint }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        placeholder="0"
        value={value || ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.max(0, n) : 0);
        }}
        className="tnum"
      />
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function SavingsRoi() {
  const [bill, setBill] = useState(3000);
  const [kw, setKw] = useState(3);
  const [costPerKw, setCostPerKw] = useState(ASSUMPTIONS.costPerKw);
  const [subsidy, setSubsidy] = useState(0);
  const [tariff, setTariff] = useState(ASSUMPTIONS.tariff);

  const annualUnits = tariff > 0 ? (bill / tariff) * 12 : 0;
  const annualGeneration = kw * ASSUMPTIONS.specificYield;
  const offsetUnits = Math.min(annualGeneration, annualUnits);
  const yearlySavings = offsetUnits * tariff;

  const grossCost = kw * costPerKw;
  const netCost = Math.max(0, grossCost - subsidy);
  const payback = yearlySavings > 0 && netCost > 0 ? netCost / yearlySavings : Infinity;

  let running = 0;
  const series = Array.from({ length: 25 }, (_, i) => {
    const annual = yearlySavings * (1 - ASSUMPTIONS.degradation) ** i;
    running += annual;
    return { year: i + 1, annual: Math.round(annual), cumulative: Math.round(running) };
  });
  const total25 = Math.round(running);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Total cost after subsidy"
          value={inr(netCost)}
          hint={subsidy > 0 ? `${inr(grossCost)} − ${inr(subsidy)} subsidy` : "No subsidy applied"}
        />
        <Metric
          label="Estimated yearly savings"
          value={inr(yearlySavings)}
          hint={`${fmt(offsetUnits)} kWh offset at ₹${fmt(tariff, 2)}/unit`}
        />
        <Metric
          label="Payback period"
          value={Number.isFinite(payback) ? fmt(payback, 1) : "—"}
          unit={Number.isFinite(payback) ? "years" : ""}
          hint="Time to recover your net cost"
        />
        <Metric label="25-year savings" value={inr(total25)} hint="Includes 0.5%/yr degradation" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your inputs">
          <div className="space-y-4">
            <RoiField id="roi-bill" label="Monthly electricity bill (₹)" value={bill} onChange={setBill} step={100} />
            <RoiField id="roi-kw" label="System size (kW)" value={kw} onChange={setKw} step={0.5} hint="Your rooftop solar capacity" />
            <RoiField id="roi-cost" label="Cost per kW (₹)" value={costPerKw} onChange={setCostPerKw} step={1000} hint="Indicative installed cost" />
            <RoiField id="roi-subsidy" label="Subsidy amount (₹)" value={subsidy} onChange={setSubsidy} step={1000} hint="Central + state subsidy, default 0" />
            <RoiField id="roi-tariff" label="Electricity tariff (₹/unit)" value={tariff} onChange={setTariff} step={0.25} />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="25-year savings outlook (₹)">
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={series}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `Y${v}`} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v: number) => inr(v)}
                    labelFormatter={(v) => `Year ${v}`}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="annual" name="Annual savings" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                  <Line dataKey="cumulative" name="Cumulative savings" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Assumes a steady {fmt(ASSUMPTIONS.degradation * 100, 1)}% annual panel degradation and an unchanged tariff.
            </p>
          </Panel>

          <Panel title="Payback at a glance">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Total system cost", inr(grossCost)],
                ["Subsidy applied", inr(subsidy)],
                ["Net cost to you", inr(netCost)],
                ["Year-1 savings", inr(yearlySavings)],
                ["Payback period", Number.isFinite(payback) ? `${fmt(payback, 1)} years` : "Not recoverable"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum text-forest">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs italic text-muted-foreground">
              Note: these figures are illustrative estimates based on your inputs and typical Indian rooftop assumptions — not a quotation or a guaranteed return.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// Average daily peak sun hours (kWh/m²/day) — indicative annual averages for Indian cities.
const CITY_SUN_HOURS: Record<string, number> = {
  Delhi: 5.1,
  Mumbai: 5,
  Bengaluru: 5.3,
  Chennai: 5.4,
  Kolkata: 4.7,
  Hyderabad: 5.4,
  Pune: 5.4,
  Ahmedabad: 5.6,
  Jaipur: 5.6,
  Lucknow: 5.1,
  Surat: 5.5,
  Bhopal: 5.4,
  Nagpur: 5.4,
  Kochi: 4.8,
  Chandigarh: 5.2,
};

const CITIES = Object.keys(CITY_SUN_HOURS);

// Share of the gross roof area that stays shadow-free and usable for panels.
const ROOF_FACTOR: Record<string, number> = { flat: 0.7, sloped: 0.85 };
// Output retained under each shading condition.
const SHADING_FACTOR: Record<string, number> = { none: 1, low: 0.9, high: 0.72 };
// Performance ratio: losses from heat, wiring, inverter and soiling.
const PERFORMANCE_RATIO = 0.78;

function Choice({ id, label, value, onChange, options, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function SolarPotentialView() {
  const [city, setCity] = useState("Bengaluru");
  const [roofArea, setRoofArea] = useState(600);
  const [roofType, setRoofType] = useState("flat");
  const [shading, setShading] = useState("none");

  const sunHours = CITY_SUN_HOURS[city] ?? 5;
  const usableArea = roofArea * (ROOF_FACTOR[roofType] ?? 1);
  const maxKw = Math.round((usableArea / ASSUMPTIONS.sqftPerKw) * 10) / 10;
  const effectiveKw = maxKw * (SHADING_FACTOR[shading] ?? 1);
  const yieldPerKw = sunHours * 365 * PERFORMANCE_RATIO;
  const annualKwh = effectiveKw * yieldPerKw;
  const data = monthlySeries(effectiveKw, yieldPerKw, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Usable roof area" value={fmt(usableArea)} unit="sq ft" hint={`of ${fmt(roofArea)} sq ft gross`} />
        <Metric label="Max installable size" value={fmt(maxKw, 1)} unit="kW" hint="At ~100 sq ft per kW" />
        <Metric label="Avg. daily sun hours" value={fmt(sunHours, 1)} unit="h" hint={`${city} annual average`} />
        <Metric label="Estimated yearly generation" value={fmt(annualKwh)} unit="kWh" hint={`${fmt(effectiveKw, 1)} kW after shading`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your roof">
          <div className="space-y-4">
            <Choice
              id="sp-city"
              label="City"
              value={city}
              onChange={setCity}
              options={CITIES.map((c) => ({ value: c, label: `${c} · ${CITY_SUN_HOURS[c]} h` }))}
              hint="Sets the average daily sun hours"
            />
            <RoiField id="sp-area" label="Roof area (sq ft)" value={roofArea} onChange={setRoofArea} step={50} hint="Total available roof area" />
            <Choice
              id="sp-roof"
              label="Roof type"
              value={roofType}
              onChange={setRoofType}
              options={[{ value: "flat", label: "Flat" }, { value: "sloped", label: "Sloped" }]}
              hint="Flat roofs need spacing between panel rows"
            />
            <Choice
              id="sp-shade"
              label="Shading level"
              value={shading}
              onChange={setShading}
              options={[{ value: "none", label: "None" }, { value: "low", label: "Low" }, { value: "high", label: "High" }]}
              hint="Trees, tanks or nearby buildings"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Monthly generation profile (kWh)">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Bar dataKey="expected" name="Monthly generation" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The monsoon dip in July–August is typical across most of India.
            </p>
          </Panel>

          <Panel title="Site summary">
            <dl className="space-y-2.5 text-sm">
              {[
                ["City", city],
                ["Average daily sun hours", `${fmt(sunHours, 1)} h`],
                ["Usable roof area", `${fmt(usableArea)} sq ft`],
                ["Maximum system size", `${fmt(maxKw, 1)} kW`],
                ["Yield per kW", `${fmt(yieldPerKw)} kWh/yr`],
                ["Estimated yearly generation", `${fmt(annualKwh)} kWh`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum text-forest">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs italic text-muted-foreground">
              Note: these are indicative estimates from typical Indian roof and weather assumptions — an on-site survey gives a more accurate figure.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Planner
// ---------------------------------------------------------------------------

// Panel rating assumed for the "number of panels" figure.
const PLANNER_PANEL_WATT = 550;

// Multipliers used to build the smaller / larger alternatives around the
// recommended size.
const PLAN_SCALE = { smaller: 0.7, larger: 1.3 };

type PlanContext = {
  yieldPerKw: number;
  roofArea: number;
  budget: number;
  costPerKw: number;
};

type Plan = {
  key: string;
  label: string;
  kw: number;
  panels: number;
  area: number;
  cost: number;
  annualKwh: number;
  fitsRoof: boolean;
  fitsBudget: boolean;
};

// Sizes are quoted in 0.5 kW steps, never below the smallest practical system.
const roundHalfKw = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);

function buildPlan(key: string, label: string, kw: number, ctx: PlanContext): Plan {
  const panels = Math.ceil((kw * 1000) / PLANNER_PANEL_WATT);
  const area = kw * ASSUMPTIONS.sqftPerKw;
  const cost = kw * ctx.costPerKw;
  const annualKwh = kw * ctx.yieldPerKw;
  return {
    key,
    label,
    kw,
    panels,
    area,
    cost,
    annualKwh,
    fitsRoof: area <= ctx.roofArea,
    fitsBudget: ctx.budget > 0 ? cost <= ctx.budget : true,
  };
}

function FitBadge({ ok, okLabel, failLabel }: { ok: boolean; okLabel: string; failLabel: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {ok ? okLabel : failLabel}
    </span>
  );
}

function SystemPlanner() {
  const [monthlyUnits, setMonthlyUnits] = useState(330);
  const [city, setCity] = useState("Bengaluru");
  const [roofArea, setRoofArea] = useState(600);
  const [budget, setBudget] = useState(200000);
  const [costPerKw, setCostPerKw] = useState(ASSUMPTIONS.costPerKw);

  const sunHours = CITY_SUN_HOURS[city] ?? 5;
  const yieldPerKw = sunHours * 365 * PERFORMANCE_RATIO;
  const annualUnits = monthlyUnits * 12;
  const needKw = yieldPerKw > 0 ? annualUnits / yieldPerKw : 0;
  const recommendedKw = roundHalfKw(needKw);

  const ctx: PlanContext = { yieldPerKw, roofArea, budget, costPerKw };
  const recommended = buildPlan("recommended", "Recommended", recommendedKw, ctx);
  const smaller = buildPlan("smaller", "Smaller", roundHalfKw(recommendedKw * PLAN_SCALE.smaller), ctx);
  const larger = buildPlan("larger", "Larger", roundHalfKw(recommendedKw * PLAN_SCALE.larger), ctx);
  const plans = [smaller, recommended, larger];

  const hasBudget = budget > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Recommended system size" value={fmt(recommended.kw, 1)} unit="kW" hint={`To offset ${fmt(annualUnits)} kWh/yr`} />
        <Metric label="Number of panels" value={fmt(recommended.panels)} unit={`× ${PLANNER_PANEL_WATT} W`} hint="Module count at the assumed rating" />
        <Metric label="Roof area required" value={fmt(recommended.area)} unit="sq ft" hint={`of ${fmt(roofArea)} sq ft available`} />
        <Metric label="Estimated cost" value={inr(recommended.cost)} hint={`at ${inr(costPerKw)}/kW`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your requirement">
          <div className="space-y-4">
            <RoiField
              id="spl-units"
              label="Average monthly electricity units (kWh)"
              value={monthlyUnits}
              onChange={setMonthlyUnits}
              step={10}
              hint="Your typical monthly consumption from the bill"
            />
            <Choice
              id="spl-city"
              label="City"
              value={city}
              onChange={setCity}
              options={CITIES.map((c) => ({ value: c, label: `${c} · ${CITY_SUN_HOURS[c]} h` }))}
              hint="Sets the average daily sun hours"
            />
            <RoiField id="spl-area" label="Roof area (sq ft)" value={roofArea} onChange={setRoofArea} step={50} hint="Total available roof area" />
            <RoiField
              id="spl-budget"
              label="Budget (₹, optional)"
              value={budget}
              onChange={setBudget}
              step={5000}
              hint="Leave as 0 if you have no fixed budget"
            />
            <RoiField
              id="spl-cost"
              label="Cost per kW (₹)"
              value={costPerKw}
              onChange={setCostPerKw}
              step={1000}
              hint="Editable — indicative installed cost"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <div className={cn("rounded-lg border-2 p-5", recommended.fitsRoof && (!hasBudget || recommended.fitsBudget) ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended plan</p>
                <p className="mt-1 font-display text-3xl font-light text-forest">
                  {fmt(recommended.kw, 1)} kW
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{city} · {fmt(sunHours, 1)} sun hours/day</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FitBadge ok={recommended.fitsRoof} okLabel="Fits your roof" failLabel="Doesn't fit your roof" />
                <FitBadge
                  ok={!hasBudget || recommended.fitsBudget}
                  okLabel={hasBudget ? "Within budget" : "No budget set"}
                  failLabel="Over budget"
                />
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                ["System size", `${fmt(recommended.kw, 1)} kW`],
                ["Panels", `${fmt(recommended.panels)} × ${PLANNER_PANEL_WATT} W`],
                ["Roof area required", `${fmt(recommended.area)} sq ft (${fmt(roofArea)} sq ft available)`],
                ["Estimated cost", inr(recommended.cost)],
                ["Estimated yearly generation", `${fmt(recommended.annualKwh)} kWh`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="tnum text-right text-forest">{v}</dd>
                </div>
              ))}
            </dl>

            {!recommended.fitsRoof && (
              <p className="mt-4 text-xs text-destructive">
                The recommended system needs more roof area than you have. Reduce your target consumption or free up more roof space.
              </p>
            )}
            {recommended.fitsRoof && hasBudget && !recommended.fitsBudget && (
              <p className="mt-4 text-xs text-destructive">
                The recommended system exceeds your budget. Consider the smaller option below or increase your budget.
              </p>
            )}
          </div>

          <Panel title="Plan comparison">
            <div className="grid gap-3 sm:grid-cols-3">
              {plans.map((p) => {
                const isRecommended = p.key === "recommended";
                return (
                  <div
                    key={p.key}
                    className={cn(
                      "space-y-3 rounded-lg border p-4",
                      isRecommended ? "border-forest ring-1 ring-forest" : "",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</p>
                      {isRecommended && <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-medium text-forest-foreground">Pick</span>}
                    </div>
                    <p className="font-display text-2xl font-light text-forest">{fmt(p.kw, 1)} kW</p>
                    <dl className="space-y-1.5 text-xs">
                      {[
                        ["Panels", `${fmt(p.panels)} × ${PLANNER_PANEL_WATT} W`],
                        ["Roof area", `${fmt(p.area)} sq ft`],
                        ["Cost", inr(p.cost)],
                        ["Generation", `${fmt(p.annualKwh)} kWh/yr`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="tnum text-right text-forest">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <FitBadge ok={p.fitsRoof} okLabel="Roof OK" failLabel="Roof short" />
                      <FitBadge ok={!hasBudget || p.fitsBudget} okLabel={hasBudget ? "Budget OK" : "No budget"} failLabel="Over budget" />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs italic text-muted-foreground">
              Note: the recommended size offsets your current consumption using typical-year sun hours and a {(PERFORMANCE_RATIO * 100).toFixed(0)}% performance ratio. Panels are assumed at {PLANNER_PANEL_WATT} W each and roof area at {ASSUMPTIONS.sqftPerKw} sq ft per kW. Figures are illustrative estimates, not a quotation.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// Battery bank assumptions. Modules are quoted as 48 V / 100 Ah blocks (4.8 kWh each).
const BATTERY_TYPES: Record<string, { label: string; dod: number; lifeYears: number; moduleKwh: number; moduleAh: number; costLow: number; costHigh: number }> = {
  lithium: { label: "Lithium (LFP)", dod: 0.9, lifeYears: 10, moduleKwh: 4.8, moduleAh: 100, costLow: 16000, costHigh: 22000 },
  "lead-acid": { label: "Lead-acid (tubular)", dod: 0.5, lifeYears: 4, moduleKwh: 4.8, moduleAh: 100, costLow: 9000, costHigh: 13000 },
};

const BATTERY_VOLTS = 48;

function BatteryPlanner() {
  const [dailyUsage, setDailyUsage] = useState(10);
  const [backupHours, setBackupHours] = useState(4);
  const [essentialLoad, setEssentialLoad] = useState(500);
  const [batteryType, setBatteryType] = useState("lithium");

  const battery = BATTERY_TYPES[batteryType] ?? BATTERY_TYPES["lithium"]!;
  const backupEnergyKwh = (essentialLoad * backupHours) / 1000;
  const requiredKwh = backupEnergyKwh / battery.dod;
  const requiredAh = (requiredKwh * 1000) / BATTERY_VOLTS;
  const units = requiredKwh > 0 ? Math.ceil(requiredKwh / battery.moduleKwh) : 0;
  const costLow = requiredKwh * battery.costLow;
  const costHigh = requiredKwh * battery.costHigh;
  const coverPct = dailyUsage > 0 ? (backupEnergyKwh / dailyUsage) * 100 : 0;

  const usableKwh = requiredKwh * battery.dod;
  const maxLoad = Math.max(1000, Math.round((essentialLoad * 2) / 100) * 100);
  const step = maxLoad / 10;
  const curve = Array.from({ length: 11 }, (_, i) => {
    const load = Math.round(step * (i + 1));
    return { load, hours: load > 0 ? Math.round((usableKwh * 1000) / load * 10) / 10 : 0 };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Required capacity" value={fmt(requiredKwh, 1)} unit="kWh" hint={`${fmt(requiredAh)} Ah at ${BATTERY_VOLTS} V`} />
        <Metric label="Usable depth of discharge" value={`${Math.round(battery.dod * 100)}%`} hint={battery.label} />
        <Metric label="Recommended batteries" value={fmt(units)} unit={units === 1 ? "unit" : "units"} hint={`${battery.moduleAh} Ah · ${BATTERY_VOLTS} V each`} />
        <Metric label="Expected battery life" value={fmt(battery.lifeYears)} unit="years" hint="At the recommended depth of discharge" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your backup need">
          <div className="space-y-4">
            <RoiField id="bp-usage" label="Daily electricity usage (kWh)" value={dailyUsage} onChange={setDailyUsage} step={1} hint="Used to check how much of the day is covered" />
            <RoiField id="bp-hours" label="Hours of backup needed" value={backupHours} onChange={setBackupHours} step={1} />
            <RoiField id="bp-load" label="Essential load (W)" value={essentialLoad} onChange={setEssentialLoad} step={50} hint="Lights, fans, fridge, router — not the whole house" />
            <Choice
              id="bp-type"
              label="Battery type"
              value={batteryType}
              onChange={setBatteryType}
              options={[
                { value: "lithium", label: "Lithium (LFP)" },
                { value: "lead-acid", label: "Lead-acid (tubular)" },
              ]}
              hint="Lithium tolerates deeper discharge and lasts longer"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Backup hours vs load">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={curve}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="load" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v}W`} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(v: number) => `${fmt(v, 1)} h`} labelFormatter={(v) => `${fmt(v as number)} W load`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Area dataKey="hours" name="Backup hours" type="monotone" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              With {fmt(usableKwh, 1)} kWh usable, a heavier load drains the bank faster.
            </p>
          </Panel>

          <Panel title="Battery bank summary">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Daily usage", `${fmt(dailyUsage, 1)} kWh`],
                ["Backup energy needed", `${fmt(backupEnergyKwh, 2)} kWh`],
                ["Share of daily usage backed up", `${fmt(coverPct)}%`],
                ["Required capacity", `${fmt(requiredKwh, 2)} kWh · ${fmt(requiredAh)} Ah at ${BATTERY_VOLTS} V`],
                ["Depth of discharge", `${Math.round(battery.dod * 100)}% (${battery.label})`],
                ["Recommended batteries", `${fmt(units)} × ${battery.moduleAh} Ah @ ${BATTERY_VOLTS} V`],
                ["Estimated cost range", `${inr(costLow)} – ${inr(costHigh)}`],
                ["Expected life", `${fmt(battery.lifeYears)} years`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="tnum text-right text-forest">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs italic text-muted-foreground">
              Note: these are indicative estimates based on typical Indian battery prices and duty cycles — actual sizing and cost depend on the brand, inverter and site conditions.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Energy Forecast
// ---------------------------------------------------------------------------

// Optimal panel tilt for most of India sits near ~20°; deviating from it loses yield.
const OPTIMAL_TILT = 20;
const TILT_OPTIONS = [0, 10, 15, 20, 25, 30];

// Built-in table of relative month-by-month sun hours (monsoon dip Jun–Sep,
// lowest in Jul–Aug). Multiplied by each city's annual average daily sun hours.
const MONTHLY_SUN_SCALE = [1.04, 1.08, 1.14, 1.14, 1.1, 0.86, 0.74, 0.78, 0.88, 1.02, 1.06, 1.08];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Illustrative short-term outlook: simple sunny/cloudy/rainy assumptions, no external API.
const WEATHER_FACTOR: Record<string, number> = { Sunny: 1, Cloudy: 0.55, Rainy: 0.25 };
const WEEK_WEATHER = ["Sunny", "Sunny", "Cloudy", "Cloudy", "Rainy", "Sunny", "Sunny"];
const WEATHER_COLOR: Record<string, string> = { Sunny: "var(--chart-1)", Cloudy: "var(--chart-2)", Rainy: "var(--chart-3)" };
const WEATHER_ICON: Record<string, typeof Sun> = { Sunny: Sun, Cloudy: Cloud, Rainy: CloudRain };

function EnergyForecast() {
  const [kw, setKw] = useState(3);
  const [city, setCity] = useState("Bengaluru");
  const [tilt, setTilt] = useState("20");

  const tiltDeg = Number(tilt);
  const tiltFactor = Math.cos(((tiltDeg - OPTIMAL_TILT) * Math.PI) / 180);
  const avgSun = CITY_SUN_HOURS[city] ?? 5;

  const data = MONTHS.map((month, i) => {
    const sunHours = avgSun * MONTHLY_SUN_SCALE[i]!;
    const expected = kw * sunHours * tiltFactor * PERFORMANCE_RATIO * DAYS_IN_MONTH[i]!;
    return {
      month,
      sunHours: Math.round(sunHours * 10) / 10,
      expected: Math.round(expected),
      savings: Math.round(expected * ASSUMPTIONS.tariff),
    };
  });

  const annualKwh = data.reduce((a, d) => a + d.expected, 0);
  const annualSavings = data.reduce((a, d) => a + d.savings, 0);

  const today = new Date();
  const monthIdx = today.getMonth();
  const dailyBase = data[monthIdx]!.expected / DAYS_IN_MONTH[monthIdx]!;
  const week = WEEK_WEATHER.map((weather, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      key: `${d.getMonth()}-${d.getDate()}`,
      day: i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      weather,
      kwh: Math.round(dailyBase * WEATHER_FACTOR[weather]!),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="System size" value={fmt(kw, 1)} unit="kW" hint={`${city} · ${tiltDeg}° tilt`} />
        <Metric label="Avg. daily sun hours" value={fmt(avgSun, 1)} unit="h" hint={`${city} annual average`} />
        <Metric label="Estimated annual generation" value={fmt(annualKwh)} unit="kWh" hint="Typical-year estimate" />
        <Metric label="Estimated annual savings" value={inr(annualSavings)} hint={`at ₹${ASSUMPTIONS.tariff}/kWh`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your system">
          <div className="space-y-4">
            <RoiField id="ef-kw" label="System size (kW)" value={kw} onChange={setKw} step={0.5} hint="Rooftop solar capacity" />
            <Choice
              id="ef-city"
              label="City"
              value={city}
              onChange={setCity}
              options={CITIES.map((c) => ({ value: c, label: c }))}
              hint="Sets the monthly sun hours"
            />
            <Choice
              id="ef-tilt"
              label="Panel tilt"
              value={tilt}
              onChange={setTilt}
              options={TILT_OPTIONS.map((t) => ({ value: String(t), label: `${t}°` }))}
              hint={`Optimal tilt is about ${OPTIMAL_TILT}° for most of India`}
            />
          </div>
        </Panel>

        <Panel title="12-month generation forecast (kWh)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="expected" name="Expected generation" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The monsoon dip in June–August is typical across most of India.
          </p>
        </Panel>
      </div>

      <Panel title="7-day generation outlook (kWh)">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={week}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="kwh" name="Expected generation" radius={[3, 3, 0, 0]}>
                {week.map((d) => (
                  <Cell key={d.key} fill={WEATHER_COLOR[d.weather]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {week.map((d) => {
            const Icon = WEATHER_ICON[d.weather]!;
            return (
              <li key={d.key} className="flex items-center gap-2 rounded-md border p-2.5 text-xs">
                <Icon className="h-4 w-4 shrink-0" style={{ color: WEATHER_COLOR[d.weather] }} />
                <div className="min-w-0">
                  <p className="truncate text-forest">{d.day} · {d.date}</p>
                  <p className="text-muted-foreground">{d.weather} · {fmt(d.kwh)} kWh</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Month-by-month estimate">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 text-right font-medium">Peak sun hours (h/day)</th>
                <th className="py-2 text-right font-medium">Expected generation (kWh)</th>
                <th className="py-2 text-right font-medium">Expected savings (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.month} className="border-b last:border-0">
                  <td className="py-2 text-muted-foreground">{d.month}</td>
                  <td className="py-2 text-right tnum">{fmt(d.sunHours, 1)}</td>
                  <td className="py-2 text-right tnum">{fmt(d.expected)}</td>
                  <td className="py-2 text-right tnum text-forest">{inr(d.savings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="py-2 text-forest">Total</td>
                <td className="py-2" />
                <td className="py-2 text-right tnum text-forest">{fmt(annualKwh)}</td>
                <td className="py-2 text-right tnum text-forest">{inr(annualSavings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-4 text-xs italic text-muted-foreground">
          Note: these are indicative estimates based on typical-year sun hours, panel tilt and a {(PERFORMANCE_RATIO * 100).toFixed(0)}% performance ratio — not metered production. No live weather or external data is used.
        </p>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Environmental Impact
// ---------------------------------------------------------------------------

// Indicative impact factors for the Indian grid. These are approximate national
// averages — actual values vary by region, season and the power-source mix.
const GRID_CO2_KG_PER_KWH = 0.82; // kg CO₂ avoided per kWh of solar generation
const COAL_KG_PER_KWH = 0.44; // kg of coal saved per kWh generated
const TREE_CO2_KG_PER_YEAR = 21; // kg CO₂ absorbed by one mature tree per year
const IMPACT_YEARS = 25;

function EnvironmentalImpact() {
  const [source, setSource] = useState("kw");
  const [kw, setKw] = useState(3);
  const [city, setCity] = useState("Bengaluru");
  const [yearlyKwh, setYearlyKwh] = useState(4000);

  const sunHours = CITY_SUN_HOURS[city] ?? 5;
  const yieldPerKw = sunHours * 365 * PERFORMANCE_RATIO;
  const annualKwh = source === "kw" ? kw * yieldPerKw : yearlyKwh;

  const yearlyCo2Kg = annualKwh * GRID_CO2_KG_PER_KWH;
  const yearlyCoalKg = annualKwh * COAL_KG_PER_KWH;
  const yearlyTrees = yearlyCo2Kg / TREE_CO2_KG_PER_YEAR;

  let runningKg = 0;
  const series = Array.from({ length: IMPACT_YEARS }, (_, i) => {
    const yearCo2Kg = annualKwh * (1 - ASSUMPTIONS.degradation) ** i * GRID_CO2_KG_PER_KWH;
    runningKg += yearCo2Kg;
    return { year: i + 1, cumulative: Math.round(runningKg / 1000) }; // tonnes
  });

  const totalCo2Kg = runningKg;
  const totalCoalKg = (totalCo2Kg / GRID_CO2_KG_PER_KWH) * COAL_KG_PER_KWH;
  const totalTrees = totalCo2Kg / TREE_CO2_KG_PER_YEAR;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="CO₂ avoided each year" value={fmt(yearlyCo2Kg)} unit="kg" hint={`At ${GRID_CO2_KG_PER_KWH} kg CO₂ per kWh`} />
        <Metric label="Equivalent trees planted" value={fmt(yearlyTrees)} unit="trees" hint={`One tree absorbs ~${TREE_CO2_KG_PER_YEAR} kg CO₂ per year`} />
        <Metric label="Coal saved each year" value={fmt(yearlyCoalKg)} unit="kg" hint={`At ${COAL_KG_PER_KWH} kg coal per kWh`} />
        <Metric label="CO₂ avoided over 25 years" value={fmt(totalCo2Kg / 1000, 1)} unit="tonnes" hint="Includes 0.5%/yr degradation" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your system">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Estimate from</Label>
              <div className="flex gap-2">
                {[{ v: "kw", l: "System size" }, { v: "kwh", l: "Yearly generation" }].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setSource(o.v)}
                    className={cn("rounded-md border px-3 py-1.5 text-sm", source === o.v ? "border-forest bg-forest text-forest-foreground" : "bg-card")}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            {source === "kw" ? (
              <>
                <RoiField id="ei-kw" label="System size (kW)" value={kw} onChange={setKw} step={0.5} hint="Your rooftop solar capacity" />
                <Choice id="ei-city" label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} hint="Sets the average daily sun hours" />
              </>
            ) : (
              <RoiField id="ei-kwh" label="Yearly generation (kWh)" value={yearlyKwh} onChange={setYearlyKwh} step={100} hint="Use a metered or estimated figure" />
            )}
          </div>
        </Panel>

        <Panel title="Cumulative CO₂ saved over 25 years (tonnes)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `Y${v}`} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v} t`} />
                <Tooltip
                  formatter={(v: number) => `${fmt(v)} t`}
                  labelFormatter={(v) => `Year ${v}`}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                />
                <Area dataKey="cumulative" name="Cumulative CO₂ saved" type="monotone" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on {fmt(annualKwh)} kWh generated in year 1, falling {(ASSUMPTIONS.degradation * 100).toFixed(1)}% each year.
          </p>
        </Panel>
      </div>

      <Panel title="25-year impact summary">
        <dl className="space-y-2.5 text-sm">
          {[
            ["Total solar generation", `${fmt(totalCo2Kg / GRID_CO2_KG_PER_KWH)} kWh`],
            ["CO₂ avoided", `${fmt(totalCo2Kg / 1000, 1)} tonnes`],
            ["Coal saved", `${fmt(totalCoalKg / 1000, 1)} tonnes`],
            ["Equivalent trees planted", `${fmt(totalTrees)} trees`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="tnum text-right text-forest">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs italic text-muted-foreground">
          Note: the grid emission factor ({GRID_CO2_KG_PER_KWH} kg CO₂ per kWh), coal factor ({COAL_KG_PER_KWH} kg coal per kWh) and tree absorption (~{TREE_CO2_KG_PER_YEAR} kg CO₂ per tree per year) are approximate national averages. Actual impact depends on your region's grid mix, real generation and site conditions.
        </p>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// `phone` and `tariff_per_unit` are columns on public.profiles. The generated
// Supabase types catch up once the migration is applied, hence the local shape.
type ProfileRow = {
  display_name: string | null;
  city: string | null;
  phone: string | null;
  tariff_per_unit: number | null;
};

function SettingsView() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [tariff, setTariff] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!alive) return;
      if (!auth.user) {
        setLoading(false);
        return;
      }
      setEmail(auth.user.email ?? "");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      if (!alive) return;
      if (error) {
        toast.error("Could not load your profile.", { description: error.message });
      } else {
        const row = data as unknown as ProfileRow | null;
        setFullName(row?.display_name ?? "");
        setPhone(row?.phone ?? "");
        setCity(row?.city ?? "");
        setTariff(row?.tariff_per_unit == null ? "" : String(row.tariff_per_unit));
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    const digits = phone.replace(/\D/g, "");
    if (phone.trim() && !/^(91)?[6-9]\d{9}$/.test(digits)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    const tariffValue = tariff.trim() === "" ? null : Number(tariff);
    if (tariffValue !== null && (!Number.isFinite(tariffValue) || tariffValue <= 0)) {
      toast.error("Enter a valid electricity tariff in ₹ per unit.");
      return;
    }

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    const payload = {
      id: auth.user.id,
      display_name: fullName.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      tariff_per_unit: tariffValue,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .upsert(payload as unknown as TablesInsert<"profiles">, { onConflict: "id" });
    setSaving(false);

    if (error) {
      toast.error("Could not save your profile.", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved.");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Your profile" className="lg:col-span-2">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-name" className="text-xs text-muted-foreground">Full name</Label>
              <Input id="st-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ananya Sharma" disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-phone" className="text-xs text-muted-foreground">Phone</Label>
              <Input id="st-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" disabled={loading} className="tnum" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-city" className="text-xs text-muted-foreground">City</Label>
              <Input id="st-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-tariff" className="text-xs text-muted-foreground">Electricity tariff (₹/unit)</Label>
              <Input id="st-tariff" type="number" inputMode="decimal" min={0} step={0.25} value={tariff} onChange={(e) => setTariff(e.target.value)} placeholder="0.00" disabled={loading} className="tnum" />
              <p className="text-[11px] text-muted-foreground/70">What you pay per unit — used to personalise your savings estimates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={loading || saving}>{saving ? "Saving…" : "Save changes"}</Button>
            {loading && <span className="text-xs text-muted-foreground">Loading your profile…</span>}
          </div>
        </form>
      </Panel>

      <Panel title="Account">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate text-forest">{email || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="text-forest">Homeowner</dd>
          </div>
        </dl>
        <Button variant="outline" className="mt-4 w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Reports
// ---------------------------------------------------------------------------

// Rotating demo templates so "Create sample report" produces a varied list.
const SAMPLE_REPORTS = [
  { kw: 2, city: "Pune" },
  { kw: 3, city: "Bengaluru" },
  { kw: 5, city: "Chennai" },
];

function MyReports() {
  const qc = useQueryClient();
  const { data: reports = [], isLoading, isError } = useQuery(assessmentsQuery);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Assessment | null>(null);

  const createSample = async () => {
    setCreating(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setCreating(false);
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    const t = SAMPLE_REPORTS[reports.length % SAMPLE_REPORTS.length]!;
    const annual = t.kw * ASSUMPTIONS.specificYield;
    const savings = Math.min(annual, 330 * 12) * ASSUMPTIONS.tariff;
    const cost = t.kw * ASSUMPTIONS.costPerKw;

    const { error } = await supabase.from("assessments").insert({
      user_id: auth.user.id,
      title: `${fmt(t.kw, 1)} kW · ${t.city} rooftop`,
      city: t.city,
      capacity_kw: t.kw,
      annual_kwh: Math.round(annual),
      annual_savings: Math.round(savings),
      cost: Math.round(cost),
      payback_years: savings > 0 ? Number((cost / savings).toFixed(1)) : null,
      inputs: {
        monthlyUnits: 330,
        roofSqft: t.kw * ASSUMPTIONS.sqftPerKw,
        direction: "South",
        shading: "None",
        budget: Math.round(cost),
        battery: false,
        tariff: ASSUMPTIONS.tariff,
      },
    });
    setCreating(false);

    if (error) {
      toast.error("Could not create the sample report.", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["assessments"] });
    toast.success("Sample report created.");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete this report.", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["assessments"] });
    toast.success("Report deleted.");
  };

  return (
    <div className="space-y-6">
      <Panel title="My saved reports">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {reports.length
              ? `${reports.length} saved report${reports.length === 1 ? "" : "s"} · private to your account`
              : "Reports you save are private to your account"}
          </p>
          <Button size="sm" onClick={createSample} disabled={creating}>
            <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create sample report"}
          </Button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading your reports…</p>
        ) : isError ? (
          <Empty>We couldn't load your reports. Refresh the page and try again.</Empty>
        ) : reports.length === 0 ? (
          <Empty>
            No saved reports yet. Run an assessment in the{" "}
            <Link to="/advisor" className="text-primary underline underline-offset-2">Solar Advisor</Link>{" "}
            or create a sample report to see how this works.
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">System size</TableHead>
                <TableHead className="text-right">Estimated savings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground tnum">{fmtDate(r.created_at)}</TableCell>
                  <TableCell className="text-forest">{r.title}</TableCell>
                  <TableCell className="text-right tnum">{fmt(r.capacity_kw, 1)} kW</TableCell>
                  <TableCell className="text-right tnum text-forest">
                    {inr(r.annual_savings)}
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <PrintLink id={r.id} />
                      <DeleteReport title={r.title} onConfirm={() => remove(r.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <ReportDialog report={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  );
}

function PrintLink({ id, size = "sm" }: { id: string; size?: "sm" | "default" }) {
  return (
    <Button asChild size={size} variant="outline">
      <Link to="/reports/print" search={{ id }} target="_blank" rel="noopener">
        <Printer className="h-4 w-4" /> Print
      </Link>
    </Button>
  );
}

function DeleteReport({ title, onConfirm }: { title: string; onConfirm: () => void | Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this report?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} will be permanently removed from your account. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReportDialog({ report, onOpenChange }: { report: Assessment | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!report} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {report && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-light text-forest">{report.title}</DialogTitle>
              <DialogDescription>
                Saved {fmtDate(report.created_at)}
                {report.city ? ` · ${report.city}` : ""}
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-2.5 text-sm">
              {[
                ["System size", `${fmt(report.capacity_kw, 1)} kW`],
                ["Annual generation", `${fmt(report.annual_kwh)} kWh`],
                ["Estimated annual savings", inr(report.annual_savings)],
                ["Estimated cost", inr(report.cost)],
                ["Payback period", report.payback_years == null ? "—" : `${fmt(report.payback_years, 1)} years`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum text-forest">{v}</dd>
                </div>
              ))}
            </dl>

            <DialogFooter>
              <PrintLink id={report.id} size="default" />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
