import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="15" className="fill-forest" />
        <circle cx="16" cy="12" r="4.5" className="fill-solar" />
        <path d="M8 24c3-7 9-9 16-8-2 6-8 9-16 8z" className="fill-lime" />
        <path d="M9 23l7-5m0 0h4m-4 0v-3" className="stroke-forest" strokeWidth="1.2" fill="none" />
      </svg>
      <span className={cn("font-display text-[17px] font-medium tracking-tight", light ? "text-inverse-foreground" : "text-forest")}>
        SolarVerse <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-solar/60 bg-solar/15 px-2.5 py-0.5 text-[11px] font-medium text-solar-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-solar" /> {label}
    </span>
  );
}

const NAV = [
  { to: "/", label: "Home" },
  { to: "/advisor", label: "Solar Advisor" },
  { to: "/homeowner", label: "Homeowners" },
  { to: "/operator", label: "Solar Operators" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={cn("sticky top-0 z-50 transition-[background-color,border-color] duration-300", scrolled ? "border-b bg-background/85 backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-muted-foreground transition-colors hover:text-forest" activeProps={{ className: "text-forest font-medium" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm"><Link to="/advisor">Get Started</Link></Button>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { heading: string; items: { label: string; to?: "/advisor" | "/homeowner" | "/operator" }[] }[] = [
  {
    heading: "Homeowners",
    items: [
      { label: "Solar Advisor", to: "/advisor" },
      { label: "Savings & ROI", to: "/homeowner" },
      { label: "Battery Planner", to: "/homeowner" },
    ],
  },
  {
    heading: "Operators",
    items: [
      { label: "Plant Monitoring", to: "/operator" },
      { label: "Fault Detection", to: "/operator" },
      { label: "Forecasting", to: "/operator" },
    ],
  },
  {
    heading: "Company",
    items: [{ label: "About" }, { label: "Privacy" }, { label: "Terms" }, { label: "Contact" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="space-y-3">
          <Logo light />
          <p className="text-sm opacity-70">Powering Smarter Homes. Optimizing a Greener Planet.</p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="mb-3 text-xs uppercase tracking-[0.14em] opacity-60">{col.heading}</p>
            <ul className="space-y-2 text-sm opacity-85">
              {col.items.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="transition-colors hover:text-solar hover:opacity-100">
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-inverse-foreground/10 py-6 text-center text-xs opacity-60">© 2026 SolarVerse AI. Figures on this site are illustrative estimates.</div>
    </footer>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { label: string; up: boolean | null };
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
      </div>
      <p className="mt-3 font-display text-3xl font-light text-forest tnum">
        {value}{unit && <span className="ml-1 text-base text-muted-foreground">{unit}</span>}
      </p>
      {trend && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            trend.up === null ? "bg-muted text-muted-foreground" : trend.up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
          )}
        >
          {trend.up === null ? <Minus className="h-3 w-3" /> : trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend.label}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
