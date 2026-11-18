import { useLayoutEffect, useRef } from "react";
import { useCinematicMode } from "./use-cinematic-mode";
import { Reveal } from "./reveal";

const frameModules = import.meta.glob<string>("@/assets/scroll-frames/*.webp", {
  eager: true,
  import: "default",
});

const FRAME_URLS = Object.keys(frameModules)
  .sort()
  .map((key) => frameModules[key]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function FrameScroll() {
  const cinematic = useCinematicMode();
  return cinematic ? <CinematicFrames /> : <StaticFrames />;
}

function StaticFrames() {
  return (
    <section
      aria-label="Solar intelligence gallery"
      className="bg-stage px-6 py-24 text-stage-foreground"
    >
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FRAME_URLS.map((src, i) => (
          <Reveal key={src} delay={(i % 4) * 80}>
            <img
              src={src}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full rounded-xl border border-stage-foreground/10 object-cover"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CinematicFrames() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const last = FRAME_URLS.length - 1;

    const render = (p: number) => {
      const pos = p * last;
      frameRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = clamp(i - pos, -1, 1);
        el.style.opacity = String(clamp01(1 - Math.abs(d)));
        el.style.transform = `translate3d(0, ${d * 48}px, 0) scale(${1 - 0.05 * Math.abs(d)})`;
      });
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(pos) + 1).padStart(2, "0");
      }
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const total = section.offsetHeight - window.innerHeight;
      render(total > 0 ? clamp01(-section.getBoundingClientRect().top / total) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Solar intelligence gallery"
      className="relative h-[300vh] bg-stage text-stage-foreground"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-stage-accent">Scroll to explore</p>
          <h2 className="mt-3 text-3xl font-light tracking-tight md:text-4xl">
            Solar intelligence, frame by frame.
          </h2>
        </div>
        <div className="relative mt-10 aspect-[16/9] w-full max-w-5xl">
          {FRAME_URLS.map((src, i) => (
            <img
              key={src}
              ref={(el) => {
                frameRefs.current[i] = el;
              }}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full rounded-2xl border border-stage-foreground/10 object-contain will-change-transform"
              style={{ opacity: i === 0 ? 1 : 0 }}
            />
          ))}
        </div>
        <p className="mt-6 text-sm tabular-nums text-stage-muted">
          <span ref={counterRef}>01</span> / {String(FRAME_URLS.length).padStart(2, "0")}
        </p>
      </div>
    </section>
  );
}
