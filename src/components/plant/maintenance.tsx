import { useState } from "react";
import {
  CartesianGrid,
  Legend,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INVERTERS,
  PLANT_KWP,
  PLANT_NAME,
  TARIFF_PER_KWH,
  makeRng,
  panels,
} from "@/lib/plant-data";
import { MONTHS, fmt, fmtDate, inr } from "@/lib/solar";
import { cn } from "@/lib/utils";

// Demo data. Health scores, trends and cost figures are illustrative rule-based
// estimates computed from the seeded plant data — not live telemetry, and not a
// substitute for a technician's inspection.

type Tally = { ok: number; weak: number; fault: number; offline: number; total: number };

const TALLY = (() => {
  const map = new Map<string, Tally>();
  for (const name of INVERTERS) map.set(name, { ok: 0, weak: 0, fault: 0, offline: 0, total: 0 });
  for (const p of panels) {
    const t = map.get(p.inverter)!;
    t.total += 1;
    if (p.status === "ok") t.ok += 1;
    else if (p.status === "underperforming") t.weak += 1;
    else if (p.status === "fault") t.fault += 1;
    else t.offline += 1;
  }
  return map;
})();

type HealthTier = "healthy" | "watch" | "at-risk";

const TIER: Record<HealthTier, { label: string; chip: string; bar: string }> = {
  healthy: { label: "Healthy", chip: "bg-success/10 text-success", bar: "bg-success" },
  watch: { label: "Watch", chip: "bg-warning/10 text-warning", bar: "bg-warning" },
  "at-risk": {
    label: "At risk",
    chip: "bg-destructive/10 text-destructive",
    bar: "bg-destructive",
  },
};

function tierOf(score: number): HealthTier {
  if (score >= 80) return "healthy";
  if (score >= 60) return "watch";
  return "at-risk";
}

// Health score (0-100): start at 100 and subtract penalties for offline, faulty
// and underperforming panels, plus a deterministic per-inverter stress term that
// stands in for runtime / thermal aging.
const STRESS = (() => {
  const rng = makeRng(30);
  return INVERTERS.map(() => 2 + rng() * 20);
})();

const HEALTH = INVERTERS.map((name, i) => {
  const t = TALLY.get(name)!;
  const penalty = t.offline * 6 + t.fault * 2.2 + t.weak * 0.9 + STRESS[i]!;
  const score = Math.max(0, Math.round(100 - penalty));
  return { name, score, tier: tierOf(score), ...t };
});

const LINE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"];

// 12-month health trend ending at the current score (drift is demo, seeded).
const TREND: Array<Record<string, number | string>> = (() => {
  const rng = makeRng(707);
  return MONTHS.map((month, i) => {
    const back = MONTHS.length - 1 - i; // months before today
    const row: Record<string, number | string> = { month };
    HEALTH.forEach((inv, idx) => {
      const drift = back * (0.45 + idx * 0.18);
      const wobble = (rng() - 0.5) * 3;
      row[inv.name] = Math.max(0, Math.min(100, Math.round(inv.score + drift + wobble)));
    });
    return row;
  });
})();

const KWH_PER_INVERTER_DAY = (PLANT_KWP / INVERTERS.length) * 5.6;
const VALUE_PER_INVERTER_DAY = KWH_PER_INVERTER_DAY * TARIFF_PER_KWH;

const AT_RISK = HEALTH.filter((inv) => inv.tier === "at-risk").map((inv) => {
  // Extra output loss that accrues each day the repair is deferred (rule-based).
  const extraLossPctPerDay = (80 - inv.score) * 0.08;
  const rupeesPerDay = (VALUE_PER_INVERTER_DAY * extraLossPctPerDay) / 100;
  const action = inv.score < 55 ? "Service immediately" : "Schedule service within a week";
  return { ...inv, extraLossPctPerDay, rupeesPerDay, thirtyDay: rupeesPerDay * 30, action };
});
const DAILY_DELAY_COST = AT_RISK.reduce((sum, i) => sum + i.rupeesPerDay, 0);
const TOTAL_30_DAY = AT_RISK.reduce((sum, i) => sum + i.thirtyDay, 0);

type Priority = "high" | "medium" | "low";
type Task = {
  id: string;
  task: string;
  inverter: string;
  due: string;
  priority: Priority;
  done: boolean;
};

const PRIORITY_CHIP: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};
const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

const isoInDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    task: "Thermal scan of INV-1 strings",
    inverter: "INV-1",
    due: isoInDays(2),
    priority: "high",
    done: false,
  },
  {
    id: "t2",
    task: "Investigate INV-2 underperformance",
    inverter: "INV-2",
    due: isoInDays(1),
    priority: "high",
    done: false,
  },
  {
    id: "t3",
    task: "Replace suspect string fuses",
    inverter: "INV-1",
    due: isoInDays(7),
    priority: "medium",
    done: false,
  },
  {
    id: "t4",
    task: "Clean combiner box filters",
    inverter: "INV-2",
    due: isoInDays(10),
    priority: "medium",
    done: false,
  },
  {
    id: "t5",
    task: "Check cooling and ventilation",
    inverter: "INV-3",
    due: isoInDays(12),
    priority: "medium",
    done: false,
  },
  {
    id: "t6",
    task: "Routine panel cleaning (whole plant)",
    inverter: "All",
    due: isoInDays(21),
    priority: "low",
    done: false,
  },
  {
    id: "t7",
    task: "Quarterly IV-curve scan",
    inverter: "All",
    due: isoInDays(45),
    priority: "low",
    done: false,
  },
];

export function PredictiveMaintenance() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [draft, setDraft] = useState<{
    task: string;
    inverter: string;
    priority: Priority;
    due: string;
  }>({ task: "", inverter: "All", priority: "medium", due: isoInDays(7) });

  function addTask() {
    const name = draft.task.trim();
    if (!name) return;
    setTasks((prev) => [
      {
        id: `t${Date.now()}`,
        task: name,
        inverter: draft.inverter,
        due: draft.due,
        priority: draft.priority,
        done: false,
      },
      ...prev,
    ]);
    setDraft((d) => ({ ...d, task: "" }));
  }

  function markDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Demo data. Rule-based estimates for {PLANT_NAME} — not live telemetry.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HEALTH.map((inv) => {
          const t = TIER[inv.tier];
          return (
            <div key={inv.name} className="rounded-lg border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <p className="eyebrow">{inv.name}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", t.chip)}>
                  {t.label}
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-light text-forest tnum">
                {inv.score}
                <span className="ml-1 text-base text-muted-foreground">/100</span>
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", t.bar)}
                  style={{ width: `${inv.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {inv.fault} faulty · {inv.weak} underperforming · {inv.offline} offline
              </p>
            </div>
          );
        })}
      </div>

      <Panel title="Health trend — last 12 months">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={TREND}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={40}
                domain={[40, 100]}
              />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Legend />
              {HEALTH.map((inv, i) => (
                <Line
                  key={inv.name}
                  type="monotone"
                  dataKey={inv.name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Rule-based health score per inverter. Healthy 80+, Watch 60–79, At risk below 60.
        </p>
      </Panel>

      <Panel title="Maintenance tasks">
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <Input
            placeholder="New task…"
            value={draft.task}
            onChange={(e) => setDraft((d) => ({ ...d, task: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
          />
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm"
            value={draft.inverter}
            onChange={(e) => setDraft((d) => ({ ...d, inverter: e.target.value }))}
            aria-label="Inverter"
          >
            <option value="All">All</option>
            {INVERTERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm"
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
            aria-label="Priority"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Input
            type="date"
            className="w-auto"
            value={draft.due}
            onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))}
            aria-label="Due date"
          />
          <Button onClick={addTask}>Add task</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Inverter</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell
                  className={cn("font-medium", t.done && "text-muted-foreground line-through")}
                >
                  {t.task}
                </TableCell>
                <TableCell className="text-muted-foreground">{t.inverter}</TableCell>
                <TableCell className="tnum">{fmtDate(t.due)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      PRIORITY_CHIP[t.priority],
                    )}
                  >
                    {PRIORITY_LABEL[t.priority]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {t.done ? (
                    <span className="text-xs text-muted-foreground">Done</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => markDone(t.id)}>
                      Mark done
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Cost of waiting">
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Metric label="At-risk inverters" value={String(AT_RISK.length)} hint="Health below 60" />
          <Metric
            label="Cost of delay per day"
            value={inr(DAILY_DELAY_COST)}
            hint="Across at-risk inverters"
          />
          <Metric
            label="30-day cost of delay"
            value={inr(TOTAL_30_DAY)}
            hint="If repairs are deferred"
          />
        </div>

        {AT_RISK.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No inverters are at risk right now.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inverter</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Extra loss / day</TableHead>
                <TableHead className="text-right">Cost / day</TableHead>
                <TableHead className="text-right">30-day cost</TableHead>
                <TableHead>Recommended action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AT_RISK.map((inv) => (
                <TableRow key={inv.name}>
                  <TableCell className="font-medium">{inv.name}</TableCell>
                  <TableCell className="tnum text-right">
                    <span className="text-destructive">{inv.score}</span>
                  </TableCell>
                  <TableCell className="tnum text-right">
                    {fmt(inv.extraLossPctPerDay, 1)} %
                  </TableCell>
                  <TableCell className="tnum text-right">{inr(inv.rupeesPerDay)}</TableCell>
                  <TableCell className="tnum text-right">{inr(inv.thirtyDay)}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Rule-based estimates. Deferring repairs leaves the inverter operating below its expected
          output, so the cost grows every day.
        </p>
      </Panel>
    </div>
  );
}
