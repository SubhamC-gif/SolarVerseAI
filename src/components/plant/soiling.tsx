import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLANT_KWP, PLANT_NAME, TARIFF_PER_KWH, makeRng } from "@/lib/plant-data";
import { fmt, fmtDate, inr } from "@/lib/solar";
import { cn } from "@/lib/utils";

// Demo data. All figures are illustrative rule-based estimates for this plant —
// no external API or live sensor feed is used. Values are seeded so the UI stays
// stable across reloads.

// Daily potential generation for the whole plant (kWh/day) = kWp x peak sun hours.
const DAILY_KWH = PLANT_KWP * 5.6;
// Soiling added on a dusty day (%), the seeded noise below makes it vary.
const DUST_RATE = 0.32;
// Days where rain washed the panels partially clean.
const RAIN_DAYS = [20, 21, 47, 48];
// Scheduled cleaning days that reset soiling to a low residual.
const CLEAN_DAYS = [1, 31];
const WINDOW = 60;
const RESIDUAL = 0.4;

type SoilingDay = {
  day: number;
  soilingPct: number;
  cleaned: boolean;
  rained: boolean;
};

// 60-day soiling profile: soiling builds up with dust, drops sharply on a
// cleaning day, and drops partially on rainy days.
const BASE_SERIES: SoilingDay[] = (() => {
  const rng = makeRng(9091);
  const out: SoilingDay[] = [];
  let s = RESIDUAL;
  for (let day = 1; day <= WINDOW; day++) {
    const cleaned = CLEAN_DAYS.includes(day);
    const rained = RAIN_DAYS.includes(day);
    if (cleaned) s = RESIDUAL;
    else if (rained) s = s * 0.45;
    else s += DUST_RATE * (0.75 + rng() * 0.5);
    out.push({ day, soilingPct: Number(s.toFixed(2)), cleaned, rained });
  }
  return out;
})();

/** Calendar date for a day index in the 60-day window (day 60 = today). */
function dayDate(day: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (WINDOW - day));
  return d.toISOString().slice(0, 10);
}

function SoilingTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload?.length) return null;
  const d = (payload[0] as { payload?: SoilingDay } | undefined)?.payload;
  if (!d) return null;
  const lostRs = (DAILY_KWH * d.soilingPct * TARIFF_PER_KWH) / 100;
  return (
    <div className="rounded-lg border bg-card p-3 text-sm shadow-soft">
      <p className="font-medium text-forest">Day {d.day}</p>
      <p className="tnum mt-1">{fmt(d.soilingPct, 1)}% soiling</p>
      <p className="tnum mt-1 text-muted-foreground">{inr(lostRs)} lost that day</p>
      {d.cleaned && <p className="mt-1 text-xs text-solar-foreground">Scheduled cleaning</p>}
      {d.rained && <p className="mt-1 text-xs text-muted-foreground">Rain wash-off</p>}
    </div>
  );
}

export function SoilingAnalytics() {
  const [series, setSeries] = useState<SoilingDay[]>(BASE_SERIES);
  const [cost, setCost] = useState(3000);

  const lastCleanIdx = useMemo(() => {
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i]!.cleaned) return i;
    }
    return 0;
  }, [series]);

  const current = series[series.length - 1]!;
  const lastCleaned = series[lastCleanIdx]!;
  const daysSinceCleaning = current.day - lastCleaned.day;

  const month = series.slice(-30);
  const energyLostKwh = month.reduce((sum, d) => sum + (DAILY_KWH * d.soilingPct) / 100, 0);
  const rupeesLost = energyLostKwh * TARIFF_PER_KWH;

  // Value lost to soiling since the last cleaning — compared against cleaning cost.
  const since = series.slice(lastCleanIdx);
  const lossSinceCleaning = since.reduce(
    (sum, d) => sum + (DAILY_KWH * d.soilingPct * TARIFF_PER_KWH) / 100,
    0,
  );
  const dailyLossNow = (DAILY_KWH * current.soilingPct * TARIFF_PER_KWH) / 100;
  const shouldClean = lossSinceCleaning >= cost;
  const daysToBreakEven =
    dailyLossNow > 0 ? Math.max(0, Math.ceil((cost - lossSinceCleaning) / dailyLossNow)) : 0;

  function logCleaning() {
    setSeries((prev) =>
      prev.map((d, i) =>
        i === prev.length - 1 ? { ...d, soilingPct: RESIDUAL, cleaned: true, rained: false } : d,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Demo data. Illustrative soiling estimates for {PLANT_NAME} — rule-based, not live sensors.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Soiling loss"
          value={fmt(current.soilingPct, 1)}
          unit="%"
          hint="Current surface soiling"
        />
        <Metric
          label="Energy lost this month"
          value={fmt(energyLostKwh)}
          unit="kWh"
          hint="Last 30 days"
        />
        <Metric
          label="Value lost this month"
          value={inr(rupeesLost)}
          hint={`at ${inr(TARIFF_PER_KWH)}/kWh`}
        />
        <Metric
          label="Days since cleaning"
          value={fmt(daysSinceCleaning)}
          unit="days"
          hint={`Last cleaned ${fmtDate(dayDate(lastCleaned.day))}`}
        />
      </div>

      <Panel title="Soiling trend — last 60 days">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={46}
                unit="%"
                domain={[0, "dataMax + 1"]}
              />
              <Tooltip content={<SoilingTooltip />} />
              {series
                .filter((d) => d.cleaned)
                .map((d) => (
                  <ReferenceLine
                    key={d.day}
                    x={d.day}
                    stroke="var(--chart-2)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Clean",
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      position: "insideTopRight",
                    }}
                  />
                ))}
              <Line
                type="monotone"
                dataKey="soilingPct"
                name="Soiling"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Soiling rises as dust accumulates, drops sharply on a cleaning day (dashed marker), and
          falls partly on rainy days.
        </p>
      </Panel>

      <Panel title="Cleaning planner">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Cleaning cost</span>
              <Input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Math.max(0, Number(e.target.value) || 0))}
                className="max-w-[10rem]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Loss since last cleaning</p>
                <p className="mt-1 text-xl font-semibold text-forest tnum">
                  {inr(lossSinceCleaning)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Cleaning cost</p>
                <p className="mt-1 text-xl font-semibold tnum">{inr(cost)}</p>
              </div>
            </div>
            <Button onClick={logCleaning}>Log cleaning</Button>
          </div>

          <div
            className={cn(
              "rounded-lg border p-5",
              shouldClean ? "border-destructive/40 bg-destructive/5" : "bg-card",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  shouldClean ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
                )}
              >
                {shouldClean ? "Clean now" : "Not worth cleaning yet"}
              </span>
              <h3 className="font-medium text-forest">
                {shouldClean ? "Cleaning pays back immediately" : "Hold the cleaning"}
              </h3>
            </div>
            {shouldClean ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Soiling has cost {inr(lossSinceCleaning)} since the last cleaning, which is more
                than the {inr(cost)} cleaning cost. Cleaning now recovers value straight away.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Soiling has cost {inr(lossSinceCleaning)} so far — below the {inr(cost)} cleaning
                cost. At today's loss of {inr(dailyLossNow)}/day, wait about {daysToBreakEven} more
                days before cleaning pays back.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Rule: cleaning is recommended once the value lost since the last cleaning exceeds the
              cleaning cost.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
