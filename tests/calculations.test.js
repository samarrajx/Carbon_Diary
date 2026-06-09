'use strict';
const {
  calcCO2,
  getDailyTotal,
  filterByCategory,
  calculateStreak
} = require('../js/calculations');

describe('calcCO2 — transport', () => {
  test('petrol car 10km = 1.80 kg', () => {
    expect(calcCO2('transport', 'Car trip (petrol)', 10))
      .toBeCloseTo(1.80, 1);
  });
  test('diesel car 10km = 1.70 kg', () => {
    expect(calcCO2('transport', 'Car trip (diesel)', 10))
      .toBeCloseTo(1.70, 1);
  });
  test('electric car 10km = 0.50 kg', () => {
    expect(calcCO2('transport', 'Car trip (electric)', 10))
      .toBeCloseTo(0.50, 1);
  });
  test('bus 100km = 4.00 kg', () => {
    expect(calcCO2('transport', 'Bus / Metro', 100))
      .toBeCloseTo(4.00, 1);
  });
  test('train 100km = 3.50 kg', () => {
    expect(calcCO2('transport', 'Train', 100))
      .toBeCloseTo(3.50, 1);
  });
  test('walking any distance = 0 kg', () => {
    expect(calcCO2('transport', 'Walking / Cycling', 999))
      .toBe(0);
  });
  test('zero quantity = 0 kg', () => {
    expect(calcCO2('transport', 'Car trip (petrol)', 0))
      .toBe(0);
  });
  test('unknown activity = 0, no crash', () => {
    expect(calcCO2('transport', 'Teleport', 10))
      .toBe(0);
  });
  test('unknown category = 0, no crash', () => {
    expect(calcCO2('spaceship', 'Rocket', 10))
      .toBe(0);
  });
});

describe('calcCO2 — food', () => {
  test('beef meal 1 serving = 6.61 kg', () => {
    expect(calcCO2('food', 'Beef meal', 1))
      .toBeCloseTo(6.61, 1);
  });
  test('vegan meal 1 serving = 0.39 kg', () => {
    expect(calcCO2('food', 'Vegan meal', 1))
      .toBeCloseTo(0.39, 1);
  });
  test('beef meal 3 servings = 19.83 kg', () => {
    expect(calcCO2('food', 'Beef meal', 3))
      .toBeCloseTo(19.83, 1);
  });
});

describe('calcCO2 — energy', () => {
  test('electricity 10 kWh = 4.00 kg', () => {
    expect(calcCO2('energy', 'Electricity used', 10))
      .toBeCloseTo(4.00, 1);
  });
});

describe('getDailyTotal', () => {
  const activities = [
    { date: '2026-06-09', co2kg: 2.5, category: 'transport' },
    { date: '2026-06-09', co2kg: 1.0, category: 'food' },
    { date: '2026-06-08', co2kg: 5.0, category: 'transport' }
  ];
  test('empty array returns 0', () => {
    expect(getDailyTotal([], '2026-06-09')).toBe(0);
  });
  test('sums activities for target date only', () => {
    expect(getDailyTotal(activities, '2026-06-09'))
      .toBeCloseTo(3.5, 1);
  });
  test('excludes other dates', () => {
    expect(getDailyTotal(activities, '2026-06-07')).toBe(0);
  });
  test('single activity returns its value', () => {
    const single = [{ date: '2026-06-09', co2kg: 4.2 }];
    expect(getDailyTotal(single, '2026-06-09'))
      .toBeCloseTo(4.2, 1);
  });
});

describe('filterByCategory', () => {
  const activities = [
    { category: 'transport', co2kg: 1 },
    { category: 'food', co2kg: 2 },
    { category: 'transport', co2kg: 3 },
    { category: 'energy', co2kg: 4 }
  ];
  test('returns only transport', () => {
    expect(filterByCategory(activities, 'transport'))
      .toHaveLength(2);
  });
  test('returns only food', () => {
    expect(filterByCategory(activities, 'food'))
      .toHaveLength(1);
  });
  test('empty array returns empty', () => {
    expect(filterByCategory([], 'transport'))
      .toHaveLength(0);
  });
  test('unknown category returns empty', () => {
    expect(filterByCategory(activities, 'spaceship'))
      .toHaveLength(0);
  });
});

describe('calculateStreak', () => {
  test('no activities = 0', () => {
    expect(calculateStreak([])).toBe(0);
  });
});
