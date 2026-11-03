import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Logo, DemoBadge } from "@/components/brand";
import { cn } from "@/lib/utils";

export function DashboardShell({ nav, active, title, subtitle, children }: { nav: { icon: LucideIcon; label: string }[]; active: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card px-4 py-6 lg:flex">
        <div className="px-2"><Logo /></div>
        <nav className="mt-10 space-y-0.5">
          {nav.map(({ icon: I, label }) => (
            <div key={label} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm", label === active ? "bg-forest text-forest-foreground" : "text-muted-foreground")}>
              <I className="h-4 w-4" /> {label}
            </div>
          ))}
        </nav>
        <p className="mt-auto px-2 text-[11px] text-muted-foreground">Other sections are on the roadmap.</p>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 lg:hidden"><Logo /></div>
            <h1 className="text-3xl font-light text-forest">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <DemoBadge />
        </div>
        {children}
      </main>
    </div>
  );
}

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-soft", className)}>
      <h2 className="mb-4 text-sm font-medium text-forest">{title}</h2>
      {children}
    </section>
  );
}
