/**
 * Carbon Diary — Utility Functions
 *
 * Provides common helper functions used across the application.
 *
 * @version 1.0.0
 */

/**
 * Clamps a number between min and max.
 * @param {number} value - Input value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  if (isNaN(value) || value === null || typeof value === 'string') return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Raw string input
 * @returns {string} Sanitized string safe for innerHTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

/**
 * Formats a number to 2 decimal places.
 * @param {number} n - Number to format
 * @returns {string} Formatted string e.g. "2.40"
 */
function formatCO2(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0.00';
  return n.toFixed(2);
}

/**
 * Returns today's date as YYYY-MM-DD string.
 * @returns {string} Date string
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns yesterday's date as YYYY-MM-DD string.
 * @returns {string} Date string
 */
function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Generates a unique ID for activity entries.
 * @returns {string} Unique ID string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Safely parses JSON, returns fallback on error.
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Value returned if parse fails
 * @returns {*} Parsed object or fallback
 */
function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('Failed to parse JSON:', e);
    return fallback;
  }
}

// Export for Node.js / Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    clamp,
    escapeHtml,
    formatCO2,
    getTodayString,
    getYesterdayString,
    generateId,
    safeJsonParse
  };
}
