import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, homeFor } from "@/lib/auth";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

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

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const goHome = async () => {
    const role = await getMyRole();
    navigate({ to: role ? homeFor(role) : "/onboarding", replace: true });
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    
    setBusy(true);
    try {
      const cleanEmail = email.trim();
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setSent(true);
        toast.success("Verification email sent!");
      }
    } catch (error: any) {
      console.error('[Auth Error]', error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/20 px-4 py-10 sm:px-6 lg:px-8 ${mode === "in" ? "auth-login" : "auth-signup"}`}
    >
      <div key={mode} className="auth-bg" aria-hidden>
        {mode === "in" ? (
          <>
            <div className="auth-blob auth-blob-a" />
            <div className="auth-blob auth-blob-b" />
          </>
        ) : (
          <>
            <div className="auth-rays" />
            <div className="auth-sun" />
          </>
        )}
      </div>
      <div className="relative z-10 w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border shadow-xl transition-all duration-300">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
            <Logo />
          </div>
          <h1
            key={mode}
            className={`text-3xl font-semibold tracking-tight text-foreground ${mode === "in" ? "auth-title-login" : "auth-title-signup"}`}
          >
            {mode === "in" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            The intelligent platform for homeowners and solar plant operators.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-primary/5 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Check your email</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                Please confirm your account to continue.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSent(false)}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Password</Label>
                  {mode === "in" && (
                    <button type="button" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="pw"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-medium text-base transition-all active:scale-[0.98]"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center">
                  {mode === "in" ? "Sign in" : "Get started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  New to SolarVerse?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full hover:bg-muted transition-colors"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setSent(false);
              }}
            >
              {mode === "in" ? "Create an account" : "Sign in to existing account"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <button className="underline hover:text-primary">Terms of Service</button> and{" "}
          <button className="underline hover:text-primary">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
}
