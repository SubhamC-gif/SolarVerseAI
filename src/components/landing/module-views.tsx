import type { ReactNode } from "react";
import hero from "@/assets/hero-solar.jpg";
import { cn } from "@/lib/utils";

export type ModuleKind =
  "home" | "advisor" | "roi" | "plant" | "fault" | "forecast" | "maintenance";

const URLS: Record<ModuleKind, string> = {
  home: "solarverse.ai",
  advisor: "solarverse.ai/advisor",
  roi: "solarverse.ai/homeowner",
  plant: "solarverse.ai/operator",
  fault: "solarverse.ai/operator/faults",
  forecast: "solarverse.ai/operator/forecast",
  maintenance: "solarverse.ai/operator/maintenance",
};

function Bars({ values }: { values: number[] }) {
  return (
    <div className="flex h-24 items-end gap-1.5">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-[#287BFF] to-[#8755FF]"
          style={{ height: `${v}%` }}
        />
      ))}
    </div>
  );
}

const FAULT_TILES = [7, 22];

const BODIES: Record<ModuleKind, ReactNode> = {
  home: (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-white">
          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#287BFF] to-[#8755FF]" />
          SolarVerse <span className="text-[#00D6FF]">AI</span>
        </div>
        <div className="hidden gap-5 text-zinc-400 md:flex">
          <span>Home</span>
          <span>Solar Advisor</span>
          <span>Homeowners</span>
          <span>Solar Operators</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
          Get Started
        </span>
      </div>
      <div className="mt-6 grid grid-cols-[1.05fr_1fr] gap-5">
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#00D6FF]">
            Smarter solar decisions
          </p>
          <p className="mt-2 text-xl font-light leading-tight text-white">
            The Intelligence Behind Every Ray of Sunshine.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-gradient-to-r from-[#287BFF] to-[#8755FF] px-3 py-1.5 text-white">
              Explore Solar Intelligence
            </span>
            <span className="rounded-md border border-white/15 px-3 py-1.5 text-zinc-300">
              Calculate potential
            </span>
          </div>
        </div>
        <img src={hero} alt="" className="h-40 w-full rounded-lg object-cover" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        {[
          ["Live generation", "8.42 kW"],
          ["System health", "98.4%"],
          ["CO₂ saved", "18.6 kg"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white/[0.04] p-3">
            <p className="text-[10px] text-zinc-500">{label}</p>
            <p className="mt-1 text-base font-light text-white tnum">{value}</p>
          </div>
        ))}
      </div>
    </>
  ),
  advisor: (
    <>
      <p className="font-medium text-white">Solar Advisor</p>
      <p className="text-zinc-500">Tell us about your roof and usage.</p>
      <div className="mt-4 space-y-2.5">
        {[
          ["Roof area", "120 m²"],
          ["Monthly usage", "350 kWh"],
          ["Budget", "₹ 3,00,000"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="text-zinc-400">{k}</span>
            <span className="text-white tnum">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-gradient-to-r from-[#287BFF]/25 to-[#8755FF]/25 p-3">
        <p className="text-zinc-300">Recommended system</p>
        <p className="mt-1 text-xl font-light text-white tnum">
          4.5 kW <span className="text-xs text-zinc-400">· 11 panels</span>
        </p>
        <div className="mt-3 h-1 rounded bg-white/10">
          <div className="h-1 w-[72%] rounded bg-gradient-to-r from-[#287BFF] to-[#00D6FF]" />
        </div>
      </div>
    </>
  ),
  roi: (
    <>
      <div className="flex items-center justify-between">
        <p className="font-medium text-white">Savings &amp; ROI</p>
        <span className="rounded-full border border-[#00D6FF]/30 px-2 py-0.5 text-[10px] text-[#00D6FF]">
          Illustrative
        </span>
      </div>
      <p className="mt-4 text-2xl font-light text-white tnum">₹ 1.84L</p>
      <p className="text-zinc-500">Estimated 20-year savings</p>
      <div className="mt-4">
        <Bars values={[30, 38, 44, 52, 48, 60, 66, 72, 78, 84, 90, 96]} />
      </div>
    </>
  ),
  plant: (
    <>
      <div className="flex items-center justify-between">
        <p className="font-medium text-white">Plant Monitoring</p>
        <span className="text-emerald-300 tnum">98.2% healthy</span>
      </div>
      <div className="mt-4 grid grid-cols-12 gap-1">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-[3px]",
              FAULT_TILES.includes(i) ? "bg-solar" : "bg-[#287BFF]/60",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-zinc-500">36 strings · 2 under review</p>
    </>
  ),
  fault: (
    <>
      <p className="font-medium text-white">Fault Detection</p>
      <div className="relative mt-3 h-36 overflow-hidden rounded-lg bg-[radial-gradient(circle_at_30%_40%,#8755FF,#287BFF_35%,#0A0C12_80%)]">
        <div className="absolute left-[20%] top-[28%] h-11 w-16 border border-[#00D6FF]" />
        <div className="absolute left-[58%] top-[52%] h-8 w-12 border border-solar" />
      </div>
      <div className="mt-3 flex justify-between text-zinc-400">
        <span>Hotspot · 0.4% area</span>
        <span className="text-solar">Crack · Low</span>
      </div>
    </>
  ),
  forecast: (
    <>
      <p className="font-medium text-white">7-Day Forecast</p>
      <svg viewBox="0 0 300 110" className="mt-3 h-28 w-full" aria-hidden>
        <defs>
          <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#287BFF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#287BFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 80 C40 60 60 30 100 44 S170 90 210 40 S270 20 300 30 L300 110 L0 110 Z"
          fill="url(#forecast-fill)"
        />
        <path
          d="M0 80 C40 60 60 30 100 44 S170 90 210 40 S270 20 300 30"
          fill="none"
          stroke="#00D6FF"
          strokeWidth="2"
        />
      </svg>
      <p className="text-zinc-500">Weather-aware generation outlook</p>
    </>
  ),
  maintenance: (
    <>
      <p className="font-medium text-white">Predictive Maintenance</p>
      <ul className="mt-4 space-y-2.5">
        {[
          ["Clean Array B", "Soiling loss 6.2%", "High", "bg-[#8755FF]/25 text-[#c4b5fd]"],
          [
            "Inspect inverter 2",
            "Efficiency drift detected",
            "Medium",
            "bg-[#287BFF]/20 text-[#93c5fd]",
          ],
          ["Thermal scan, Block C", "Routine check due", "Low", "bg-white/10 text-zinc-300"],
        ].map(([task, note, priority, tone]) => (
          <li
            key={task}
            className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <div>
              <p className="text-white">{task}</p>
              <p className="text-zinc-500">{note}</p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", tone)}>{priority}</span>
          </li>
        ))}
      </ul>
    </>
  ),
};

export function ModuleView({
  kind,
  large = false,
  className,
}: {
  kind: ModuleKind;
  large?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-[#0A0C12] text-zinc-200 shadow-[0_50px_90px_-35px_rgba(0,0,0,0.95)] ring-1 ring-inset ring-white/10",
        large ? "text-sm" : "text-[11px]",
        className,
      )}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-white/5 bg-white/[0.03] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-3 truncate rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
          {URLS[kind]}
        </span>
      </div>
      <div className={cn("p-4", large && "p-6")}>{BODIES[kind]}</div>
    </div>
  );
}
