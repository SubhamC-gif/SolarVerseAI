// Shared Solar store and unified calculation model for SolarVerse AI
// Single source of truth across all Homeowner views, Settings, and Reports.

import { useState, useEffect } from "react";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export interface CityProfile {
  name: string;
  state: string;
  avgSunHours: number; // Daily average peak sun hours (h/day)
  monthlySunScale: number[]; // 12-month relative multiplier (mean ≈ 1.0)
  description: string;
}

// Indian cities with solar insolation profiles (Kolkata as default with typical monsoon dip Jun-Sep)
export const CITIES_DATA: Record<string, CityProfile> = {
  Kolkata: {
    name: "Kolkata",
    state: "West Bengal",
    avgSunHours: 4.8,
    // Strong winter/spring sunshine (Feb-May), monsoon drop (Jun-Sep), autumn recovery (Oct-Nov)
    monthlySunScale: [0.98, 1.10, 1.18, 1.15, 1.08, 0.82, 0.73, 0.77, 0.85, 1.02, 1.12, 1.00],
    description: "East India profile with pronounced monsoon dip June–Sept and high winter/spring clearness index",
  },
  Bengaluru: {
    name: "Bengaluru",
    state: "Karnataka",
    avgSunHours: 5.3,
    monthlySunScale: [1.08, 1.14, 1.18, 1.12, 1.02, 0.85, 0.78, 0.82, 0.92, 0.98, 1.02, 1.05],
    description: "Deccan plateau profile with high baseline year-round insolation",
  },
  Delhi: {
    name: "Delhi",
    state: "NCR",
    avgSunHours: 5.1,
    monthlySunScale: [0.88, 1.02, 1.18, 1.22, 1.20, 1.05, 0.80, 0.82, 0.98, 1.05, 0.92, 0.82],
    description: "Northern plains with high summer insolation and winter haze reduction",
  },
  Mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    avgSunHours: 5.0,
    monthlySunScale: [1.08, 1.16, 1.20, 1.22, 1.18, 0.75, 0.58, 0.62, 0.82, 1.08, 1.12, 1.09],
    description: "Coastal Western profile with sharp July–August monsoon suppression",
  },
  Chennai: {
    name: "Chennai",
    state: "Tamil Nadu",
    avgSunHours: 5.4,
    monthlySunScale: [1.02, 1.12, 1.18, 1.20, 1.14, 1.02, 0.96, 0.95, 0.94, 0.82, 0.78, 0.85],
    description: "Coromandel coast with retreat/northeast monsoon dip in Oct–Nov",
  },
  Hyderabad: {
    name: "Hyderabad",
    state: "Telangana",
    avgSunHours: 5.4,
    monthlySunScale: [1.06, 1.14, 1.20, 1.18, 1.12, 0.88, 0.78, 0.80, 0.90, 1.02, 1.04, 1.02],
    description: "Central plateau with dependable generation from October through May",
  },
  Ahmedabad: {
    name: "Ahmedabad",
    state: "Gujarat",
    avgSunHours: 5.6,
    monthlySunScale: [1.02, 1.12, 1.20, 1.22, 1.20, 0.98, 0.72, 0.70, 0.88, 1.10, 1.08, 1.00],
    description: "Semi-arid western region with some of India's highest annual irradiance",
  },
  Pune: {
    name: "Pune",
    state: "Maharashtra",
    avgSunHours: 5.4,
    monthlySunScale: [1.06, 1.14, 1.20, 1.20, 1.15, 0.84, 0.70, 0.72, 0.88, 1.04, 1.06, 1.03],
    description: "Western Maharashtra plateau with strong generation except peak monsoon",
  },
  Jaipur: {
    name: "Jaipur",
    state: "Rajasthan",
    avgSunHours: 5.6,
    monthlySunScale: [0.95, 1.08, 1.20, 1.24, 1.22, 1.08, 0.82, 0.78, 0.96, 1.08, 1.02, 0.93],
    description: "Desert adjacent with high solar yield throughout the year",
  },
};

export const DEFAULT_CITY = "Kolkata";
export const CITIES = Object.keys(CITIES_DATA);

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Fixed system constants aligned across the application
export const SHARED_SOLAR_CONSTANTS = {
  performanceRatio: 0.78, // Losses from heat, dust, wiring, inverter
  gridCo2Factor: 0.82, // kg CO2 avoided per kWh
  degradationRate: 0.005, // 0.5% per year
  coalKgPerKwh: 0.44, // kg coal displaced per kWh
  treeCo2KgPerYear: 21, // kg CO2 sequestered per tree/yr
  sqftPerKw: 100, // shadow-free sqft needed per kW
  defaultTariff: 8, // ₹ per kWh
  defaultCostPerKw: 55000, // ₹ per kW installed
  defaultRoofArea: 600, // sq ft
  defaultKw: 3, // kW system size
  defaultMonthlyBill: 2800, // ₹/month
  panelWatt: 550, // Watts per panel
};

export interface SolarSettings {
  city: string;
  roofArea: number; // sq ft
  systemSizeKw: number; // kW
  monthlyBill: number; // ₹
  tariff: number; // ₹/unit
  performanceRatio: number; // e.g. 0.78
  gridCo2Factor: number; // kg/kWh (0.82)
  degradation: number; // 0.005
  costPerKw: number; // ₹
  roofType: "flat" | "sloped";
  shading: "none" | "low" | "high";
  direction: "South" | "South-East" | "South-West" | "East" | "West" | "North" | "Flat";
}

export const DEFAULT_SOLAR_SETTINGS: SolarSettings = {
  city: DEFAULT_CITY,
  roofArea: SHARED_SOLAR_CONSTANTS.defaultRoofArea,
  systemSizeKw: SHARED_SOLAR_CONSTANTS.defaultKw,
  monthlyBill: SHARED_SOLAR_CONSTANTS.defaultMonthlyBill,
  tariff: SHARED_SOLAR_CONSTANTS.defaultTariff,
  performanceRatio: SHARED_SOLAR_CONSTANTS.performanceRatio,
  gridCo2Factor: SHARED_SOLAR_CONSTANTS.gridCo2Factor,
  degradation: SHARED_SOLAR_CONSTANTS.degradationRate,
  costPerKw: SHARED_SOLAR_CONSTANTS.defaultCostPerKw,
  roofType: "flat",
  shading: "none",
  direction: "South",
};

const STORAGE_KEY = "solarverse_user_settings_v1";

// In-memory state and listeners for instant reactive cross-component updates
let currentSettings: SolarSettings = { ...DEFAULT_SOLAR_SETTINGS };
const listeners = new Set<(s: SolarSettings) => void>();

// Load from localStorage if present
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentSettings = { ...DEFAULT_SOLAR_SETTINGS, ...parsed };
      // Ensure city exists in our city dataset
      if (!CITIES_DATA[currentSettings.city]) {
        currentSettings.city = DEFAULT_CITY;
      }
    }
  } catch (e) {
    console.error("Failed to load solar settings from localStorage", e);
  }
}

export function getSolarSettings(): SolarSettings {
  return currentSettings;
}

export function updateSolarSettings(updates: Partial<SolarSettings>): SolarSettings {
  currentSettings = { ...currentSettings, ...updates };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch (e) {
      console.error("Failed to persist solar settings", e);
    }
  }
  listeners.forEach((fn) => fn(currentSettings));
  return currentSettings;
}

export function resetSolarSettings(): SolarSettings {
  currentSettings = { ...DEFAULT_SOLAR_SETTINGS };
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to reset solar settings", e);
    }
  }
  listeners.forEach((fn) => fn(currentSettings));
  return currentSettings;
}

export function useSolarStore() {
  const [settings, setSettings] = useState<SolarSettings>(currentSettings);

  useEffect(() => {
    const onChange = (next: SolarSettings) => setSettings({ ...next });
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const update = (partial: Partial<SolarSettings>) => {
    return updateSolarSettings(partial);
  };

  const calculations = calculateSolarMetrics(settings);

  return {
    settings,
    update,
    reset: resetSolarSettings,
    calculations,
    cityProfile: CITIES_DATA[settings.city] ?? CITIES_DATA[DEFAULT_CITY]!,
  };
}

// ---------------------------------------------------------------------------
// UNIFIED CALCULATION ENGINE
// Guarantees exact parity across Overview, Forecast, Savings & ROI, Potential, Impact
// ---------------------------------------------------------------------------

export const ROOF_USABILITY_FACTOR: Record<string, number> = { flat: 0.7, sloped: 0.85 };
export const SHADING_REDUCTION_FACTOR: Record<string, number> = { none: 1, low: 0.9, high: 0.72 };
export const DIRECTION_FACTOR: Record<string, number> = {
  South: 1,
  "South-East": 0.96,
  "South-West": 0.96,
  East: 0.86,
  West: 0.86,
  North: 0.7,
  Flat: 0.93,
};

export interface MonthlyMetric {
  month: string;
  days: number;
  sunHours: number; // Daily avg peak sun hours this month
  expected: number; // kWh generated
  savings: number; // ₹ savings
  consumption: number; // Estimated consumption kWh
  exportKwh: number;
  importKwh: number;
}

export interface UnifiedSolarMetrics {
  city: string;
  sunHours: number; // Daily avg
  yieldPerKw: number; // Specific annual yield kWh/kWp/yr
  annualGenerationKwh: number; // Total annual kWh
  monthlyGenerationKwh: number; // Average monthly kWh
  usableRoofArea: number; // shadow-free sq ft
  maxInstallableKw: number; // kW
  panelsCount: number; // Physical panel count at panelWatt
  
  // Financials
  annualElectricityUnits: number; // From bill / tariff
  offsetUnitsKwh: number;
  yearlySavings: number; // ₹
  grossCost: number; // ₹
  netCost: number; // ₹ (with subsidy)
  paybackYears: number; // Years
  lifetime25YearSavings: number; // ₹ with degradation
  
  // Environmental
  yearlyCo2AvoidedKg: number;
  lifetimeCo2AvoidedTonnes: number;
  yearlyTreesEquivalent: number;
  lifetimeTreesEquivalent: number;
  yearlyCoalSavedKg: number;
  
  // 12-Month Series
  monthlySeries: MonthlyMetric[];
  peakMonth: string;
  lowestMonth: string;
}

export function calculateSolarMetrics(settings: SolarSettings, customKw?: number, customSubsidy = 0): UnifiedSolarMetrics {
  const cityProf = CITIES_DATA[settings.city] ?? CITIES_DATA[DEFAULT_CITY]!;
  const kw = customKw !== undefined ? customKw : settings.systemSizeKw;
  
  const roofFactor = ROOF_USABILITY_FACTOR[settings.roofType] ?? 0.7;
  const shadeFactor = SHADING_REDUCTION_FACTOR[settings.shading] ?? 1.0;
  const dirFactor = DIRECTION_FACTOR[settings.direction] ?? 1.0;
  
  // Shadow-free usable roof area
  const usableRoofArea = Math.round(settings.roofArea * roofFactor);
  // Max possible KW based on 100 sqft/kW rule
  const maxInstallableKw = Math.max(0.5, Math.round((usableRoofArea / SHARED_SOLAR_CONSTANTS.sqftPerKw) * 10) / 10);
  
  // Specific Yield (kWh per kWp per year)
  // Base formula: SunHours * 365 * PerformanceRatio * OrientationFactor * ShadingFactor
  const effectiveSunHours = cityProf.avgSunHours;
  const yieldPerKw = Math.round(effectiveSunHours * 365 * settings.performanceRatio * dirFactor * shadeFactor);
  
  // Annual generation
  const annualGenerationKwh = Math.round(kw * yieldPerKw);
  const monthlyGenerationKwh = Math.round(annualGenerationKwh / 12);
  const panelsCount = Math.ceil((kw * 1000) / SHARED_SOLAR_CONSTANTS.panelWatt);
  
  // Consumption from monthly bill
  const monthlyConsumptionUnits = settings.tariff > 0 ? Math.round(settings.monthlyBill / settings.tariff) : 350;
  const annualElectricityUnits = monthlyConsumptionUnits * 12;
  
  // Net offsetting
  const offsetUnitsKwh = Math.min(annualGenerationKwh, annualElectricityUnits);
  const yearlySavings = Math.round(offsetUnitsKwh * settings.tariff);
  
  // Costs & Payback
  const grossCost = Math.round(kw * settings.costPerKw);
  const netCost = Math.max(0, grossCost - customSubsidy);
  const paybackYears = yearlySavings > 0 && netCost > 0 ? Number((netCost / yearlySavings).toFixed(1)) : 0;
  
  // 25-Year Cumulative Savings with 0.5% yearly degradation
  let cumulativeSavings = 0;
  for (let year = 0; year < 25; year++) {
    const degradedGen = offsetUnitsKwh * Math.pow(1 - settings.degradation, year);
    cumulativeSavings += degradedGen * settings.tariff;
  }
  const lifetime25YearSavings = Math.round(cumulativeSavings);
  
  // Environmental
  const yearlyCo2AvoidedKg = Math.round(annualGenerationKwh * settings.gridCo2Factor);
  const yearlyCoalSavedKg = Math.round(annualGenerationKwh * SHARED_SOLAR_CONSTANTS.coalKgPerKwh);
  const yearlyTreesEquivalent = Math.round(yearlyCo2AvoidedKg / SHARED_SOLAR_CONSTANTS.treeCo2KgPerYear);
  
  let cumulativeCo2Kg = 0;
  for (let year = 0; year < 25; year++) {
    cumulativeCo2Kg += annualGenerationKwh * Math.pow(1 - settings.degradation, year) * settings.gridCo2Factor;
  }
  const lifetimeCo2AvoidedTonnes = Math.round(cumulativeCo2Kg / 1000);
  const lifetimeTreesEquivalent = Math.round(cumulativeCo2Kg / (SHARED_SOLAR_CONSTANTS.treeCo2KgPerYear * 25));
  
  // 12-month series
  let peakExpected = -1;
  let peakMonth: string = MONTHS[0] ?? "Jan";
  let lowestExpected = Infinity;
  let lowestMonth: string = MONTHS[0] ?? "Jan";
  
  const monthlySeries: MonthlyMetric[] = MONTHS.map((month, i) => {
    const scale = cityProf.monthlySunScale[i] ?? 1.0;
    const monthSun = Number((cityProf.avgSunHours * scale).toFixed(1));
    const days = DAYS_IN_MONTH[i] ?? 30;
    // Monthly generation = kw * dailySunHours * days * PR * dir * shade
    const expected = Math.round(kw * monthSun * days * settings.performanceRatio * dirFactor * shadeFactor);
    const monthOffset = Math.min(expected, monthlyConsumptionUnits);
    const savings = Math.round(monthOffset * settings.tariff);
    const exportKwh = Math.max(0, expected - monthlyConsumptionUnits);
    const importKwh = Math.max(0, monthlyConsumptionUnits - expected);
    
    if (expected > peakExpected) {
      peakExpected = expected;
      peakMonth = month;
    }
    if (expected < lowestExpected) {
      lowestExpected = expected;
      lowestMonth = month;
    }
    
    return {
      month,
      days,
      sunHours: monthSun,
      expected,
      savings,
      consumption: monthlyConsumptionUnits,
      exportKwh,
      importKwh,
    };
  });
  
  return {
    city: settings.city,
    sunHours: cityProf.avgSunHours,
    yieldPerKw,
    annualGenerationKwh,
    monthlyGenerationKwh,
    usableRoofArea,
    maxInstallableKw,
    panelsCount,
    annualElectricityUnits,
    offsetUnitsKwh,
    yearlySavings,
    grossCost,
    netCost,
    paybackYears,
    lifetime25YearSavings,
    yearlyCo2AvoidedKg,
    lifetimeCo2AvoidedTonnes,
    yearlyTreesEquivalent,
    lifetimeTreesEquivalent,
    yearlyCoalSavedKg,
    monthlySeries,
    peakMonth,
    lowestMonth,
  };
}
