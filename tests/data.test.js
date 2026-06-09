const { calcCO2, getDailyTotal, filterByCategory, calculateStreak } = require('../js/calculations');
const { clamp, escapeHtml } = require('../js/utils');
const { EMISSION_FACTORS } = require('../js/constants');

function formatDateFriendly(dateStr) { const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

describe('Data Constants Module', () => {

  test('EMISSION_FACTORS has all 4 categories', () => {
    expect(EMISSION_FACTORS).toHaveProperty('transport');
    expect(EMISSION_FACTORS).toHaveProperty('energy');
    expect(EMISSION_FACTORS).toHaveProperty('food');
    expect(EMISSION_FACTORS).toHaveProperty('shopping');
  });

  test('Each category has at least 3 activity types', () => {
    expect(Object.keys(EMISSION_FACTORS.transport).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(EMISSION_FACTORS.energy).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(EMISSION_FACTORS.food).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(EMISSION_FACTORS.shopping).length).toBeGreaterThanOrEqual(3);
  });

  test('All emission factors are positive numbers (or zero)', () => {
    let valid = true;
    for (const cat in EMISSION_FACTORS) {
      for (const act in EMISSION_FACTORS[cat]) {
        if (typeof EMISSION_FACTORS[cat][act].factor !== 'number' || EMISSION_FACTORS[cat][act].factor < 0) {
          valid = false;
        }
      }
    }
    expect(valid).toBe(true);
  });

  test('No emission factor exceeds 300 kg', () => {
    let valid = true;
    for (const cat in EMISSION_FACTORS) {
      for (const act in EMISSION_FACTORS[cat]) {
        if (EMISSION_FACTORS[cat][act].factor > 300) {
          valid = false;
        }
      }
    }
    expect(valid).toBe(true);
  });

  test('Walking/Cycling factor is exactly 0', () => {
    expect(EMISSION_FACTORS.transport['Walking/Cycling'].factor).toBe(0);
  });

  test('Beef meal is the highest food emission', () => {
    const foodFactors = Object.values(EMISSION_FACTORS.food).map(item => item.factor);
    const maxFood = Math.max(...foodFactors);
    expect(EMISSION_FACTORS.food['Beef meal'].factor).toBe(maxFood);
  });

  test('Vegan meal is lower than vegetarian meal', () => {
    const vegan = EMISSION_FACTORS.food['Vegan meal'].factor;
    const vegetarian = EMISSION_FACTORS.food['Vegetarian meal'].factor;
    expect(vegan).toBeLessThan(vegetarian);
  });

  test('Electric car is lower than petrol car', () => {
    const electric = EMISSION_FACTORS.transport['Car trip (electric)'].factor;
    const petrol = EMISSION_FACTORS.transport['Car trip (petrol)'].factor;
    expect(electric).toBeLessThan(petrol);
  });

  test('Train is lower than bus', () => {
    const train = EMISSION_FACTORS.transport['Train'].factor;
    const bus = EMISSION_FACTORS.transport['Bus/Metro'].factor;
    expect(train).toBeLessThan(bus);
  });

  test('All factor objects have factor and unit properties', () => {
    let valid = true;
    for (const cat in EMISSION_FACTORS) {
      for (const act in EMISSION_FACTORS[cat]) {
        const item = EMISSION_FACTORS[cat][act];
        if (!item.hasOwnProperty('factor') || !item.hasOwnProperty('unit')) {
          valid = false;
        }
      }
    }
    expect(valid).toBe(true);
  });

});
