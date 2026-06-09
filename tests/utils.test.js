'use strict';
const {
  clamp,
  escapeHtml,
  formatCO2,
  getTodayString,
  generateId,
  safeJsonParse
} = require('../js/utils');

describe('clamp', () => {
  test('above max returns max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
  test('below min returns min', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });
  test('within range unchanged', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
  test('exactly min returns min', () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });
  test('exactly max returns max', () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
  test('NaN returns min', () => {
    expect(clamp(NaN, 0, 100)).toBe(0);
  });
  test('null returns min', () => {
    expect(clamp(null, 0, 100)).toBe(0);
  });
  test('string returns min', () => {
    expect(clamp('hello', 0, 100)).toBe(0);
  });
});

describe('escapeHtml', () => {
  test('escapes < character', () => {
    expect(escapeHtml('<script>')).toContain('&lt;');
  });
  test('escapes > character', () => {
    expect(escapeHtml('<script>')).toContain('&gt;');
  });
  test('escapes & character', () => {
    expect(escapeHtml('a & b')).toContain('&amp;');
  });
  test('clean string unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
  test('empty string returns empty', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('formatCO2', () => {
  test('rounds to 2 decimals', () => {
    expect(formatCO2(1.234)).toBe('1.23');
  });
  test('zero formats correctly', () => {
    expect(formatCO2(0)).toBe('0.00');
  });
  test('whole number adds decimals', () => {
    expect(formatCO2(10)).toBe('10.00');
  });
});

describe('getTodayString', () => {
  test('returns YYYY-MM-DD format', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test('matches current date', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(getTodayString()).toBe(today);
  });
});

describe('generateId', () => {
  test('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });
  test('generates unique values', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('safeJsonParse', () => {
  test('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });
  test('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', [])).toEqual([]);
  });
  test('returns fallback for null', () => {
    expect(safeJsonParse(null, 'default')).toBe('default');
  });
});
