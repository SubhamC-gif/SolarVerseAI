import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/dashboard-shell";
import { Metric } from "@/components/brand";
import { fmt } from "@/lib/solar";
import { cn } from "@/lib/utils";
import { ImageInspection } from "@/components/plant/image-inspection";
import { useSolarStore } from "@/lib/solar-store";

type InverterStatus = "ok" | "warning" | "off";
type Severity = "high" | "medium" | "low";

interface Cause {
  title: string;
  detail: string;
  action: string;
  severity: Severity;
}

const SEV: Record<Severity, { label: string; chip: string; text: string }> = {
  high: { label: "High", chip: "bg-destructive/10 text-destructive", text: "text-destructive" },
  medium: { label: "Medium", chip: "bg-warning/10 text-warning", text: "text-warning" },
  low: { label: "Low", chip: "bg-info/10 text-info", text: "text-info" },
};

const SEV_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

const STATUS_COLOR: Record<string, string> = {
  Healthy: "var(--success)",
  "Needs attention": "var(--warning)",
  Critical: "var(--destructive)",
};

function NumField({
  id,
  label,
  value,
  onChange,
  step = 1,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  hint?: string;
}) {
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

function Flag({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <div className="text-sm">
        <Label htmlFor={id} className="cursor-pointer font-normal text-forest">{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const len = Math.PI * r;
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 180 110" className="w-full" role="img" aria-label={`Health score ${score} out of 100`}>
        <path d={path} fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * len} ${len}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="font-display text-4xl font-light tnum" style={{ color }}>{score}</p>
        <p className="text-xs text-muted-foreground">out of 100</p>
      </div>
    </div>
  );
}

export function FaultDetectionUI() {
  const { settings } = useSolarStore();
  const [kw, setKw] = useState(settings.systemSizeKw);
  const [actual, setActual] = useState(11.2);
  const [expected, setExpected] = useState(13.8);
  const [inverter, setInverter] = useState<InverterStatus>("ok");
  const [dust, setDust] = useState(false);
  const [shading, setShading] = useState(false);
  const [wiring, setWiring] = useState(false);
  const [hot, setHot] = useState(false);

  const hasGeneration = expected > 0;
  const perfPct = hasGeneration ? (actual / expected) * 100 : null;
  const deficitPct = perfPct !== null ? Math.max(0, 100 - perfPct) : 0;
  // A small shortfall (up to 5%) is treated as normal day-to-day variation.
  const shortfallPenalty = hasGeneration ? Math.min(55, Math.max(0, deficitPct - 5) * 1.2) : 0;

  const penalties =
    shortfallPenalty +
    (inverter === "off" ? 60 : inverter === "warning" ? 15 : 0) +
    (dust ? 10 : 0) +
    (shading ? 12 : 0) +
    (wiring ? 20 : 0) +
    (hot ? 25 : 0);

  const score = Math.max(0, Math.min(100, Math.round(100 - penalties)));

  // Strict score bracket: 80-100 green (Healthy), 60-79 amber (Needs attention), below 60 red (Critical)
  const status: "Healthy" | "Needs attention" | "Critical" =
    score >= 80 ? "Healthy" : score >= 60 ? "Needs attention" : "Critical";

  const badgeColor =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : score >= 60
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-destructive/10 text-destructive border-destructive/20";

  const color = score >= 80 ? "var(--success)" : score >= 60 ? "var(--warning)" : "var(--destructive)";

  // 7-day actual vs expected mini chart data
  const days7 = [
    { day: "Mon", expected: 13.5, actual: 13.2 },
    { day: "Tue", expected: 14.0, actual: 13.8 },
    { day: "Wed", expected: 13.8, actual: 12.5 },
    { day: "Thu", expected: 14.2, actual: 13.9 },
    { day: "Fri", expected: 13.6, actual: 13.1 },
    { day: "Sat", expected: 14.0, actual: 12.8 },
    { day: "Sun", expected: expected, actual: actual },
  ];

  const causes: Cause[] = [];
  if (inverter === "off") {
    causes.push({
      severity: "high",
      title: "Inverter is switched off",
      detail: "The inverter is off, so the system cannot generate or export any power today.",
      action: "Switch the inverter back on and look for an error code. If it stays off, check the DC/AC supply and call your installer.",
    });
  }
  if (inverter === "warning") {
    causes.push({
      severity: "medium",
      title: "Inverter reporting a warning",
      detail: "An inverter warning usually means it is still running but limiting or derating output.",
      action: "Note the warning code, restart the inverter once, and contact your installer if the code returns.",
    });
  }
  if (dust) {
    causes.push({
      severity: "low",
      title: "Visible dust or soiling",
      detail: "A layer of dust on the glass typically costs 5–15% of output, more in dry or dusty areas.",
      action: "Clean the panels with plain water and a soft brush or cloth — early morning or evening, never on hot glass.",
    });
  }
  if (shading) {
    causes.push({
      severity: "medium",
      title: "Shading on the array",
      detail: "Even partial shade on one panel can pull down a whole string, especially during peak hours.",
      action: "Trim trees or clear obstructions, and confirm no new shadow falls on the panels between 10am and 4pm.",
    });
  }
  if (wiring) {
    causes.push({
      severity: "high",
      title: "Possible loose wiring or DC connection",
      detail: "Loose DC connectors or damaged cabling cause voltage drops, arcing and output loss.",
      action: "Do not touch live wiring. Have a qualified technician tighten DC connectors and check earthing.",
    });
  }
  if (hot) {
    causes.push({
      severity: "high",
      title: "Hot panels or a possible hotspot",
      detail: "A hot spot means one cell is working harder than the rest and can permanently damage a panel.",
      action: "Isolate the affected string and get a technician to inspect the panels and bypass diodes.",
    });
  }
  if (deficitPct > 10 && !dust && !shading && !wiring && !hot && inverter !== "off") {
    causes.push({
      severity: deficitPct > 30 ? "high" : "medium",
      title: "Output below expected",
      detail: `Today's generation is ${fmt(perfPct ?? 0, 0)}% of expected — a shortfall of about ${fmt(deficitPct, 0)}%.`,
      action: "Check for soiling, new shading and any inverter fault, then clean the panels and recheck the output.",
    });
  }
  if (causes.length === 0) {
    causes.push({
      severity: "low",
      title: "No obvious problem detected",
      detail: "Generation is in line with expectations and no flagged issues were selected.",
      action: "Keep monitoring daily output and clean the panels periodically.",
    });
  }
  causes.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const perfBarWidth = Math.min(100, Math.max(0, perfPct ?? 0));
  const perfBarColor =
    perfPct === null ? "bg-muted-foreground/40" : perfPct >= 90 ? "bg-success" : perfPct >= 70 ? "bg-warning" : "bg-destructive";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Health score" value={fmt(score)} unit="/ 100" hint={status} />
        <Metric label="Today's generation" value={fmt(actual)} unit="kWh" hint={`Expected ${fmt(expected)} kWh`} />
        <Metric
          label="Performance vs expected"
          value={perfPct === null ? "—" : fmt(perfPct, 0)}
          unit={perfPct === null ? "" : "%"}
          hint="Actual ÷ expected"
        />
        <Metric
          label="System size"
          value={fmt(kw, 1)}
          unit="kW"
          hint={inverter === "off" ? "Inverter off" : inverter === "warning" ? "Inverter warning" : "Inverter OK"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Inspection inputs">
          <div className="space-y-4">
            <NumField id="fd-kw" label="System size (kW)" value={kw} onChange={setKw} step={0.5} hint="Your rooftop solar capacity" />
            <NumField id="fd-actual" label="Today's actual generation (kWh)" value={actual} onChange={setActual} step={0.5} hint="From your inverter or meter" />
            <NumField id="fd-expected" label="Expected generation (kWh)" value={expected} onChange={setExpected} step={0.5} hint="Typical or forecast output for today" />
            <div className="space-y-1.5">
              <Label htmlFor="fd-inverter" className="text-xs text-muted-foreground">Inverter status</Label>
              <Select value={inverter} onValueChange={(v) => setInverter(v as InverterStatus)}>
                <SelectTrigger id="fd-inverter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Visible issues (tick anything you can see)</p>
              <Flag id="fd-dust" label="Visible dust" hint="Dust, bird droppings or a dull film on the glass" checked={dust} onChange={setDust} />
              <Flag id="fd-shading" label="Shading" hint="Trees, tanks or buildings casting a shadow" checked={shading} onChange={setShading} />
              <Flag id="fd-wiring" label="Loose wiring" hint="Loose DC connectors, damaged or exposed cable" checked={wiring} onChange={setWiring} />
              <Flag id="fd-hot" label="Hot panels" hint="Panels noticeably hotter than their neighbours" checked={hot} onChange={setHot} />
            </div>
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="System health">
            <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
              <ScoreGauge score={score} color={color} />
              <div className="space-y-4">
                <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider", badgeColor)}>
                  {status === "Healthy" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {status} · Score {score}/100
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual vs expected generation</span>
                    <span className="tnum text-forest font-medium">{perfPct === null ? "—" : `${fmt(perfPct, 0)}%`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", perfBarColor)} style={{ width: `${perfBarWidth}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Actual {fmt(actual, 1)} kWh</span>
                    <span>Expected {fmt(expected, 1)} kWh</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thresholds: 80–100 Healthy (Green), 60–79 Attention (Amber), &lt;60 Critical (Red).
                </p>
              </div>
            </div>

            {/* 7-day actual vs expected mini chart */}
            <div className="mt-6 border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-forest">7-Day Actual vs Expected Mini Chart (kWh)</span>
                <span className="text-[11px] text-muted-foreground">Green = Actual · Amber Dotted = Expected</span>
              </div>
              <div className="h-32">
                <ResponsiveContainer>
                  <LineChart data={days7}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip formatter={(v: number) => `${v} kWh`} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="expected" stroke="var(--solar)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Expected" />
                    <Line type="monotone" dataKey="actual" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>

          <Panel title="Identified issues & live score impact">
            <div className="grid gap-3 sm:grid-cols-2">
              {causes.map((c) => (
                <div key={c.title} className="flex flex-col justify-between rounded-lg border bg-card p-3.5 text-sm transition-all hover:border-primary/40 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-forest truncate">{c.title}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", SEV[c.severity].chip)}>
                        {SEV[c.severity].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
                  </div>
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs text-forest"><span className="text-muted-foreground font-normal">Action:</span> {c.action}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Rule-based diagnostic checklist with live score changes. For DC wiring, hotspot or inverter issues, always contact a certified solar specialist.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <ImageInspection />
    </div>
  );
}