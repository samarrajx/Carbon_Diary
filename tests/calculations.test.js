const { calcCO2, getDailyTotal, filterByCategory, calculateStreak } = require('../js/calculations');
const { clamp, escapeHtml } = require('../js/utils');
const { EMISSION_FACTORS } = require('../js/constants');

function formatDateFriendly(dateStr) { const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

describe('Calculations Module', () => {

  describe('1. CO2 CALCULATION TESTS', () => {
    test('transport: Car trip (petrol) 10km should equal 1.8', () => {
      expect(calcCO2('transport', 'Car trip (petrol)', 10)).toBe(1.8);
    });

    test('transport: Car trip (diesel) 10km should equal 1.7', () => {
      expect(calcCO2('transport', 'Car trip (diesel)', 10)).toBe(1.7);
    });

    test('transport: Car trip (electric) 10km should equal 0.5', () => {
      expect(calcCO2('transport', 'Car trip (electric)', 10)).toBe(0.5);
    });

    test('transport: Bus / Metro 100km should equal 4.0', () => {
      expect(calcCO2('transport', 'Bus/Metro', 100)).toBe(4.0);
    });

    test('transport: Train 100km should equal 3.5', () => {
      expect(calcCO2('transport', 'Train', 100)).toBe(3.5);
    });

    test('transport: Walking / Cycling 999km should equal 0', () => {
      expect(calcCO2('transport', 'Walking/Cycling', 999)).toBe(0);
    });

    test('food: Beef meal 1 serving should equal 6.61', () => {
      expect(calcCO2('food', 'Beef meal', 1)).toBe(6.61);
    });

    test('food: Vegan meal 1 serving should equal 0.39', () => {
      expect(calcCO2('food', 'Vegan meal', 1)).toBe(0.39);
    });

    test('food: Beef meal 3 servings should equal 19.83', () => {
      expect(calcCO2('food', 'Beef meal', 3)).toBe(19.83);
    });

    test('energy: Electricity used 5kWh should equal 2.0', () => {
      expect(calcCO2('energy', 'Electricity used', 5)).toBe(2.0);
    });
  });

  describe('2. INPUT VALIDATION TESTS (clamp)', () => {
    test('clamp(150, 0, 100) === 100', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    test('clamp(-5, 0, 100) === 0', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    test('clamp(50, 0, 100) === 50', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    test('clamp(0, 0, 100) === 0', () => {
      expect(clamp(0, 0, 100)).toBe(0);
    });

    test('clamp(100, 0, 100) === 100', () => {
      expect(clamp(100, 0, 100)).toBe(100);
    });

    test('clamp(NaN, 0, 100) === 0', () => {
      expect(clamp(NaN, 0, 100)).toBe(0);
    });

    test('clamp("abc", 0, 100) === 0', () => {
      expect(clamp("abc", 0, 100)).toBe(0);
    });

    test('clamp(null, 0, 100) === 0', () => {
      expect(clamp(null, 0, 100)).toBe(0);
    });
  });

  describe('3. STREAK CALCULATION TESTS', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    test('streak is 0 when no previous logs', () => {
      expect(calculateStreak([])).toBe(0);
    });

    test('streak increments when logging consecutive days', () => {
      const activities = [
        { date: twoDaysAgo, co2kg: 5 },
        { date: yesterday, co2kg: 4 },
        { date: today, co2kg: 3 }
      ];
      expect(calculateStreak(activities)).toBe(3);
    });

    test('streak resets when a day is missed', () => {
      const activities = [
        { date: twoDaysAgo, co2kg: 5 },
        // Missed yesterday
        { date: today, co2kg: 3 }
      ];
      // The current implementation might give 1 because it's only today. Let's verify behavior.
      // Actually calculateStreak logic checks continuous days back from today. So it should be 1.
      expect(calculateStreak(activities)).toBe(1);
    });

    test('streak stays same when logging twice on same day', () => {
      const activities = [
        { date: yesterday, co2kg: 4 },
        { date: today, co2kg: 3 },
        { date: today, co2kg: 2 }
      ];
      expect(calculateStreak(activities)).toBe(2);
    });

    test('streak correctly identifies "today" vs "yesterday"', () => {
      const activities = [
        { date: yesterday, co2kg: 4 }
      ];
      // Still 1 if logged yesterday, as streak is maintained for today until missed
      expect(calculateStreak(activities)).toBe(1);
    });
  });

  describe('4. DAILY TOTAL TESTS', () => {
    test('empty activities array returns 0', () => {
      expect(getDailyTotal([], '2026-06-09')).toBe(0);
    });

    test('single activity returns its co2kg value', () => {
      const activities = [{ date: '2026-06-09', co2kg: 5.5 }];
      expect(getDailyTotal(activities, '2026-06-09')).toBe(5.5);
    });

    test('multiple activities sum correctly', () => {
      const activities = [
        { date: '2026-06-09', co2kg: 5.5 },
        { date: '2026-06-09', co2kg: 2.5 }
      ];
      expect(getDailyTotal(activities, '2026-06-09')).toBe(8.0);
    });

    test('activities from different dates are filtered correctly', () => {
      const activities = [
        { date: '2026-06-09', co2kg: 5.5 },
        { date: '2026-06-08', co2kg: 2.5 }
      ];
      expect(getDailyTotal(activities, '2026-06-09')).toBe(5.5);
    });

    test('activities for today only are summed', () => {
      const activities = [
        { date: '2026-06-09', co2kg: 3.0 },
        { date: '2026-06-09', co2kg: 4.0 },
        { date: '2026-06-08', co2kg: 10.0 }
      ];
      expect(getDailyTotal(activities, '2026-06-09')).toBe(7.0);
    });
  });

  describe('5. CATEGORY FILTER TESTS', () => {
    const mockActivities = [
      { category: 'transport', co2kg: 1 },
      { category: 'transport', co2kg: 2 },
      { category: 'food', co2kg: 3 },
      { category: 'energy', co2kg: 4 }
    ];

    test('filterByCategory(activities, "transport") returns only transport', () => {
      const result = filterByCategory(mockActivities, 'transport');
      expect(result.length).toBe(2);
      expect(result.every(a => a.category === 'transport')).toBe(true);
    });

    test('filterByCategory(activities, "food") returns only food', () => {
      const result = filterByCategory(mockActivities, 'food');
      expect(result.length).toBe(1);
      expect(result[0].co2kg).toBe(3);
    });

    test('empty array returns empty array', () => {
      const result = filterByCategory([], 'transport');
      expect(result).toEqual([]);
    });

    test('all categories return correct counts', () => {
      expect(filterByCategory(mockActivities, 'transport').length).toBe(2);
      expect(filterByCategory(mockActivities, 'food').length).toBe(1);
      expect(filterByCategory(mockActivities, 'energy').length).toBe(1);
      expect(filterByCategory(mockActivities, 'shopping').length).toBe(0);
    });

    test('unknown category returns empty array', () => {
      const result = filterByCategory(mockActivities, 'unknown');
      expect(result).toEqual([]);
    });
  });

});
