// Motion tokens & Live Theme Background for SolarVerse AI
import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type MotionMode = "full" | "calm" | "off";
export const MOTION_STORAGE_KEY = "solarverse_motion_mode";

export function getMotionPreference(): MotionMode {
  if (typeof window === "undefined") return "full";
  try {
    const saved = localStorage.getItem(MOTION_STORAGE_KEY);
    if (saved === "full" || saved === "calm" || saved === "off") return saved;
    // Auto calm on mobile or low-power devices, off on prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";
    if (window.innerWidth < 768 || (navigator as { hardwareConcurrency?: number }).hardwareConcurrency! < 4) {
      return "calm";
    }
  } catch (e) {
    // fallback
  }
  return "full";
}

export function setMotionPreference(mode: MotionMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, mode);
    document.documentElement.setAttribute("data-motion", mode);
    window.dispatchEvent(new Event("motion-mode-change"));
  } catch (e) {}
}

export function useMotionMode() {
  const [mode, setMode] = useState<MotionMode>("full");

  useEffect(() => {
    const current = getMotionPreference();
    setMode(current);
    document.documentElement.setAttribute("data-motion", current);

    const onMotionChange = () => setMode(getMotionPreference());
    window.addEventListener("motion-mode-change", onMotionChange);
    return () => window.removeEventListener("motion-mode-change", onMotionChange);
  }, []);

  return { mode, setMode: setMotionPreference };
}

// Live Theme Ambient Background:
// Light Mode: Slowly rotating golden sun-ray burst (120s), drifting green/amber blobs
// Dark Mode: Slowly rotating dark gold mandala + counter-rotating second layer, 35 CSS-only floating golden particles
export function LiveBackground() {
  const { mode } = useMotionMode();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (mode === "off") {
    return <div className="fixed inset-0 pointer-events-none -z-50 bg-background" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-50">
      {/* Light Mode: Sun-ray burst and drifting emerald/gold organic blobs */}
      {!isDark ? (
        <div className="relative h-full w-full">
          {/* Subtle 120s rotating golden sun ray burst */}
          <div
            className="absolute -top-[30%] -right-[20%] h-[160vh] w-[160vh] opacity-20 pointer-events-none animate-sun-burst-120s"
            style={{
              background: "conic-gradient(from 0deg at 50% 50%, rgba(255, 194, 26, 0.15) 0deg, transparent 20deg, rgba(10, 122, 79, 0.1) 40deg, transparent 60deg, rgba(255, 194, 26, 0.15) 90deg, transparent 110deg, rgba(10, 122, 79, 0.1) 140deg, transparent 160deg, rgba(255, 194, 26, 0.15) 180deg, transparent 200deg, rgba(10, 122, 79, 0.1) 230deg, transparent 250deg, rgba(255, 194, 26, 0.15) 270deg, transparent 290deg, rgba(10, 122, 79, 0.1) 320deg, transparent 340deg, rgba(255, 194, 26, 0.15) 360deg)",
            }}
          />

          {/* Drifting blurred green/amber blobs */}
          <div className="absolute top-1/4 left-10 h-96 w-96 rounded-full bg-emerald-600/10 blur-[100px] animate-blob-drift-1" />
          <div className="absolute top-2/3 right-20 h-80 w-80 rounded-full bg-amber-400/10 blur-[90px] animate-blob-drift-2" />
        </div>
      ) : (
        /* Dark Mode: Dual rotating mandalas + 35 floating golden ember particles */
        <div className="relative h-full w-full">
          {/* Slowly rotating dark gold mandala (60s clockwise) */}
          <div
            className="absolute -top-32 -right-32 h-[800px] w-[800px] opacity-15 pointer-events-none animate-mandala-rotate"
            style={{
              backgroundImage: "url('/dark-gold-mandala.webp')",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Second layer counter-rotating (90s counter-clockwise) */}
          <div
            className="absolute -top-16 -right-16 h-[650px] w-[650px] opacity-10 pointer-events-none animate-mandala-counter-rotate"
            style={{
              backgroundImage: "url('/dark-gold-mandala.webp')",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* 35 CSS-only golden floating particles */}
          {mode === "full" && (
            <div className="absolute inset-0">
              {Array.from({ length: 35 }).map((_, i) => {
                const left = `${(i * 2.8 + (i % 5) * 4) % 100}%`;
                const delay = `${((i * 1.7) % 14).toFixed(1)}s`;
                const duration = `${(12 + (i % 7) * 3)}s`;
                const size = i % 3 === 0 ? "h-1 w-1" : i % 2 === 0 ? "h-1.5 w-1.5" : "h-0.5 w-0.5";
                return (
                  <div
                    key={i}
                    className={`absolute bottom-0 rounded-full bg-amber-400 opacity-60 shadow-[0_0_6px_rgba(255,194,26,0.8)] animate-particle-float ${size}`}
                    style={{
                      left,
                      animationDuration: duration,
                      animationDelay: delay,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Surface contrast overlay preserving strict WCAG AA readability */}
      <div className="absolute inset-0 bg-background/80 dark:bg-background/88 backdrop-blur-[1px]" />
      <div className="live-atmosphere absolute inset-0" aria-hidden="true">
        <div className="live-atmosphere-glow live-atmosphere-glow-one" />
        <div className="live-atmosphere-glow live-atmosphere-glow-two" />
        <div className="live-atmosphere-grid" />
      </div>
    </div>
  );
}
