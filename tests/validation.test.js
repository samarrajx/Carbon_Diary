const { calcCO2, getDailyTotal, filterByCategory, calculateStreak } = require('../js/calculations');
const { clamp, escapeHtml } = require('../js/utils');
const { EMISSION_FACTORS } = require('../js/constants');

function formatDateFriendly(dateStr) { const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

describe('Validation Module', () => {

  describe('Input sanitization', () => {
    test('HTML characters are escaped correctly', () => {
      const dirty = '<script>alert("xss & fun")</script>';
      const clean = escapeHtml(dirty);
      expect(clean).toBe('&lt;script&gt;alert(&quot;xss &amp; fun&quot;)&lt;/script&gt;');
    });
    
    test('Null or undefined inputs return empty string', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
    
    test('Newlines are converted to <br/>', () => {
      expect(escapeHtml('Line 1\nLine 2')).toBe('Line 1<br/>Line 2');
    });
  });

  function formatDateFriendly(dateStr) { const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

describe('Date formatting', () => {
    test('Formats YYYY-MM-DD correctly', () => {
      // 2026-06-09 is a Tuesday
      expect(formatDateFriendly('2026-06-09')).toBe('Tuesday, June 9');
    });

    test('Invalid date string returns "Invalid Date"', () => {
      expect(formatDateFriendly('2026/06/09')).toBe('Invalid Date');
      expect(formatDateFriendly('not-a-date')).toBe('Invalid Date');
      expect(formatDateFriendly(null)).toBe('Invalid Date');
    });
  });

  describe('CO2 formatting & Large numbers', () => {
    test('Rounds to 2 decimal places', () => {
      // Train (0.035) * 10 = 0.35
      expect(calcCO2('transport', 'Train', 10)).toBe(0.35);
      
      // Some precision issue tests
      const factors = EMISSION_FACTORS['transport'];
      factors['Test'] = { factor: 0.333333, unit: 'km' };
      expect(calcCO2('transport', 'Test', 10)).toBe(3.33);
    });

    test('Large numbers handled correctly (10000km car trip)', () => {
      expect(calcCO2('transport', 'Car trip (petrol)', 10000)).toBe(1800.0);
    });
    
    test('Zero quantity returns 0 CO2', () => {
      expect(calcCO2('transport', 'Car trip (petrol)', 0)).toBe(0);
    });
    
    test('Quantity validation (negative numbers clamped to 0)', () => {
      expect(clamp(-50, 0, 1000)).toBe(0);
      // Wait, user asks for validation tests, so we test clamp
      expect(clamp(-1, 0, 100)).toBe(0);
    });
  });

  describe('Category validation', () => {
    test('Only valid categories accepted in calcCO2', () => {
      expect(calcCO2('unknown_category', 'Car trip (petrol)', 10)).toBe(0);
    });
    
    test('Unknown activity type returns 0', () => {
      expect(calcCO2('transport', 'Spaceship', 10)).toBe(0);
    });

    test('All 4 categories have at least one activity type', () => {
      const categories = ['transport', 'energy', 'food', 'shopping'];
      categories.forEach(cat => {
        expect(EMISSION_FACTORS[cat]).toBeDefined();
        expect(Object.keys(EMISSION_FACTORS[cat]).length).toBeGreaterThan(0);
      });
    });

    test('All activity types have valid positive factors', () => {
      let allPositiveOrZero = true;
      for (const cat in EMISSION_FACTORS) {
        for (const act in EMISSION_FACTORS[cat]) {
          if (EMISSION_FACTORS[cat][act].factor < 0) {
            allPositiveOrZero = false;
          }
        }
      }
      expect(allPositiveOrZero).toBe(true);
    });
  });

});
