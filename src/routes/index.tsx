import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ScanSearch, LineChart, Home, Wind, IndianRupee, Wrench } from "lucide-react";
import hero from "@/assets/hero-solar.jpg";
import { Button } from "@/components/ui/button";
import { SiteNav, SiteFooter } from "@/components/brand";
import { BreakoutStage } from "@/components/landing/breakout-stage";
import { Reveal } from "@/components/landing/reveal";
import { SolutionCards } from "@/components/landing/solution-cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolarVerse AI — Intelligent Solar for Homes & Plants" },
      { name: "description", content: "Plan rooftop solar, estimate savings, and monitor solar plants with SolarVerse AI." },
      { property: "og:title", content: "SolarVerse AI — Intelligent Solar for Homes & Plants" },
      { property: "og:description", content: "From rooftop planning to plant monitoring, one intelligent solar platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CAPS = [
  { icon: ScanSearch, t: "AI Solar Fault Detection", d: "Flag cracks, hotspots and cell abnormalities from inspection imagery.", to: "/operator" },
  { icon: LineChart, t: "Intelligent Energy Forecasting", d: "Typical-year estimates and short-term weather-aware outlooks.", to: "/operator" },
  { icon: Home, t: "Smart Rooftop Planning", d: "Right-size capacity to your roof, usage and budget.", to: "/homeowner" },
  { icon: Wind, t: "Dust & Soiling Analysis", d: "Quantify soiling losses and time cleaning cycles.", to: "/operator" },
  { icon: IndianRupee, t: "Financial & ROI Intelligence", d: "Payback, savings and 20-year projections in ₹.", to: "/homeowner" },
  { icon: Wrench, t: "Predictive Maintenance", d: "Prioritise inspections before output drops.", to: "/operator" },
];

function Landing() {
  return (
    <div>
      <SiteNav />
      <section className="relative -mt-16 overflow-hidden">
        <img src={hero} alt="Rooftop solar panels at golden hour" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-40 lg:grid-cols-[1.2fr_1fr]">
          <div className="fade-up max-w-xl">
            <p className="eyebrow text-primary">Smarter Solar Decisions. Measurable Energy Impact.</p>
            <h1 className="mt-5 text-5xl font-light leading-[1.05] text-forest md:text-6xl">
              The Intelligence Behind Every Ray of Sunshine.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              From smarter rooftop solar planning to intelligent power plant monitoring, SolarVerse AI brings the entire solar-energy journey into one intelligent platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/operator">Explore Solar Intelligence <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-card/70"><Link to="/advisor">Calculate My Solar Potential</Link></Button>
            </div>
          </div>
          <div className="fade-up self-end justify-self-end [animation-delay:200ms]">
            <div className="w-72 rounded-xl border bg-card/90 p-5 shadow-lift backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-forest">Live system</p>
              </div>
              <p className="mt-4 eyebrow">Live generation</p>
              <p className="font-display text-4xl font-light text-forest tnum">8.42 <span className="text-base text-muted-foreground">kW</span></p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-xs">
                <div><p className="text-muted-foreground">Today</p><p className="font-medium tnum">42.8 kWh</p></div>
                <div><p className="text-muted-foreground">Health</p><p className="font-medium text-success tnum">98.4%</p></div>
                <div><p className="text-muted-foreground">CO₂ saved</p><p className="font-medium tnum">18.6 kg</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BreakoutStage />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">Two ways to use SolarVerse</p>
        </Reveal>
        <SolutionCards />
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="eyebrow">Platform capabilities</p>
          <h2 className="mt-3 max-w-xl text-4xl font-light text-forest">One intelligence layer for the full solar lifecycle.</h2>
          <Reveal className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
            {CAPS.map(({ icon: I, t, d, to }) => (
              <Link key={t} to={to} className="group bg-card p-8 transition-colors hover:bg-cream">
                <I className="h-5 w-5 text-primary transition-colors group-hover:text-forest" />
                <h3 className="mt-6 text-lg font-medium text-forest">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="eyebrow">How SolarVerse works</p>
        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {["Connect your solar data.", "Analyse using intelligent models.", "Discover actionable insights.", "Optimize solar performance."].map((s, i) => (
            <Reveal key={s} delay={i * 120} className="border-t-2 border-forest pt-5">
              <p className="font-display text-sm text-primary tnum">0{i + 1}</p>
              <p className="mt-2 text-lg text-forest">{s}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-2xl bg-cream px-10 py-16 text-center">
          <h2 className="text-4xl font-light text-forest">Your Solar Future Starts Here.</h2>
          <p className="mt-3 text-muted-foreground">Plan smarter. Generate better. Power a cleaner future.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/advisor">Start Your Solar Journey <ArrowRight /></Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
