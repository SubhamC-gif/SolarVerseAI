// Demo data for the Plant Management (operator) dashboard.
// All values are illustrative and deterministic (seeded) so the UI is stable
// across reloads — no Math.random() flicker. No external API is used.

export type PanelStatus = "ok" | "underperforming" | "fault" | "offline";

export type Panel = {
  id: string;
  inverter: string;
  string: string;
  status: PanelStatus;
};

export type HourPoint = {
  hour: string;
  powerKw: number;
  irradiance: number;
};

export type DayGeneration = {
  day: number;
  kwh: number;
};

// ---------------------------------------------------------------------------
// Plant configuration
// ---------------------------------------------------------------------------

export const PLANT_NAME = "Demo Plant, Jaipur";
export const PLANT_KWP = 264;
export const PANEL_COUNT = 480;
export const PANEL_WATT = 550;
export const INVERTER_COUNT = 4;
export const STRINGS_PER_INVERTER = 6;
export const PANELS_PER_STRING = 20;

/** Feed-in tariff in Indian Rupees per kWh. */
export const TARIFF_PER_KWH = 7;

export const INVERTERS: string[] = Array.from({ length: INVERTER_COUNT }, (_, i) => `INV-${i + 1}`);

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (mulberry32)
// ---------------------------------------------------------------------------

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Panel inventory (4 inverters x 6 strings x 20 panels = 480 panels)
// ---------------------------------------------------------------------------

export const panels: Panel[] = (() => {
  const rng = makeRng(20240101);
  const list: Panel[] = [];
  for (let i = 1; i <= INVERTER_COUNT; i++) {
    const inverter = `INV-${i}`;
    for (let s = 1; s <= STRINGS_PER_INVERTER; s++) {
      const string = `${inverter}-S${s}`;
      for (let p = 1; p <= PANELS_PER_STRING; p++) {
        const r = rng();
        let status: PanelStatus;
        if (r < 0.88) status = "ok";
        else if (r < 0.94) status = "underperforming";
        else if (r < 0.98) status = "fault";
        else status = "offline";
        list.push({ id: `${string}-P${p}`, inverter, string, status });
      }
    }
  }
  return list;
})();

// ---------------------------------------------------------------------------
// Today's power curve by hour (bell shape, peak ~0.85 of rated near noon)
// ---------------------------------------------------------------------------

export const powerCurve: HourPoint[] = (() => {
  const rng = makeRng(777);
  const points: HourPoint[] = [];
  for (let h = 5; h <= 19; h++) {
    const x = (h - 12) / 5; // half-width ~5 hours
    const bell = Math.exp(-0.5 * x * x);
    const powerKw = Number((PLANT_KWP * 0.85 * bell * (0.92 + rng() * 0.12)).toFixed(2));
    const irradiance = Math.round(1000 * bell);
    points.push({
      hour: `${h.toString().padStart(2, "0")}:00`,
      powerKw,
      irradiance,
    });
  }
  return points;
})();

// ---------------------------------------------------------------------------
// Last 30 days of daily generation (kWh)
// ---------------------------------------------------------------------------

export const dailyGeneration: DayGeneration[] = (() => {
  const rng = makeRng(999);
  const points: DayGeneration[] = [];
  const peak = PLANT_KWP * 5.6; // ~5.6 peak-sun-hours for Jaipur
  for (let i = 0; i < 30; i++) {
    const seasonal = 1 + Math.sin((i / 30) * Math.PI * 2) * 0.08;
    const noise = 0.9 + rng() * 0.2;
    points.push({ day: i + 1, kwh: Math.round(peak * seasonal * noise) });
  }
  return points;
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as Indian Rupees using the Indian numbering system. */
export function formatRupee(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** Summarise panel counts by status. */
export function panelStatusSummary(): Record<PanelStatus, number> {
  const summary: Record<PanelStatus, number> = {
    ok: 0,
    underperforming: 0,
    fault: 0,
    offline: 0,
  };
  for (const p of panels) {
    summary[p.status] += 1;
  }
  return summary;
}
