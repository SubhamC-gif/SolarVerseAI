import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-solar.jpg";
import { Button } from "@/components/ui/button";

const HEADLINE = "The Intelligence Behind Every Ray of Sunshine.".split(" ");

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let height = section.offsetHeight;
    let last = -1;
    const update = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / height));
      if (p === last) return;
      last = p;
      section.style.setProperty("--scroll", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      height = section.offsetHeight;
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={ref} className="hero-section relative -mt-16 min-h-[92vh] overflow-hidden">
      <div className="hero-bg absolute inset-0">
        <img
          src={hero}
          alt="Rooftop solar panels at golden hour"
          width={1600}
          height={1008}
          className="hero-ken absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div aria-hidden className="hero-orb absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div aria-hidden className="hero-orb hero-orb-2 absolute right-10 top-16 h-80 w-80 rounded-full bg-solar/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-40 lg:grid-cols-[1.2fr_1fr]">
        <div className="hero-copy max-w-xl">
          <div className="fade-up">
            <p className="eyebrow text-primary">Smarter Solar Decisions. Measurable Energy Impact.</p>
            <h1
              className="mt-5 text-5xl font-light leading-[1.05] text-forest md:text-6xl"
              style={{ perspective: "800px" }}
            >
              {HEADLINE.map((word, i) => (
                <Fragment key={`${word}-${i}`}>
                  <span
                    className="hero-word"
                    style={{ "--d": `${300 + i * 90}ms` } as CSSProperties}
                  >
                    {word}
                  </span>
                  {i < HEADLINE.length - 1 && " "}
                </Fragment>
              ))}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              From smarter rooftop solar planning to intelligent power plant monitoring, SolarVerse AI brings the entire solar-energy journey into one intelligent platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-shine group">
                <Link to="/operator">
                  Explore Solar Intelligence
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-shine bg-card/70">
                <Link to="/advisor">Calculate My Solar Potential</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="hero-card justify-self-end self-end lg:self-center">
          <div className="fade-up [animation-delay:200ms]">
            <div className="hero-float w-72 rounded-xl border bg-card p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-forest">Live system</p>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-primary" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              </div>
              <p className="mt-4 eyebrow">Live generation</p>
              <p className="font-display text-4xl font-light text-forest tnum">
                8.42 <span className="text-base text-muted-foreground">kW</span>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-xs">
                <div><p className="text-muted-foreground">Today</p><p className="font-medium tnum">42.8 kWh</p></div>
                <div><p className="text-muted-foreground">Health</p><p className="font-medium text-success tnum">98.4%</p></div>
                <div><p className="text-muted-foreground">CO₂ saved</p><p className="font-medium tnum">18.6 kg</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-cue pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Scroll</span>
        <span className="relative h-10 w-5 rounded-full border border-muted-foreground/40">
          <span className="scroll-dot absolute left-1/2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
      </div>
    </section>
  );
}
