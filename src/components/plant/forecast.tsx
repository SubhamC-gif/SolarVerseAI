import { useState } from "react";
import { Cloud, CloudRain, CloudSun, Sun, type LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLANT_KWP, PLANT_NAME, TARIFF_PER_KWH } from "@/lib/plant-data";
import { MONTHS, fmt, inr } from "@/lib/solar";

type WeatherKey = "sunny" | "partly" | "cloudy" | "rainy";

const WEATHER: Record<WeatherKey, { label: string; factor: number; Icon: LucideIcon }> = {
  sunny: { label: "Sunny", factor: 1, Icon: Sun },
  partly: { label: "Partly cloudy", factor: 0.75, Icon: CloudSun },
  cloudy: { label: "Cloudy", factor: 0.5, Icon: Cloud },
  rainy: { label: "Rainy", factor: 0.3, Icon: CloudRain },
};

// Estimated daily generation: kWp x sun hours x performance ratio x weather factor.
const PERFORMANCE_RATIO = 0.78;
const dailyKwh = (sunHours: number, weather: WeatherKey) =>
  PLANT_KWP * sunHours * PERFORMANCE_RATIO * WEATHER[weather].factor;

const compactRs = (n: number) => `₹${(n / 1000).toFixed(1)}k`;

const WEEK: { day: string; weather: WeatherKey; sunHours: number }[] = [
  { day: "Mon", weather: "sunny", sunHours: 6.1 },
  { day: "Tue", weather: "partly", sunHours: 5.9 },
  { day: "Wed", weather: "cloudy", sunHours: 5.2 },
  { day: "Thu", weather: "rainy", sunHours: 4.1 },
  { day: "Fri", weather: "partly", sunHours: 5.7 },
  { day: "Sat", weather: "sunny", sunHours: 6.2 },
  { day: "Sun", weather: "sunny", sunHours: 6.3 },
];

const weekRows = WEEK.map((d) => {
  const kwh = Math.round(dailyKwh(d.sunHours, d.weather));
  return { ...d, kwh, rupees: kwh * TARIFF_PER_KWH };
});

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_SUN = [5.0, 5.5, 6.0, 6.4, 6.5, 6.0, 4.9, 4.8, 5.5, 5.9, 5.3, 4.9];
const MONTH_WEATHER: WeatherKey[] = [
  "sunny",
  "sunny",
  "sunny",
  "sunny",
  "sunny",
  "partly",
  "partly",
  "partly",
  "partly",
  "sunny",
  "sunny",
  "sunny",
];

const monthRows = MONTHS.map((month, i) => {
  const sunHours = MONTH_SUN[i]!;
  const weather = MONTH_WEATHER[i]!;
  const kwh = Math.round(dailyKwh(sunHours, weather) * DAYS_IN_MONTH[i]!);
  return { month, weather, sunHours, kwh, rupees: kwh * TARIFF_PER_KWH };
});

/** X-axis tick that shows the day's weather icon above the day label. */
function WeatherTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) {
  const row = weekRows.find((r) => r.day === payload?.value);
  const Icon = row ? WEATHER[row.weather].Icon : Sun;
  return (
    <g transform={`translate(${x},${y})`}>
      <Icon x={-8} y={4} width={16} height={16} color="var(--forest)" />
      <text x={0} y={34} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
        {payload?.value}
      </text>
    </g>
  );
}

function WeekTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: unknown[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const row = weekRows.find((r) => r.day === label);
  if (!row) return null;
  const Icon = WEATHER[row.weather].Icon;
  return (
    <div className="rounded-lg border bg-card p-3 text-sm shadow-soft">
      <div className="flex items-center gap-2 font-medium text-forest">
        <Icon className="h-4 w-4" />
        {row.day} · {WEATHER[row.weather].label}
      </div>
      <p className="mt-1 text-muted-foreground">
        {fmt(row.sunHours, 1)} sun hours · factor {WEATHER[row.weather].factor}
      </p>
      <p className="mt-1 tnum">{fmt(row.kwh)} kWh</p>
      <p className="tnum text-forest">{inr(row.rupees)}</p>
    </div>
  );
}

export function GenerationForecast() {
  const [range, setRange] = useState<"week" | "month">("week");

  const weekKwh = weekRows.reduce((sum, d) => sum + d.kwh, 0);
  const weekRs = weekRows.reduce((sum, d) => sum + d.rupees, 0);
  const weekBest = weekRows.reduce((a, b) => (b.kwh > a.kwh ? b : a));

  const yearKwh = monthRows.reduce((sum, m) => sum + m.kwh, 0);
  const yearRs = monthRows.reduce((sum, m) => sum + m.rupees, 0);
  const monthBest = monthRows.reduce((a, b) => (b.kwh > a.kwh ? b : a));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Demo data. Estimates for {PLANT_NAME} using kWp × sun hours × {PERFORMANCE_RATIO} × weather
        factor.
      </p>

      <div className="inline-flex rounded-lg border p-1">
        <Button
          size="sm"
          variant={range === "week" ? "default" : "ghost"}
          onClick={() => setRange("week")}
        >
          Next 7 days
        </Button>
        <Button
          size="sm"
          variant={range === "month" ? "default" : "ghost"}
          onClick={() => setRange("month")}
        >
          Next 12 months
        </Button>
      </div>

      {range === "week" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="7-day generation" value={fmt(weekKwh)} unit="kWh" hint="Estimated" />
            <Metric
              label="Best day"
              value={fmt(weekBest.kwh)}
              unit="kWh"
              hint={`${weekBest.day} · ${WEATHER[weekBest.weather].label}`}
            />
            <Metric
              label="Estimated value"
              value={inr(weekRs)}
              hint={`at ${inr(TARIFF_PER_KWH)}/kWh`}
            />
          </div>

          <Panel title="Generation forecast — next 7 days">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={weekRows} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tick={WeatherTick}
                    tickLine={false}
                    axisLine={false}
                    height={48}
                    interval={0}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={46} />
                  <Tooltip
                    content={<WeekTooltip />}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar dataKey="kwh" name="Generation" fill="var(--chart-1)" radius={[3, 3, 0, 0]}>
                    <LabelList
                      dataKey="rupees"
                      position="top"
                      formatter={(value: number | string) => compactRs(Number(value))}
                      fontSize={11}
                      fill="var(--muted-foreground)"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Bars show estimated generation (kWh); the label above each bar is the value in ₹.
              Icons show the day's weather.
            </p>
          </Panel>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Annual generation" value={fmt(yearKwh)} unit="kWh" hint="Estimated" />
            <Metric
              label="Best month"
              value={fmt(monthBest.kwh)}
              unit="kWh"
              hint={monthBest.month}
            />
            <Metric
              label="Annual value"
              value={inr(yearRs)}
              hint={`at ${inr(TARIFF_PER_KWH)}/kWh`}
            />
          </div>

          <Panel title="Monthly generation forecast">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={monthRows}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={52} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(value) => `${fmt(Number(value))} kWh`}
                  />
                  <Line
                    type="monotone"
                    dataKey="kwh"
                    name="Generation"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Monthly detail">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Weather</TableHead>
                  <TableHead className="text-right">Sun hours</TableHead>
                  <TableHead className="text-right">Generation</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthRows.map((m) => {
                  const Icon = WEATHER[m.weather].Icon;
                  return (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="h-4 w-4 text-forest" />
                          {WEATHER[m.weather].label}
                        </span>
                      </TableCell>
                      <TableCell className="tnum text-right">{fmt(m.sunHours, 1)} h</TableCell>
                      <TableCell className="tnum text-right">{fmt(m.kwh)} kWh</TableCell>
                      <TableCell className="tnum text-right">{inr(m.rupees)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>
        </>
      )}
    </div>
  );
}
