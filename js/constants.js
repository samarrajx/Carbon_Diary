/**
 * Carbon Diary — Constants
 *
 * Stores all static configuration and data definitions used across the app.
 *
 * @version 1.0.0
 */
'use strict';


/**
 * Application version string.
 * @type {string}
 */
const APP_VERSION = "1.0.0";

/**
 * Key used for saving data to localStorage.
 * @type {string}
 */
const STORAGE_KEY = "carbondiary_data";

/**
 * Daily CO2 target in kilograms (kg).
 * Based on the Paris Agreement 1.5°C pathway.
 * @type {number}
 */
const DAILY_TARGET = 8;
/** Alias used in script.js — kg CO2 per day target */
const DAILY_TARGET_KG = DAILY_TARGET;

/**
 * All emission factors organized by category.
 * Factor values are in kg CO2 per unit.
 * @type {Object}
 */
const EMISSION_FACTORS = {
  transport: {
    'Car trip (petrol)':    { factor: 0.18,   unit: 'km' },
    'Car trip (diesel)':    { factor: 0.17,   unit: 'km' },
    'Car trip (electric)':  { factor: 0.05,   unit: 'km' },
    'Taxi/Rideshare':       { factor: 0.21,   unit: 'km' },
    'Motorcycle taxi':      { factor: 0.11,   unit: 'km' },
    'Motorbike':            { factor: 0.11,   unit: 'km' },
    'Bus / Metro':            { factor: 0.04,   unit: 'km' },
    'Train':                { factor: 0.035,  unit: 'km' },
    'Domestic flight':      { factor: 0.255,  unit: 'km' },
    'Long-haul flight':     { factor: 0.195,  unit: 'km' },
    'Walking / Cycling':      { factor: 0,      unit: 'km' },
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
 * All 12 challenges in the pool.
 * Each challenge has an ID, title, description, points, and a manual/autoCheck function.
 * @type {Array<Object>}
 */
const CHALLENGE_POOL = [
  {
    id: 'zero_car',
    icon: '🚗',
    title: 'Zero Car Day',
    desc: "Don't log any car trips today.",
    points: 30,
    autoCheck: (todayEntries) =>
      !todayEntries.some(e => e.category === 'transport' && e.activityType.startsWith('Car')),
    manual: false,
  },
  {
    id: 'plant_based',
    icon: '🥗',
    title: 'Plant-Based Day',
    desc: 'Log only vegan or vegetarian meals today.',
    points: 40,
    autoCheck: (todayEntries) => {
      const meals = todayEntries.filter(e => e.category === 'food' &&
        ['Beef meal','Lamb meal','Pork meal','Chicken meal','Fish meal','Coffee (cup)','Dairy milk (glass)'].includes(e.activityType));
      return meals.length === 0;
    },
    manual: false,
  },
  {
    id: 'walk_5km',
    icon: '🚶',
    title: '5km Walk',
    desc: 'Log a walking or cycling trip of at least 5km.',
    points: 20,
    autoCheck: (todayEntries) =>
      todayEntries.some(e => e.category === 'transport' && e.activityType === 'Walking / Cycling' && e.quantity >= 5),
    manual: false,
  },
  {
    id: 'no_ac',
    icon: '❄️',
    title: 'No AC Day',
    desc: "Don't log any air conditioning usage today.",
    points: 25,
    autoCheck: (todayEntries) =>
      !todayEntries.some(e => e.category === 'energy' && e.activityType === 'Air conditioning (hour)'),
    manual: false,
  },
  {
    id: 'minimal_shopper',
    icon: '🛒',
    title: 'Minimal Shopper',
    desc: 'Log zero shopping today.',
    points: 20,
    autoCheck: (todayEntries) =>
      !todayEntries.some(e => e.category === 'shopping'),
    manual: false,
  },
  {
    id: 'green_commuter',
    icon: '🚌',
    title: 'Green Commuter',
    desc: 'Use only transit, train or walk/cycle today (no cars).',
    points: 35,
    autoCheck: (todayEntries) => {
      const hasTransport = todayEntries.some(e => e.category === 'transport');
      const hasCar = todayEntries.some(e =>
        e.category === 'transport' &&
        ['Car trip (petrol)','Car trip (diesel)','Car trip (electric)','Motorbike'].includes(e.activityType)
      );
      return hasTransport && !hasCar;
    },
    manual: false,
  },
  {
    id: 'under_5kg',
    icon: '🌿',
    title: 'Under 5kg Day',
    desc: 'Keep your total CO₂ under 5kg today.',
    points: 50,
    autoCheck: (todayEntries, todayTotal) => todayTotal > 0 && todayTotal < 5,
    manual: false,
  },
  {
    id: 'meatless_meal',
    icon: '🥦',
    title: 'One Meatless Meal',
    desc: 'Log a vegan or vegetarian meal today.',
    points: 15,
    autoCheck: (todayEntries) =>
      todayEntries.some(e => e.category === 'food' &&
        ['Vegan meal', 'Vegetarian meal'].includes(e.activityType)),
    manual: false,
  },
  {
    id: 'short_shower',
    icon: '🚿',
    title: 'Short Shower',
    desc: 'Log only 1 shower today (or none).',
    points: 20,
    autoCheck: (todayEntries) => {
      const showers = todayEntries.filter(e => e.activityType === 'Long hot shower (per shower)');
      return showers.length === 0 || showers.reduce((s,e) => s + e.quantity, 0) <= 1;
    },
    manual: false,
  },
  {
    id: 'no_delivery',
    icon: '📦',
    title: 'No Delivery',
    desc: "Log no online delivery packages today.",
    points: 15,
    autoCheck: (todayEntries) =>
      !todayEntries.some(e => e.activityType === 'Online delivery package'),
    manual: false,
  },
  {
    id: 'train_day',
    icon: '🚂',
    title: 'Train Day',
    desc: 'Log a train journey today.',
    points: 25,
    autoCheck: (todayEntries) =>
      todayEntries.some(e => e.category === 'transport' && e.activityType === 'Train'),
    manual: false,
  },
  {
    id: 'under_8kg',
    icon: '🎯',
    title: 'Under 8kg Day',
    desc: 'Keep your total CO₂ under 8kg today (Paris target!).',
    points: 30,
    autoCheck: (todayEntries, todayTotal) => todayTotal > 0 && todayTotal < 8,
    manual: false,
  },
];

/**
 * Achievements definitions.
 * @type {Array<Object>}
 */
const ACHIEVEMENTS = [
  {
    id: 'first_log',
    emoji: '🌱',
    name: 'First Log',
    desc: 'Log your first activity',
    check: (state) => state.activities && state.activities.length >= 1,
  },
  {
    id: 'streak_3',
    emoji: '📅',
    name: '3 Day Streak',
    desc: '3 consecutive days logged',
    check: (state) => state.streak.current >= 3,
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    name: '7 Day Streak',
    desc: '7 consecutive days logged',
    check: (state) => state.streak.current >= 7,
  },
  {
    id: 'green_day',
    emoji: '🌿',
    name: 'Green Day',
    desc: 'Stay under 5kg in a day',
    check: (state) => {
      if (!state.activities) return false;
      const grouped = {};
      state.activities.forEach(a => {
        grouped[a.date] = (grouped[a.date] || 0) + a.co2kg;
      });
      return Object.values(grouped).some(val => val > 0 && val < 5);
    },
  },
  {
    id: 'plant_week',
    emoji: '🥗',
    name: 'Plant Week',
    desc: 'Log 7 vegan meals total',
    check: (state) => {
      if (!state.activities) return false;
      return state.activities.filter(a => a.activityType === 'Vegan meal').reduce((sum, a) => sum + a.quantity, 0) >= 7;
    },
  },
  {
    id: 'flight_free',
    emoji: '✈️',
    name: 'Flight Free',
    desc: '7 days logged without flying',
    check: (state) => {
      if (!state.activities) return false;
      const dates = [...new Set(state.activities.map(a => a.date))];
      if (dates.length < 7) return false;
      const flights = state.activities.filter(a => a.activityType.includes('flight')).map(a => a.date);
      let freeDays = 0;
      for (const d of dates) {
        if (!flights.includes(d)) freeDays++;
      }
      return freeDays >= 7;
    },
  },
  {
    id: 'cyclist',
    emoji: '🚲',
    name: 'Cyclist',
    desc: 'Log 50km of walking/cycling total',
    check: (state) => {
      if (!state.activities) return false;
      return state.activities.filter(a => a.activityType === 'Walking / Cycling').reduce((sum, a) => sum + a.quantity, 0) >= 50;
    },
  },
  {
    id: 'climate_warrior',
    emoji: '🌍',
    name: 'Climate Warrior',
    desc: '30 days logged total',
    check: (state) => {
      if (!state.activities) return false;
      return new Set(state.activities.map(a => a.date)).size >= 30;
    },
  },
];

/**
 * XP Level definitions.
 * @type {Array<Object>}
 */
const LEVELS = [
  { name: '🌱 Seedling',        min: 0,    max: 99 },
  { name: '🌿 Sprout',          min: 100,  max: 299 },
  { name: '🌳 Sapling',         min: 300,  max: 699 },
  { name: '🌲 Tree',            min: 700,  max: 1499 },
  { name: '🌲🌲 Forest Guardian', min: 1500, max: Infinity },
];

/**
 * Benchmarks for global comparison (in metric tons).
 * @type {Array<Object>}
 */
const COMPARISONS = [
  { label: '🇮🇳 India avg',  val: 1.9,  color: '#059669' },
  { label: '🌍 Global avg', val: 4.0,  color: '#3b82f6' },
  { label: '🇪🇺 EU avg',     val: 7.0,  color: '#f59e0b' },
  { label: '🇺🇸 US avg',     val: 14.9, color: '#e63946' },
];

/**
 * Benchmark data for global CO2 comparison.
 * @type {Array<Object>}
 */
const BENCHMARKS = [
  { label: '🎯 Paris Target', val: 2.0, color: '#059669' },
  { label: '🇮🇳 India avg',   val: 1.9, color: '#10b981' },
  { label: '🌍 Global avg',   val: 4.0, color: '#3b82f6' },
  { label: '🇪🇺 EU avg',      val: 7.0, color: '#f59e0b' },
  { label: '🇺🇸 US avg',      val: 14.9,color: '#e63946' },
];

/** Chart dimensions for weekly SVG chart */
const CHART_WIDTH = 520;
const CHART_HEIGHT = 180;
const CHART_PAD_LEFT = 40;
const CHART_PAD_RIGHT = 20;
const CHART_PAD_TOP = 20;
const CHART_PAD_BOTTOM = 36;
const CHART_POINT_PADDING = 20;

/** Calendar and date constants */
const CALENDAR_DAYS = 30;
const DAYS_IN_YEAR = 365;

/** Global comparison scale maximum (US average in tonnes) */
const MAX_GLOBAL_TONS = 16;

/**
 * Category configuration.
 * @type {Object}
 */
const CAT_CONFIG = {
  transport: { icon: '🚗', label: 'Transport', color: '#3b82f6' },
  energy: { icon: '⚡', label: 'Energy', color: '#f59e0b' },
  food: { icon: '🍽️', label: 'Food', color: '#10b981' },
  shopping: { icon: '🛒', label: 'Shopping', color: '#8b5cf6' }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EMISSION_FACTORS,
    CHALLENGE_POOL,
    ACHIEVEMENTS,
    LEVELS,
    DAILY_TARGET,
    DAILY_TARGET_KG,
    COMPARISONS,
    STORAGE_KEY,
    APP_VERSION,
    CAT_CONFIG,
    BENCHMARKS
  };
}

/* Freeze all objects to prevent accidental mutation */
Object.freeze(EMISSION_FACTORS);
Object.freeze(CHALLENGE_POOL);
Object.freeze(ACHIEVEMENTS);
Object.freeze(LEVELS);
Object.freeze(COMPARISONS);
Object.freeze(CAT_CONFIG);
Object.freeze(BENCHMARKS);
