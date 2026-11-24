import { useEffect, useMemo, useRef } from "react";

/**
 * AuthScene — the animated lotus + eclipse art used behind the login/sign-up card.
 * Pure visual layer: no auth logic. Animates only transform & opacity for 60fps.
 *
 * Layers (back to front):
 *   1. Starfield            (twinkle, parallax depth 4)
 *   2. Mandala rings        (cw + ccw rotation, parallax depth 6)
 *   3. Eclipse rays         (conic gradient, 120s rotation, parallax depth 8)
 *   4. Eclipse disc + corona (pulse, parallax depth 10)
 *   5. Golden lotus         (float + sway + breathe + petal bloom, parallax depth 14)
 *   6. Water line + ripples (parallax depth 8)
 *   7. Lotus reflection     (flipped, 15% opacity, masked)
 *   8. Fireflies            (drift up, parallax depth 6)
 */
export function AuthScene({ success = false }: { success?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Generate stable random positions once.
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        left: `${(i * 13.7 + (i % 7) * 3.1) % 100}%`,
        top: `${(i * 7.3 + (i % 11) * 1.7) % 100}%`,
        size: i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.5 : 1,
        dur: `${3 + (i % 4)}s`,
        delay: `${(i * 0.37) % 5}s`,
      })),
    [],
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        left: `${(i * 3.3 + (i % 5) * 7) % 100}%`,
        size: i % 3 === 0 ? 3 : 2,
        dur: `${12 + (i % 14)}s`,
        delay: `${(i * 0.8) % 20}s`,
        drift: `${(i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 12)}px`,
      })),
    [],
  );

  // Parallax: smoothed cursor offset stored as --px / --py on the root.
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

    // Pause ambient animation when tab hidden.
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
    <div ref={rootRef} className={`auth-scene ${success ? "auth-success" : ""}`} aria-hidden>
      {/* 1. Starfield */}
      <div className="auth-layer" style={{ ["--depth" as string]: "4px" }}>
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

      {/* 2. Mandala rings (outer CW, inner CCW) */}
      <div className="auth-layer" style={{ ["--depth" as string]: "6px" }}>
        <div className="auth-mandala auth-mandala-outer" style={{ width: 720, height: 720 }}>
          <Mandala size={720} />
        </div>
      </div>
      <div className="auth-layer" style={{ ["--depth" as string]: "6px" }}>
        <div className="auth-mandala auth-mandala-inner" style={{ width: 520, height: 520 }}>
          <Mandala size={520} />
        </div>
      </div>

      {/* 3. Eclipse rays */}
      <div className="auth-layer" style={{ ["--depth" as string]: "8px" }}>
        <div className="auth-rays" />
      </div>

      {/* 4. Eclipse disc + corona */}
      <div className="auth-layer" style={{ ["--depth" as string]: "10px" }}>
        <div className="auth-eclipse">
          <div className="auth-eclipse-disc" />
        </div>
      </div>

      {/* 5. Golden lotus (surrounds the eclipse) */}
      <div className="auth-layer" style={{ ["--depth" as string]: "14px" }}>
        <div className="auth-lotus-wrap">
          <div className="auth-lotus-float">
            <div className="auth-lotus-sway">
              <div className="auth-lotus-glow">
                <Lotus />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Water line + ripples */}
      <div
        className="auth-layer"
        style={{ ["--depth" as string]: "8px", top: "62%", left: 0, right: 0 }}
      >
        <div className="auth-water-line" />
        <div style={{ position: "relative", height: 0 }}>
          {[0, 2, 4].map((d) => (
            <span key={d} className="auth-ripple" style={{ ["--delay" as string]: `${d}s` }} />
          ))}
        </div>
      </div>

      {/* 7. Lotus reflection (below water line) */}
      <div
        className="auth-layer"
        style={{ ["--depth" as string]: "10px", top: "66%", left: 0, right: 0 }}
      >
        <div className="auth-reflection">
          <Lotus reflection />
        </div>
      </div>

      {/* 8. Fireflies */}
      <div className="auth-layer" style={{ ["--depth" as string]: "6px", inset: 0 }}>
        {fireflies.map((f, i) => (
          <span
            key={i}
            className="auth-firefly"
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
    </div>
  );
}

/** Decorative golden mandala ring (inline SVG — the webp asset is a stub). */
function Mandala({ size }: { size: number }) {
  const r = size / 2;
  const dots = Array.from({ length: 24 }).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return { x: r + Math.cos(a) * (r * 0.86), y: r + Math.sin(a) * (r * 0.86) };
  });
  const petals = Array.from({ length: 16 }).map((_, i) => (i / 16) * 360);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <radialGradient id={`mg-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#FFC21A" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFC21A" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle
        cx={r}
        cy={r}
        r={r * 0.92}
        fill="none"
        stroke="#FFC21A"
        strokeWidth="0.6"
        opacity="0.5"
      />
      <circle
        cx={r}
        cy={r}
        r={r * 0.78}
        fill="none"
        stroke="#FFC21A"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="1.6" fill="#FFC21A" opacity="0.8" />
      ))}
      <g transform={`translate(${r} ${r})`}>
        {petals.map((a, i) => (
          <path
            key={i}
            d={`M 0 ${-r * 0.72} C ${-r * 0.06} ${-r * 0.6}, ${-r * 0.06} ${-r * 0.5}, 0 ${-r * 0.42} C ${r * 0.06} ${-r * 0.5}, ${r * 0.06} ${-r * 0.6}, 0 ${-r * 0.72} Z`}
            fill="none"
            stroke="#FFC21A"
            strokeWidth="0.7"
            opacity="0.55"
            transform={`rotate(${a})`}
          />
        ))}
      </g>
    </svg>
  );
}

/** Golden lotus drawn as two rings of SVG petals around the center. */
function Lotus({ reflection = false }: { reflection?: boolean }) {
  const outer = Array.from({ length: 12 }).map((_, i) => (i / 12) * 360);
  const inner = Array.from({ length: 8 }).map((_, i) => (i / 8) * 360 + 22.5);
  const suffix = reflection ? "-ref" : "";
  const idGold = `lotus-gold${suffix}`;
  const idGoldInner = `lotus-gold-inner${suffix}`;

  return (
    <svg
      width="460"
      height="460"
      viewBox="-230 -230 460 460"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={idGold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="45%" stopColor="#FFC21A" />
          <stop offset="100%" stopColor="#C98A0E" />
        </linearGradient>
        <linearGradient id={idGoldInner} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE680" />
          <stop offset="100%" stopColor="#E0A814" />
        </linearGradient>
      </defs>

      {/* outer ring — larger petals */}
      {outer.map((a, i) => (
        <path
          key={`o-${i}`}
          className="auth-lotus-petal"
          d="M 0 0 C -13 -30, -9 -68, 0 -96 C 9 -68, 13 -30, 0 0 Z"
          fill={`url(#${idGold})`}
          stroke="#B8860B"
          strokeWidth="0.6"
          style={{
            ["--rot" as string]: `${a}deg`,
            ["--i" as string]: i,
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
          }}
        />
      ))}

      {/* inner ring — smaller petals, offset */}
      {inner.map((a, i) => (
        <path
          key={`i-${i}`}
          className="auth-lotus-petal"
          d="M 0 0 C -9 -22, -6 -50, 0 -70 C 6 -50, 9 -22, 0 0 Z"
          fill={`url(#${idGoldInner})`}
          stroke="#C9941A"
          strokeWidth="0.5"
          style={{
            ["--rot" as string]: `${a}deg`,
            ["--i" as string]: i + 12,
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
          }}
        />
      ))}
    </svg>
  );
}
