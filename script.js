/**
 * Carbon Diary — Main Application Controller
 * 
 * Handles DOM manipulation, event listeners, and UI rendering.
 * Pure logic is in js/calculations.js
 * Constants are in js/constants.js
 * Storage operations are in js/storage.js
 * Utility functions are in js/utils.js
 * 
 * @version 1.0.0
 * @author Carbon Diary
 * @license MIT
 */

'use strict';

let state = getDefaultState();
let activeCategory = 'transport';

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Wires up all event listeners for the application.
 */
function initEventListeners() {

  // Sidebar nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Mobile tabs
  document.querySelectorAll('.mobile-tab[data-page]').forEach(tab => {
    tab.addEventListener('click', () => navigateTo(tab.dataset.page));
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = document.getElementById('sidebar').classList.contains('open');
      if (isOpen) closeMobileSidebar(); else openMobileSidebar();
    });
  }

  // Sidebar overlay click to close
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Category tabs
  document.querySelectorAll('.cat-tab[data-cat]').forEach(tab => {
    tab.addEventListener('click', () => switchCategory(tab.dataset.cat));
  });

  // Log form
  const logForm = document.getElementById('logForm');
  if (logForm) logForm.addEventListener('submit', handleLogSubmit);

  // Live CO2 preview — transport
  document.getElementById('transportType').addEventListener('change', updateCO2Preview);
  document.getElementById('transportQty').addEventListener('input', updateCO2Preview);

  // Live CO2 preview — energy
  document.getElementById('energyType').addEventListener('change', updateCO2Preview);
  document.getElementById('energyQty').addEventListener('input', updateCO2Preview);

  // Live CO2 preview — food
  document.getElementById('foodType').addEventListener('change', updateCO2Preview);
  document.getElementById('foodQty').addEventListener('input', updateCO2Preview);

  // Live CO2 preview — shopping
  document.getElementById('shoppingType').addEventListener('change', updateCO2Preview);
  document.getElementById('shoppingQty').addEventListener('input', updateCO2Preview);

  // Energy unit label update on type change
  document.getElementById('energyType').addEventListener('change', () => {
    const type = document.getElementById('energyType').value;
    const factor = EMISSION_FACTORS.energy[type];
    const label = document.getElementById('energyUnitLabel');
    if (label && factor) label.textContent = `Quantity (${factor.unit})`;
  });

  // Chat send button
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    if (input) handleChatMessage(input.value);
  });

  // Chat input — send on Enter
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatMessage(chatInput.value);
      }
    });
  }

  // Quick question buttons
  document.querySelectorAll('.quick-q-btn[data-q]').forEach(btn => {
    btn.addEventListener('click', () => handleChatMessage(btn.dataset.q));
  });
}

document.addEventListener('DOMContentLoaded', () => {

  // 1. Load state from localStorage
  state = loadState();

  // 2. Ensure unlockedAchievements array exists
  if (!state.unlockedAchievements) state.unlockedAchievements = [];

  // 3. Apply theme
  applyTheme();

  // 4. Update streak (in case day rolled over)
  updateStreak();

  // 5. Wire all event listeners
  initEventListeners();

  // 6. Set today's date display
  renderTodayDate();

  // 7. Render today's log (default page)
  renderTodayPage();
  updateCO2Preview();

  // 8. Update sidebar stats
  updateSidebarStats();

  // 9. Auto-check challenges based on any existing data
  checkAndAutoVerifyChallenges();

  // 10. Check achievements
  checkAchievements();

  // 11. Save any streak update
  saveState();

  console.log('%c📗 Carbon Diary Initialized', 'color: #2d6a4f; font-weight: bold; font-size: 16px;');
  console.log('%cState:', 'color: #52b788;', {
    activities: state.activities.length,
    streak: state.streak.current,
    points: state.points,
    theme: state.theme,
  });

// ============================================================
// PAGE NAVIGATION
// ============================================================

/**
 * Navigates to a given page, hiding all others.
 * Also triggers page-specific rendering.
 * @param {string} pageId - e.g. 'page-today'
 */
function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });

  // Show target page
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    target.hidden = false;
  }

  // Update nav active states (sidebar)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  // Update mobile tabs
  document.querySelectorAll('.mobile-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === pageId);
  });

  // Close mobile sidebar
  closeMobileSidebar();

  // Page-specific render
  if (pageId === 'page-today') {
    renderTodayPage();
    renderTodayDate();
  } else if (pageId === 'page-progress') {
    renderProgressPage();
  } else if (pageId === 'page-challenges') {
    renderChallengesPage();
  } else if (pageId === 'page-coach') {
    renderChatMessages();
  }
}

/**
 * Switches the active category tab and shows the right form fields.
 * @param {string} cat - 'transport' | 'energy' | 'food' | 'shopping'
 */
function switchCategory(cat) {
  activeCategory = cat;

  // Update tab styles
  document.querySelectorAll('.cat-tab').forEach(tab => {
    const isActive = tab.dataset.cat === cat;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive.toString());
  });

  // Show/hide field panels
  ['transport', 'energy', 'food', 'shopping'].forEach(c => {
    const el = document.getElementById(`fields-${c}`);
    if (el) {
      el.hidden = c !== cat;
    }
  });

  updateCO2Preview();
}

// ============================================================
// TODAY'S LOG — QUICK LOG PANEL
// ============================================================

/**
 * Updates the today's date display in the page header.
 */
function renderTodayDate() {
  const el = document.getElementById('todayDate');
  if (el) el.textContent = formatDateFriendly(getTodayString());
}

/**
 * Returns the current form values for the active category.
 * @returns {{ activityType: string, quantity: number, unit: string, co2kg: number }}
 */
function getFormValues() {
  let activityType = '';
  let quantity = 0;
  let unit = '';
  let co2kg = 0;

  if (activeCategory === 'transport') {
    activityType = document.getElementById('transportType').value;
    quantity = clamp(parseFloat(document.getElementById('transportQty').value) || 0, 0, 50000);
    unit = 'km';
    co2kg = calcCO2('transport', activityType, quantity);
  } else if (activeCategory === 'energy') {
    activityType = document.getElementById('energyType').value;
    quantity = clamp(parseFloat(document.getElementById('energyQty').value) || 0, 0, 10000);
    const energyFactor = EMISSION_FACTORS.energy[activityType];
    unit = energyFactor ? energyFactor.unit : 'units';
    co2kg = calcCO2('energy', activityType, quantity);
  } else if (activeCategory === 'food') {
    activityType = document.getElementById('foodType').value;
    quantity = clamp(parseFloat(document.getElementById('foodQty').value) || 1, 1, 50);
    unit = 'servings';
    co2kg = calcCO2('food', activityType, quantity);
  } else if (activeCategory === 'shopping') {
    activityType = document.getElementById('shoppingType').value;
    quantity = clamp(parseFloat(document.getElementById('shoppingQty').value) || 1, 1, 1000);
    const shoppingFactor = EMISSION_FACTORS.shopping[activityType];
    unit = shoppingFactor ? shoppingFactor.unit : 'items';
    co2kg = calcCO2('shopping', activityType, quantity);
  }

  return { activityType, quantity, unit, co2kg };
}

/**
 * Updates the live CO2 preview as the user types in the form.
 */
function updateCO2Preview() {
  const { co2kg } = getFormValues();
  const previewEl = document.getElementById('co2Preview');
  const valEl = document.getElementById('co2PreviewValue');

  if (valEl) valEl.textContent = `${co2kg.toFixed(2)} kg CO₂`;

  if (previewEl) {
    previewEl.classList.toggle('zero', co2kg === 0);
  }

  // Update energy unit label
  if (activeCategory === 'energy') {
    const activityType = document.getElementById('energyType').value;
    const factor = EMISSION_FACTORS.energy[activityType];
    const unitLabel = document.getElementById('energyUnitLabel');
    if (unitLabel && factor) unitLabel.textContent = `Quantity (${factor.unit})`;
  }
}

/**
 * Handles log form submission — validates, adds entry, updates UI.
 * @param {Event} e
 */
function handleLogSubmit(e) {
  e.preventDefault();

  const { activityType, quantity, unit, co2kg } = getFormValues();

  if (!activityType) { showToast('Please select an activity type.'); return; }
  if (quantity <= 0 && co2kg > 0) { showToast('Please enter a valid quantity greater than 0.'); return; }
  if (quantity < 0) { showToast('Quantity cannot be negative.'); return; }

  const activity = {
    id: generateId(),
    date: getTodayString(),
    category: activeCategory,
    activityType,
    quantity,
    unit,
    co2kg,
    timestamp: Date.now(),
  };

  state.activities.push(activity);
  updateStreak();
  saveState();

  renderTodayPage();
  checkAndAutoVerifyChallenges();
  checkAchievements();
  updateSidebarStats();
  showToast(`✅ Logged: ${co2kg.toFixed(2)} kg CO₂`);
}

// ============================================================
// TODAY'S LOG — ENTRIES LIST
// ============================================================

/**
 * Renders the full Today's Log page including entries list and summary.
 */
function renderTodayPage() {
  const today = getTodayString();
  const todayEntries = getActivitiesForDate(today)
    .sort((a, b) => b.timestamp - a.timestamp);
  const todayTotal = todayEntries.reduce((s, e) => s + e.co2kg, 0);

  // Update subtitle
  const sub = document.getElementById('todayTotalSubtitle');
  if (sub) sub.textContent = `${todayTotal.toFixed(2)} kg CO₂`;

  // Streak banner
  renderStreakBanner(todayTotal);

  // Entries list
  const list = document.getElementById('entriesList');
  const count = document.getElementById('entryCount');
  if (count) count.textContent = `${todayEntries.length} ${todayEntries.length === 1 ? 'activity' : 'activities'}`;

  if (!list) return;

  if (todayEntries.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">🌿</div>
        <strong>No activities logged yet today.</strong>
        <p>Start with your morning commute!</p>
      </div>`;
    return;
  }

  list.innerHTML = todayEntries.map(entry => {
    const cfg = CAT_CONFIG[entry.category];
    return `
      <div class="entry-item" role="listitem" aria-label="${entry.activityType}: ${entry.co2kg.toFixed(2)} kg CO2">
        <div class="entry-cat-dot" style="background:${cfg.color};" aria-hidden="true"></div>
        <div class="entry-name">${cfg.icon} ${entry.activityType}</div>
        <div class="entry-qty">${entry.quantity} ${entry.unit}</div>
        <div class="entry-co2">${entry.co2kg.toFixed(2)} kg</div>
        <div class="entry-time">${formatTime(entry.timestamp)}</div>
        <button class="btn btn-danger" onclick="deleteActivity('${entry.id}')"
          aria-label="Delete ${entry.activityType} entry">🗑️</button>
      </div>`;
  }).join('');

  // Summary bar
  renderSummaryBar(todayEntries, todayTotal);
}

/**
 * Deletes an activity by ID, updates state and UI.
 * @param {string} id
 */
function deleteActivity(id) {
  state.activities = state.activities.filter(a => a.id !== id);
  updateStreak();
  saveState();
  renderTodayPage();
  checkAndAutoVerifyChallenges();
  updateSidebarStats();
}

/**
 * Renders the summary bar with per-category totals and overall total.
 * @param {Array} entries - Today's entries
 * @param {number} total - Today's total CO2
 */
function renderSummaryBar(entries, total) {
  const cats = { transport: 0, energy: 0, food: 0, shopping: 0 };
  entries.forEach(e => { if (cats[e.category] !== undefined) cats[e.category] += e.co2kg; });

  ['transport', 'energy', 'food', 'shopping'].forEach(cat => {
    const el = document.getElementById(`sum${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    if (el) el.textContent = cats[cat].toFixed(1);
  });

  const totalEl = document.getElementById('summaryTotalVal');
  const totalWrap = document.getElementById('summaryTotal');
  if (totalEl) totalEl.textContent = `${total.toFixed(2)} kg CO₂`;
  if (totalWrap) {
    totalWrap.className = 'summary-total';
    if (total < DAILY_TARGET_KG) totalWrap.classList.add('green');
    else if (total < 15) totalWrap.classList.add('yellow');
    else totalWrap.classList.add('red');
  }
}

// ============================================================
// PROGRESS PAGE
// ============================================================

/**
 * Renders the full progress page (stat cards, heatmap, charts).
 */
function renderProgressPage() {
  renderStatCards();
  renderCalendarHeatmap();
  renderBreakdownBars();
  renderWeeklyChart();
  renderComparisonCard();
}

/**
 * Renders the 4 stat cards (today, week, month, yearly pace).
 */
function renderStatCards() {
  const today = getDayTotal(getTodayString());
  const week = getTotalForLastNDays(7);
  const month = getTotalForLastNDays(30);
  const yearlyPace = (month / 30) * 365 / 1000; // tons

  setStatCard('statToday', today.toFixed(2), getColorClass(today));
  setStatCard('statWeek', week.toFixed(2), getColorClass(week / 7));
  setStatCard('statMonth', month.toFixed(2), getColorClass(month / 30));

  const paceEl = document.getElementById('statPace');
  if (paceEl) paceEl.textContent = month > 0 ? `${yearlyPace.toFixed(1)}t` : '—';
  const paceSubEl = document.getElementById('statPaceSub');
  if (paceSubEl) paceSubEl.textContent = 'On track for';
}

/**
 * Sets a stat card value and color class.
 * @param {string} id
 * @param {string} value
 * @param {string} colorClass - 'green' | 'yellow' | 'red' | ''
 */
function setStatCard(id, value, colorClass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  el.className = 'stat-card-value';
  if (colorClass) el.classList.add(colorClass);
}

/**
 * Returns a color class based on daily CO2 value.
 * @param {number} dailyKg
 * @returns {string}
 */
function getColorClass(dailyKg) {
  if (dailyKg < DAILY_TARGET_KG) return 'green';
  if (dailyKg < 15) return 'yellow';
  return 'red';
}

/**
 * Renders the 30-day calendar heatmap.
 */
function renderCalendarHeatmap() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  // Build 7-column header (Sun–Sat)
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayHeaders.map(d =>
    `<div class="cal-day-header" aria-hidden="true">${d}</div>`
  ).join('');

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Find the first day of the 30-day window
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);

  // Find the day of week for startDate so we can pad
  const startDow = startDate.getDay(); // 0=Sun

  // Add empty cells for padding
  for (let i = 0; i < startDow; i++) {
    html += `<div class="cal-day empty-day" aria-hidden="true"></div>`;
  }

  // Add 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    const total = getDayTotal(dateStr);
    const isToday = dateStr === getTodayString();
    const hasData = getActivitiesForDate(dateStr).length > 0;

    let lvlClass = 'no-data';
    if (hasData) {
      if (total < 5) lvlClass = 'lvl-0';
      else if (total < 10) lvlClass = 'lvl-1';
      else if (total < 15) lvlClass = 'lvl-2';
      else lvlClass = 'lvl-3';
    }

    const todayClass = isToday ? ' today' : '';
    const ariaLabel = hasData
      ? `${formatDateShort(dateStr)}: ${total.toFixed(1)} kg CO₂`
      : `${formatDateShort(dateStr)}: no data`;

    html += `
      <div class="cal-day ${lvlClass}${todayClass}"
        data-date="${dateStr}"
        data-total="${total.toFixed(1)}"
        aria-label="${ariaLabel}"
        tabindex="0"
        role="gridcell">
        ${dayNum}
      </div>`;
  }

  grid.innerHTML = html;

  // Attach hover tooltips
  grid.querySelectorAll('.cal-day:not(.empty-day)').forEach(cell => {
    cell.addEventListener('mouseenter', showCalTooltip);
    cell.addEventListener('mouseleave', hideCalTooltip);
    cell.addEventListener('mousemove', moveCalTooltip);
    cell.addEventListener('focus', showCalTooltip);
    cell.addEventListener('blur', hideCalTooltip);
  });
}

/**
 * Shows the calendar tooltip.
 * @param {Event} e
 */
function showCalTooltip(e) {
  const tip = document.getElementById('calTooltip');
  if (!tip) return;
  const date = e.currentTarget.dataset.date;
  const total = e.currentTarget.dataset.total;
  const hasData = getActivitiesForDate(date).length > 0;
  tip.textContent = hasData
    ? `${formatDateShort(date)}: ${total} kg CO₂`
    : `${formatDateShort(date)}: no data`;
  tip.style.opacity = '1';
  tip.setAttribute('aria-hidden', 'false');
}

/**
 * Moves the calendar tooltip to follow mouse position.
 * @param {MouseEvent} e
 */
function moveCalTooltip(e) {
  const tip = document.getElementById('calTooltip');
  if (!tip) return;
  tip.style.left = (e.clientX + 10) + 'px';
  tip.style.top  = (e.clientY - 30) + 'px';
}

/**
 * Hides the calendar tooltip.
 */
function hideCalTooltip() {
  const tip = document.getElementById('calTooltip');
  if (!tip) return;
  tip.style.opacity = '0';
  tip.setAttribute('aria-hidden', 'true');
}

/**
 * Renders the horizontal category breakdown bar chart for the last 30 days.
 */
function renderBreakdownBars() {
  const container = document.getElementById('breakdownBars');
  if (!container) return;

  const totals = getCategoryTotalsForLastNDays(30);
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  const cats = ['transport', 'energy', 'food', 'shopping'];

  if (grandTotal === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:.88rem;">No data for this month yet. Start logging!</p>';
    return;
  }

  container.innerHTML = cats.map(cat => {
    const cfg = CAT_CONFIG[cat];
    const val = totals[cat];
    const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
    return `
      <div class="breakdown-item">
        <div class="breakdown-header">
          <div class="breakdown-label">
            <div class="breakdown-dot" style="background:${cfg.color};" aria-hidden="true"></div>
            ${cfg.icon} ${cfg.label}
          </div>
          <div class="breakdown-val">${val.toFixed(1)} kg &nbsp;·&nbsp; ${pct.toFixed(0)}%</div>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="background:${cfg.color};width:0%"
            data-target="${pct.toFixed(1)}"
            role="progressbar"
            aria-valuenow="${pct.toFixed(0)}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="${cfg.label}: ${pct.toFixed(0)}%">
          </div>
        </div>
      </div>`;
  }).join('');

  // Animate bars in next frame
  requestAnimationFrame(() => {
    container.querySelectorAll('.breakdown-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  });
}

/**
 * Renders the SVG weekly trend line chart for the last 7 days.
 */
function renderWeeklyChart() {
  const svg = document.getElementById('weeklyChartContent');
  if (!svg) return;

  const W = 520, H = 180;
  const padL = 40, padR = 20, padT = 20, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Gather last 7 days data
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const ds = dateNDaysAgo(i);
    days.push({ ds, label: getDayLabel(ds), total: getDayTotal(ds) });
  }

  const maxVal = Math.max(...days.map(d => d.total), DAILY_TARGET_KG * 1.2, 1);
  const minVal = 0;
  const range = maxVal - minVal;

  const toX = (i) => padL + (i / 6) * chartW;
  const toY = (v) => padT + chartH - ((v - minVal) / range) * chartH;

  // Grid lines
  let gridLines = '';
  for (let gi = 0; gi <= 3; gi++) {
    const gy = padT + (gi / 3) * chartH;
    const gval = (maxVal * (1 - gi / 3)).toFixed(1);
    gridLines += `<line class="chart-grid-line" x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>`;
    gridLines += `<text class="chart-label" x="${padL - 4}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${gval}</text>`;
  }

  // Target line at DAILY_TARGET_KG
  const targetY = toY(DAILY_TARGET_KG).toFixed(1);
  const targetLine = `
    <line class="chart-target-line" x1="${padL}" y1="${targetY}" x2="${W - padR}" y2="${targetY}"/>
    <text class="chart-target-label" x="${(W - padR + 2)}" y="${(parseFloat(targetY) + 3).toFixed(1)}" text-anchor="start">Target (8kg)</text>
  `;

  // Area
  const areaPoints = days.map((d, i) => `${toX(i).toFixed(1)},${toY(d.total).toFixed(1)}`).join(' ');
  const areaPath = `M ${toX(0).toFixed(1)},${toY(days[0].total).toFixed(1)} ` +
    days.slice(1).map((d, i) => `L ${toX(i+1).toFixed(1)},${toY(d.total).toFixed(1)}`).join(' ') +
    ` L ${toX(6).toFixed(1)},${(padT + chartH).toFixed(1)} L ${toX(0).toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  // Polyline
  const polyPoints = days.map((d, i) => `${toX(i).toFixed(1)},${toY(d.total).toFixed(1)}`).join(' ');

  // Dots + labels
  let dots = '';
  let labels = '';
  days.forEach((d, i) => {
    const cx = toX(i).toFixed(1);
    const cy = toY(d.total).toFixed(1);
    dots += `<circle class="chart-dot" cx="${cx}" cy="${cy}" r="4" aria-label="${d.label}: ${d.total.toFixed(1)} kg"/>`;
    labels += `<text class="chart-label" x="${cx}" y="${(padT + chartH + 18).toFixed(1)}" text-anchor="middle">${d.label}</text>`;
  });

  // Axes
  const axes = `
    <line class="chart-axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}"/>
    <line class="chart-axis-line" x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}"/>
  `;

  svg.innerHTML = `
    ${gridLines}
    ${targetLine}
    ${axes}
    <path class="chart-area" d="${areaPath}"/>
    <polyline class="chart-polyline" points="${polyPoints}" fill="none"/>
    ${dots}
    ${labels}
  `;
}

/**
 * Renders the global comparison horizontal bar chart.
 */
function renderComparisonCard() {
  const container = document.getElementById('comparisonBars');
  if (!container) return;

  const month = getTotalForLastNDays(30);
  const yearlyPaceTons = month > 0 ? (month / 30) * 365 / 1000 : null;

  const benchmarks = [
    { label: '🇮🇳 India avg',  val: 1.9,  color: '#059669' },
    { label: '🌍 Global avg',  val: 4.0,  color: '#3b82f6' },
    { label: '🇪🇺 EU avg',     val: 7.0,  color: '#f59e0b' },
    { label: '🇺🇸 US avg',     val: 14.9, color: '#e63946' },
  ];

  const maxVal = 16;
  const userVal = yearlyPaceTons !== null ? yearlyPaceTons : null;

  let rows = '';

  if (userVal !== null) {
    const userPct = Math.min(100, (userVal / maxVal) * 100);
    const userColor = userVal < 2 ? '#10b981' : userVal < 7 ? '#f59e0b' : '#e63946';
    rows += `
      <div class="comp-row highlight">
        <div class="comp-label">📗 You (pace)</div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="background:${userColor};width:${userPct.toFixed(1)}%"
            role="progressbar" aria-valuenow="${userPct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="comp-val">${userVal.toFixed(1)}t</div>
      </div>`;
  }

  rows += benchmarks.map(b => {
    const pct = (b.val / maxVal) * 100;
    return `
      <div class="comp-row">
        <div class="comp-label">${b.label}</div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="background:${b.color};width:${pct.toFixed(1)}%"
            role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="comp-val">${b.val}t</div>
      </div>`;
  }).join('');

  container.innerHTML = rows;
}

// ============================================================
// CHALLENGES PAGE
// ============================================================

/**
 * Picks 3 challenges for today using date-seeded pseudo-random selection.
 * Same date always gives same 3 challenges.
 * @returns {Array} Array of 3 challenge objects
 */
function getTodayChallenges() {
  // Seed from today's date string
  const seed = getTodayString().replace(/-/g, '');
  let rng = parseInt(seed, 10);

  function seededRandom() {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(rng) / 0xffffffff;
  }

  // Fisher-Yates shuffle with seeded rng
  const pool = [...CHALLENGE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 3);
}

/**
 * Returns the completed challenge IDs for today.
 * @returns {string[]}
 */
function getTodayCompletedChallenges() {
  return state.completedChallenges[getTodayString()] || [];
}

/**
 * Marks a challenge as complete (manually or via auto-check).
 * Awards points.
 * @param {string} challengeId
 * @param {number} points
 */
function completeChallenge(challengeId, points) {
  const today = getTodayString();
  if (!state.completedChallenges[today]) state.completedChallenges[today] = [];
  if (!state.completedChallenges[today].includes(challengeId)) {
    state.completedChallenges[today].push(challengeId);
    state.points += points;
    saveState();
    renderChallengesPage();
    updateSidebarStats();
    showToast(`🎉 Challenge complete! +${points} points!`);
  }
}

/**
 * Auto-verifies challenges that can be checked from logged activities.
 * Called after every log add/delete.
 */
function checkAndAutoVerifyChallenges() {
  const today = getTodayString();
  const todayEntries = getActivitiesForDate(today);
  const todayTotal = todayEntries.reduce((s, e) => s + e.co2kg, 0);
  const challenges = getTodayChallenges();
  const completed = getTodayCompletedChallenges();

  challenges.forEach(ch => {
    if (!completed.includes(ch.id) && !ch.manual) {
      try {
        if (ch.autoCheck(todayEntries, todayTotal)) {
          completeChallenge(ch.id, ch.points);
        }
      } catch (err) {
        // Auto-check failed silently
      }
    }
  });
}

/**
 * Renders the full challenges page.
 */
function renderChallengesPage() {
  renderPointsDisplay();
  renderTodayChallenges();
  renderAchievements();
}

/**
 * Renders today's 3 challenge cards.
 */
function renderTodayChallenges() {
  const container = document.getElementById('challengesGrid');
  const dateEl = document.getElementById('challengesDate');
  if (!container) return;

  if (dateEl) dateEl.textContent = formatDateFriendly(getTodayString());

  const challenges = getTodayChallenges();
  const completed = getTodayCompletedChallenges();

  container.innerHTML = challenges.map(ch => {
    const isDone = completed.includes(ch.id);
    return `
      <div class="challenge-card ${isDone ? 'completed' : ''}"
        role="article" aria-label="${ch.title} challenge">
        <div class="challenge-icon" aria-hidden="true">${ch.icon}</div>
        <div class="challenge-content">
          <div class="challenge-title">${ch.title}</div>
          <div class="challenge-desc">${ch.desc}</div>
          <div class="challenge-meta">
            <span class="challenge-points">+${ch.points} pts</span>
            ${isDone
              ? `<span style="font-size:.82rem;color:var(--accent);font-weight:600;">✅ Completed!</span>`
              : `<button class="btn btn-sm btn-outline"
                  onclick="completeChallenge('${ch.id}', ${ch.points})"
                  aria-label="Mark ${ch.title} as complete">
                  Mark Complete
                </button>`
            }
          </div>
        </div>
        ${isDone ? `<div class="challenge-complete-icon" aria-hidden="true">✅</div>` : ''}
      </div>`;
  }).join('');
}

// ============================================================
// AI COACH PAGE
// ============================================================

/**
 * Renders all persisted chat messages to the chat window.
 */
function renderChatMessages() {
  const window_ = document.getElementById('chatWindow');
  if (!window_) return;

  if (state.chatMessages.length === 0) {
    window_.innerHTML = '';
    // Add welcome message
    addAIMessage(buildWelcomeMessage());
    return;
  }

  window_.innerHTML = state.chatMessages.map(m => renderMessageBubble(m)).join('');
  scrollChatToBottom();
}

/**
 * Builds the welcome message string from current state data.
 * @returns {string}
 */
function buildWelcomeMessage() {
  const totalActivities = state.activities.length;
  const uniqueDays = getUniqueDaysLogged(state);
  const month = getTotalForLastNDays(30);
  const yearlyPace = month > 0 ? ((month / 30) * 365 / 1000).toFixed(1) : null;

  if (totalActivities === 0) {
    return `Hi! I'm your Carbon Coach 🌱\n\nWelcome to Carbon Diary! Start logging your daily activities and I'll give you personalized advice based on your actual data.\n\nAsk me anything about carbon footprints, or use the quick questions below!`;
  }

  return `Hi! I'm your Carbon Coach 🌱\n\nI've analyzed your recent logs. You've tracked ${totalActivities} ${totalActivities === 1 ? 'activity' : 'activities'} over ${uniqueDays} ${uniqueDays === 1 ? 'day' : 'days'}.\n\nYour current pace is ${yearlyPace ? yearlyPace + 't' : 'building...'} CO₂/year.\n\nAsk me anything about your carbon footprint or how to reduce it!`;
}

/**
 * Adds a new AI message bubble to state and UI.
 * @param {string} text
 */
function addAIMessage(text) {
  const msg = {
    role: 'ai',
    text,
    timestamp: Date.now(),
  };
  state.chatMessages.push(msg);
  // Keep last 20 messages
  if (state.chatMessages.length > 20) {
    state.chatMessages = state.chatMessages.slice(-20);
  }
  saveState();

  const window_ = document.getElementById('chatWindow');
  if (!window_) return;

  // Remove typing indicator if present
  const typing = window_.querySelector('.typing-indicator');
  if (typing) typing.remove();

  window_.insertAdjacentHTML('beforeend', renderMessageBubble(msg));
  scrollChatToBottom();
}

/**
 * Adds a user message bubble to state and UI.
 * @param {string} text
 */
function addUserMessage(text) {
  const msg = {
    role: 'user',
    text,
    timestamp: Date.now(),
  };
  state.chatMessages.push(msg);
  if (state.chatMessages.length > 20) {
    state.chatMessages = state.chatMessages.slice(-20);
  }
  saveState();

  const window_ = document.getElementById('chatWindow');
  if (!window_) return;

  window_.insertAdjacentHTML('beforeend', renderMessageBubble(msg));
  scrollChatToBottom();
}

/**
 * Returns HTML for a single chat message bubble.
 * @param {{ role: string, text: string, timestamp: number }} msg
 * @returns {string}
 */
function renderMessageBubble(msg) {
  const isAI = msg.role === 'ai';
  const time = formatTime(msg.timestamp);
  const escapedText = escapeHtml(msg.text);
  return `
    <div class="msg ${isAI ? 'ai' : 'user'}" role="article" aria-label="${isAI ? 'Carbon Coach' : 'You'}: message">
      ${isAI ? `<div class="msg-sender" aria-hidden="true">🌱 Carbon Coach</div>` : ''}
      <div class="msg-bubble">${escapedText}</div>
      <div class="msg-time" aria-label="Sent at ${time}">${time}</div>
    </div>`;
}

/**
 * Shows the typing indicator in the chat window.
 */
function showTypingIndicator() {
  const window_ = document.getElementById('chatWindow');
  if (!window_) return;

  window_.insertAdjacentHTML('beforeend', `
    <div class="typing-indicator" aria-label="Carbon Coach is thinking">
      <div class="typing-dot" aria-hidden="true"></div>
      <div class="typing-dot" aria-hidden="true"></div>
      <div class="typing-dot" aria-hidden="true"></div>
    </div>`);
  scrollChatToBottom();
}

/**
 * Scrolls the chat window to the bottom.
 */
function scrollChatToBottom() {
  const window_ = document.getElementById('chatWindow');
  if (window_) window_.scrollTop = window_.scrollHeight;
}

/**
 * Handles sending a chat message — adds user bubble, generates AI response.
 * @param {string} message
 */
function handleChatMessage(message) {
  const text = (message || '').trim();
  if (!text) return;

  // Clear input
  const input = document.getElementById('chatInput');
  if (input) input.value = '';

  addUserMessage(text);
  showTypingIndicator();

  // Delay for "thinking" effect
  setTimeout(() => {
    const response = generateCoachResponse(text.toLowerCase());
    addAIMessage(response);
  }, 1200);
}

/**
 * Returns a weekly improvement tip for a given category.
 * @param {string} category
 * @returns {string}
 */
function getWeeklyTip(category) {
  const tips = {
    transport: 'Plan your week to batch car trips — combining errands cuts mileage significantly.',
    energy: 'Set your thermostat 1°C lower this week and see the difference in your logs.',
    food: 'Try a plant-based lunch every day this week — each swap saves ~0.5–1.5kg CO₂.',
    shopping: 'Before buying anything online, wait 24 hours — it reduces impulse purchases.',
  };
  return tips[category] || 'Review your logs and identify one activity you can reduce tomorrow.';
}

/**
 * Returns a diagnostic tip for a category based on kg amount.
 * @param {string} category
 * @param {number} kg
 * @returns {string}
 */
function getDiagTip(category, kg) {
  const tips = {
    transport: kg > 3 ? 'Consider transit or cycling for some of today\'s trips.' : 'Your transport today is reasonable — keep it up!',
    energy: kg > 2 ? 'Try reducing appliance usage this afternoon.' : 'Good energy discipline today!',
    food: kg > 5 ? 'Consider plant-based for your next meal today.' : 'Nice food choices today!',
    shopping: kg > 5 ? 'Shopping adds up — consider if each purchase is essential.' : 'Minimal shopping today — great!',
  };
  return tips[category] || 'Keep logging to get more personalised advice!';
}

// ============================================================
// THEME & SIDEBAR
// ============================================================

/**
 * Applies the saved theme to the HTML element.
 */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme || 'light');
  updateThemeButton();
}

/**
 * Toggles between light and dark theme.
 */
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  saveState();
}

/**
 * Updates the theme toggle button label and icon.
 */
function updateThemeButton() {
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (state.theme === 'dark') {
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Light Mode';
  } else {
    if (icon) icon.textContent = '🌙';
    if (label) label.textContent = 'Dark Mode';
  }
}

/**
 * Opens the mobile sidebar overlay.
 */
function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('menuToggle');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

/**
 * Closes the mobile sidebar overlay.
 */
function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('menuToggle');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

/**
 * Updates the quick stats displayed in the sidebar.
 */
function updateSidebarStats() {
  const today = getDayTotal(getTodayString());
  const month = getTotalForLastNDays(30);
  const streak = state.streak.current;

  const todayEl = document.getElementById('sidebarToday');
  const monthEl = document.getElementById('sidebarMonth');
  const streakEl = document.getElementById('sidebarStreakText');

  if (todayEl) todayEl.textContent = `${today.toFixed(1)} kg`;
  if (monthEl) monthEl.textContent = `${month.toFixed(1)} kg`;
  if (streakEl) {
    streakEl.textContent = streak > 0
      ? `${streak} Day Streak!`
      : 'Start your streak today!';
  }
}

// ============================================================
// STREAK & GAMIFICATION
// ============================================================

/**
 * Recalculates and updates the streak based on when user last logged.
 * Called on page load and after every new activity is added.
 */
function updateStreak() {
  const today = getTodayString();
  const yesterday = dateNDaysAgo(1);
  const lastLog = state.streak.lastLogDate;

  const todayActivities = getActivitiesForDate(today);
  const hasLoggedToday = todayActivities.length > 0;

  if (!lastLog) {
    // First time ever — initialise cleanly so current is always a number
    state.streak.current = hasLoggedToday ? 1 : 0;
    if (hasLoggedToday) state.streak.lastLogDate = today;
  } else if (lastLog === today) {
    // Already counted today — no change needed
  } else if (lastLog === yesterday) {
    // Streak continues only if user has also logged today
    if (hasLoggedToday) {
      state.streak.current = (state.streak.current || 0) + 1;
      state.streak.lastLogDate = today;
    }
    // If not logged today yet: streak pending, not broken
  } else {
    // Gap detected — reset; restart from 1 if they log today
    if (hasLoggedToday) {
      state.streak.current = 1;
      state.streak.lastLogDate = today;
    } else {
      state.streak.current = 0;
      state.streak.lastLogDate = null;
    }
  }
}

/**
 * Checks all achievement conditions against current state and unlocks any earned ones.
 */
function checkAchievements() {
  let changed = false;
  ACHIEVEMENTS.forEach(ach => {
    if (!state.unlockedAchievements) state.unlockedAchievements = [];
    if (!state.unlockedAchievements.includes(ach.id) && ach.check(state)) {
      state.unlockedAchievements.push(ach.id);
      changed = true;
      showToast(`🏆 Achievement unlocked: ${ach.name}!`);
    }
  });
  if (changed) {
    saveState();
    renderAchievements();
  }
}

/**
 * Renders the achievement wall with locked/unlocked states.
 */
function renderAchievements() {
  const container = document.getElementById('achievementsGrid');
  if (!container) return;

  const unlocked = state.unlockedAchievements || [];

  container.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `
      <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}"
        role="article"
        aria-label="${ach.name}: ${isUnlocked ? 'Unlocked' : 'Locked'}">
        <div class="achievement-emoji" aria-hidden="true">${ach.emoji}</div>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        ${isUnlocked ? `<div class="achievement-unlocked-badge">Unlocked ✓</div>` : ''}
      </div>`;
  }).join('');
}

/**
 * Renders the streak banner with green/red/neutral state.
 * @param {number} todayTotal - Today's CO2 total in kg
 */
function renderStreakBanner(todayTotal) {
  const banner = document.getElementById('streakBanner');
  const text = document.getElementById('streakBannerText');
  if (!banner || !text) return;

  const streak = state.streak.current;
  const hasLoggedToday = getActivitiesForDate(getTodayString()).length > 0;

  banner.className = 'streak-banner';

  if (!hasLoggedToday) {
    banner.classList.add('neutral');
    text.textContent = '🌱 Start logging to build your green streak!';
  } else if (todayTotal < DAILY_TARGET_KG) {
    banner.classList.add('green');
    text.textContent = `🔥 ${streak} Day Green Streak! You're under the ${DAILY_TARGET_KG}kg daily target.`;
  } else {
    banner.classList.add('red');
    text.textContent = `⚠️ ${streak} Day Streak — Today is above ${DAILY_TARGET_KG}kg. Keep logging to improve!`;
  }
}

/**
 * Shows a brief toast notification and announces it to screen readers.
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  
  // Dedicated screen reader announcement
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    // Briefly clear and set to force voiceover re-announcement
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = message; }, 50);
  }
}

/**
 * Renders the points and level display.
 */
function renderPointsDisplay() {
  const points = state.points;
  const pointsEl = document.getElementById('pointsDisplay');
  if (pointsEl) pointsEl.textContent = points;

  // Determine current level
  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) { currentLevel = LEVELS[i]; break; }
  }

  const levelBadge = document.getElementById('levelBadge');
  if (levelBadge) levelBadge.textContent = currentLevel.name;

  // Progress bar
  const fill = document.getElementById('levelProgressFill');
  const bar = document.getElementById('levelProgressBar');
  const text = document.getElementById('levelProgressText');

  if (currentLevel.max === Infinity) {
    if (fill) fill.style.width = '100%';
    if (bar) bar.setAttribute('aria-valuenow', '100');
    if (text) text.textContent = 'Max level reached! 🌲';
  } else {
    const rangeMin = currentLevel.min;
    const rangeMax = currentLevel.max + 1;
    const pct = ((points - rangeMin) / (rangeMax - rangeMin)) * 100;
    if (fill) fill.style.width = `${pct.toFixed(1)}%`;
    if (bar) bar.setAttribute('aria-valuenow', pct.toFixed(0));

    const nextLevel = LEVELS[LEVELS.findIndex(l => l === currentLevel) + 1];
    if (text && nextLevel) text.textContent = `${rangeMax - points} pts to ${nextLevel.name}`;
  }
}


// ============================================================
// HELPERS & DATA QUERIES
// ============================================================

/**
 * Returns a date string N days ago in YYYY-MM-DD format.
 * @param {number} daysAgo
 * @returns {string}
 */
function dateNDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/**
 * Formats a YYYY-MM-DD string as "Monday, June 9" style.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateFriendly(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Formats a YYYY-MM-DD string as "Jun 9" style.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a timestamp as "HH:MM" time string.
 * @param {number} ts - Unix timestamp in ms
 * @returns {string}
 */
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Returns the day-of-week abbreviation for a date string.
 * @param {string} dateStr
 * @returns {string}
 */
function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Returns all activities for a specific date string.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Array}
 */
function getActivitiesForDate(dateStr) {
  return state.activities.filter(a => a.date === dateStr);
}

/**
 * Returns the total CO2 for a given date.
 * @param {string} dateStr
 * @returns {number}
 */
function getDayTotal(dateStr) {
  return getActivitiesForDate(dateStr).reduce((sum, a) => sum + a.co2kg, 0);
}

/**
 * Returns total CO2 across the last N days (including today).
 * @param {number} days
 * @returns {number}
 */
function getTotalForLastNDays(days) {
  let total = 0;
  for (let i = 0; i < days; i++) {
    total += getDayTotal(dateNDaysAgo(i));
  }
  return total;
}

/**
 * Returns per-category totals for the last N days.
 * @param {number} days
 * @returns {{ transport: number, energy: number, food: number, shopping: number }}
 */
function getCategoryTotalsForLastNDays(days) {
  const result = { transport: 0, energy: 0, food: 0, shopping: 0 };
  const cutoff = dateNDaysAgo(days - 1);
  state.activities
    .filter(a => a.date >= cutoff)
    .forEach(a => { if (result[a.category] !== undefined) result[a.category] += a.co2kg; });
  return result;
}

/**
 * Returns the total count of all activities ever logged.
 * @param {object} s - state object
 * @returns {number}
 */
function getTotalActivities(s) {
  return s.activities.length;
}

/**
 * Returns the count of unique days that have at least one logged activity.
 * @param {object} s
 * @returns {number}
 */
function getUniqueDaysLogged(s) {
  return new Set(s.activities.map(a => a.date)).size;
}

/**
 * Counts how many times a specific activityType was logged.
 * @param {object} s
 * @param {string} type
 * @returns {number}
 */
function countActivityType(s, type) {
  return s.activities.filter(a => a.activityType === type).reduce((sum, a) => sum + a.quantity, 0);
}

/**
 * Checks if the user ever had a day under a given threshold.
 * @param {object} s
 * @param {number} threshold
 * @returns {boolean}
 */
function hasHadDayUnder(s, threshold) {
  const days = {};
  s.activities.forEach(a => {
    if (!days[a.date]) days[a.date] = 0;
    days[a.date] += a.co2kg;
  });
  return Object.values(days).some(v => v > 0 && v < threshold);
}

/**
 * Returns total walking/cycling km logged across all activities.
 * @param {object} s
 * @returns {number}
 */
function totalCyclingKm(s) {
  return s.activities
    .filter(a => a.activityType === 'Walking/Cycling')
    .reduce((sum, a) => sum + a.quantity, 0);
}

/**
 * Checks if user has had N consecutive flight-free logged days.
 * @param {object} s
 * @param {number} n
 * @returns {boolean}
 */
function hasFlightFreeStreak(s, n) {
  const loggedDates = [...new Set(s.activities.map(a => a.date))].sort();
  if (loggedDates.length < n) return false;

  let consecutive = 0;
  for (const date of loggedDates) {
    const hasFlights = s.activities.some(a =>
      a.date === date && (a.activityType === 'Domestic flight' || a.activityType === 'Long-haul flight')
    );
    if (!hasFlights) {
      consecutive++;
      if (consecutive >= n) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

/**
 * Finds the category with the highest total CO2 in the last 30 days.
 * @returns {{ category: string, total: number }}
 */
function getBiggestCategory() {
  const totals = getCategoryTotalsForLastNDays(30);
  let biggest = 'transport';
  let max = 0;
  Object.entries(totals).forEach(([cat, total]) => {
    if (total > max) { max = total; biggest = cat; }
  });
  return { category: biggest, total: max };
}

