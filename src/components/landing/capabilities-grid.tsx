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

type Cap = { icon: LucideIcon; t: string; d: string; to: "/operator" | "/homeowner" };

const CAPS: Cap[] = [
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

const ORBITS = [
  { rx: 420, ry: 215, omega: 0.11 },
  { rx: 250, ry: 130, omega: -0.17 },
];

const orbitOf = (i: number) => ORBITS[i % 2]!;
const phaseOf = (i: number) => (Math.floor(i / 2) / 3) * Math.PI * 2 + (i % 2 ? Math.PI / 3 : 0);

export function CapabilitiesGrid() {
  return (
    <section className="dark live-bg relative overflow-hidden bg-stage text-stage-foreground">
      <LiveBackground />
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <p className="eyebrow text-solar">Platform capabilities</p>
        <h2 className="mt-3 max-w-xl text-4xl font-light">
          One intelligence layer for the full solar lifecycle.
        </h2>
        <OrbitSystem />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:hidden">
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

function OrbitSystem() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let t = 0;
    let paused = false;
    let raf = 0;
    let last = performance.now();

    const render = () => {
      const w = stage.offsetWidth;
      if (!w) return;
      const k = Math.min(1, (w - 260) / 840);

      ORBITS.forEach((o, i) => {
        const ring = ringRefs.current[i];
        if (!ring) return;
        ring.style.width = `${o.rx * 2 * k}px`;
        ring.style.height = `${o.ry * 2 * k}px`;
      });

      CAPS.forEach((_, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const o = orbitOf(i);
        const theta = phaseOf(i) + o.omega * t;
        const x = o.rx * k * Math.cos(theta);
        const y = o.ry * k * Math.sin(theta);
        const depth = (Math.sin(theta) + 1) / 2;
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${0.8 + 0.2 * depth})`;
        el.style.opacity = String(0.5 + 0.5 * depth);
        el.style.zIndex = String(Math.round(depth * 100));
      });
    };

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) t += dt;
      render();
      raf = requestAnimationFrame(frame);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(render);
    ro.observe(stage);
    render();
    if (!reduce) raf = requestAnimationFrame(frame);

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    stage.addEventListener("pointerenter", pause);
    stage.addEventListener("pointerleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("pointerenter", pause);
      stage.removeEventListener("pointerleave", resume);
    };
  }, []);

  return (
    <div ref={stageRef} className="relative mx-auto mt-6 hidden h-[680px] max-w-6xl md:block">
      {ORBITS.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15"
        />
      ))}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div
          className="flex h-32 w-32 items-center justify-center rounded-full text-center text-xs font-medium text-stage"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #fff7d6 0%, #ffd23f 30%, rgba(255,176,0,0.45) 55%, transparent 72%)",
            animation: "sun-pulse 4s ease-in-out infinite",
          }}
        >
          SolarVerse AI
        </div>
      </div>

      {CAPS.map((cap, i) => (
        <OrbitCard
          key={cap.t}
          cap={cap}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

function OrbitCard({ cap, ref }: { cap: Cap; ref: (el: HTMLAnchorElement | null) => void }) {
  const I = cap.icon;
  return (
    <Link
      ref={ref}
      to={cap.to}
      className="absolute left-1/2 top-1/2 w-60 rounded-xl border border-white/10 bg-stage/80 p-5 shadow-lift backdrop-blur-md transition-colors duration-300 hover:border-solar/60"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-solar/15 text-solar">
        <I className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-base font-medium">{cap.t}</h3>
      <p className="mt-1.5 text-xs text-stage-muted">{cap.d}</p>
    </Link>
  );
}

function CapabilityBlock({ cap, index }: { cap: Cap; index: number }) {
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
    transitionDelay: `${(index % 2) * 140}ms`,
  };

  const I = cap.icon;

  return (
    <Link
      ref={ref}
      to={cap.to}
      style={style}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-[opacity,transform,border-color,background-color] duration-700 ease-out hover:-translate-y-1 hover:border-solar/50 hover:bg-white/[0.08]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-solar/15 text-solar">
        <I className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-medium">{cap.t}</h3>
      <p className="mt-2 text-sm text-stage-muted">{cap.d}</p>
    </Link>
  );
}
