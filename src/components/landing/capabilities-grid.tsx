import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  ScanSearch,
  LineChart,
  Home,
  Wind,
  IndianRupee,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const CAPS: { icon: LucideIcon; t: string; d: string; to: "/operator" | "/homeowner" }[] = [
  {
    icon: ScanSearch,
    t: "AI Solar Fault Detection",
    d: "Flag cracks, hotspots and cell abnormalities from inspection imagery.",
    to: "/operator",
  },
  {
    icon: LineChart,
    t: "Intelligent Energy Forecasting",
    d: "Typical-year estimates and short-term weather-aware outlooks.",
    to: "/operator",
  },
  {
    icon: Home,
    t: "Smart Rooftop Planning",
    d: "Right-size capacity to your roof, usage and budget.",
    to: "/homeowner",
  },
  {
    icon: Wind,
    t: "Dust & Soiling Analysis",
    d: "Quantify soiling losses and time cleaning cycles.",
    to: "/operator",
  },
  {
    icon: IndianRupee,
    t: "Financial & ROI Intelligence",
    d: "Payback, savings and 20-year projections in ₹.",
    to: "/homeowner",
  },
  {
    icon: Wrench,
    t: "Predictive Maintenance",
    d: "Prioritise inspections before output drops.",
    to: "/operator",
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="live-bg relative overflow-hidden bg-stage text-stage-foreground">
      <LiveBackground />
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <p className="eyebrow text-solar">Platform capabilities</p>
        <h2 className="mt-3 max-w-xl text-4xl font-light">
          One intelligence layer for the full solar lifecycle.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CAPS.map((cap, i) => (
            <CapabilityBlock key={cap.t} cap={cap} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute -left-24 top-8 h-80 w-80 rounded-full bg-solar/25 blur-3xl"
        style={{ animation: "orb-drift 14s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-chart-1/25 blur-3xl"
        style={{ animation: "orb-drift 18s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          animation: "grid-drift 12s linear infinite",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-solar/20 to-transparent"
        style={{ animation: "scan-line 9s linear infinite" }}
      />
    </div>
  );
}

function CapabilityBlock({ cap, index }: { cap: (typeof CAPS)[number]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,48px,0) scale(0.97)",
    transitionDelay: `${(index % 3) * 140}ms`,
  };

  const I = cap.icon;

  return (
    <Link
      ref={ref}
      to={cap.to}
      style={style}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition-[opacity,transform,border-color,background-color] duration-700 ease-out hover:-translate-y-1 hover:border-solar/50 hover:bg-white/[0.08]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-solar transition-transform duration-700 group-hover:scale-x-100"
      />
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-solar/15 text-solar transition-transform duration-500 group-hover:scale-110">
        <I className="h-5 w-5" />
      </span>
      <h3 className="mt-6 text-lg font-medium">{cap.t}</h3>
      <p className="mt-2 text-sm text-stage-muted">{cap.d}</p>
    </Link>
  );
}
