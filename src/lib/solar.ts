// Preliminary solar estimation model (India-focused). All outputs are illustrative
// estimates based on the assumptions below — not verified site measurements.

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Typical-year relative monthly yield profile for much of India (monsoon dip Jul–Aug).
export const MONTHLY_FACTORS = [0.085, 0.088, 0.097, 0.098, 0.096, 0.078, 0.068, 0.07, 0.077, 0.083, 0.081, 0.079];

export const ASSUMPTIONS = {
  specificYield: 1450, // kWh per kWp per year, typical-year
  panelWatt: 550,
  sqftPerKw: 100, // shadow-free area per kWp
  costPerKw: 55000, // ₹ per kWp, on-grid, indicative
  batteryCostPerKwh: 18000,
  tariff: 8, // ₹ per kWh
  emissionFactor: 0.82, // kg CO₂ per kWh (aligned to standard Indian grid emission factor)
  degradation: 0.005,
  maintenancePerKw: 500,
};

export const DIRECTION_FACTOR: Record<string, number> = {
  South: 1, "South-East": 0.96, "South-West": 0.96, East: 0.86, West: 0.86, North: 0.7, Flat: 0.93,
};
export const SHADING_FACTOR: Record<string, number> = { None: 1, Partial: 0.88, Heavy: 0.72 };

export type AdvisorInput = {
  monthlyUnits: number;
  roofSqft: number;
  direction: string;
  shading: string;
  budget: number;
  battery: boolean;
  tariff: number;
};

export function annualYieldPerKw(direction: string, shading: string) {
  return ASSUMPTIONS.specificYield * (DIRECTION_FACTOR[direction] ?? 1) * (SHADING_FACTOR[shading] ?? 1);
}

export function systemFor(kw: number, input: AdvisorInput) {
  const perKw = annualYieldPerKw(input.direction, input.shading);
  const annual = kw * perKw;
  const panels = Math.ceil((kw * 1000) / ASSUMPTIONS.panelWatt);
  const area = kw * ASSUMPTIONS.sqftPerKw;
  const batteryKwh = input.battery ? Math.round(kw * 2) : 0;
  const cost = kw * ASSUMPTIONS.costPerKw + batteryKwh * ASSUMPTIONS.batteryCostPerKwh;
  const usable = Math.min(annual, input.monthlyUnits * 12 * 1.1);
  const savings = usable * input.tariff - kw * ASSUMPTIONS.maintenancePerKw;
  return {
    kw,
    panels,
    area,
    batteryKwh,
    annual,
    monthly: annual / 12,
    cost,
    savings,
    payback: savings > 0 ? cost / savings : Infinity,
    co2: (annual * ASSUMPTIONS.emissionFactor) / 1000, // tonnes/yr
    fitsRoof: area <= input.roofSqft,
  };
}

const round = (n: number) => Math.max(1, Math.round(n * 2) / 2);

export function recommend(input: AdvisorInput) {
  const perKw = annualYieldPerKw(input.direction, input.shading);
  const needKw = (input.monthlyUnits * 12) / perKw;
  const roofMax = input.roofSqft / ASSUMPTIONS.sqftPerKw;
  const balanced = round(Math.min(needKw, roofMax));
  return {
    budget: systemFor(round(Math.min(balanced * 0.7, input.budget / ASSUMPTIONS.costPerKw || balanced)), input),
    balanced: systemFor(balanced, input),
    high: systemFor(round(Math.min(balanced * 1.3, roofMax)), input),
  };
}

export function monthlySeries(kw: number, perKw = ASSUMPTIONS.specificYield, consumption = 300) {
  return MONTHS.map((m, i) => {
    const gen = kw * perKw * (MONTHLY_FACTORS[i] ?? 0);
    return {
      month: m,
      expected: Math.round(gen),
      optimistic: Math.round(gen * 1.08),
      conservative: Math.round(gen * 0.9),
      consumption,
      export: Math.max(0, Math.round(gen - consumption)),
      import: Math.max(0, Math.round(consumption - gen)),
    };
  });
}

export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");
export const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
