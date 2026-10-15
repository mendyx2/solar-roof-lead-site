import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimate, pickConfig, scoreLead, usageFromBill } from '../src/lib/estimate.ts';

const a = {
  pricePerWatt: 2.75,
  dcToAc: 0.85,
  exportRateRatio: 0.5,
  rateEscalation: 0.025,
  degradation: 0.005,
  years: 25,
  rangePct: 0.12,
};

test('usageFromBill converts a monthly bill to yearly kWh', () => {
  assert.equal(usageFromBill(150, 0.15), 12000);
  assert.equal(usageFromBill(0, 0.15), 0);
});

test('estimate computes size, cost and a payback within the 25-year window', () => {
  const e = estimate({ panels: 20, panelWatts: 400, yearlyDcKwh: 12000, monthlyBill: 150, rate: 0.15 }, a);
  assert.equal(e.systemKw, 8);
  assert.equal(e.cost, 22000);
  assert.equal(e.yearlyKwh, 10200);
  assert.equal(e.offsetPct, 85);
  assert.equal(e.firstYearSavings, 1530);
  assert.ok(e.paybackYears !== null && e.paybackYears > 10 && e.paybackYears < 15);
  assert.ok(e.range.costLow < e.cost && e.cost < e.range.costHigh);
});

test('exported energy is valued at the export ratio', () => {
  const e = estimate({ panels: 10, panelWatts: 400, yearlyDcKwh: 2000 / 0.85, monthlyBill: 12.5, rate: 0.15 }, a);
  // usage 1000 kWh, production 2000 kWh: 1000*0.15 + 1000*0.15*0.5
  assert.equal(e.firstYearSavings, 225);
});

test('pickConfig picks the smallest config meeting the target, else the largest', () => {
  const configs = [
    { panelsCount: 4, yearlyEnergyDcKwh: 2400 },
    { panelsCount: 10, yearlyEnergyDcKwh: 6000 },
    { panelsCount: 20, yearlyEnergyDcKwh: 12000 },
  ];
  assert.equal(pickConfig(configs, 5000, 1, 0.85)?.panelsCount, 10);
  assert.equal(pickConfig(configs, 50000, 1, 0.85)?.panelsCount, 20);
  assert.equal(pickConfig([], 5000, 1, 0.85), undefined);
});

test('scoreLead', () => {
  assert.equal(scoreLead({ homeowner: 'no', monthlyBill: 300, timeline: 'asap' }), 'cold');
  assert.equal(scoreLead({ homeowner: 'yes', monthlyBill: 200, timeline: 'asap' }), 'hot');
  assert.equal(scoreLead({ homeowner: 'yes', monthlyBill: 110, timeline: 'researching' }), 'warm');
});
