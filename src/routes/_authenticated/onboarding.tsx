import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Factory } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, homeFor, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Choose your role — SolarVerse AI" },
      { name: "description", content: "Tell us whether you're a homeowner or a solar plant operator." },
      { property: "og:title", content: "Choose your role — SolarVerse AI" },
      { property: "og:description", content: "Set up your SolarVerse AI profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AppRole>("homeowner");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const id = await currentUserId();
    const p = await supabase.from("profiles").upsert({ id, display_name: name || null, city: city || null, state: state || null });
    const r = await supabase.from("user_roles").upsert({ user_id: id, role }, { onConflict: "user_id" });
    setBusy(false);
    if (p.error || r.error) { toast.error("Could not save your profile."); return; }
    navigate({ to: homeFor(role), replace: true });
  };

  const opts = [
    { v: "homeowner" as const, icon: Home, t: "Homeowner", d: "Plan rooftop solar, savings and batteries." },
    { v: "operator" as const, icon: Factory, t: "Solar plant operator", d: "Monitor plants, detect faults, plan maintenance." },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Logo />
      <h1 className="mt-8 text-2xl font-light text-forest">How will you use SolarVerse?</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {opts.map(({ v, icon: I, t, d }) => (
          <button key={v} onClick={() => setRole(v)} className={cn("rounded-lg border bg-card p-5 text-left", role === v ? "border-forest ring-1 ring-forest" : "hover:border-primary")}>
            <I className="h-5 w-5 text-primary" />
            <p className="mt-3 font-medium text-forest">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3"><Label htmlFor="n">Your name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="c">City</Label><Input id="c" value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="s">State</Label><Input id="s" value={state} onChange={(e) => setState(e.target.value)} /></div>
      </div>
      <Button className="mt-8 w-full sm:w-auto" onClick={save} disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
    </div>
  );
}
