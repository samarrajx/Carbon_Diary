/**
 * Carbon Diary — Storage Module
 *
 * Handles saving and loading application state to/from localStorage safely.
 *
 * @version 1.0.0
 */

// We assume STORAGE_KEY is loaded globally from constants.js
// If running in Node/Jest, try to require it
let ACTIVE_STORAGE_KEY = typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'carbondiary_data';
if (typeof require !== 'undefined' && typeof STORAGE_KEY === 'undefined') {
  try {
    const constants = require('./constants');
    ACTIVE_STORAGE_KEY = constants.STORAGE_KEY || ACTIVE_STORAGE_KEY;
  } catch (e) {}
}

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
    localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(state));
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
    const raw = localStorage.getItem(ACTIVE_STORAGE_KEY);
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

// Export for Node.js / Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveState,
    loadState,
    getDefaultState
  };
}
