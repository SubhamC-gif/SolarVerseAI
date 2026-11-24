import { useEffect, useMemo, useRef } from "react";

const eclipseArt =
  "https://cdn.builder.io/api/v1/image/assets%2F93aaeeb2b96346949a27773e04861c15%2Ff55f2aa1496e4540a264905c001afccb?format=webp&width=800&height=1200";
const lotusArt =
  "https://cdn.builder.io/api/v1/image/assets%2F93aaeeb2b96346949a27773e04861c15%2Fa8248ef4b3ed4647b6b8bf32e986d2e5?format=webp&width=800&height=1200";

/**
 * AuthScene — the reference artwork (eclipse + petal flower + lotus bloom)
 * with motion layered on top. Pure visual layer: no auth logic.
 *
 * Layers (back to front):
 *   1. Navy base + vignette
 *   2. Starfield            (twinkle, parallax depth 6)
 *   3. Artwork plate        (static, edges feathered, parallax depth 10)
 *   4. Counter-rotating rays
 *   5. Rotating petal flower (80s clockwise around the still eclipse)
 *   6. Pulsing corona
 *   7. Lotus bloom          (rock + float + breathe, rotating light ring)
 *   8. Water ripples
 *   9. Dust motes + shooting star
 *
 * Only transform & opacity are animated for 60fps.
 */
export function AuthScene({ success = false }: { success?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Stable pseudo-random positions, generated once.
  const stars = useMemo(
    () =>
      Array.from({ length: 72 }).map((_, i) => ({
        left: `${(i * 13.7 + (i % 7) * 3.1) % 100}%`,
        top: `${(i * 7.3 + (i % 11) * 1.7) % 100}%`,
        size: i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.5 : 1,
        dur: `${3 + (i % 4)}s`,
        delay: `${(i * 0.37) % 5}s`,
      })),
    [],
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        left: `${(i * 3.3 + (i % 5) * 7) % 100}%`,
        size: i % 3 === 0 ? 3 : 2,
        dur: `${13 + (i % 14)}s`,
        delay: `${(i * 0.8) % 20}s`,
        drift: `${(i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 12)}px`,
      })),
    [],
  );

  // Desktop parallax: smoothed cursor offset stored as --px / --py on the root.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile =
      window.innerWidth < 768 ||
      (navigator as { hardwareConcurrency?: number }).hardwareConcurrency! <= 4;
    if (isMobile) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      root.style.setProperty("--px", currentX.toFixed(4));
      root.style.setProperty("--py", currentY.toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Pause ambient animation when the tab is hidden.
    const onVis = () => {
      document.documentElement.setAttribute(
        "data-scene-paused",
        document.hidden ? "true" : "false",
      );
    };
    onVis();

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.removeAttribute("data-scene-paused");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`auth-scene ${success ? "auth-success" : ""}`}
      style={{
        ["--art" as string]: `url("${eclipseArt}")`,
        ["--lotus-art" as string]: `url("${lotusArt}")`,
      }}
      aria-hidden
    >
      {/* 1. Navy base + vignette */}
      <div className="auth-bg" />

      {/* 2. Starfield */}
      <div className="auth-layer" style={{ ["--depth" as string]: "6px" }}>
        {stars.map((s, i) => (
          <span
            key={i}
            className="auth-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              ["--dur" as string]: s.dur,
              ["--delay" as string]: s.delay,
            }}
          />
        ))}
      </div>

      {/* 3-8. The artwork itself */}
      <div className="auth-layer" style={{ ["--depth" as string]: "10px" }}>
        <div className="auth-art-box">
          <div className="auth-art-base" />
          <div className="auth-art-rays" />
          <div className="auth-art-flower" />
          <div className="auth-art-corona" />
          <div className="auth-art-lotus-ring" />
          <div className="auth-art-lotus-float">
            <div className="auth-art-lotus" />
          </div>
          <div className="auth-art-lotus-glow" />
          {[0, 2, 4].map((d) => (
            <span key={d} className="auth-ripple" style={{ ["--delay" as string]: `${d}s` }} />
          ))}
        </div>
      </div>

      {/* 9. Dust motes drifting up */}
      <div className="auth-layer" style={{ ["--depth" as string]: "6px", inset: 0 }}>
        {motes.map((f, i) => (
          <span
            key={i}
            className="auth-mote"
            style={{
              left: f.left,
              width: f.size,
              height: f.size,
              ["--dur" as string]: f.dur,
              ["--delay" as string]: f.delay,
              ["--drift" as string]: f.drift,
            }}
          />
        ))}
      </div>

      {/* Occasional shooting star */}
      <span className="auth-shooting-star" />
    </div>
  );
}
