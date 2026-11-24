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
import { useSolarStore, CITIES, SHARED_SOLAR_CONSTANTS, calculateSolarMetrics, type SolarSettings } from "@/lib/solar-store";
import { useMotionMode, type MotionMode } from "@/components/live-theme";
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
  const { settings } = useSolarStore();

  const nav = NAV.map(n => ({
    ...n,
    active: n.label === view,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      setView(n.label);
    }
  }));

  const getSubtitle = (tab: string) => {
    switch (tab) {
      case "Overview":
        return `${settings.city}, West Bengal · South-facing RCC roof · ${fmt(settings.roofArea)} sq ft · ${fmt(settings.systemSizeKw, 1)} kW`;
      case "Solar Potential":
        return "Assess your rooftop area, solar irradiance, and estimated generation capacity.";
      case "Fault Detection":
        return "Real-time diagnostic health, panel anomaly monitoring, and issue resolution.";
      case "System Planner":
        return "Tailor your panel capacity, inverter sizing, and estimated installation investment.";
      case "Energy Forecast":
        return "Seasonal 12-month generation predictions and grid export projections.";
      case "Savings & ROI":
        return "Financial returns, payback timeline, and cumulative lifetime net position.";
      case "Battery Planner":
        return "Energy storage sizing, critical load backup, and battery chemistry comparison.";
      case "Environmental Impact":
        return "Carbon offset metrics, tree equivalents, and lifetime clean energy generation.";
      case "My Reports":
        return "Archived system estimates, generated audits, and downloadable solar plans.";
      case "Settings":
        return "Customize location, roof area, utility tariff, and solar simulation parameters.";
      default:
        return "Personalized solar intelligence for your home.";
    }
  };

  return (
    <DashboardShell 
      nav={nav} 
      active={view} 
      title={view === "Overview" ? "Good morning! Let's make your home solar-ready." : view} 
      subtitle={getSubtitle(view)}
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
const SAMPLE_OVERVIEW = { kw: 3, city: "Kolkata" };

const QUICK_LINKS = [
  { icon: Sun, label: "Solar Potential", desc: "Check your roof's capacity" },
  { icon: Settings2, label: "System Planner", desc: "Plan panels, inverter and cost" },
  { icon: IndianRupee, label: "Savings & ROI", desc: "See payback and 25-year return" },
  { icon: Battery, label: "Battery Planner", desc: "Size backup for power cuts" },
];

function Overview({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { data: profile } = useQuery(profileQuery);
  const { data: assessments = [] } = useQuery(assessmentsQuery);
  const { settings, calculations } = useSolarStore();
  const latest = assessments[0] ?? null;

  const saved = latest !== null;
  const kw = latest?.capacity_kw ?? settings.systemSizeKw;
  const annualKwh = latest?.annual_kwh ?? calculations.annualGenerationKwh;
  const annualSavings = latest?.annual_savings ?? calculations.yearlySavings;
  const co2 = (annualKwh * settings.gridCo2Factor) / 1000; // tonnes/yr
  const city = latest?.city ?? profile?.city ?? settings.city;
  const series = calculations.monthlySeries;

  // Live generation simulation (kW) fluctuating gently every 2.5s around peak solar capacity
  const [liveKw, setLiveKw] = useState(() => Number((kw * 0.72).toFixed(2)));
  const [sparkHistory, setSparkHistory] = useState<number[]>([1.8, 1.9, 2.1, 2.05, 2.15, 2.2, 2.18]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate live daylight power output: 65% - 85% of rated capacity with gentle noise
      const base = kw * 0.74;
      const variation = (Math.sin(Date.now() / 3000) * 0.08 + (Math.random() - 0.5) * 0.04) * kw;
      const nextVal = Number(Math.max(0.1, base + variation).toFixed(2));
      setLiveKw(nextVal);
      setSparkHistory((prev) => [...prev.slice(1), nextVal]);
    }, 2500);
    return () => clearInterval(timer);
  }, [kw]);

  return (
    <div className="space-y-6">
      {/* Hero card with golden lotus art right & gradient contrast overlay */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-soft transition-all duration-300">
        {/* Subtle decorative lotus art positioned right */}
        <div 
          className="pointer-events-none absolute -right-6 -bottom-8 h-48 w-48 opacity-15 dark:opacity-25"
          style={{
            backgroundImage: "url('/golden-lotus.webp')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Live Array Telemetry</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Peak: {calculations.peakMonth}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-4xl font-light tracking-tight text-forest tnum">
                {liveKw} <span className="text-xl font-normal text-muted-foreground">kW</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                Generating now · {city} ({fmt(kw, 1)} kW system)
              </span>
            </div>
          </div>

          {/* Sparkline visualization */}
          <div className="flex items-center gap-3 rounded-xl border bg-card/80 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-muted-foreground">Instantaneous</span>
              <span className="text-xs font-medium text-forest tnum">{liveKw} kW</span>
            </div>
            <div className="flex h-8 items-end gap-1.5">
              {sparkHistory.map((val, idx) => {
                const heightPct = Math.max(20, Math.min(100, (val / kw) * 100));
                return (
                  <div
                    key={idx}
                    className="w-1.5 rounded-t bg-amber-400 transition-all duration-500"
                    style={{ height: `${heightPct}%` }}
                    title={`${val} kW`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="energy-flow mt-5 h-1.5 w-full rounded-full opacity-80" />
      </div>

      {/* 4 KPI cards with icons, trends, and hover highlights */}
      <div className="fade-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "80ms" }}>
        <Metric
          label="System size"
          value={fmt(kw, 1)}
          unit="kW"
          icon={Settings2}
          trend={{ value: `${calculations.panelsCount} panels`, positive: true }}
          hint={saved ? "From your saved assessment" : `${calculations.panelsCount} × 550W modules`}
        />
        <Metric
          label="Yearly generation"
          value={fmt(annualKwh)}
          unit="kWh"
          icon={Sun}
          trend={{ value: `Peak in ${calculations.peakMonth}`, positive: true }}
          hint={`Yield: ${fmt(calculations.yieldPerKw)} kWh/kWp/yr`}
        />
        <Metric
          label="Yearly savings"
          value={inr(annualSavings)}
          icon={IndianRupee}
          trend={{ value: `${calculations.paybackYears}y payback`, positive: true }}
          hint={`At ₹${settings.tariff}/unit base tariff`}
        />
        <Metric
          label="CO₂ avoided"
          value={fmt(co2, 2)}
          unit="t/yr"
          icon={Leaf}
          trend={{ value: `${calculations.yearlyTreesEquivalent} trees/yr`, positive: true }}
          hint={`Grid factor ${settings.gridCo2Factor} kg/kWh`}
        />
      </div>

      <div className="fade-up grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "160ms" }}>
        {QUICK_LINKS.map(({ icon: I, label, desc }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(label)}
            className="group flex items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-muted hover:shadow-lift"
          >
            <I className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-forest">{label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="fade-up" style={{ animationDelay: "240ms" }}>
        <Panel title={`Monthly generation estimate (kWh) — Peak: ${calculations.peakMonth}`}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="expected" name="Monthly generation" radius={[4, 4, 0, 0]}>
                  {series.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.month === calculations.peakMonth ? "var(--solar)" : "var(--chart-1)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {saved
              ? `Based on your latest saved assessment for ${city}. Peak generation month highlighted in amber (${calculations.peakMonth}).`
              : `Showing Kolkata profile insolation model. Peak month in amber (${calculations.peakMonth}: ${fmt(series.find(s=>s.month===calculations.peakMonth)?.expected ?? 0)} kWh).`}
          </p>
        </Panel>
      </div>
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
  const { settings, update } = useSolarStore();
  const [hasSubsidy, setHasSubsidy] = useState(false);
  const [subsidy, setSubsidy] = useState(78000); // Standard PM Surya Ghar benchmark for 3kW
  const [tariffEscalationPct, setTariffEscalationPct] = useState(3.0); // 3%/yr escalation

  const effectiveSubsidy = hasSubsidy ? subsidy : 0;

  // Dynamic calculations for the current system
  const metrics = calculateSolarMetrics(settings, settings.systemSizeKw, effectiveSubsidy);

  // 25-Year Cumulative Net Position (starts negative at -netCost, crosses zero at break-even)
  const netCost = metrics.netCost;
  let runningCumulative = -netCost;
  let breakEvenYear = 0;

  const series = Array.from({ length: 25 }, (_, i) => {
    const year = i + 1;
    // Each year: generation slightly degraded, tariff escalated
    const degradedGen = metrics.offsetUnitsKwh * Math.pow(1 - settings.degradation, i);
    const escalatedTariff = settings.tariff * Math.pow(1 + tariffEscalationPct / 100, i);
    const annualSavings = Math.round(degradedGen * escalatedTariff);
    
    const prevPosition = runningCumulative;
    runningCumulative += annualSavings;

    if (prevPosition < 0 && runningCumulative >= 0 && breakEvenYear === 0) {
      breakEvenYear = year;
    }

    return {
      year,
      annual: annualSavings,
      netPosition: Math.round(runningCumulative),
      isBreakEven: year === breakEvenYear,
    };
  });

  const total25CumulativeSavings = series[series.length - 1]?.netPosition ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Total cost after subsidy"
          value={inr(netCost)}
          hint={hasSubsidy ? `${inr(metrics.grossCost)} − ${inr(subsidy)} subsidy` : "No subsidy applied"}
        />
        <Metric
          label="Estimated yearly savings"
          value={inr(metrics.yearlySavings)}
          hint={`${fmt(metrics.offsetUnitsKwh)} kWh offset at ₹${fmt(settings.tariff, 2)}/unit`}
        />
        <Metric
          label="Payback period"
          value={breakEvenYear > 0 ? `${breakEvenYear}` : metrics.paybackYears > 0 ? fmt(metrics.paybackYears, 1) : "—"}
          unit={breakEvenYear > 0 || metrics.paybackYears > 0 ? "years" : ""}
          hint={breakEvenYear > 0 ? `Break-even at Year ${breakEvenYear}` : "Time to recover your net cost"}
        />
        <Metric label="25-year net profit" value={inr(total25CumulativeSavings)} hint={`At ${tariffEscalationPct}%/yr tariff escalation`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your financial inputs">
          <div className="space-y-4">
            <RoiField id="roi-bill" label="Monthly electricity bill (₹)" value={settings.monthlyBill} onChange={(n) => update({ monthlyBill: n })} step={100} />
            <RoiField id="roi-kw" label="System size (kW)" value={settings.systemSizeKw} onChange={(n) => update({ systemSizeKw: n })} step={0.5} hint="Your rooftop solar capacity" />
            <RoiField id="roi-cost" label="Cost per kW (₹)" value={settings.costPerKw} onChange={(n) => update({ costPerKw: n })} step={1000} hint="Indicative installed cost" />
            
            {/* Subsidy Toggle & Input */}
            <div className="rounded-lg border p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="roi-subsidy-toggle" className="text-xs font-medium text-forest cursor-pointer">
                  PM Surya Ghar Subsidy
                </Label>
                <input
                  id="roi-subsidy-toggle"
                  type="checkbox"
                  checked={hasSubsidy}
                  onChange={(e) => setHasSubsidy(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
              {hasSubsidy && (
                <div className="pt-1">
                  <RoiField id="roi-subsidy" label="Subsidy amount (₹)" value={subsidy} onChange={setSubsidy} step={1000} hint="Govt. direct benefit transfer" />
                </div>
              )}
            </div>

            <RoiField id="roi-tariff" label="Electricity tariff (₹/unit)" value={settings.tariff} onChange={(n) => update({ tariff: n })} step={0.25} />
            <RoiField id="roi-escalation" label="Tariff escalation rate (%/yr)" value={tariffEscalationPct} onChange={setTariffEscalationPct} step={0.5} hint="Default 3%/yr realistic grid rate rise" />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          {/* Cumulative Net Position Line Chart Crossing Zero */}
          <Panel title="Cumulative net-position & break-even timeline (₹)">
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={series}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `Y${v}`} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v: number) => inr(v)}
                    labelFormatter={(v) => `Year ${v}`}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                  {/* Zero reference line where system breaks even */}
                  <Line
                    type="monotone"
                    dataKey={() => 0}
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Zero Line (Break-even)"
                  />
                  {/* Cumulative net-position line */}
                  <Line
                    type="monotone"
                    dataKey="netPosition"
                    name="Cumulative Net Position"
                    stroke="#0A7A4F"
                    strokeWidth={3}
                    dot={(props: { payload?: { isBreakEven?: boolean }; cx?: number; cy?: number }) => {
                      if (props.payload?.isBreakEven && props.cx !== undefined && props.cy !== undefined) {
                        return (
                          <circle
                            key="breakeven-dot"
                            cx={props.cx}
                            cy={props.cy}
                            r={6}
                            fill="#FFC21A"
                            stroke="#0A3D2A"
                            strokeWidth={2}
                          />
                        );
                      }
                      return <circle key={Math.random()} cx={props.cx} cy={props.cy} r={2} fill="#0A7A4F" />;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 border border-emerald-900 inline-block" />
                Break-even dot in amber (Year {breakEvenYear || "5"})
              </span>
              <span>Green line starts at -{inr(netCost)} and climbs into lifetime profit</span>
            </div>
          </Panel>

          <Panel title="Payback at a glance">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Total system cost", inr(metrics.grossCost)],
                ["Subsidy applied", hasSubsidy ? inr(subsidy) : "None"],
                ["Net capital investment", inr(metrics.netCost)],
                ["Year-1 savings", inr(metrics.yearlySavings)],
                ["Break-even year", breakEvenYear > 0 ? `Year ${breakEvenYear}` : `${fmt(metrics.paybackYears, 1)} years`],
                ["Lifetime 25-yr net return", inr(total25CumulativeSavings)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum font-medium text-forest">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

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
  const { settings, update } = useSolarStore();

  const metrics = calculateSolarMetrics(settings, settings.systemSizeKw);
  const maxKw = metrics.maxInstallableKw;
  const sunHours = metrics.sunHours;
  const usableArea = metrics.usableRoofArea;
  const yieldPerKw = metrics.yieldPerKw;
  const annualKwh = metrics.annualGenerationKwh;
  const data = metrics.monthlySeries;

  // Roof fit percentage: what percentage of available roof does current system require
  const neededArea = settings.systemSizeKw * SHARED_SOLAR_CONSTANTS.sqftPerKw;
  const roofFitPct = Math.min(100, Math.round((neededArea / Math.max(1, usableArea)) * 100));

  // Shading hint
  const shadingHint =
    settings.shading === "none"
      ? "Shadow-free roof retains 100% solar efficiency throughout prime sun hours."
      : settings.shading === "low"
      ? "Minor tree or parapet shadow causes an estimated ~10% loss in seasonal generation."
      : "Heavy nearby obstructions cause ~28% generation reduction; microinverters or optimizers recommended.";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Usable roof area" value={fmt(usableArea)} unit="sq ft" hint={`of ${fmt(settings.roofArea)} sq ft gross`} />
        <Metric label="Max installable size" value={fmt(maxKw, 1)} unit="kW" hint="At ~100 sq ft per kW" />
        <Metric label="Avg. daily sun hours" value={fmt(sunHours, 1)} unit="h" hint={`${settings.city} annual average`} />
        <Metric label="Estimated yearly generation" value={fmt(annualKwh)} unit="kWh" hint={`${fmt(settings.systemSizeKw, 1)} kW system`} />
      </div>

      {/* Roof-fit progress & Seasonal Chips */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Roof Utilization</span>
            <span className="text-xs font-semibold text-forest tnum">{roofFitPct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", roofFitPct > 100 ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min(100, roofFitPct)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {neededArea} sq ft required for {fmt(settings.systemSizeKw, 1)} kW (of {usableArea} sq ft usable)
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Seasonal Incline</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              Best: {metrics.peakMonth} ({fmt(data.find(d=>d.month===metrics.peakMonth)?.expected ?? 0)} kWh)
            </span>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              Low: {metrics.lowestMonth} ({fmt(data.find(d=>d.month===metrics.lowestMonth)?.expected ?? 0)} kWh)
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Peak output occurs during pre-summer dry months
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Shading Impact Hint</span>
          <p className="mt-1 text-xs text-forest leading-relaxed">
            {shadingHint}
          </p>
          <span className="mt-1 text-[11px] text-muted-foreground">Current: {settings.shading} shading</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        <Panel title="Your roof parameters" className="h-full flex flex-col justify-between">
          <div className="space-y-4">
            <Choice
              id="sp-city"
              label="City"
              value={settings.city}
              onChange={(c) => update({ city: c })}
              options={CITIES.map((c) => ({ value: c, label: c }))}
              hint="Sets the average daily sun hours & seasonal solar profile"
            />
            <RoiField id="sp-area" label="Roof area (sq ft)" value={settings.roofArea} onChange={(a) => update({ roofArea: a })} step={50} hint="Total available roof area" />
            <Choice
              id="sp-roof"
              label="Roof type"
              value={settings.roofType}
              onChange={(t) => update({ roofType: t as "flat" | "sloped" })}
              options={[{ value: "flat", label: "Flat (RCC)" }, { value: "sloped", label: "Sloped / Shed" }]}
              hint="Flat roofs need spacing between panel rows"
            />
            <Choice
              id="sp-shade"
              label="Shading level"
              value={settings.shading}
              onChange={(s) => update({ shading: s as "none" | "low" | "high" })}
              options={[{ value: "none", label: "None (Full sun)" }, { value: "low", label: "Low (Partial shadow)" }, { value: "high", label: "High (Heavy shadow)" }]}
              hint="Trees, water tanks or adjacent parapets"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2 flex flex-col justify-between">
          <Panel title="Monthly generation profile (kWh)">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Bar dataKey="expected" name="Monthly generation" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.month === metrics.peakMonth ? "var(--solar)" : "var(--chart-1)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Calculated using the {settings.city} 12-month solar profile. Peak month highlighted in amber ({metrics.peakMonth}).
            </p>
          </Panel>

          <Panel title="Site summary">
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              {[
                ["City", settings.city],
                ["Average daily sun hours", `${fmt(sunHours, 1)} h`],
                ["Usable roof area", `${fmt(usableArea)} sq ft`],
                ["Maximum system size", `${fmt(maxKw, 1)} kW`],
                ["Yield per kW", `${fmt(yieldPerKw)} kWh/yr`],
                ["Estimated yearly generation", `${fmt(annualKwh)} kWh`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2 last:border-0 sm:last:border-b">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tnum font-medium text-forest">{v}</dd>
                </div>
              ))}
            </dl>
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
  const qc = useQueryClient();
  const { settings, update } = useSolarStore();
  const [budget, setBudget] = useState(200000);
  const [savingPlan, setSavingPlan] = useState(false);

  const metrics = calculateSolarMetrics(settings);
  const monthlyUnits = settings.tariff > 0 ? Math.round(settings.monthlyBill / settings.tariff) : 350;
  const sunHours = metrics.sunHours;
  const yieldPerKw = metrics.yieldPerKw;
  const annualUnits = monthlyUnits * 12;
  const needKw = yieldPerKw > 0 ? annualUnits / yieldPerKw : 0;
  const recommendedKw = roundHalfKw(needKw);

  const ctx: PlanContext = { yieldPerKw, roofArea: settings.roofArea, budget, costPerKw: settings.costPerKw };
  const recommended = buildPlan("recommended", "Recommended", recommendedKw, ctx);
  const smaller = buildPlan("smaller", "Smaller", roundHalfKw(recommendedKw * PLAN_SCALE.smaller), ctx);
  const larger = buildPlan("larger", "Larger", roundHalfKw(recommendedKw * PLAN_SCALE.larger), ctx);
  const plans = [smaller, recommended, larger];

  const hasBudget = budget > 0;
  const overBudgetAmount = hasBudget && recommended.cost > budget ? recommended.cost - budget : 0;

  // Function to save selected plan into My Reports
  const savePlanToReports = async (p: Plan) => {
    setSavingPlan(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSavingPlan(false);
      toast.error("Please sign in to save your plan.");
      return;
    }

    const annualSavings = Math.round(Math.min(p.annualKwh, annualUnits) * settings.tariff);
    const payback = annualSavings > 0 ? Number((p.cost / annualSavings).toFixed(1)) : null;

    const { error } = await supabase.from("assessments").insert({
      user_id: auth.user.id,
      title: `${fmt(p.kw, 1)} kW (${p.label}) · ${settings.city} Plan`,
      city: settings.city,
      capacity_kw: p.kw,
      annual_kwh: Math.round(p.annualKwh),
      annual_savings: annualSavings,
      cost: Math.round(p.cost),
      payback_years: payback,
      inputs: {
        monthlyUnits,
        roofSqft: settings.roofArea,
        direction: settings.direction,
        shading: settings.shading,
        budget: p.cost,
        battery: false,
        tariff: settings.tariff,
      },
    });
    setSavingPlan(false);

    if (error) {
      toast.error("Could not save plan to reports.", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["assessments"] });
    toast.success(`${p.label} plan (${fmt(p.kw, 1)} kW) saved to My Reports.`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Recommended system size" value={fmt(recommended.kw, 1)} unit="kW" hint={`To offset ${fmt(annualUnits)} kWh/yr`} />
        <Metric label="Number of panels" value={fmt(recommended.panels)} unit={`× ${PLANNER_PANEL_WATT} W`} hint="Module count at the assumed rating" />
        <Metric label="Roof area required" value={fmt(recommended.area)} unit="sq ft" hint={`of ${fmt(settings.roofArea)} sq ft available`} />
        <Metric label="Estimated cost" value={inr(recommended.cost)} hint={`at ${inr(settings.costPerKw)}/kW`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your requirement">
          <div className="space-y-4">
            <RoiField
              id="spl-units"
              label="Average monthly electricity units (kWh)"
              value={monthlyUnits}
              onChange={(units) => update({ monthlyBill: units * settings.tariff })}
              step={10}
              hint="Calculated from your monthly bill & tariff"
            />
            <Choice
              id="spl-city"
              label="City"
              value={settings.city}
              onChange={(c) => update({ city: c })}
              options={CITIES.map((c) => ({ value: c, label: c }))}
              hint="Sets the average daily sun hours"
            />
            <RoiField id="spl-area" label="Roof area (sq ft)" value={settings.roofArea} onChange={(a) => update({ roofArea: a })} step={50} hint="Total available roof area" />
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
              value={settings.costPerKw}
              onChange={(c) => update({ costPerKw: c })}
              step={1000}
              hint="Editable — indicative installed cost"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          {/* Over-budget warning banner */}
          {overBudgetAmount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold text-sm">Warning:</span>
              <span>Recommended plan is over budget by <strong>{inr(overBudgetAmount)}</strong>. Consider the smaller alternative or expand your budget.</span>
            </div>
          )}

          <div className={cn("rounded-lg border-2 p-5", recommended.fitsRoof && (!hasBudget || recommended.fitsBudget) ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended plan</p>
                <p className="mt-1 font-display text-3xl font-light text-forest">
                  {fmt(recommended.kw, 1)} kW
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{settings.city} · {fmt(sunHours, 1)} sun hours/day</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FitBadge ok={recommended.fitsRoof} okLabel="Fits your roof" failLabel="Doesn't fit your roof" />
                <FitBadge
                  ok={!hasBudget || recommended.fitsBudget}
                  okLabel={hasBudget ? "Within budget" : "No budget set"}
                  failLabel={`Over by ${inr(overBudgetAmount)}`}
                />
                <Button size="sm" onClick={() => savePlanToReports(recommended)} disabled={savingPlan}>
                  {savingPlan ? "Saving…" : "Save Plan to My Reports"}
                </Button>
              </div>
            </div>

            {/* Roof fit progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Roof footprint</span>
                <span className="font-medium text-forest tnum">{recommended.area} sq ft / {settings.roofArea} sq ft</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", recommended.fitsRoof ? "bg-primary" : "bg-destructive")}
                  style={{ width: `${Math.min(100, (recommended.area / Math.max(1, settings.roofArea)) * 100)}%` }}
                />
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                ["System size", `${fmt(recommended.kw, 1)} kW`],
                ["Panels", `${fmt(recommended.panels)} × ${PLANNER_PANEL_WATT} W`],
                ["Roof area required", `${fmt(recommended.area)} sq ft (${fmt(settings.roofArea)} sq ft available)`],
                ["Estimated cost", inr(recommended.cost)],
                ["Estimated yearly generation", `${fmt(recommended.annualKwh)} kWh`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="tnum text-right text-forest">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Panel title="Plan comparison (Equal height cards)">
            <div className="grid gap-3 sm:grid-cols-3 items-stretch">
              {plans.map((p) => {
                const isRecommended = p.key === "recommended";
                const annualSavings = Math.round(Math.min(p.annualKwh, annualUnits) * settings.tariff);
                const payback = annualSavings > 0 ? (p.cost / annualSavings).toFixed(1) : "—";
                const isOverBudget = hasBudget && p.cost > budget;
                const overAmt = isOverBudget ? p.cost - budget : 0;

                return (
                  <div
                    key={p.key}
                    className={cn(
                      "flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-all hover:border-primary/50",
                      isRecommended ? "border-forest ring-1 ring-forest bg-forest/5" : "bg-card",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{p.label}</p>
                        {isRecommended && <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-medium text-forest-foreground">Best fit</span>}
                      </div>
                      <p className="font-display text-2xl font-light text-forest mt-1">{fmt(p.kw, 1)} kW</p>
                      
                      {/* Roof Fit Bar */}
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", p.fitsRoof ? "bg-primary" : "bg-destructive")}
                            style={{ width: `${Math.min(100, (p.area / Math.max(1, settings.roofArea)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">{p.area} / {settings.roofArea} sq ft</span>
                      </div>

                      <dl className="space-y-1.5 text-xs mt-3">
                        <div className="flex justify-between gap-2 border-b pb-1">
                          <dt className="text-muted-foreground">Panels</dt>
                          <dd className="tnum text-right text-forest">{fmt(p.panels)} × {PLANNER_PANEL_WATT}W</dd>
                        </div>
                        <div className="flex justify-between gap-2 border-b pb-1">
                          <dt className="text-muted-foreground">Cost</dt>
                          <dd className="tnum text-right text-forest">{inr(p.cost)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 border-b pb-1">
                          <dt className="text-muted-foreground">Est. Payback</dt>
                          <dd className="tnum text-right text-amber-600 dark:text-amber-400 font-medium">{payback} yrs</dd>
                        </div>
                        <div className="flex justify-between gap-2 border-b pb-1">
                          <dt className="text-muted-foreground">Generation</dt>
                          <dd className="tnum text-right text-forest">{fmt(p.annualKwh)} kWh/yr</dd>
                        </div>
                      </dl>

                      {isOverBudget && (
                        <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          Over budget by {inr(overAmt)}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t mt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        <FitBadge ok={p.fitsRoof} okLabel="Roof OK" failLabel="Roof short" />
                        <FitBadge ok={!hasBudget || p.fitsBudget} okLabel={hasBudget ? "Budget OK" : "No budget"} failLabel="Over budget" />
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => savePlanToReports(p)} disabled={savingPlan}>
                        Save Plan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs italic text-muted-foreground">
              Note: System sizes offset typical consumption using {settings.city}'s solar insolation. Panels assumed at {PLANNER_PANEL_WATT} W each.
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
  const [batteryType, setBatteryType] = useState<"lithium" | "lead-acid">("lithium");

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
        <Metric label="Depth of discharge" value={`${Math.round(battery.dod * 100)}%`} hint={battery.label} />
        <Metric label="Recommended batteries" value={fmt(units)} unit={units === 1 ? "unit" : "units"} hint={`${battery.moduleAh} Ah · ${BATTERY_VOLTS} V each`} />
        <Metric label="Expected battery life" value={fmt(battery.lifeYears)} unit="years" hint="Cycle life at rated DOD" />
      </div>

      {/* Battery Gauge & Chemistry Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Animated Gauge Card */}
        <div className="rounded-xl border bg-card p-5 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Battery Usable Storage Gauge</span>
          <div className="my-3 flex flex-col items-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
              <span className="font-display text-2xl font-light text-forest tnum">
                {Math.round(battery.dod * 100)}%
              </span>
              <span className="absolute bottom-3 text-[10px] text-muted-foreground uppercase font-semibold">Usable DOD</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {fmt(usableKwh, 1)} kWh usable of {fmt(requiredKwh, 1)} kWh gross capacity
          </p>
        </div>

        {/* Lithium vs Lead-acid side-by-side comparison */}
        <div className="md:col-span-2 rounded-xl border bg-card p-5 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chemistry Comparison</span>
            <span className="text-xs text-primary font-medium">Selected: {battery.label}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className={cn("rounded-lg border p-3 transition-colors", batteryType === "lithium" ? "border-primary bg-primary/5" : "bg-muted/30")}>
              <p className="font-semibold text-forest">Lithium Iron Phosphate (LFP)</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 90% usable depth of discharge</li>
                <li>• ~10 years lifespan (3,500+ cycles)</li>
                <li>• High efficiency, zero maintenance</li>
                <li>• ₹16,000 – ₹22,000 / kWh</li>
              </ul>
            </div>
            <div className={cn("rounded-lg border p-3 transition-colors", batteryType === "lead-acid" ? "border-primary bg-primary/5" : "bg-muted/30")}>
              <p className="font-semibold text-forest">Tubular Lead-Acid</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 50% usable depth of discharge</li>
                <li>• ~4 years lifespan (1,200 cycles)</li>
                <li>• Periodic distilled water top-ups</li>
                <li>• ₹9,000 – ₹13,000 / kWh (lower upfront)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your backup need">
          <div className="space-y-4">
            <RoiField id="bp-usage" label="Daily electricity usage (kWh)" value={dailyUsage} onChange={setDailyUsage} step={1} hint="Used to check how much of the day is covered" />
            <RoiField id="bp-hours" label="Hours of backup needed" value={backupHours} onChange={setBackupHours} step={1} />
            <RoiField id="bp-load" label="Essential load (W)" value={essentialLoad} onChange={setEssentialLoad} step={50} hint="Lights, fans, fridge, router" />
            <Choice
              id="bp-type"
              label="Battery type"
              value={batteryType}
              onChange={(v) => setBatteryType(v as "lithium" | "lead-acid")}
              options={[
                { value: "lithium", label: "Lithium (LFP) — 90% DOD, 10y life" },
                { value: "lead-acid", label: "Lead-acid (tubular) — 50% DOD, 4y life" },
              ]}
              hint="Select chemistry to update capacity and replacement costs"
            />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Backup hours vs load (with active load marker)">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={curve}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="load" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v}W`} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(v: number) => `${fmt(v, 1)} h`} labelFormatter={(v) => `${fmt(v as number)} W load`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  {/* Load Marker reference line */}
                  <Line
                    type="monotone"
                    dataKey={() => (usableKwh * 1000) / essentialLoad}
                    stroke="#FFC21A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    name="Current Load Duration"
                    dot={false}
                  />
                  <Area dataKey="hours" name="Backup hours" type="monotone" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Amber line: ~{fmt(backupHours, 1)} hours at your current {essentialLoad} W load</span>
              <span>Total usable storage: {fmt(usableKwh, 1)} kWh</span>
            </div>
          </Panel>

          <Panel title="Battery bank summary">
            {/* Fix clipped summary values with robust responsive grid layout */}
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                ["Daily household usage", `${fmt(dailyUsage, 1)} kWh`],
                ["Backup energy required", `${fmt(backupEnergyKwh, 2)} kWh`],
                ["Share of daily usage backed up", `${fmt(coverPct, 0)}%`],
                ["Required gross capacity", `${fmt(requiredKwh, 1)} kWh (${fmt(requiredAh)} Ah @ ${BATTERY_VOLTS}V)`],
                ["Depth of discharge", `${Math.round(battery.dod * 100)}% (${battery.label})`],
                ["Recommended module count", `${fmt(units)} × ${battery.moduleAh} Ah @ ${BATTERY_VOLTS} V`],
                ["Estimated cost range", `${inr(costLow)} – ${inr(costHigh)}`],
                ["Expected battery life", `${fmt(battery.lifeYears)} years`],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col justify-between border-b pb-2 last:border-0 sm:last:border-b">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 tnum font-medium text-forest truncate">{v}</dd>
                </div>
              ))}
            </dl>
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

// Illustrative short-term outlook: sunny (green), cloudy (amber), rainy (grey)
const WEATHER_FACTOR: Record<string, number> = { Sunny: 1, Cloudy: 0.55, Rainy: 0.25 };
const WEEK_WEATHER = ["Sunny", "Sunny", "Cloudy", "Cloudy", "Rainy", "Sunny", "Sunny"];
const WEATHER_COLOR: Record<string, string> = {
  Sunny: "#0A7A4F", // Brand primary green
  Cloudy: "#FFC21A", // Amber accent
  Rainy: "#94A3B8", // Neutral grey
};
const WEATHER_ICON: Record<string, typeof Sun> = { Sunny: Sun, Cloudy: Cloud, Rainy: CloudRain };

function EnergyForecast() {
  const { settings, update } = useSolarStore();
  const [tilt, setTilt] = useState("20");

  const tiltDeg = Number(tilt);
  const tiltFactor = Math.cos(((tiltDeg - OPTIMAL_TILT) * Math.PI) / 180);

  const metrics = calculateSolarMetrics(settings);
  const avgSun = metrics.sunHours;
  const kw = settings.systemSizeKw;

  // Derive forecast using store settings and tilt factor
  const data = metrics.monthlySeries.map((d) => {
    const expected = Math.round(d.expected * tiltFactor);
    const savings = Math.round(expected * settings.tariff);
    return {
      month: d.month,
      sunHours: d.sunHours,
      expected,
      savings,
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
        <Metric label="System size" value={fmt(kw, 1)} unit="kW" hint={`${settings.city} · ${tiltDeg}° tilt`} />
        <Metric label="Avg. daily sun hours" value={fmt(avgSun, 1)} unit="h" hint={`${settings.city} annual average`} />
        <Metric label="Estimated annual generation" value={fmt(annualKwh)} unit="kWh" hint="Typical-year estimate" />
        <Metric label="Estimated annual savings" value={inr(annualSavings)} hint={`at ₹${settings.tariff}/kWh`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your system">
          <div className="space-y-4">
            <RoiField id="ef-kw" label="System size (kW)" value={kw} onChange={(k) => update({ systemSizeKw: k })} step={0.5} hint="Rooftop solar capacity" />
            <Choice
              id="ef-city"
              label="City"
              value={settings.city}
              onChange={(c) => update({ city: c })}
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

        <Panel title={`12-month generation forecast (kWh) — Peak: ${metrics.peakMonth}`} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v: number) => `${fmt(v)} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                {/* Average generation dotted reference line */}
                <Line
                  type="monotone"
                  dataKey={() => Math.round(annualKwh / 12)}
                  stroke="#FFC21A"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  name="Monthly Average"
                  dot={false}
                />
                <Bar dataKey="expected" name="Expected generation" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`forecast-cell-${index}`}
                      fill={entry.month === metrics.peakMonth ? "#FFC21A" : "#0A7A4F"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Peak month in amber ({metrics.peakMonth}: {fmt(data.find(d=>d.month===metrics.peakMonth)?.expected ?? 0)} kWh)</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-amber-400" /> Avg: {fmt(annualKwh / 12)} kWh/mo</span>
          </div>
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

      <Panel title="Month-by-month estimate & savings">
        <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-10 border-b shadow-sm">
              <tr className="text-left text-xs text-muted-foreground bg-muted/50">
                <th className="py-2.5 px-3 font-semibold">Month</th>
                <th className="py-2.5 px-3 text-right font-semibold">Peak sun hours (h/day)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Expected generation (kWh)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Expected savings (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.month} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-forest font-medium">{d.month}</td>
                  <td className="py-2 px-3 text-right tnum">{fmt(d.sunHours, 1)}</td>
                  <td className="py-2 px-3 text-right tnum">{fmt(d.expected)}</td>
                  <td className="py-2 px-3 text-right tnum text-forest font-medium">{inr(d.savings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-card z-10 border-t-2 font-semibold">
              <tr className="bg-primary/5">
                <td className="py-3 px-3 text-forest font-display">Total Annual</td>
                <td className="py-3 px-3 text-right text-xs text-muted-foreground">—</td>
                <td className="py-3 px-3 text-right tnum text-forest">{fmt(annualKwh)} kWh</td>
                <td className="py-3 px-3 text-right tnum text-forest text-base">{inr(annualSavings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-4 text-xs italic text-muted-foreground">
          Note: Monthly generation reflects seasonal sun insolation in {settings.city} with a {(settings.performanceRatio * 100).toFixed(0)}% performance ratio and ₹{settings.tariff}/unit tariff.
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
  const { settings, update } = useSolarStore();
  const [source, setSource] = useState("kw");
  const [yearlyKwh, setYearlyKwh] = useState(4000);

  const metrics = calculateSolarMetrics(settings);
  const annualKwh = source === "kw" ? metrics.annualGenerationKwh : yearlyKwh;

  const yearlyCo2Kg = annualKwh * settings.gridCo2Factor;
  const yearlyCoalKg = annualKwh * SHARED_SOLAR_CONSTANTS.coalKgPerKwh;
  const yearlyTrees = yearlyCo2Kg / SHARED_SOLAR_CONSTANTS.treeCo2KgPerYear;

  let runningKg = 0;
  const series = Array.from({ length: IMPACT_YEARS }, (_, i) => {
    const yearCo2Kg = annualKwh * (1 - settings.degradation) ** i * settings.gridCo2Factor;
    runningKg += yearCo2Kg;
    return { year: i + 1, cumulative: Math.round(runningKg / 1000) }; // tonnes
  });

  const totalCo2Kg = runningKg;
  const totalCoalKg = (totalCo2Kg / settings.gridCo2Factor) * SHARED_SOLAR_CONSTANTS.coalKgPerKwh;
  const totalTrees = totalCo2Kg / SHARED_SOLAR_CONSTANTS.treeCo2KgPerYear;

  // Share My Impact action
  const shareImpact = () => {
    const text = `🌱 My home rooftop solar system in ${settings.city} offsets ${fmt(yearlyCo2Kg)} kg CO₂ per year (equivalent to planting ${fmt(yearlyTrees)} mature trees)! Calculated with SolarVerse AI.`;
    if (navigator.share) {
      navigator.share({ title: "My Solar Environmental Impact", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Impact summary copied to clipboard! Share it with friends.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="CO₂ avoided each year" value={fmt(yearlyCo2Kg)} unit="kg" hint={`At ${settings.gridCo2Factor} kg CO₂ per kWh`} />
        <Metric label="Equivalent trees planted" value={fmt(yearlyTrees)} unit="trees" hint={`One tree absorbs ~${SHARED_SOLAR_CONSTANTS.treeCo2KgPerYear} kg CO₂ per year`} />
        <Metric label="Coal saved each year" value={fmt(yearlyCoalKg)} unit="kg" hint={`At ${SHARED_SOLAR_CONSTANTS.coalKgPerKwh} kg coal per kWh`} />
        <Metric label="CO₂ avoided over 25 years" value={fmt(totalCo2Kg / 1000, 1)} unit="tonnes" hint={`Includes ${(settings.degradation * 100).toFixed(1)}%/yr degradation`} />
      </div>

      {/* Tree Equivalents Card & Share My Impact Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-gradient-to-r from-emerald-500/10 via-card to-card p-5 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tree Equivalents Offset</p>
              <h3 className="font-display text-2xl font-light text-forest">
                {fmt(yearlyTrees)} Trees <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lifetime offset: {fmt(Math.round(totalTrees))} mature trees over 25 years
              </p>
            </div>
          </div>
          <Button onClick={shareImpact} className="gap-2">
            Share My Impact
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grid Emission Factor</span>
          <p className="font-display text-2xl font-light text-forest mt-1">
            {settings.gridCo2Factor} <span className="text-sm font-normal text-muted-foreground">kg CO₂/kWh</span>
          </p>
          <p className="text-xs text-muted-foreground">
            CEA (Central Electricity Authority) standard baseline
          </p>
        </div>
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
                <RoiField id="ei-kw" label="System size (kW)" value={settings.systemSizeKw} onChange={(k) => update({ systemSizeKw: k })} step={0.5} hint="Your rooftop solar capacity" />
                <Choice id="ei-city" label="City" value={settings.city} onChange={(c) => update({ city: c })} options={CITIES.map((c) => ({ value: c, label: c }))} hint="Sets the average daily sun hours" />
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
                {/* X-axis labels Y1, Y5, Y10, Y15, Y20, Y25 only */}
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  ticks={[1, 5, 10, 15, 20, 25]}
                  tickFormatter={(v) => `Y${v}`}
                />
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
            Based on {fmt(annualKwh)} kWh generated in year 1, falling {(settings.degradation * 100).toFixed(1)}% each year.
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
  const { settings, update } = useSolarStore();
  const { mode: motionMode, setMode: setMotionMode } = useMotionMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Settings values synced with shared store
  const [city, setCity] = useState(settings.city);
  const [roofArea, setRoofArea] = useState(settings.roofArea);
  const [systemSizeKw, setSystemSizeKw] = useState(settings.systemSizeKw);
  const [monthlyBill, setMonthlyBill] = useState(settings.monthlyBill);
  const [tariff, setTariff] = useState(String(settings.tariff));

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
        if (row?.city && CITIES.includes(row.city)) {
          setCity(row.city);
          update({ city: row.city });
        }
        if (row?.tariff_per_unit != null) {
          setTariff(String(row.tariff_per_unit));
          update({ tariff: Number(row.tariff_per_unit) });
        }
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
    const tariffValue = tariff.trim() === "" ? settings.tariff : Number(tariff);
    if (!Number.isFinite(tariffValue) || tariffValue <= 0) {
      toast.error("Enter a valid electricity tariff in ₹ per unit.");
      return;
    }
    if (roofArea <= 0) {
      toast.error("Enter a valid rooftop area in sq ft.");
      return;
    }
    if (systemSizeKw <= 0) {
      toast.error("Enter a valid system size in kW.");
      return;
    }
    if (monthlyBill < 0) {
      toast.error("Enter a valid monthly electricity bill.");
      return;
    }

    // Persist to central shared store
    update({
      city,
      roofArea,
      systemSizeKw,
      monthlyBill,
      tariff: tariffValue,
    });

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      toast.success("Settings saved locally.");
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
      toast.error("Could not sync profile to server.", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings and profile saved successfully.");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Solar & Profile Settings" className="lg:col-span-2">
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-name" className="text-xs text-muted-foreground">Full name</Label>
              <Input id="st-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Subham Chakraborty" disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-phone" className="text-xs text-muted-foreground">Phone</Label>
              <Input id="st-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" disabled={loading} className="tnum" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-city" className="text-xs text-muted-foreground">City (Location Profile)</Label>
              <Select value={city} onValueChange={(v) => setCity(v)}>
                <SelectTrigger id="st-city"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground/70">Default: Kolkata (~4.8 h/day peak insolation)</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-tariff" className="text-xs text-muted-foreground">Electricity tariff (₹/unit)</Label>
              <Input id="st-tariff" type="number" inputMode="decimal" min={0} step={0.25} value={tariff} onChange={(e) => setTariff(e.target.value)} placeholder="8.00" disabled={loading} className="tnum" />
              <p className="text-[11px] text-muted-foreground/70">Base utility rate used across all financial ROI models</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-roof" className="text-xs text-muted-foreground">Roof Area (sq ft)</Label>
              <Input id="st-roof" type="number" min={50} step={50} value={roofArea} onChange={(e) => setRoofArea(Number(e.target.value))} disabled={loading} className="tnum" />
              <p className="text-[11px] text-muted-foreground/70">Gross available rooftop space</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-kw" className="text-xs text-muted-foreground">System Size (kW)</Label>
              <Input id="st-kw" type="number" min={0.5} step={0.5} value={systemSizeKw} onChange={(e) => setSystemSizeKw(Number(e.target.value))} disabled={loading} className="tnum" />
              <p className="text-[11px] text-muted-foreground/70">Capacity simulated across Overview and Forecast</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-bill" className="text-xs text-muted-foreground">Monthly Electricity Bill (₹)</Label>
              <Input id="st-bill" type="number" min={0} step={100} value={monthlyBill} onChange={(e) => setMonthlyBill(Number(e.target.value))} disabled={loading} className="tnum" />
              <p className="text-[11px] text-muted-foreground/70">Used to determine consumption offset and net-zero viability</p>
            </div>

            {/* Live Theme Motion Preference Selector */}
            <div className="space-y-1.5 sm:col-span-2 rounded-xl border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="st-motion" className="text-xs font-semibold text-forest">Live Theme Motion System</Label>
                  <p className="text-[11px] text-muted-foreground">Full (ambient particles + rotations) / Calm (smooth transitions only) / Off</p>
                </div>
                <Select value={motionMode} onValueChange={(v) => setMotionMode(v as MotionMode)}>
                  <SelectTrigger id="st-motion" className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Motion</SelectItem>
                    <SelectItem value="calm">Calm (Eco)</SelectItem>
                    <SelectItem value="off">Motion Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={loading || saving}>{saving ? "Saving…" : "Save changes"}</Button>
            {loading && <span className="text-xs text-muted-foreground">Loading your profile…</span>}
          </div>
        </form>
      </Panel>

      <Panel title="Account & System Parameters">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate text-forest">{email || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="text-forest">Homeowner</dd>
          </div>
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Performance Ratio</dt>
            <dd className="tnum text-forest">{(settings.performanceRatio * 100).toFixed(0)}%</dd>
          </div>
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Grid CO₂ Factor</dt>
            <dd className="tnum text-forest">{settings.gridCo2Factor} kg/kWh</dd>
          </div>
          <div className="flex justify-between gap-4 border-b pb-2">
            <dt className="text-muted-foreground">Annual Degradation</dt>
            <dd className="tnum text-forest">{(settings.degradation * 100).toFixed(1)}%/yr</dd>
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
  { kw: 3, city: "Kolkata" },
  { kw: 5, city: "Kolkata" },
  { kw: 2, city: "Pune" },
  { kw: 4, city: "Chennai" },
];

function MyReports() {
  const qc = useQueryClient();
  const { data: reports = [], isLoading, isError } = useQuery(assessmentsQuery);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Assessment | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "size" | "savings">("date");

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

  // Filter & Sort
  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(search.toLowerCase()))
  );

  filteredReports.sort((a, b) => {
    if (sortBy === "size") return b.capacity_kw - a.capacity_kw;
    if (sortBy === "savings") return b.annual_savings - a.annual_savings;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <Panel title="My saved reports">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search reports by title or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-8 text-xs"
            />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "size" | "savings")}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="size">Sort by Size</SelectItem>
                <SelectItem value="savings">Sort by Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={createSample} disabled={creating}>
            <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create sample report"}
          </Button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading your reports…</p>
        ) : isError ? (
          <Empty>We couldn't load your reports. Refresh the page and try again.</Empty>
        ) : filteredReports.length === 0 ? (
          /* Lotus Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
            <div
              className="h-24 w-24 opacity-30 dark:opacity-40 mb-3"
              style={{
                backgroundImage: "url('/golden-lotus.webp')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
            <h4 className="font-display text-base font-medium text-forest">No Saved Reports Found</h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {search ? "No reports matched your search keyword." : "Run an assessment or save a system plan from the System Planner to view your solar reports here."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={createSample} disabled={creating}>
                Create Sample Report
              </Button>
              <Button asChild size="sm">
                <Link to="/advisor">Open Solar Advisor</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((r) => (
              <div key={r.id} className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 hover:border-primary/50 hover:shadow-lift">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground tnum">{fmtDate(r.created_at)}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {fmt(r.capacity_kw, 1)} kW
                    </span>
                  </div>
                  <h4 className="mt-1 font-display text-base font-normal text-forest leading-snug">{r.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.city || "Rooftop"}</p>

                  <dl className="mt-3 space-y-1.5 border-t pt-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Est. Savings</dt>
                      <dd className="tnum font-medium text-forest">{inr(r.annual_savings)}/yr</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Generation</dt>
                      <dd className="tnum text-forest">{fmt(r.annual_kwh)} kWh/yr</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Est. Cost</dt>
                      <dd className="tnum text-forest">{inr(r.cost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Payback</dt>
                      <dd className="tnum text-amber-600 dark:text-amber-400 font-medium">
                        {r.payback_years != null ? `${fmt(r.payback_years, 1)} yrs` : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5 border-t pt-3">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setViewing(r)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <PrintLink id={r.id} />
                  <DeleteReport title={r.title} onConfirm={() => remove(r.id)} />
                </div>
              </div>
            ))}
          </div>
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
