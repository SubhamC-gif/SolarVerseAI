import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

const STEPS = [
  "Connect your solar data.",
  "Analyse using intelligent models.",
  "Discover actionable insights.",
  "Optimize solar performance.",
];

export function HowItWorks() {
  return (
    <section className="dark live-bg relative overflow-hidden bg-stage text-stage-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-solar/20 blur-3xl"
          style={{ animation: "orb-drift 16s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-chart-1/25 blur-3xl"
          style={{ animation: "orb-drift 20s ease-in-out infinite reverse" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <p className="eyebrow text-solar">How SolarVerse works</p>

        <div className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[15px] hidden h-px bg-white/10 md:block"
          >
            <div
              className="h-full w-full bg-[linear-gradient(90deg,transparent,var(--solar),transparent)] bg-[length:50%_100%] bg-no-repeat"
              style={{ animation: "flow-x 3.5s linear infinite" }}
            />
          </div>

          {STEPS.map((s, i) => (
            <Reveal key={s} delay={i * 150}>
              <div className="group relative">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-solar/50 bg-stage font-display text-xs text-solar tnum transition-colors duration-300 group-hover:bg-solar group-hover:text-solar-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-6 text-lg leading-snug text-stage-foreground transition-transform duration-300 group-hover:translate-x-1">
                  {s}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="relative mt-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-10 py-16 text-center backdrop-blur-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(255,210,63,0.25), transparent 60%)",
              }}
            />
            <h2 className="relative text-4xl font-light">Your Solar Future Starts Here.</h2>
            <p className="relative mt-3 text-stage-muted">
              Plan smarter. Generate better. Power a cleaner future.
            </p>
            <Button asChild size="lg" className="relative mt-8">
              <Link to="/advisor">
                Start Your Solar Journey <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
