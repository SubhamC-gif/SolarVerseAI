import { useEffect, useState } from "react";

const CINEMATIC_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

export function useCinematicMode() {
  const [cinematic, setCinematic] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(CINEMATIC_QUERY);
    const sync = () => setCinematic(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return cinematic;
}
