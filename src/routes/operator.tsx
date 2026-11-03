import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutGrid, Factory, Activity, LineChart, ScanSearch, Wind, Wrench, BarChart3, FileText, Settings, AlertTriangle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Bar, BarChart } from "recharts";
import { DashboardShell, Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { fmt } from "@/lib/solar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Solar Operator Dashboard — SolarVerse AI" },
      { name: "description", content: "Monitor plant generation, alerts, soiling and maintenance across solar plants." },
      { property: "og:title", content: "Solar Operator Dashboard — SolarVerse AI" },
      { property: "og:description", content: "Plant monitoring, fault alerts and maintenance in one view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Operator,
});

const NAV = [
  { icon: LayoutGrid, label: "Overview" }, { icon: Factory, label: "My Solar Plants" }, { icon: Activity, label: "Plant Monitoring" },
  { icon: LineChart, label: "Energy Forecast" }, { icon: ScanSearch, label: "Fault Detection" }, { icon: Wind, label: "Soiling Analysis" },
  { icon: Wrench, label: "Maintenance Center" }, { icon: BarChart3, label: "Analytics" }, { icon: FileText, label: "Reports" }, { icon: Settings, label: "Settings" },
];

const PLANTS = [
  { id: "jodhpur", name: "Jodhpur Solar Park", mw: 12.5, pr: 81.2, soil: 4.8 },
  { id: "anantapur", name: "Anantapur Array B", mw: 8, pr: 78.4, soil: 6.1 },
  { id: "kutch", name: "Kutch Rooftop Cluster", mw: 2.4, pr: 83.6, soil: 3.2 },
];

const ALERTS = [
  { sev: "High", t: "String 14 output 22% below expected", p: "Anantapur Array B", c: "text-destructive" },
  { sev: "Medium", t: "Hotspot indicator on inverter block 3 panels", p: "Jodhpur Solar Park", c: "text-warning" },
  { sev: "Medium", t: "Soiling loss above 6% — schedule cleaning", p: "Anantapur Array B", c: "text-warning" },
  { sev: "Low", t: "Inverter 2 firmware update available", p: "Kutch Rooftop Cluster", c: "text-info" },
];

function Operator() {
  const [pid, setPid] = useState(PLANTS[0].id);
  const plant = PLANTS.find((p) => p.id === pid)!;
  const day = Array.from({ length: 15 }, (_, i) => {
    const h = i + 5;
    const irr = Math.max(0, Math.sin(((h - 6) / 13) * Math.PI)) * 950;
    const exp = (irr / 1000) * plant.mw * 0.85;
    return { hour: `${h}:00`, expected: +exp.toFixed(2), actual: +(exp * (plant.pr / 85) * (0.96 + ((i * 7) % 5) / 100)).toFixed(2), irradiance: Math.round(irr) };
  });
  const today = day.reduce((a, d) => a + d.actual, 0);
  const month = Array.from({ length: 30 }, (_, i) => ({ d: i + 1, mwh: +(plant.mw * (4.6 + Math.sin(i / 3) * 0.5 - (i % 9 === 0 ? 1.2 : 0))).toFixed(1) }));

  return (
    <DashboardShell nav={NAV} active="Overview" title="Plant operations" subtitle="Generation, health and maintenance across your portfolio">
      <div className="mb-6 flex flex-wrap gap-2">
        {PLANTS.map((p) => (
          <button key={p.id} onClick={() => setPid(p.id)} className={cn("rounded-md border px-3 py-1.5 text-sm", p.id === pid ? "border-forest bg-forest text-forest-foreground" : "bg-card hover:border-primary")}>
            {p.name} <span className="opacity-60 tnum">· {p.mw} MW</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Metric label="Installed" value={fmt(plant.mw, 1)} unit="MW" />
        <Metric label="Today" value={fmt(today, 1)} unit="MWh" />
        <Metric label="This month" value={fmt(month.reduce((a, d) => a + d.mwh, 0))} unit="MWh" />
        <Metric label="Performance ratio" value={fmt(plant.pr, 1)} unit="%" />
        <Metric label="Active alerts" value={String(ALERTS.filter((a) => a.p === plant.name).length)} />
        <Metric label="Soiling loss" value={fmt(plant.soil, 1)} unit="%" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Actual vs. expected generation (MW) · irradiance (W/m²)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={day}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="l" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar yAxisId="r" dataKey="irradiance" fill="var(--chart-2)" fillOpacity={0.35} radius={[3, 3, 0, 0]} />
                <Line yAxisId="l" dataKey="expected" stroke="var(--chart-3)" strokeDasharray="4 4" dot={false} />
                <Line yAxisId="l" dataKey="actual" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Inspection alerts">
          <ul className="space-y-3">
            {ALERTS.map((a) => (
              <li key={a.t} className={cn("flex gap-3 rounded-md border p-3 text-sm", a.p !== plant.name && "opacity-50")}>
                <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", a.c)} />
                <div><p className="text-forest">{a.t}</p><p className="text-xs text-muted-foreground">{a.sev} · {a.p}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Daily production this month (MWh)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={month}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Area dataKey="mwh" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Plant-wise performance ratio (%)">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={PLANTS} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[70, 90]} hide />
                <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="pr" fill="var(--chart-3)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
