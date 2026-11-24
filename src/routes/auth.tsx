import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthScene } from "@/components/auth-scene";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, homeFor, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  User,
  MapPin,
  Home,
  Factory,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — SolarVerse AI" },
      { name: "description", content: "Sign in or create your SolarVerse AI account." },
      { property: "og:title", content: "Sign in — SolarVerse AI" },
      { property: "og:description", content: "Access your homeowner or solar operator dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(error: unknown, mode: "in" | "up"): string {
  const e = error as { code?: string; message?: string };
  const code = e?.code;
  const msg = (e?.message || "").toLowerCase();

  if (mode === "up") {
    if (
      code === "user_already_exists" ||
      msg.includes("already registered") ||
      msg.includes("already been taken") ||
      msg.includes("unique")
    ) {
      return "This email is already registered. Please sign in.";
    }
    if (
      code === "weak_password" ||
      (msg.includes("password") &&
        (msg.includes("too short") ||
          msg.includes("weak") ||
          msg.includes("at least") ||
          msg.includes("minimum")))
    ) {
      return "Password must be at least 6 characters.";
    }
  }

  if (code === "invalid_email" || msg.includes("invalid email") || msg.includes("valid email")) {
    return "Please enter a valid email address.";
  }
  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid password") ||
    msg.includes("incorrect")
  ) {
    return "Invalid email or password.";
  }
  return (
    e?.message ||
    (mode === "in" ? "Sign in failed. Please try again." : "Sign up failed. Please try again.")
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<AppRole>("homeowner");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const suppressNavRef = useRef(false);

  const goHome = async () => {
    if (suppressNavRef.current) return;
    const r = await getMyRole();
    navigate({ to: r ? homeFor(r) : "/onboarding", replace: true });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goHome();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") goHome();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger the lotus bloom + card fade, then navigate after the animation.
  const triggerSuccess = (to: string) => {
    setSuccess(true);
    setTimeout(() => navigate({ to, replace: true }), 600);
  };

  const spawnRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement("span");
    dot.className = "auth-ripple-dot";
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${e.clientX - rect.left}px`;
    dot.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      setShake(true);
      setTimeout(() => setShake(false), 320);
      return;
    }
    if (mode === "up" && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setShake(true);
      setTimeout(() => setShake(false), 320);
      return;
    }
    if (mode === "up" && !name.trim()) {
      toast.error("Please enter your name.");
      setShake(true);
      setTimeout(() => setShake(false), 320);
      return;
    }

    suppressNavRef.current = true;
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        const r = await getMyRole();
        triggerSuccess(r ? homeFor(r) : "/onboarding");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;

        // signUp returns no session when the email already exists (Supabase
        // returns null silently to avoid account enumeration) or when email
        // confirmation still blocks the session. Fall back to a password
        // sign-in so we always have an active session.
        const isNewAccount = !!data.user;

        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr) {
            throw new Error("This email is already registered. Please sign in.");
          }
        }

        if (isNewAccount && data.user) {
          // Persist role + city alongside the profile the trigger already created.
          const { error: roleErr } = await supabase
            .from("user_roles")
            .upsert({ user_id: data.user.id, role }, { onConflict: "user_id" });
          if (roleErr) throw roleErr;

          const { error: profileErr } = await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: name.trim(),
            city: city.trim() || null,
          });
          if (profileErr) throw profileErr;

          toast.success("Welcome to SolarVerse AI!");
          triggerSuccess(homeFor(role));
        } else {
          // Existing account — route to their actual dashboard.
          toast.success("Welcome back!");
          const r = await getMyRole();
          triggerSuccess(r ? homeFor(r) : "/onboarding");
        }
      }
    } catch (error: unknown) {
      suppressNavRef.current = false;
      console.error("[Auth Error]", error);
      toast.error(mapAuthError(error, mode));
      setShake(true);
      setTimeout(() => setShake(false), 320);
    } finally {
      setBusy(false);
    }
  };

  const roleOptions = [
    {
      v: "homeowner" as const,
      icon: Home,
      t: "Homeowner",
      d: "Plan rooftop solar, savings and batteries.",
    },
    {
      v: "operator" as const,
      icon: Factory,
      t: "Solar plant operator",
      d: "Monitor plants, detect faults, plan maintenance.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070A0D]">
      {/* Animated lotus scene — behind everything */}
      <div className="absolute inset-0">
        <AuthScene success={success} />
      </div>

      {/* Mobile dimming so the card stays readable over the art */}
      <div className="absolute inset-0 bg-[#070A0D]/55 md:hidden" />

      <div className="relative z-10 flex min-h-screen">
        {/* Left: art scene spacer (desktop only) */}
        <div className="hidden md:block md:w-[55%]" aria-hidden />

        {/* Right: login card */}
        <div className="flex w-full items-center justify-center px-4 py-10 sm:px-6 md:w-[45%] lg:px-8">
          <div
            className={cn(
              "auth-card auth-card-border relative w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-[#0D1318]/85 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300",
              shake && "auth-error-shake",
              success && "auth-card-fade-out"
            )}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                <Logo />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {mode === "in" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                The intelligent platform for homeowners and solar plant operators.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {mode === "up" && (
                <div className="auth-field space-y-4" style={{ ["--i" as string]: 0 }}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={busy}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleOptions.map(({ v, icon: I, t, d }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRole(v)}
                        className={cn(
                          "rounded-lg border bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5",
                          role === v ? "border-forest ring-1 ring-forest" : "hover:border-primary",
                        )}
                        disabled={busy}
                      >
                        <I className="h-5 w-5 text-primary" />
                        <p className="mt-3 font-medium text-forest">{t}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="auth-field space-y-2" style={{ ["--i" as string]: mode === "up" ? 1 : 0 }}>
                <Label htmlFor="email">Email address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field space-y-2" style={{ ["--i" as string]: mode === "up" ? 2 : 1 }}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Password</Label>
                  {mode === "in" && (
                    <button type="button" className="auth-link text-xs text-primary font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "up" && (
                <div className="auth-field space-y-2" style={{ ["--i" as string]: 3 }}>
                  <Label htmlFor="city">City</Label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="city"
                      type="text"
                      placeholder="Your city"
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={busy}
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="auth-submit w-full h-11 font-medium text-base transition-all active:scale-[0.97] hover:-translate-y-0.5"
                disabled={busy}
                data-loading={busy}
                onClick={spawnRipple}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <div className="flex items-center">
                    {mode === "in" ? "Sign in" : "Get started"}
                    <ArrowRight className="auth-submit-arrow ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0D1318] px-2 text-muted-foreground">
                    {mode === "in" ? "New to SolarVerse?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full hover:bg-muted transition-colors"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setShowPassword(false);
                }}
                disabled={busy}
              >
                {mode === "in" ? "Create an account" : "Sign in to existing account"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <button className="auth-link underline hover:text-primary">Terms of Service</button> and{" "}
              <button className="auth-link underline hover:text-primary">Privacy Policy</button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
