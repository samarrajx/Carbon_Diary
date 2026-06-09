/**
 * Carbon Diary — Calculations Module
 *
 * Contains pure functions for business logic, data aggregation, and AI responses.
 *
 * @version 1.0.0
 */

// If running in Node/Jest, try to require constants
let LOCAL_EMISSION_FACTORS = typeof EMISSION_FACTORS !== 'undefined' ? EMISSION_FACTORS : null;
let LOCAL_CAT_CONFIG = typeof CAT_CONFIG !== 'undefined' ? CAT_CONFIG : {
  transport: { icon: '🚗', label: 'Transport' },
  energy: { icon: '⚡', label: 'Energy' },
  food: { icon: '🍽️', label: 'Food' },
  shopping: { icon: '🛒', label: 'Shopping' }
};

if (typeof require !== 'undefined' && !LOCAL_EMISSION_FACTORS) {
  try {
    const constants = require('./constants');
    LOCAL_EMISSION_FACTORS = constants.EMISSION_FACTORS || LOCAL_EMISSION_FACTORS;
  } catch (e) {}
}

/**
 * Calculates CO2 emissions for a logged activity.
 * @param {string} category - One of: transport|energy|food|shopping
 * @param {string} activityType - Activity name matching EMISSION_FACTORS key
 * @param {number} quantity - Amount (km, kWh, servings, etc.)
 * @returns {number} CO2 in kg, rounded to 2 decimal places
 */
function calcCO2(category, activityType, quantity) {
  if (!LOCAL_EMISSION_FACTORS) return 0;
  const factors = LOCAL_EMISSION_FACTORS[category];
  if (!factors || !factors[activityType]) return 0;
  const num = Number(quantity);
  if (isNaN(num) || num < 0) return 0;
  return Number((factors[activityType].factor * num).toFixed(2));
}

/**
 * Sums total CO2 for all activities on a given date.
 * @param {Array} activities - Full activities array from state
 * @param {string} date - Date string YYYY-MM-DD
 * @returns {number} Total CO2 in kg
 */
function getDailyTotal(activities, date) {
  if (!activities || !Array.isArray(activities)) return 0;
  return activities
    .filter(a => a.date === date)
    .reduce((sum, a) => sum + a.co2kg, 0);
}

/**
 * Filters activities array by category.
 * @param {Array} activities - Full activities array
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered activities
 */
function filterByCategory(activities, category) {
  if (!activities || !Array.isArray(activities)) return [];
  return activities.filter(a => a.category === category);
}

/**
 * Calculates current streak from activity log.
 * Streak = consecutive days with at least one activity.
 * Breaks if a day is missed. Does not break for future days.
 * @param {Array} activities - Full activities array
 * @returns {number} Current streak count in days
 */
function calculateStreak(activities) {
  if (!activities || activities.length === 0) return 0;
  
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const loggedDates = [...new Set(activities.map(a => a.date))].sort().reverse();
  if (loggedDates.length === 0) return 0;

  if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr && loggedDates[0] < todayStr) {
    return 0;
  }

  let streak = 0;
  let currentDateStr = loggedDates[0] > todayStr ? todayStr : loggedDates[0];
  let currentDate = new Date(currentDateStr + 'T12:00:00');

  for (let i = 0; i < loggedDates.length; i++) {
    const expectedDateStr = currentDate.toISOString().split('T')[0];
    if (loggedDates[i] === expectedDateStr || loggedDates[i] > todayStr) {
      if (loggedDates[i] === expectedDateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates yearly CO2 pace based on this month's data.
 * @param {Array} activities - Full activities array
 * @returns {number} Projected annual CO2 in tonnes
 */
function getYearlyPace(activities) {
  if (!activities || activities.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffStr = thirtyDaysAgo.toISOString().split('T')[0];

  const monthTotal = activities
    .filter(a => a.date >= cutoffStr)
    .reduce((sum, a) => sum + a.co2kg, 0);

  if (monthTotal === 0) return 0;
  return (monthTotal / 30) * 365 / 1000;
}

/**
 * Returns the category with highest total CO2 this month.
 * @param {Array} activities - Full activities array
 * @returns {string} Category name or "transport" if no data
 */
function getWorstCategory(activities) {
  if (!activities || activities.length === 0) return 'transport';

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffStr = thirtyDaysAgo.toISOString().split('T')[0];

  const totals = { transport: 0, energy: 0, food: 0, shopping: 0 };
  activities.forEach(a => {
    if (a.date >= cutoffStr && totals[a.category] !== undefined) {
      totals[a.category] += a.co2kg;
    }
  });

  let worst = 'transport';
  let max = -1;
  for (const cat in totals) {
    if (totals[cat] > max) {
      max = totals[cat];
      worst = cat;
    }
  }
  return worst;
}

/**
 * Generates AI coach response based on user message and state.
 * @param {string} message - User's chat message (lowercase)
 * @param {Object} state - Full application state
 * @returns {string} Coach response text
 */
function generateCoachResponse(message, state) {
  const msgLower = (message || '').toLowerCase();
  const acts = state.activities || [];
  
  if (acts.length === 0) {
    return "Start logging today's activities and I'll give you personalized advice! What have you done today — any commute, meals, or home energy use?";
  }

  const streak = calculateStreak(acts);
  const yearlyPace = getYearlyPace(acts);
  const worstCategory = getWorstCategory(acts);

  if (msgLower.includes('biggest') || msgLower.includes('worst') || msgLower.includes('most')) {
    const icon = LOCAL_CAT_CONFIG[worstCategory]?.icon || '';
    const label = LOCAL_CAT_CONFIG[worstCategory]?.label || worstCategory;
    return `Based on your logs, ${icon} ${label} is your biggest source of emissions recently.\n\n💡 Try looking for alternatives in this area to lower your footprint!`;
  }

  if (msgLower.includes('streak') || msgLower.includes('days') || msgLower.includes('consistent')) {
    if (streak === 0) return "You don't have an active streak yet. Log at least one activity today to start your streak!";
    return `You have a ${streak}-day streak! 🔥 Consistent tracking is proven to drive behaviour change.\n\nResearch shows users who log for 7+ days reduce their emissions by ~15% on average.`;
  }

  if (msgLower.includes('paris') || msgLower.includes('target') || msgLower.includes('on track')) {
    if (yearlyPace === 0) return "Log more activities and I can tell you exactly how you compare to the Paris target (2.0t/year)!";
    const diff = (yearlyPace - 2.0).toFixed(1);
    if (yearlyPace <= 2.0) {
      return `🎉 Amazing! You're currently on pace for ${yearlyPace.toFixed(1)}t CO₂/year — already within the Paris Agreement 2°C target!\n\nYou're among the most climate-conscious individuals globally.`;
    } else {
      return `You're on pace for ${yearlyPace.toFixed(1)}t CO₂/year. The Paris target is 2.0t/year — you're ${diff}t above it.\n\n🎯 Focus on your biggest category to close the gap.`;
    }
  }

  if (msgLower.includes('transport') || msgLower.includes('car')) {
    const transportActs = filterByCategory(acts, 'transport');
    if (transportActs.length === 0) return "You haven't logged any transport lately. Walking and cycling are great zero-emission options!";
    return "🚗 Transport tip: Switching 2 days per week to public transit or cycling could save significant CO₂ each month.";
  }

  if (msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('diet')) {
    return "🥗 Food tip: Replacing red meat meals with vegetarian alternatives can save significant CO₂. Consider trying a plant-based day!";
  }

  // Default response
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = getDailyTotal(acts, todayStr);
  return `Today so far: ${todayTotal.toFixed(1)}kg CO₂.\n\nTry asking me about your biggest category, streak, or Paris target!`;
}

// Export for Jest/Node.js testing environment
// In browser, functions are already global — this block is ignored
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcCO2,
    getDailyTotal,
    filterByCategory,
    calculateStreak,
    getYearlyPace,
    getWorstCategory,
    generateCoachResponse
  };
}
