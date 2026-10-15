// Deterministic solar estimate math. No LLM involved: every number here is
// reproducible from the inputs, so estimates can be audited and explained.

export interface PricingAssumptions {
  pricePerWatt: number;
  dcToAc: number;
  exportRateRatio: number;
  rateEscalation: number;
  degradation: number;
  years: number;
  rangePct: number;
}

export interface EstimateInput {
  panels: number;
  panelWatts: number;
  yearlyDcKwh: number; // DC production for this many panels
  monthlyBill: number; // $
  rate: number; // $/kWh
}

export interface Estimate {
  panels: number;
  systemKw: number;
  yearlyKwh: number; // AC
  yearlyUsageKwh: number;
  offsetPct: number;
  cost: number;
  firstYearSavings: number;
  lifetimeSavings: number;
  paybackYears: number | null;
  range: { costLow: number; costHigh: number; savingsLow: number; savingsHigh: number };
}

export function usageFromBill(monthlyBill: number, rate: number): number {
  if (monthlyBill <= 0 || rate <= 0) return 0;
  return (monthlyBill * 12) / rate;
}

/** Bill savings for one year, given AC production and usage. */
function yearSavings(prodKwh: number, usageKwh: number, rate: number, exportRatio: number): number {
  const selfUsed = Math.min(prodKwh, usageKwh);
  const exported = Math.max(0, prodKwh - usageKwh);
  return selfUsed * rate + exported * rate * exportRatio;
}

export function estimate(input: EstimateInput, a: PricingAssumptions): Estimate {
  const systemKw = (input.panels * input.panelWatts) / 1000;
  const yearlyKwh = input.yearlyDcKwh * a.dcToAc;
  const usage = usageFromBill(input.monthlyBill, input.rate);
  const cost = systemKw * 1000 * a.pricePerWatt;

  let lifetime = 0;
  let cumulative = 0;
  let paybackYears: number | null = null;
  for (let y = 0; y < a.years; y++) {
    const prod = yearlyKwh * Math.pow(1 - a.degradation, y);
    const rate = input.rate * Math.pow(1 + a.rateEscalation, y);
    const s = yearSavings(prod, usage, rate, a.exportRateRatio);
    if (paybackYears === null && cumulative + s >= cost && s > 0) {
      paybackYears = y + (cost - cumulative) / s;
    }
    cumulative += s;
    lifetime += s;
  }

  const firstYearSavings = yearSavings(yearlyKwh, usage, input.rate, a.exportRateRatio);
  const r = a.rangePct;
  return {
    panels: input.panels,
    systemKw: round(systemKw, 2),
    yearlyKwh: Math.round(yearlyKwh),
    yearlyUsageKwh: Math.round(usage),
    offsetPct: usage > 0 ? Math.round((yearlyKwh / usage) * 100) : 0,
    cost: Math.round(cost),
    firstYearSavings: Math.round(firstYearSavings),
    lifetimeSavings: Math.round(lifetime - cost),
    paybackYears: paybackYears === null ? null : round(paybackYears, 1),
    range: {
      costLow: Math.round(cost * (1 - r)),
      costHigh: Math.round(cost * (1 + r)),
      savingsLow: Math.round(firstYearSavings * (1 - r)),
      savingsHigh: Math.round(firstYearSavings * (1 + r)),
    },
  };
}

export interface PanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
}

/**
 * Pick the smallest config whose AC output covers `targetPct` of usage.
 * Falls back to the largest config when the roof can't cover it.
 */
export function pickConfig(
  configs: PanelConfig[],
  usageKwh: number,
  targetPct: number,
  dcToAc: number,
): PanelConfig | undefined {
  if (configs.length === 0) return undefined;
  const target = usageKwh * targetPct;
  return configs.find((c) => c.yearlyEnergyDcKwh * dcToAc >= target) ?? configs[configs.length - 1];
}

/** Hot/warm/cold lead score from qualifying answers. */
export function scoreLead(q: { homeowner?: string; monthlyBill?: number; timeline?: string }): 'hot' | 'warm' | 'cold' {
  if (q.homeowner !== 'yes') return 'cold';
  let pts = 0;
  if ((q.monthlyBill ?? 0) >= 150) pts += 2;
  else if ((q.monthlyBill ?? 0) >= 100) pts += 1;
  if (q.timeline === 'asap' || q.timeline === '1-3 months') pts += 2;
  else if (q.timeline === '3-6 months') pts += 1;
  return pts >= 3 ? 'hot' : pts >= 1 ? 'warm' : 'cold';
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
