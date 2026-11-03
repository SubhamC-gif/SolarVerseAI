// Simulated plant telemetry. No live inverter/SCADA feed is connected, so every
// value here is illustrative and must be labelled as demo data in the UI.

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function plantProfile(id: string, kw: number) {
  const r = hash(id);
  return { pr: 76 + r * 9, soiling: 2 + r * 5, health: 92 + r * 7, kw };
}

export function dayCurve(id: string, kw: number) {
  const p = plantProfile(id, kw);
  return Array.from({ length: 15 }, (_, i) => {
    const h = i + 5;
    const irr = Math.max(0, Math.sin(((h - 6) / 13) * Math.PI)) * 950;
    const expected = (irr / 1000) * kw * 0.85;
    const actual = expected * (p.pr / 85) * (0.95 + hash(id + i) * 0.06);
    return { hour: `${h}:00`, expected: +expected.toFixed(1), actual: +actual.toFixed(1), irradiance: Math.round(irr) };
  });
}

export function monthDays(id: string, kw: number) {
  return Array.from({ length: 30 }, (_, i) => ({
    d: i + 1,
    kwh: Math.round(kw * (4.2 + Math.sin(i / 3) * 0.5 + hash(id + "d" + i) * 0.6 - (hash(id + "c" + i) > 0.88 ? 1.4 : 0))),
  }));
}
