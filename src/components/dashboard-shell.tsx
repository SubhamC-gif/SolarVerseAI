import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Menu, LogOut, Home, Factory, Loader2 } from "lucide-react";
import { Logo, DemoBadge } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, homeFor, setMyRole, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NavItem = { icon: LucideIcon; label: string; to: string; exact?: boolean; onClick?: (e: React.MouseEvent) => void; active?: boolean };

function NavLinks({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5">
      {nav.map(({ icon: I, label, to, exact, onClick, active }) => (
        <Link
          key={label}
          data-active={active ? "true" : undefined}
          to={to}
          onClick={(e) => {
            onClick?.(e);
            onNavigate?.();
          }}
          activeOptions={{ exact: !!exact }}
          className={cn(
            "nav-item group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-300 hover:translate-x-1 hover:bg-muted hover:text-forest",
            active ? "bg-forest text-forest-foreground" : "text-muted-foreground"
          )}
          activeProps={active === undefined ? { className: "!bg-forest !text-forest-foreground" } : undefined}
        >
          <I className="nav-icon h-4 w-4 shrink-0" /> <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function SignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground"
      onClick={async () => {
        await qc.cancelQueries();
        qc.clear();
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </Button>
  );
}

function RoleSwitcher() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: role } = useQuery({
    queryKey: ["my-role"],
    queryFn: getMyRole,
    staleTime: 30_000,
  });

  async function switchTo(target: AppRole) {
    if (!role || role === target || busy) return;
    setBusy(true);
    try {
      await setMyRole(target);
      await qc.invalidateQueries({ queryKey: ["my-role"] });
      navigate({ to: homeFor(target), replace: true });
    } catch {
      // role update failed; stay put
    } finally {
      setBusy(false);
    }
  }

  const options: { value: AppRole; label: string; icon: LucideIcon }[] = [
    { value: "homeowner", label: "Homeowner", icon: Home },
    { value: "operator", label: "Operator", icon: Factory },
  ];

  return (
    <div className="rounded-lg border bg-muted/40 p-2">
      <p className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Switch workspace</p>
      <div className="grid grid-cols-2 gap-1">
        {options.map(({ value, label, icon: I }) => {
          const active = role === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => switchTo(value)}
              disabled={busy || active}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-forest text-forest-foreground" : "text-muted-foreground hover:bg-background hover:text-forest",
                busy && "opacity-60",
              )}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <I className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardLayout({ nav, roleLabel, children }: { nav: NavItem[]; roleLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card px-4 py-6 lg:flex">
        <div className="px-2"><Logo /></div>
        <p className="mt-6 px-3 eyebrow">{roleLabel}</p>
        <div className="mt-2 flex-1 overflow-y-auto"><NavLinks nav={nav} /></div>
        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <RoleSwitcher />
          <SignOut />
        </div>
      </aside>
      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
                <p className="mt-4 px-3 eyebrow">{roleLabel}</p>
                <div className="flex-1 overflow-y-auto"><NavLinks nav={nav} onNavigate={() => setOpen(false)} /></div>
                <div className="mt-4 space-y-3 border-t pt-4">
                  <RoleSwitcher />
                  <SignOut />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  nav,
  active,
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  nav: NavItem[];
  active?: string;
  title: string;
  subtitle?: string;
  badge?: string | null;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardLayout nav={nav} roleLabel="Dashboard">
      <Page title={title} subtitle={subtitle} badge={badge} actions={actions}>
        {children}
      </Page>
    </DashboardLayout>
  );
}

export function Page({ title, subtitle, badge = "Demo data", actions, children }: { title: string; subtitle?: string | null | undefined; badge?: string | null | undefined; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-light text-forest sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">{badge && <DemoBadge label={badge} />}{actions}</div>
      </div>
      {children}
    </main>
  );
}

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-lg border bg-card p-4 shadow-soft sm:p-5", className)}>
      <h2 className="mb-4 text-sm font-medium text-forest">{title}</h2>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}
