import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/brand";
import { Hero } from "@/components/landing/hero";
import { BreakoutStage } from "@/components/landing/breakout-stage";
import { Reveal } from "@/components/landing/reveal";
import { SolutionCards } from "@/components/landing/solution-cards";
import { CapabilitiesGrid } from "@/components/landing/capabilities-grid";
import { HowItWorks } from "@/components/landing/how-it-works";

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

function Landing() {
  return (
    <div>
      <SiteNav />
      <Hero />

      <BreakoutStage />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">Two ways to use SolarVerse</p>
        </Reveal>
        <SolutionCards />
      </section>

      <CapabilitiesGrid />

      <HowItWorks />
      <SiteFooter />
    </div>
  );
}
