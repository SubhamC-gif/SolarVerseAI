import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { useState } from "react";
import { LayoutGrid, Sun, Settings2, LineChart, IndianRupee, Battery, Leaf, FileText, Settings } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar } from "recharts";
import { DashboardShell, Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ASSUMPTIONS, monthlySeries, inr, fmt } from "@/lib/solar";
import { cn } from "@/lib/utils";

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
  { icon: Settings2, label: "System Planner", to: "/homeowner" },
  { icon: LineChart, label: "Energy Forecast", to: "/homeowner" },
  { icon: IndianRupee, label: "Savings & ROI", to: "/homeowner" },
  { icon: Battery, label: "Battery Planner", to: "/homeowner" },
  { icon: Leaf, label: "Environmental Impact", to: "/homeowner" },
  { icon: FileText, label: "My Reports", to: "/homeowner" },
  { icon: Settings, label: "Settings", to: "/homeowner" },
];

function Homeowner() {
  const [kw, setKw] = useState(3);
  const data = monthlySeries(kw, ASSUMPTIONS.specificYield, 330);
  const annual = data.reduce((a, d) => a + d.expected, 0);
  const selfUse = data.reduce((a, d) => a + Math.min(d.expected, d.consumption), 0);
  const savings = Math.min(annual, 330 * 12) * ASSUMPTIONS.tariff;
  const cost = kw * ASSUMPTIONS.costPerKw;
  const cumulative = Array.from({ length: 21 }, (_, y) => ({
    year: y, value: Math.round(-cost + Array.from({ length: y }, (_, i) => savings * (1 - ASSUMPTIONS.degradation) ** i).reduce((a, b) => a + b, 0)),
  }));

  return (
    <DashboardShell nav={NAV} active="Overview" title="Good morning! Let's make your home solar-ready." subtitle="Bengaluru, Karnataka · South-facing RCC roof · 600 sq ft">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm text-muted-foreground">System size</span>
        {[1, 2, 3, 5, 10].map((k) => (
          <button key={k} onClick={() => setKw(k)} className={cn("rounded-md border px-3 py-1 text-sm tnum", k === kw ? "border-forest bg-forest text-forest-foreground" : "bg-card")}>{k} kW</button>
        ))}
        <Button asChild size="sm" variant="outline" className="ml-auto"><Link to="/advisor">New assessment</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Recommended capacity" value={fmt(kw)} unit="kW" />
        <Metric label="Monthly generation" value={fmt(annual / 12)} unit="kWh" />
        <Metric label="Annual generation" value={fmt(annual)} unit="kWh" />
        <Metric label="Annual savings" value={inr(savings)} hint={`at ₹${ASSUMPTIONS.tariff}/kWh`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Generation vs. household consumption (kWh)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={data}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="expected" name="Solar" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                <Line dataKey="consumption" name="Consumption" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line dataKey="conservative" name="Conservative" stroke="var(--chart-3)" strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Solar vs. grid energy">
          <div className="space-y-4 text-sm">
            {[["Self-consumed solar", selfUse, "bg-primary"], ["Exported to grid", annual - selfUse, "bg-solar"], ["Imported from grid", Math.max(0, 330 * 12 - selfUse), "bg-forest"]].map(([l, v, c]) => (
              <div key={l as string}>
                <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="tnum">{fmt(v as number)} kWh</span></div>
                <div className="mt-1.5 h-1.5 rounded bg-muted"><div className={cn("h-full rounded", c as string)} style={{ width: `${Math.min(100, ((v as number) / Math.max(annual, 3960)) * 100)}%` }} /></div>
              </div>
            ))}
            <div className="rounded-md bg-muted p-4">
              <p className="eyebrow">CO₂ avoided (est.)</p>
              <p className="mt-1 font-display text-2xl font-light text-forest tnum">{fmt((annual * ASSUMPTIONS.emissionFactor) / 1000, 2)} t/yr</p>
              <p className="text-xs text-muted-foreground">Grid factor {ASSUMPTIONS.emissionFactor} kg/kWh</p>
            </div>
          </div>
        </Panel>
        <Panel title="20-year cumulative savings (₹)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={cumulative}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Area dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Excludes subsidies. Actual savings depend on tariff, net-metering rules, self-consumption and installation quality.</p>
        </Panel>
        <Panel title="Configuration summary">
          <dl className="space-y-2.5 text-sm">
            {[["Panels", `${Math.ceil((kw * 1000) / ASSUMPTIONS.panelWatt)} × ${ASSUMPTIONS.panelWatt} W`], ["Inverter", `${kw} kW on-grid`], ["Roof area", `${kw * ASSUMPTIONS.sqftPerKw} sq ft`], ["Est. cost", inr(cost)], ["Payback", `${fmt(cost / savings, 1)} years`]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="tnum text-forest">{v}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>
    </DashboardShell>
  );
}
