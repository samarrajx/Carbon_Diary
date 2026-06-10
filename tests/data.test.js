'use strict';
const {
  EMISSION_FACTORS,
  CHALLENGE_POOL,
  ACHIEVEMENTS,
  LEVELS, COMPARISONS, BENCHMARKS,
  CHART_WIDTH, CHART_HEIGHT, CALENDAR_DAYS,
  DAYS_IN_YEAR, MAX_GLOBAL_TONS,
  DAILY_TARGET_KG, CAT_CONFIG, DAILY_TARGET
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

describe('BENCHMARKS', () => {
  test('has 5 benchmark entries', () => {
    expect(BENCHMARKS.length).toBe(5);
  });
  test('every benchmark has label, val, color', () => {
    BENCHMARKS.forEach(b => {
      expect(b).toHaveProperty('label');
      expect(b).toHaveProperty('val');
      expect(b).toHaveProperty('color');
    });
  });
  test('all values are positive numbers', () => {
    BENCHMARKS.forEach(b => expect(b.val).toBeGreaterThan(0));
  });
  test('India avg is less than US avg', () => {
    const india = BENCHMARKS.find(b => b.label.includes('India'));
    const us = BENCHMARKS.find(b => b.label.includes('US'));
    expect(india.val).toBeLessThan(us.val);
  });
  test('values are in ascending order', () => {
    const vals = BENCHMARKS.map(b => b.val);
    const sorted = [...vals].sort((a,b) => a-b);
    expect(vals).toEqual(sorted);
  });
});

describe('CHALLENGE_POOL — detailed', () => {
  test('every challenge has manual field', () => {
    CHALLENGE_POOL.forEach(c => {
      expect(c).toHaveProperty('manual');
      expect(typeof c.manual).toBe('boolean');
    });
  });
  test('points range is 10 to 50', () => {
    CHALLENGE_POOL.forEach(c => {
      expect(c.points).toBeGreaterThanOrEqual(10);
      expect(c.points).toBeLessThanOrEqual(50);
    });
  });
  test('all IDs are unique', () => {
    const ids = CHALLENGE_POOL.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
  test('all challenges have manual field', () => {
    const manuals = CHALLENGE_POOL.map(c => c.manual);
    expect(manuals).toContain(false);
  });
  test('no challenge has empty title', () => {
    CHALLENGE_POOL.forEach(c => {
      expect(c.title.length).toBeGreaterThan(0);
    });
  });
});

describe('ACHIEVEMENTS — detailed', () => {
  test('all IDs are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
  test('every achievement has emoji', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a).toHaveProperty('emoji');
      expect(a.emoji.length).toBeGreaterThan(0);
    });
  });
  test('every achievement has desc', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a).toHaveProperty('desc');
    });
  });
});

describe('LEVELS', () => {
  test('has exactly 5 levels', () => {
    expect(LEVELS.length).toBe(5);
  });
  test('first level starts at 0 XP', () => {
    expect(LEVELS[0].min).toBe(0);
  });
  test('levels are in ascending XP order', () => {
    for(let i=1;i<LEVELS.length;i++){
      expect(LEVELS[i].min).toBeGreaterThan(LEVELS[i-1].min);
    }
  });
  test('every level has name', () => {
    LEVELS.forEach(l => {
      expect(l).toHaveProperty('name');
    });
  });
});

describe('CAT_CONFIG', () => {
  test('has all 4 categories', () => {
    expect(CAT_CONFIG).toHaveProperty('transport');
    expect(CAT_CONFIG).toHaveProperty('energy');
    expect(CAT_CONFIG).toHaveProperty('food');
    expect(CAT_CONFIG).toHaveProperty('shopping');
  });
  test('every category has icon and label', () => {
    Object.values(CAT_CONFIG).forEach(c => {
      expect(c).toHaveProperty('icon');
      expect(c).toHaveProperty('label');
    });
  });
});

describe('Chart and date constants', () => {
  test('CHART_WIDTH is positive', () => {
    expect(CHART_WIDTH).toBeGreaterThan(0);
  });
  test('CHART_HEIGHT is positive', () => {
    expect(CHART_HEIGHT).toBeGreaterThan(0);
  });
  test('CALENDAR_DAYS is 30', () => {
    expect(CALENDAR_DAYS).toBe(30);
  });
  test('DAYS_IN_YEAR is 365', () => {
    expect(DAYS_IN_YEAR).toBe(365);
  });
  test('MAX_GLOBAL_TONS is 16', () => {
    expect(MAX_GLOBAL_TONS).toBe(16);
  });
  test('DAILY_TARGET_KG is 8', () => {
    expect(DAILY_TARGET_KG).toBe(8);
  });
});
