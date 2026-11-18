import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOME_BARS = [38, 52, 64, 78, 90, 96, 92, 84, 70, 56, 44, 36];
const STRINGS = [
  { k: "String A1", v: 96 },
  { k: "String A2", v: 91 },
  { k: "String B1", v: 74 },
  { k: "String B2", v: 98 },
];

const CARDS = [
  {
    k: "Homeowner Intelligence",
    h: "Make your rooftop work smarter.",
    items: [
      "Solar capacity recommendation",
      "Annual production estimate",
      "Installation cost estimation",
      "Savings calculator",
      "Battery configuration",
    ],
    cta: "Explore Home Solar",
    to: "/homeowner" as const,
    dark: false,
  },
  {
    k: "Solar Plant Intelligence",
    h: "Manage every panel. Understand every watt.",
    items: [
      "Plant monitoring",
      "Fault detection",
      "Generation forecasting",
      "Soiling analytics",
      "Predictive maintenance",
    ],
    cta: "Explore Plant Management",
    to: "/operator" as const,
    dark: true,
  },
];

export function SolutionCards() {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {CARDS.map((c) => (
        <SolutionCard key={c.k} card={c} />
      ))}
    </div>
  );
}

type Card = (typeof CARDS)[number];

function SolutionCard({ card }: { card: Card }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const style = e.currentTarget.style;
    style.setProperty("--mx", `${x * 100}%`);
    style.setProperty("--my", `${y * 100}%`);
    style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
    style.setProperty("--ry", `${(x - 0.5) * 5}deg`);
  }

  function onPointerLeave(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  }

  const dark = card.dark;

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={[
        "group relative overflow-hidden rounded-xl p-10 transition-[transform,box-shadow,opacity] duration-500 ease-out",
        "motion-safe:[transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
        "hover:shadow-lift",
        dark ? "bg-inverse text-inverse-foreground" : "border bg-card shadow-soft",
      ].join(" ")}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at var(--mx,50%) var(--my,50%), ${
            dark ? "rgba(255,255,255,0.10)" : "rgba(22,128,80,0.08)"
          }, transparent 45%)`,
        }}
      />

      <div className="relative">
        <p className={dark ? "eyebrow text-solar" : "eyebrow text-primary"}>{card.k}</p>
        <h2 className="mt-4 text-3xl font-light">{card.h}</h2>

        <ul className="mt-6 space-y-2.5 text-sm opacity-85">
          {card.items.map((item, i) => (
            <li
              key={item}
              className="group/item flex items-center gap-3 transition-all duration-500 ease-out"
              style={{
                transitionDelay: `${i * 90 + 200}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-12px)",
              }}
            >
              <span className="h-1 w-4 rounded bg-solar transition-all duration-300 group-hover/item:w-8" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-lg border border-current/10 p-4">
          {dark ? <PlantVisual visible={visible} /> : <HomeVisual visible={visible} />}
        </div>

        <Button asChild variant={dark ? "secondary" : "default"} className="mt-8">
          <Link to={card.to}>
            {card.cta} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function HomeVisual({ visible }: { visible: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">Monthly production, kWh</p>
      <div className="mt-3 flex h-24 items-end gap-1.5">
        {HOME_BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/80 transition-[height] duration-700 ease-out hover:bg-primary"
            style={{
              height: visible ? `${h}%` : "0%",
              transitionDelay: `${i * 60 + 400}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PlantVisual({ visible }: { visible: boolean }) {
  return (
    <div className="space-y-2.5">
      {STRINGS.map((s, i) => (
        <div key={s.k} className="flex items-center gap-3 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solar opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-solar" />
          </span>
          <span className="w-16 opacity-80">{s.k}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/10">
            <div
              className="h-full rounded bg-solar transition-[width] duration-1000 ease-out"
              style={{
                width: visible ? `${s.v}%` : "0%",
                transitionDelay: `${i * 120 + 400}ms`,
              }}
            />
          </div>
          <span className="w-9 text-right tnum opacity-80">{s.v}%</span>
        </div>
      ))}
    </div>
  );
}
