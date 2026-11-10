import { Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  INVERTERS,
  PLANT_KWP,
  PLANT_NAME,
  TARIFF_PER_KWH,
  dailyGeneration,
  panelStatusSummary,
  panels,
  powerCurve,
  type PanelStatus,
} from "@/lib/plant-data";
import { fmt, inr } from "@/lib/solar";
import { cn } from "@/lib/utils";

// Illustrative "current" instant used for the live KPIs.
const NOW_HOUR = "14:00";

const CELL: Record<PanelStatus, string> = {
  ok: "bg-success",
  underperforming: "bg-warning",
  fault: "bg-destructive",
  offline: "bg-muted-foreground/25",
};

const LEGEND: { key: PanelStatus; label: string }[] = [
  { key: "ok", label: "Healthy" },
  { key: "underperforming", label: "Underperforming" },
  { key: "fault", label: "Fault" },
  { key: "offline", label: "Offline" },
];

type InverterStatus = "ok" | "warning" | "fault" | "offline";

const INV_STATUS: Record<InverterStatus, { label: string; chip: string }> = {
  ok: { label: "Online", chip: "bg-success/10 text-success" },
  warning: { label: "Warning", chip: "bg-warning/10 text-warning" },
  fault: { label: "Fault", chip: "bg-destructive/10 text-destructive" },
  offline: { label: "Offline", chip: "bg-muted text-muted-foreground" },
};

export function PlantMonitoring() {
  const now = powerCurve.find((p) => p.hour === NOW_HOUR) ?? powerCurve[powerCurve.length - 1]!;
  const peakKw = Math.max(...powerCurve.map((p) => p.powerKw));

  // Energy delivered so far today = area under the hourly power curve (1 h steps).
  const todayKwh = Math.round(powerCurve.reduce((sum, p) => sum + p.powerKw, 0));
  // Performance ratio = actual energy / the energy the irradiance would deliver at STC.
  const irrKwhPerM2 = powerCurve.reduce((sum, p) => sum + p.irradiance, 0) / 1000;
  const performanceRatio = todayKwh / (PLANT_KWP * irrKwhPerM2);

  const avgDailyKwh = dailyGeneration.reduce((sum, d) => sum + d.kwh, 0) / dailyGeneration.length;
  const cuf = (avgDailyKwh / (PLANT_KWP * 24)) * 100;

  const summary = panelStatusSummary();
  const availability = ((panels.length - summary.offline) / panels.length) * 100;

  // Per-inverter inventory so the table reflects the same panel data as the map.
  const tally = new Map<
    string,
    { ok: number; weak: number; fault: number; offline: number; total: number }
  >();
  for (const p of panels) {
    const t = tally.get(p.inverter) ?? { ok: 0, weak: 0, fault: 0, offline: 0, total: 0 };
    t.total += 1;
    if (p.status === "ok") t.ok += 1;
    else if (p.status === "underperforming") t.weak += 1;
    else if (p.status === "fault") t.fault += 1;
    else t.offline += 1;
    tally.set(p.inverter, t);
  }

  const producing = INVERTERS.map((name) => {
    const t = tally.get(name)!;
    return Math.max(0, t.total - t.offline - t.fault);
  });
  const producingTotal = producing.reduce((a, b) => a + b, 0) || 1;

  const inverterRows = INVERTERS.map((name, i) => {
    const t = tally.get(name)!;
    // Demo thresholds derived from the seeded panel mix.
    const status: InverterStatus =
      t.offline >= 3
        ? "offline"
        : t.fault >= 7
          ? "fault"
          : t.fault + t.weak >= 13
            ? "warning"
            : "ok";
    const powerKw = status === "offline" ? 0 : (now.powerKw * producing[i]!) / producingTotal;
    const efficiency =
      status === "offline"
        ? 0
        : (status === "ok" ? 97.4 : status === "warning" ? 95.6 : 93.2) + i * 0.2;
    const tempC = status === "offline" ? 33 : 44 + i * 2.2;
    return { name, status, powerKw, efficiency, tempC };
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Demo data. Illustrative figures for {PLANT_NAME}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Current power"
          value={fmt(now.powerKw, 1)}
          unit="kW"
          hint={`Peak today ${fmt(peakKw, 1)} kW`}
        />
        <Metric
          label="Today's energy"
          value={fmt(todayKwh)}
          unit="kWh"
          hint={`≈ ${inr(todayKwh * TARIFF_PER_KWH)} at ${inr(TARIFF_PER_KWH)}/kWh`}
        />
        <Metric
          label="Performance ratio"
          value={fmt(performanceRatio * 100)}
          unit="%"
          hint="Typical target 78%"
        />
        <Metric label="CUF" value={fmt(cuf, 1)} unit="%" hint="30-day average" />
        <Metric
          label="Availability"
          value={fmt(availability, 1)}
          unit="%"
          hint={`${summary.offline} of ${panels.length} panels offline`}
        />
      </div>

      <Panel title="Today's power curve">
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={powerCurve}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={46} unit=" kW" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Area
                dataKey="powerKw"
                name="Power"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Inverters">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inverter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Power</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
                <TableHead className="text-right">Temp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inverterRows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        INV_STATUS[row.status].chip,
                      )}
                    >
                      {INV_STATUS[row.status].label}
                    </span>
                  </TableCell>
                  <TableCell className="tnum text-right">{fmt(row.powerKw, 1)} kW</TableCell>
                  <TableCell className="tnum text-right">
                    {row.status === "offline" ? "—" : `${fmt(row.efficiency, 1)}%`}
                  </TableCell>
                  <TableCell className="tnum text-right">{fmt(row.tempC, 1)} °C</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Panel map">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          >
            {panels.map((p) => (
              <div
                key={p.id}
                title={`${p.id} · ${p.status}`}
                className={cn("aspect-square rounded-[2px]", CELL[p.status])}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {LEGEND.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("h-3 w-3 rounded-[2px]", CELL[item.key])} />
                <span>
                  {item.label} ({summary[item.key]})
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
