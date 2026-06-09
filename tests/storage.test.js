'use strict';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] !== undefined 
      ? store[key] : null,
    setItem: (key, value) => { 
      store[key] = String(value); 
    },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock;
global.STORAGE_KEY = 'carbondiary_data';

const { 
  saveState, 
  loadState, 
  getDefaultState 
} = require('../js/storage');

beforeEach(() => {
  localStorage.clear();
});

describe('getDefaultState', () => {
  test('returns object with activities', () => {
    expect(getDefaultState()).toHaveProperty('activities');
  });
  test('activities is empty array', () => {
    expect(getDefaultState().activities).toHaveLength(0);
  });
  test('streak current is 0', () => {
    expect(getDefaultState().streak.current).toBe(0);
  });
  test('theme is light', () => {
    expect(getDefaultState().theme).toBe('light');
  });
  test('points is 0', () => {
    expect(getDefaultState().points).toBe(0);
  });
});

describe('saveState and loadState', () => {
  test('saveState returns true', () => {
    expect(saveState(getDefaultState())).toBe(true);
  });
  test('loadState returns default when empty', () => {
    const state = loadState();
    expect(state).toHaveProperty('activities');
  });
  test('save then load returns same data', () => {
    const original = { 
      ...getDefaultState(), 
      points: 42 
    };
    saveState(original);
    const loaded = loadState();
    expect(loaded.points).toBe(42);
  });
  test('activities survive save and load', () => {
    const state = getDefaultState();
    state.activities = [
      { id: '1', date: '2026-06-09', co2kg: 2.5 }
    ];
    saveState(state);
    const loaded = loadState();
    expect(loaded.activities).toHaveLength(1);
    expect(loaded.activities[0].co2kg).toBe(2.5);
  });
  test('saving twice keeps latest', () => {
    saveState({ ...getDefaultState(), points: 10 });
    saveState({ ...getDefaultState(), points: 99 });
    expect(loadState().points).toBe(99);
  });
});

describe('loadState with corrupted data', () => {
  test('corrupted JSON returns default state', () => {
    localStorage.setItem('carbondiary_data', 
      'not valid json {{{{');
    const state = loadState();
    expect(state).toHaveProperty('activities');
    expect(Array.isArray(state.activities)).toBe(true);
  });
});
