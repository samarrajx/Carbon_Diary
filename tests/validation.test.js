'use strict';
const { calcCO2 } = require('../js/calculations');
const { clamp } = require('../js/utils');
const { EMISSION_FACTORS } = require('../js/constants');

describe('Input validation edge cases', () => {
  test('negative distance clamped to 0', () => {
    expect(clamp(-10, 0, 1000)).toBe(0);
  });
  test('zero servings = 0 CO2', () => {
    expect(calcCO2('food', 'Beef meal', 0)).toBe(0);
  });
  test('decimal quantity works', () => {
    expect(calcCO2('food', 'Beef meal', 0.5))
      .toBeCloseTo(3.305, 1);
  });
  test('very large distance does not crash', () => {
    expect(() => calcCO2('transport',
      'Car trip (petrol)', 99999))
      .not.toThrow();
  });
  test('string quantity treated as 0', () => {
    expect(calcCO2('transport',
      'Car trip (petrol)', 'abc'))
      .toBe(0);
  });
});

describe('Data ordering integrity', () => {
  test('vegan meal < vegetarian < chicken < beef', () => {
    const vegan = EMISSION_FACTORS.food['Vegan meal'].factor;
    const veg = EMISSION_FACTORS.food['Vegetarian meal'].factor;
    const chicken = EMISSION_FACTORS.food['Chicken meal'].factor;
    const beef = EMISSION_FACTORS.food['Beef meal'].factor;
    expect(vegan).toBeLessThan(veg);
    expect(veg).toBeLessThan(chicken);
    expect(chicken).toBeLessThan(beef);
  });
  test('electric < petrol for cars', () => {
    const ev = EMISSION_FACTORS
      .transport['Car trip (electric)'].factor;
    const petrol = EMISSION_FACTORS
      .transport['Car trip (petrol)'].factor;
    expect(ev).toBeLessThan(petrol);
  });
  test('no factor is undefined', () => {
    Object.values(EMISSION_FACTORS).forEach(category => {
      Object.values(category).forEach(item => {
        expect(item.factor).not.toBeUndefined();
      });
    });
  });
  test('no factor is NaN', () => {
    Object.values(EMISSION_FACTORS).forEach(category => {
      Object.values(category).forEach(item => {
        expect(isNaN(item.factor)).toBe(false);
      });
    });
  });
  test('no factor is negative', () => {
    Object.values(EMISSION_FACTORS).forEach(category => {
      Object.values(category).forEach(item => {
        expect(item.factor).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
