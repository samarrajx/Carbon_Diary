/** All emission factors organized by category. */
const EMISSION_FACTORS = {
  transport: {
    'Car trip (petrol)':    { factor: 0.18,   unit: 'km' },
    'Car trip (diesel)':    { factor: 0.17,   unit: 'km' },
    'Car trip (electric)':  { factor: 0.05,   unit: 'km' },
    'Taxi/Rideshare':       { factor: 0.21,   unit: 'km' },
    'Motorcycle taxi':      { factor: 0.11,   unit: 'km' },
    'Motorbike':            { factor: 0.11,   unit: 'km' },
    'Bus/Metro':            { factor: 0.04,   unit: 'km' },
    'Train':                { factor: 0.035,  unit: 'km' },
    'Domestic flight':      { factor: 0.255,  unit: 'km' },
    'Long-haul flight':     { factor: 0.195,  unit: 'km' },
    'Walking/Cycling':      { factor: 0,      unit: 'km' },
  },
  energy: {
    'Electricity used':          { factor: 0.40,  unit: 'kWh' },
    'Gas heating (hour)':        { factor: 0.20,  unit: 'hrs' },
    'Air conditioning (hour)':   { factor: 0.25,  unit: 'hrs' },
    'Video call (hour)':         { factor: 0.01,  unit: 'hrs' },
    'Tumble dryer (cycle)':      { factor: 2.4,   unit: 'cycles' },
    'Washing machine (cycle)':   { factor: 0.6,   unit: 'cycles' },
    'Dishwasher (cycle)':        { factor: 0.7,   unit: 'cycles' },
    'Long hot shower (per shower)': { factor: 0.5, unit: 'showers' },
  },
  food: {
    'Beef meal':          { factor: 6.61,  unit: 'servings' },
    'Lamb meal':          { factor: 5.84,  unit: 'servings' },
    'Pork meal':          { factor: 2.15,  unit: 'servings' },
    'Chicken meal':       { factor: 1.26,  unit: 'servings' },
    'Fish meal':          { factor: 1.34,  unit: 'servings' },
    'Rice meal':          { factor: 1.2,   unit: 'servings' },
    'Vegetarian meal':    { factor: 0.63,  unit: 'servings' },
    'Vegan meal':         { factor: 0.39,  unit: 'servings' },
    'Coffee (cup)':       { factor: 0.28,  unit: 'cups' },
    'Dairy milk (glass)': { factor: 0.62,  unit: 'glasses' },
    'Plant milk (glass)': { factor: 0.14,  unit: 'glasses' },
  },
  shopping: {
    'New clothing item':        { factor: 8.0,   unit: 'items' },
    'New electronics (small)':  { factor: 40.0,  unit: 'items' },
    'New electronics (large)':  { factor: 200.0, unit: 'items' },
    'Online delivery package':  { factor: 0.5,   unit: 'packages' },
    'New book/magazine':        { factor: 1.0,   unit: 'items' },
    'Streaming hour':           { factor: 0.036, unit: 'hours' },
  },
};

/**
 * Calculates CO2 in kg for a given category, activity type, and quantity.
 */
function calcCO2(category, activityType, quantity) {
  const factors = EMISSION_FACTORS[category];
  if (!factors || !factors[activityType]) return 0;
  return Number((factors[activityType].factor * quantity).toFixed(2));
}

/**
 * Clamps a number between min and max.
 */
function clamp(v, min, max) {
  if (isNaN(v) || v === null || typeof v === 'string') return min;
  return Math.min(Math.max(v, min), max);
}

/**
 * Gets daily total from a list of activities.
 */
function getDailyTotal(activities, dateString) {
  if (!activities) return 0;
  return activities
    .filter(a => a.date === dateString)
    .reduce((sum, a) => sum + a.co2kg, 0);
}

/**
 * Filters activities by a specific category.
 */
function filterByCategory(activities, category) {
  if (!activities) return [];
  return activities.filter(a => a.category === category);
}

/**
 * Calculates current streak based on an array of activities.
 * Assumes 'today' is the local system date.
 */
function calculateStreak(activities) {
  if (!activities || activities.length === 0) return 0;
  
  // Get today's and yesterday's date strings
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Unique dates the user has logged activities
  const loggedDates = [...new Set(activities.map(a => a.date))].sort().reverse();
  
  if (loggedDates.length === 0) return 0;

  // Streak only counts if they logged today or yesterday
  if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(loggedDates[0] + 'T12:00:00');

  for (let i = 0; i < loggedDates.length; i++) {
    const expectedDateStr = currentDate.toISOString().split('T')[0];
    if (loggedDates[i] === expectedDateStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Escapes HTML characters to prevent XSS in dynamic content.
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
 * Formats a YYYY-MM-DD string as "Monday, June 9" style.
 */
function formatDateFriendly(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'Invalid Date';
  }
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Export for Node.js / Jest, and attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EMISSION_FACTORS,
    calcCO2,
    clamp,
    getDailyTotal,
    filterByCategory,
    calculateStreak,
    escapeHtml,
    formatDateFriendly
  };
} else if (typeof window !== 'undefined') {
  window.EMISSION_FACTORS = EMISSION_FACTORS;
  window.calcCO2 = calcCO2;
  window.clamp = clamp;
  window.getDailyTotal = getDailyTotal;
  window.filterByCategory = filterByCategory;
  window.calculateStreak = calculateStreak;
  window.escapeHtml = escapeHtml;
  window.formatDateFriendly = formatDateFriendly;
}
