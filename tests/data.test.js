'use strict';
const {
  EMISSION_FACTORS,
  CHALLENGE_POOL,
  ACHIEVEMENTS,
  DAILY_TARGET,
  COMPARISONS
} = require('../js/constants');

describe('EMISSION_FACTORS', () => {
  test('has transport category', () => {
    expect(EMISSION_FACTORS).toHaveProperty('transport');
  });
  test('has energy category', () => {
    expect(EMISSION_FACTORS).toHaveProperty('energy');
  });
  test('has food category', () => {
    expect(EMISSION_FACTORS).toHaveProperty('food');
  });
  test('has shopping category', () => {
    expect(EMISSION_FACTORS).toHaveProperty('shopping');
  });
  test('transport has at least 8 types', () => {
    expect(Object.keys(EMISSION_FACTORS.transport).length)
      .toBeGreaterThanOrEqual(8);
  });
  test('food has at least 8 types', () => {
    expect(Object.keys(EMISSION_FACTORS.food).length)
      .toBeGreaterThanOrEqual(8);
  });
  test('walking factor is 0', () => {
    expect(EMISSION_FACTORS.transport['Walking / Cycling'].factor)
      .toBe(0);
  });
  test('electric car < petrol car', () => {
    const ev = EMISSION_FACTORS.transport['Car trip (electric)'].factor;
    const petrol = EMISSION_FACTORS.transport['Car trip (petrol)'].factor;
    expect(ev).toBeLessThan(petrol);
  });
  test('beef > vegan in food', () => {
    const beef = EMISSION_FACTORS.food['Beef meal'].factor;
    const vegan = EMISSION_FACTORS.food['Vegan meal'].factor;
    expect(beef).toBeGreaterThan(vegan);
  });
  test('all transport factors are non-negative', () => {
    Object.values(EMISSION_FACTORS.transport).forEach(item => {
      expect(item.factor).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('CHALLENGE_POOL', () => {
  test('has at least 12 challenges', () => {
    expect(CHALLENGE_POOL.length).toBeGreaterThanOrEqual(12);
  });
  test('every challenge has required fields', () => {
    CHALLENGE_POOL.forEach(c => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('title');
      expect(c).toHaveProperty('points');
    });
  });
  test('all points are positive', () => {
    CHALLENGE_POOL.forEach(c => {
      expect(c.points).toBeGreaterThan(0);
    });
  });
});

describe('ACHIEVEMENTS', () => {
  test('has at least 8 achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(8);
  });
  test('every achievement has id and name', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('name');
    });
  });
});

describe('DAILY_TARGET and COMPARISONS', () => {
  test('DAILY_TARGET is 8', () => {
    expect(DAILY_TARGET).toBe(8);
  });
  test('COMPARISONS has at least 4 entries', () => {
    expect(COMPARISONS.length).toBeGreaterThanOrEqual(4);
  });
  test('all comparison values are positive', () => {
    COMPARISONS.forEach(c => {
      expect(c.val).toBeGreaterThan(0);
    });
  });
});
