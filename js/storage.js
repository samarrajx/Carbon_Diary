/**
 * Carbon Diary — Storage Module
 *
 * Handles saving and loading application state to/from localStorage safely.
 *
 * @version 1.0.0
 */
'use strict';

const STORAGE_KEY_LOCAL = (typeof STORAGE_KEY !== 'undefined') 
  ? STORAGE_KEY 
  : 'carbondiary_data';

/**
 * Returns a fresh default state object.
 * @returns {Object} Default state
 */
function getDefaultState() {
  return {
    activities: [],
    completedChallenges: {},
    points: 0,
    streak: { current: 0, lastLogDate: null },
    chatMessages: [],
    theme: 'light'
  };
}

/**
 * Saves application state to localStorage.
 * @param {Object} state - Full application state object
 * @returns {boolean} true if saved successfully, false if failed
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('Failed to save state:', e);
    return false;
  }
}

/**
 * Loads application state from localStorage.
 * @returns {Object} Saved state or default empty state
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL);
    if (!raw) return getDefaultState();
    
    // safe parsing
    const parsed = JSON.parse(raw);
    
    // Merge to ensure new keys are present
    const state = Object.assign(getDefaultState(), parsed);
    
    // Guard against corrupt streak object
    if (!state.streak || typeof state.streak.current !== 'number' || state.streak.current < 0) {
      state.streak = { current: 0, lastLogDate: null };
    }
    return state;
  } catch (e) {
    console.warn('Failed to load state:', e);
    return getDefaultState();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveState,
    loadState,
    getDefaultState
  };
}
