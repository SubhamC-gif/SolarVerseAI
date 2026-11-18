import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModuleView, type ModuleKind } from "./module-views";
import { Reveal } from "./reveal";
import { useCinematicMode } from "./use-cinematic-mode";

type Pose = { x: number; y: number; z: number; rx: number; ry: number; s: number };
type Module = {
  kind: ModuleKind;
  label: string;
  route: string;
  start: number;
  rest: Pose;
  final: Pose;
};

const MODULES: Module[] = [
  {
    kind: "advisor",
    label: "Solar Advisor",
    route: "/advisor",
    start: 0.36,
    rest: { x: -0.36, y: -0.3, z: 0, rx: 4, ry: 8, s: 0.6 },
    final: { x: -0.2, y: -0.1, z: 60, rx: 4, ry: 9, s: 1 },
  },
  {
    kind: "roi",
    label: "Savings & ROI",
    route: "/homeowner",
    start: 0.42,
    rest: { x: 0.36, y: -0.28, z: 0, rx: 4, ry: -8, s: 0.6 },
    final: { x: 0.16, y: -0.12, z: 110, rx: 4, ry: -8, s: 1 },
  },
  {
    kind: "plant",
    label: "Plant Monitoring",
    route: "/operator",
    start: 0.48,
    rest: { x: -0.36, y: 0.3, z: 0, rx: -4, ry: 8, s: 0.6 },
    final: { x: -0.14, y: 0.12, z: 160, rx: -4, ry: 7, s: 1 },
  },
  {
    kind: "fault",
    label: "Fault Detection",
    route: "/operator",
    start: 0.54,
    rest: { x: 0.36, y: 0.28, z: 0, rx: -4, ry: -8, s: 0.6 },
    final: { x: 0.18, y: 0.13, z: 210, rx: -4, ry: -7, s: 1 },
  },
  {
    kind: "forecast",
    label: "Forecasting",
    route: "/operator",
    start: 0.6,
    rest: { x: -0.46, y: 0.02, z: -20, rx: 0, ry: 10, s: 0.6 },
    final: { x: -0.02, y: 0.22, z: 260, rx: 6, ry: 0, s: 1 },
  },
  {
    kind: "maintenance",
    label: "Predictive Maintenance",
    route: "/operator",
    start: 0.66,
    rest: { x: 0, y: 0.02, z: -160, rx: 0, ry: 0, s: 0.7 },
    final: { x: 0.02, y: -0.02, z: 310, rx: 2, ry: 0, s: 1 },
  },
];

const INTRO = {
  eyebrow: "One ecosystem",
  title: "One Platform. Endless Possibilities.",
  body: "Everything homeowners and solar operators need to plan, measure and protect solar power, connected in one intelligence layer.",
};

const BEATS = [
  INTRO,
  {
    eyebrow: "Connected, then released",
    title: "Your Solar Data Deserves More Than a Dashboard.",
    body: "Each module detaches from the homepage and moves forward, from rooftop planning to plant fault detection.",
  },
  {
    eyebrow: "In focus",
    title: "Every module, sharper than before.",
    body: "Solar advisory, savings intelligence, live plant monitoring, fault detection, forecasting and maintenance planning.",
  },
  {
    eyebrow: "Start here",
    title: "Built for every roof and every megawatt.",
    body: "Estimate your home's solar potential, or run a full plant with predictive insight.",
  },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const beatIndex = (p: number) => (p < 0.3 ? 0 : p < 0.5 ? 1 : p < 0.76 ? 2 : 3);

export function BreakoutStage() {
  const cinematic = useCinematicMode();
  return cinematic ? <CinematicStage /> : <StaticShowcase />;
}

function StaticShowcase() {
  return (
    <section
      aria-label="SolarVerse ecosystem overview"
      className="relative overflow-hidden bg-stage px-6 py-24 text-stage-foreground"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.16em] text-stage-accent">{INTRO.eyebrow}</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-light tracking-tight md:text-4xl">
            {INTRO.title}
          </h2>
          <p className="mt-3 max-w-xl text-base text-stage-muted">{INTRO.body}</p>
        </Reveal>
        <Reveal className="mt-12" delay={80}>
          <ModuleView kind="home" large />
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.kind} delay={i * 80}>
              <Link to={m.route} className="group block">
                <ModuleView
                  kind={m.kind}
                  className="transition-transform duration-500 group-hover:-translate-y-1"
                />
                <p className="mt-3 text-sm text-stage-muted transition-colors group-hover:text-stage-foreground">
                  {m.label}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CinematicStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const sizeRef = useRef({ w: 1, h: 1 });
  const beatRef = useRef(0);
  const [beat, setBeat] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const camera = cameraRef.current;
    if (!section || !camera) return;

    const render = (p: number) => {
      const { w, h } = sizeRef.current;
      const intro = clamp01(p / 0.1);
      const appear = clamp01((p - 0.08) / 0.14);
      const breakAmt = ease(clamp01((p - 0.3) / 0.08));
      const recede = ease(clamp01((p - 0.38) / 0.52));
      const cam = ease(clamp01((p - 0.86) / 0.14));
      const flickering = p > 0.28 && p < 0.38;

      camera.style.transform = `scale(${1 + 0.05 * cam})`;

      const home = homeRef.current;
      if (home) {
        const s = (0.9 + 0.1 * ease(intro)) * lerp(1, 0.94, recede);
        home.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${-240 * recede}px) rotateX(${12 - 2 * intro}deg) rotateY(${-6 * (1 - recede)}deg) scale(${s})`;
        home.style.opacity = String(lerp(1, 0.32, recede));
      }

      MODULES.forEach((m, i) => {
        const el = moduleRefs.current[i];
        if (el) {
          const e = ease(clamp01((p - m.start) / 0.14));
          const jitter = flickering ? Math.sin(p * 900 + i * 2.3) * 5 * (1 - e) : 0;
          const x = lerp(m.rest.x, m.final.x, e) * w + jitter;
          const y = lerp(m.rest.y, m.final.y, e) * h;
          const z = lerp(m.rest.z, m.final.z, e);
          const rx = lerp(m.rest.rx, m.final.rx, e);
          const ry = lerp(m.rest.ry, m.final.ry, e);
          const s = lerp(m.rest.s * (0.8 + 0.2 * appear), m.final.s, e);
          el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
          el.style.opacity = String(lerp(appear * 0.85, 1, e));
        }

        const line = lineRefs.current[i];
        if (line) {
          const k = 1 - breakAmt * 0.92;
          const blink = flickering && Math.sin(p * 1200 + i * 1.7) < -0.2 ? 0.15 : 1;
          line.setAttribute("x2", String(m.rest.x * 1000 * k));
          line.setAttribute("y2", String(m.rest.y * 1000 * k));
          line.style.strokeDashoffset = String(1500 * (1 - appear));
          line.style.opacity = String(appear * (1 - breakAmt) * blink * 0.9);
        }
      });

      const b = beatIndex(p);
      if (b !== beatRef.current) {
        beatRef.current = b;
        setBeat(b);
      }
    };

    const measure = () => {
      sizeRef.current = { w: camera.offsetWidth, h: camera.offsetHeight };
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const total = section.offsetHeight - window.innerHeight;
      render(total > 0 ? clamp01(-section.getBoundingClientRect().top / total) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="SolarVerse ecosystem overview"
      className="relative h-[330vh] bg-stage text-stage-foreground"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_15%,rgba(40,123,255,0.14),transparent_70%),radial-gradient(50%_45%_at_85%_85%,rgba(135,85,255,0.14),transparent_70%)]"
        />
        <div
          ref={cameraRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 top-[18%] will-change-transform"
          style={{ perspective: "1600px", transformStyle: "preserve-3d" }}
        >
          <svg
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {MODULES.map((m, i) => (
              <line
                key={m.kind}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                x1={0}
                y1={0}
                x2={m.rest.x * 1000}
                y2={m.rest.y * 1000}
                stroke="#287BFF"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeDasharray="1500 1500"
              />
            ))}
          </svg>
          <div
            ref={homeRef}
            className="absolute left-1/2 top-1/2 w-[min(800px,56vw)] will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <ModuleView kind="home" large />
          </div>
          {MODULES.map((m, i) => (
            <div
              key={m.kind}
              ref={(el) => {
                moduleRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 w-[min(330px,24vw)] will-change-transform"
            >
              <ModuleView kind={m.kind} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none relative z-30 mx-auto grid max-w-2xl px-6 pt-16 text-center">
          {BEATS.map((b, i) => (
            <div
              key={b.title}
              inert={beat !== i}
              className={cn(
                "col-start-1 row-start-1 transition-all duration-700 ease-out",
                beat === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-stage-accent">{b.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-light tracking-tight md:text-4xl">{b.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-stage-muted">{b.body}</p>
              {i === 3 && (
                <div className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg">
                    <Link to="/advisor">
                      Calculate My Solar Potential <ArrowRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-stage-foreground/20 bg-transparent text-stage-foreground hover:bg-stage-foreground/10"
                  >
                    <Link to="/operator">Explore Solar Operators</Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
