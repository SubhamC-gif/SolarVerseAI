import type { ReactNode } from "react";
import { LayoutDashboard, LineChart, Settings, Sun, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModuleKind = "home" | "advisor" | "roi" | "plant" | "fault" | "forecast" | "maintenance";

const URLS: Record<ModuleKind, string> = {
  home: "solarverse.ai",
  advisor: "solarverse.ai/advisor",
  roi: "solarverse.ai/homeowner",
  plant: "solarverse.ai/operator",
  fault: "solarverse.ai/operator/faults",
  forecast: "solarverse.ai/operator/forecast",
  maintenance: "solarverse.ai/operator/maintenance",
};

const TITLES: Record<ModuleKind, string> = {
  home: "",
  advisor: "Solar Advisor",
  roi: "Savings & ROI",
  plant: "Plant Monitoring",
  fault: "Fault Detection",
  forecast: "Energy Forecast",
  maintenance: "Predictive Maintenance",
};

const RAIL_ACTIVE: Record<Exclude<ModuleKind, "home">, number> = {
  advisor: 1,
  roi: 0,
  plant: 0,
  fault: 0,
  forecast: 2,
  maintenance: 3,
};

const BLUE = "#287BFF";
const CYAN = "#00D6FF";

function Kpi({ label, value, sub, tone = "text-emerald-300" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-light text-white tnum">{value}</p>
      {sub && <p className={cn("mt-0.5 text-[10px] tnum", tone)}>{sub}</p>}
    </div>
  );
}

function Panel({ title, right, className, children }: { title: string; right?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-h-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{title}</p>
        {right}
      </div>
      <div className="mt-2 min-h-0 flex-1">{children}</div>
    </div>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone?: string | undefined }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap", tone)}>{children}</span>;
}

function Area({ values, stroke = CYAN }: { values: number[]; stroke?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 300},${92 - ((v - min) / (max - min || 1)) * 80}`);
  const line = `M${pts.join(" L")}`;
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="module-area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={BLUE} stopOpacity="0.45" />
          <stop offset="1" stopColor={BLUE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L300,100 L0,100 Z`} fill="url(#module-area-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Bars({ values }: { values: number[] }) {
  return (
    <div className="flex h-full items-end gap-1">
      {values.map((v, i) => (
        <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#287BFF] to-[#8755FF]" style={{ height: `${v}%` }} />
      ))}
    </div>
  );
}

function Donut({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={CYAN} strokeWidth="3" pathLength={100} strokeDasharray={`${value} 100`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs text-white tnum">{label}</div>
    </div>
  );
}

function Field({ label, value, fill }: { label: string; value: string; fill: number }) {
  return (
    <div>
      <div className="flex justify-between text-zinc-400">
        <span>{label}</span>
        <span className="text-white tnum">{value}</span>
      </div>
      <div className="mt-1.5 h-1 rounded bg-white/10">
        <div className="h-1 rounded bg-gradient-to-r from-[#287BFF] to-[#00D6FF]" style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}

const BODIES: Record<ModuleKind, ReactNode> = {
  home: (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium text-white">
          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#287BFF] to-[#8755FF]" />
          SolarVerse <span className="text-[#00D6FF]">AI</span>
        </div>
        <div className="hidden gap-4 text-[10px] text-zinc-400 md:flex">
          <span>Home</span>
          <span>Solar Advisor</span>
          <span>Homeowners</span>
          <span>Solar Operators</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-black">Get Started</span>
      </div>
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1.05fr_1fr] gap-4">
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#00D6FF]">Smarter solar decisions</p>
          <p className="mt-2 text-xl font-light leading-tight text-white">The Intelligence Behind Every Ray of Sunshine.</p>
          <p className="mt-2 text-[10px] text-zinc-500">From rooftop planning to plant monitoring, in one platform.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-md bg-gradient-to-r from-[#287BFF] to-[#8755FF] px-3 py-1.5 text-white">Explore Solar Intelligence</span>
            <span className="rounded-md border border-white/15 px-3 py-1.5 text-zinc-300">Calculate potential</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Kpi label="Plants monitored" value="1,240" />
            <Kpi label="Homes planned" value="8,930" />
            <Kpi label="CO₂ avoided" value="2.1 kt" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Live system</p>
            <Pill tone="bg-emerald-400/15 text-emerald-300">Online</Pill>
          </div>
          <p className="text-2xl font-light text-white tnum">8.42 <span className="text-xs text-zinc-500">kW</span></p>
          <div className="min-h-0 flex-1">
            <Area values={[18, 26, 24, 40, 38, 58, 52, 70, 66, 84, 78, 92]} />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 text-[10px]">
            <div><p className="text-zinc-500">Today</p><p className="text-white tnum">42.8 kWh</p></div>
            <div><p className="text-zinc-500">Health</p><p className="text-emerald-300 tnum">98.4%</p></div>
            <div><p className="text-zinc-500">CO₂ saved</p><p className="text-white tnum">18.6 kg</p></div>
          </div>
        </div>
      </div>
    </div>
  ),
  advisor: (
    <div className="grid h-full grid-cols-[1fr_1.15fr] gap-3">
      <Panel title="Your roof & usage">
        <div className="space-y-3">
          <Field label="Roof area" value="120 m²" fill={60} />
          <Field label="Monthly usage" value="350 kWh" fill={48} />
          <Field label="Budget" value="₹ 3,00,000" fill={70} />
          <Field label="Shade factor" value="Low" fill={20} />
        </div>
        <div className="mt-4 rounded-md bg-white/[0.04] p-2.5 text-[10px] text-zinc-400">
          Orientation: South · Tilt 18° · Roof type: RCC
        </div>
      </Panel>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="rounded-lg bg-gradient-to-r from-[#287BFF]/25 to-[#8755FF]/25 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-300">Recommended system</p>
          <p className="mt-1 text-2xl font-light text-white tnum">4.5 kW <span className="text-xs text-zinc-400">· 11 panels</span></p>
        </div>
        <Panel title="Annual production" right={<span className="text-[10px] text-zinc-400 tnum">5,980 kWh</span>} className="flex-1">
          <Bars values={[42, 48, 62, 70, 78, 86, 74, 80, 72, 60, 48, 40]} />
        </Panel>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <Donut value={62} label="62%" />
          <div className="text-[10px] text-zinc-400">
            <p>Panels 62% of cost</p>
            <p>Inverter & BOS 26%</p>
            <p>Install 12%</p>
          </div>
        </div>
      </div>
    </div>
  ),
  roi: (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="20-year savings" value="₹ 1.84L" sub="Illustrative" tone="text-[#00D6FF]" />
        <Kpi label="Payback period" value="5.8 yrs" sub="↓ vs. last year" />
        <Kpi label="Monthly saving" value="₹ 2,140" sub="+12% tariff" />
      </div>
      <Panel title="Cumulative savings" right={<span className="text-[10px] text-zinc-500">Years 1–20</span>} className="flex-1">
        <Area values={[2, 5, 9, 14, 20, 27, 35, 44, 54, 65, 77, 90]} stroke="#8755FF" />
      </Panel>
      <div className="flex justify-between text-[10px] text-zinc-500 tnum">
        <span>Y1</span><span>Y5</span><span>Y10</span><span>Y15</span><span>Y20</span>
      </div>
    </div>
  ),
  plant: (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Live output" value="412 kW" sub="▲ 3.1% vs. avg" />
        <Kpi label="Performance ratio" value="81.6%" sub="Within target" />
        <Kpi label="Strings online" value="34 / 36" sub="2 under review" tone="text-solar" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-3">
        <Panel title="String health" right={<span className="text-[10px] text-zinc-500">Block A–C</span>}>
          <div className="grid h-full grid-cols-12 content-start gap-1">
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                className={cn("aspect-square rounded-[3px]", i === 7 || i === 22 ? "bg-solar" : i % 9 === 4 ? "bg-[#287BFF]/25" : "bg-[#287BFF]/65")}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Inverters">
          <ul className="space-y-2 text-[10px]">
            {[["INV-01", "98.2%"], ["INV-02", "97.6%"], ["INV-03", "91.4%"], ["INV-04", "98.9%"]].map(([id, eff]) => (
              <li key={id} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2 py-1.5">
                <span className="flex items-center gap-2 text-white">
                  <span className={cn("h-1.5 w-1.5 rounded-full", id === "INV-03" ? "bg-solar" : "bg-emerald-400")} />
                  {id}
                </span>
                <span className="text-zinc-400 tnum">{eff}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  ),
  fault: (
    <div className="grid h-full grid-cols-[1.3fr_1fr] gap-3">
      <Panel title="Thermal scan · Block B" right={<span className="text-[10px] text-zinc-500">Drone · 14:20</span>}>
        <div className="relative grid h-full grid-cols-6 grid-rows-4 gap-1">
          {Array.from({ length: 24 }, (_, i) => {
            const hot = i === 8 || i === 15;
            return (
              <span
                key={i}
                className="rounded-[2px]"
                style={{ background: hot ? "linear-gradient(135deg,#ff7a45,#ffd23f)" : `hsl(${230 - (i % 5) * 6} 70% ${26 + (i % 4) * 3}%)` }}
              />
            );
          })}
          <span className="absolute left-[30%] top-[24%] h-[22%] w-[18%] border border-[#00D6FF]" />
          <span className="absolute left-[58%] top-[52%] h-[20%] w-[16%] border border-solar" />
        </div>
      </Panel>
      <Panel title="Detected faults">
        <ul className="space-y-2 text-[10px]">
          {[
            ["Hotspot · B-08", "71°C", "High", "bg-[#8755FF]/25 text-[#c4b5fd]"],
            ["Hotspot · B-15", "64°C", "Medium", "bg-[#287BFF]/20 text-[#93c5fd]"],
            ["Micro-crack · C-02", "48°C", "Low", "bg-white/10 text-zinc-300"],
          ].map(([name, temp, sev, tone]) => (
            <li key={name} className="rounded-md border border-white/10 bg-white/[0.03] p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white">{name}</p>
                <Pill tone={tone}>{sev}</Pill>
              </div>
              <p className="mt-1 text-zinc-500 tnum">Module temp {temp}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  ),
  forecast: (
    <div className="flex h-full flex-col gap-3">
      <Panel title="Generation outlook · kWh" right={<span className="text-[10px] text-zinc-500">Next 7 days</span>} className="flex-1">
        <Area values={[30, 44, 40, 58, 52, 70, 66, 62, 78, 74, 88, 82]} />
      </Panel>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] tnum">
        {[["Mon", "☀", "412"], ["Tue", "☀", "438"], ["Wed", "⛅", "351"], ["Thu", "☀", "446"], ["Fri", "☁", "279"], ["Sat", "⛅", "362"], ["Sun", "☀", "451"]].map(([d, icon, v]) => (
          <div key={d} className="rounded-md border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">{d}</p>
            <p className="my-0.5 text-sm">{icon}</p>
            <p className="text-white">{v}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  maintenance: (
    <div className="grid h-full grid-cols-3 gap-3">
      {[
        { col: "Open", items: [["Clean Array B", "Soiling loss 6.2%", "High", "bg-[#8755FF]/25 text-[#c4b5fd]"], ["Thermal scan, Block C", "Routine check", "Low", "bg-white/10 text-zinc-300"]] },
        { col: "In progress", items: [["Inspect inverter 2", "Efficiency drift", "Medium", "bg-[#287BFF]/20 text-[#93c5fd]"]] },
        { col: "Done", items: [["Replace fuse, String 14", "Completed today", "Done", "bg-emerald-400/15 text-emerald-300"], ["Panel swap, Row 3", "Completed", "Done", "bg-emerald-400/15 text-emerald-300"]] },
      ].map(({ col, items }) => (
        <div key={col} className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{col}</p>
            <span className="text-[10px] text-zinc-600 tnum">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.map(([task, note, priority, tone]) => (
              <div key={task} className="rounded-md border border-white/10 bg-white/[0.04] p-2.5 text-[10px]">
                <p className="text-white">{task}</p>
                <p className="mt-0.5 text-zinc-500">{note}</p>
                <div className="mt-2"><Pill tone={tone}>{priority}</Pill></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

function Rail({ active }: { active: number }) {
  const icons = [LayoutDashboard, Sun, LineChart, Wrench, Settings];
  return (
    <div className="flex w-9 shrink-0 flex-col items-center gap-3 border-r border-white/5 bg-white/[0.02] py-3">
      {icons.map((Icon, i) => (
        <span key={i} className={cn("grid h-6 w-6 place-items-center rounded", i === active ? "bg-white/10 text-white" : "text-zinc-600")}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      ))}
    </div>
  );
}

export function ModuleView({ kind, large = false, className }: { kind: ModuleKind; large?: boolean; className?: string }) {
  const isSite = kind === "home";
  return (
    <div
      className={cn(
        "flex aspect-[16/10] flex-col overflow-hidden rounded-xl bg-[#0A0C12] text-zinc-200 shadow-[0_50px_90px_-35px_rgba(0,0,0,0.95)] ring-1 ring-inset ring-white/10",
        large ? "text-sm" : "text-[11px]",
        className,
      )}
    >
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-white/5 bg-white/[0.03] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-3 truncate rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">{URLS[kind]}</span>
      </div>
      <div className="flex min-h-0 flex-1">
        {!isSite && <Rail active={RAIL_ACTIVE[kind]} />}
        <div className="flex min-w-0 flex-1 flex-col">
          {!isSite && (
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/5 px-4">
              <p className="font-medium text-white">{TITLES[kind]}</p>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500 sm:inline">Last 24 h</span>
                <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#287BFF] to-[#8755FF]" />
              </div>
            </div>
          )}
          <div className={cn("min-h-0 flex-1 p-4", large && "p-5")}>{BODIES[kind]}</div>
        </div>
      </div>
    </div>
  );
}
