import { I18N, DEFAULT_PILLARS, DEFAULT_EVENTS, DEFAULT_CHAMPIONS } from './data.js';
import {
  playTierSound,
  speakText,
  stopSpeaking,
  toggleVoiceRecognition,
  generateSmartCoachResponse
} from './voice-audio.js';
import {
  requestNotificationPermission,
  triggerSmartNotification,
  startScheduleWatcher,
  getGoogleCalendarUrl,
  downloadIcsFile
} from './calendar-notifications.js';

const STORAGE_KEY = 'better_me_state_v1';

const TIER_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50
};

const QURAN_TIER_PAGES = {
  bronze: 1,
  silver: 5,
  gold: 20
};

function getTodayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDefaultHistory() {
  const hist = {};
  const now = new Date();
  // Seed last 5 days as completed to match the default 6-day streak
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    hist[`${y}-${m}-${day}`] = 3;
  }
  return hist;
}

function loadInitialState() {
  const todayIso = getTodayIso();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const st = {
        lang: parsed.lang || 'en',
        micLang: parsed.micLang || 'ar-EG',
        theme: parsed.theme || 'dark',
        voiceEnabled: parsed.voiceEnabled !== undefined ? parsed.voiceEnabled : true,
        voiceSettings: parsed.voiceSettings || { engine: 'cloud', rate: 1.0 },
        aiConfig: parsed.aiConfig || { geminiKey: '', openaiKey: '' },
        lowEnergyMode: Boolean(parsed.lowEnergyMode),
        activeTab: parsed.activeTab || 'today',
        boardMode: parsed.boardMode || 'squad',
        user: parsed.user || { name: 'Karim', email: 'karim@nawwa.app', onboarded: true },
        points: typeof parsed.points === 'number' ? parsed.points : 285,
        streak: typeof parsed.streak === 'number' ? parsed.streak : 6,
        lastActiveDate: parsed.lastActiveDate || todayIso,
        history: parsed.history || buildDefaultHistory(),
        pillars: Array.isArray(parsed.pillars) && parsed.pillars.length ? parsed.pillars : structuredClone(DEFAULT_PILLARS),
        completedToday: parsed.completedToday || {},
        events: Array.isArray(parsed.events) ? parsed.events : structuredClone(DEFAULT_EVENTS),
        champions: parsed.champions || structuredClone(DEFAULT_CHAMPIONS),
        chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : []
      };
      return checkDailyRollover(st);
    }
  } catch (_) {}

  return {
    lang: 'en',
    micLang: 'ar-EG',
    theme: 'dark',
    voiceEnabled: true,
    voiceSettings: { engine: 'cloud', rate: 1.0 },
    aiConfig: { geminiKey: '', openaiKey: '' },
    lowEnergyMode: false,
    activeTab: 'today',
    boardMode: 'squad',
    user: { name: 'Karim', email: 'karim@nawwa.app', onboarded: true },
    points: 285,
    streak: 6,
    lastActiveDate: todayIso,
    history: buildDefaultHistory(),
    pillars: structuredClone(DEFAULT_PILLARS),
    completedToday: {},
    events: structuredClone(DEFAULT_EVENTS),
    champions: structuredClone(DEFAULT_CHAMPIONS),
    chatHistory: []
  };
}

function checkDailyRollover(st) {
  const todayIso = getTodayIso();
  if (st.lastActiveDate && st.lastActiveDate !== todayIso) {
    const prevCount = Object.keys(st.completedToday || {}).length;
    st.history = st.history || {};
    st.history[st.lastActiveDate] = prevCount;
    if (prevCount > 0) {
      st.streak = (st.streak || 0) + 1;
    }
    st.completedToday = {};
    st.lowEnergyMode = false;
    st.lastActiveDate = todayIso;
  }
  return st;
}

let state = loadInitialState();
let urgeTimerInterval = null;
let urgeSecondsLeft = 180;
let procTimerInterval = null;
let procSecondsLeft = 300;

function saveState() {
  try {
    state.history = state.history || {};
    state.history[getTodayIso()] = Object.keys(state.completedToday || {}).length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function t(key) {
  const dict = I18N[state.lang] || I18N.en;
  return dict[key] || I18N.en[key] || key;
}

function localText(objOrStr) {
  if (!objOrStr) return '';
  if (typeof objOrStr === 'string') return objOrStr;
  return objOrStr[state.lang] || objOrStr.en || objOrStr.ar || '';
}

export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 4200);
}

export function launchConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  const colors = ['#10b981', '#38bdf8', '#facc15', '#f43f5e', '#a855f7', '#34d399'];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.1}s`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 3100);
  }
}

// Apply Document Language, RTL/LTR Direction, Theme, and Static Translations
function renderShellStrings() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('data-theme', state.theme);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('ui-app-name', t('appName'));
  setTxt('ui-app-tagline', t('appTagline'));
  setTxt('ui-sos-btn', t('sosButton'));
  setTxt('ui-lang-toggle', t('langToggle'));
  setTxt('ui-voice-label', state.voiceEnabled ? t('voiceOn') : t('voiceOff'));
  setTxt('voice-icon', state.voiceEnabled ? '🔊' : '🔇');
  setTxt('theme-icon', state.theme === 'dark' ? '☀️' : '🌙');

  const voiceBtn = document.getElementById('btn-voice-toggle');
  if (voiceBtn) {
    voiceBtn.classList.toggle('active-toggle', state.voiceEnabled);
  }

  // Greeting
  const hour = new Date().getHours();
  let greetKey = 'greetingEvening';
  if (hour < 12) greetKey = 'greetingMorning';
  else if (hour < 17) greetKey = 'greetingAfternoon';

  setTxt('ui-greeting', `${t(greetKey)}, ${state.user.name}! 👋`);
  setTxt('ui-momentum-subtitle', t('momentumSubtitle'));
  setTxt('stat-points', state.points);
  setTxt('ui-points-label', t('pointsLabel'));
  setTxt('stat-streak', state.streak);
  setTxt('ui-streak-label', t('streakLabel'));
  setTxt('ui-daily-progress', t('dailyProgress'));
  setTxt('ui-weekly-momentum-title', t('weeklyMomentumTitle'));

  // Low-energy banner
  setTxt('ui-low-energy-status', state.lowEnergyMode ? t('lowEnergyActive') : t('lowEnergyPrompt'));
  setTxt('ui-low-energy-btn', state.lowEnergyMode ? t('restoreNormalMode') : t('switchLowEnergy'));

  // Tabs
  setTxt('ui-tab-today', t('tabToday'));
  setTxt('ui-tab-coach', t('tabCoach'));
  setTxt('ui-tab-calendar', t('tabCalendar'));
  setTxt('ui-tab-champions', t('tabChampions'));
  setTxt('ui-tab-profile', t('tabProfile'));

  // Today headers
  setTxt('ui-active-pillars-title', t('activePillarsTitle'));
  setTxt('ui-add-custom-pillar', t('addCustomPillarBtn'));
  setTxt('ui-add-custom-pillar-2', t('addCustomPillarBtn'));
  setTxt('ui-manage-pillars', t('managePillarsBtn'));

  // Coach headers
  setTxt('ui-coach-title', t('coachTitle'));
  setTxt('ui-coach-subtitle', t('coachSubtitle'));
  setTxt('ui-stop-speaking', t('stopVoiceBtn'));
  setTxt('ui-clear-chat', t('clearChatBtn'));
  setTxt('ui-ai-settings-btn', t('aiSettingsBtn'));
  setTxt('ui-mic-status', t('micIdle'));
  setTxt('ui-send-btn', t('sendBtn'));
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = t('chatPlaceholder');

  // Calendar headers
  setTxt('ui-calendar-title', t('calendarTitle'));
  setTxt('ui-calendar-subtitle', t('calendarSubtitle'));
  const notifGranted = 'Notification' in window && Notification.permission === 'granted';
  setTxt('ui-enable-notif', notifGranted ? t('notifEnabledBadge') : t('enableNotifBtn'));
  setTxt('ui-test-notif', t('testNotifBtn'));
  setTxt('ui-add-event-title', t('addEventTitle'));
  setTxt('ui-add-event-btn', t('addEventBtn'));
  setTxt('ui-export-ics', t('exportIcsBtn'));
  const evTitleInput = document.getElementById('event-title-input');
  if (evTitleInput) evTitleInput.placeholder = t('eventTitlePlaceholder');

  // Champions headers
  setTxt('ui-champions-title', t('championsTitle'));
  setTxt('ui-champions-subtitle', t('championsSubtitle'));
  setTxt('ui-squad-code-label', t('squadCodeLabel'));
  setTxt('squad-code-display', state.champions.squadCode);
  setTxt('ui-copy-code', t('copyCodeBtn'));
  setTxt('ui-join-squad', t('joinSquadBtn'));
  setTxt('ui-tab-squad', t('tabSquad'));
  setTxt('ui-tab-global', t('tabGlobal'));

  // Profile & Onboarding headers
  setTxt('ui-profile-title', t('profileTitle'));
  setTxt('ui-signed-in-as', t('signedInAs'));
  setTxt('profile-user-display', state.user.name);
  setTxt('profile-email-display', state.user.email);
  setTxt('ui-switch-account', t('switchAccountBtn'));
  setTxt('ui-export-backup', t('exportBackupBtn'));
  setTxt('ui-logout-btn', t('logoutBtn'));
  setTxt('ui-select-pillars-heading', t('selectPillarsHeading'));
  setTxt('onboarding-subtitle', t('onboardingSubtitle'));
  setTxt('ui-onboarding-submit', t('onboardingSubmitBtn'));

  // Custom Pillar Modal placeholders
  const setPh = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  };
  setPh('cp-name-en', 'customNameEn');
  setPh('cp-name-ar', 'customNameAr');
  setPh('cp-habit-title', 'customHabitName');
  setPh('cp-bronze', 'customBronze');
  setPh('cp-silver', 'customSilver');
  setPh('cp-gold', 'customGold');
  setPh('cp-unit', 'customUnit');

  // Modals
  setTxt('ui-sos-modal-title', t('sosModalTitle'));
  setTxt('ui-sos-tab-urge', t('sosTabUrge'));
  setTxt('ui-sos-tab-proc', t('sosTabProcrastinate'));
  setTxt('ui-sos-tab-energy', t('sosTabEnergy'));
  setTxt('ui-urge-desc', t('urgeDesc'));
  setTxt('ui-start-urge-timer', urgeTimerInterval ? t('stopTimer') : t('startUrgeTimer'));
  setTxt('ui-reset-urge-timer', t('resetTimerBtn'));
  setTxt('ui-proc-desc', t('procDesc'));
  setTxt('ui-proc-generate-btn', t('procGenerateBtn'));
  setTxt('ui-low-energy-sos-desc', t('lowEnergySosDesc'));
  setTxt('ui-activate-bronze-now', t('activateBronzeNow'));
  const procInput = document.getElementById('proc-task-input');
  if (procInput) procInput.placeholder = t('procInputPlaceholder');

  setTxt('ui-custom-pillar-modal-title', t('customPillarModalTitle'));
  setTxt('ui-save-pillar-btn', t('savePillarBtn'));
  setTxt('btn-cancel-custom-pillar', t('cancelBtn'));
}

// Render 7-Day Weekly Seed Momentum Strip
function renderWeeklyStrip() {
  const strip = document.getElementById('weekly-momentum-strip');
  if (!strip) return;
  strip.innerHTML = '';

  const daysNames = t('daysShort');
  const now = new Date();
  const todayIso = getTodayIso();
  state.history = state.history || {};
  state.history[todayIso] = Object.keys(state.completedToday || {}).length;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    const count = state.history[iso] || 0;
    const isToday = iso === todayIso;

    const cell = document.createElement('div');
    cell.className = `day-cell ${count > 0 ? 'done' : ''} ${isToday ? 'today' : ''}`;
    const dayLabel = Array.isArray(daysNames) ? daysNames[d.getDay()] : d.getDate();
    cell.innerHTML = `
      <span>${escapeHtml(dayLabel)}</span>
      <span>${count > 0 ? '🌱' : '·'}</span>
    `;
    strip.appendChild(cell);
  }
}

// Calculate & Render Daily Habit Progress
function renderProgress() {
  const activePillars = state.pillars.filter((p) => p.active);
  let totalHabits = 0;
  let completedCount = 0;

  activePillars.forEach((p) => {
    p.habits.forEach((h) => {
      totalHabits++;
      if (state.completedToday[h.id]) completedCount++;
    });
  });

  const pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const txtEl = document.getElementById('stat-progress-text');
  const barEl = document.getElementById('stat-progress-bar');
  if (txtEl) txtEl.textContent = `${completedCount} / ${totalHabits} (${pct}%)`;
  if (barEl) barEl.style.width = `${pct}%`;

  renderWeeklyStrip();
  return { completedCount, totalHabits, pct };
}

let spotlightIndex = 0;

function renderSpotlightAndFilter(activePillars) {
  const spotEl = document.getElementById('one-seed-spotlight');
  const filterEl = document.getElementById('pillar-filter-bar');

  // 1. Render Pillar Filter Chips
  if (filterEl) {
    filterEl.innerHTML = '';
    const currentFilter = state.selectedPillarFilter || 'all';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `filter-chip ${currentFilter === 'all' ? 'active' : ''}`;
    allBtn.textContent = `🌱 ${t('filterAll')} (${activePillars.length})`;
    allBtn.addEventListener('click', () => {
      state.selectedPillarFilter = 'all';
      renderPillars();
    });
    filterEl.appendChild(allBtn);

    activePillars.forEach((p) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `filter-chip ${currentFilter === p.id ? 'active' : ''}`;
      chip.textContent = `${p.icon} ${localText(p.name)}`;
      chip.addEventListener('click', () => {
        state.selectedPillarFilter = p.id;
        renderPillars();
      });
      filterEl.appendChild(chip);
    });
  }

  // 2. Render "Just 1 Seed Now" Anti-Overwhelm Spotlight
  if (!spotEl) return;
  const uncompleted = [];
  activePillars.forEach((p) => {
    p.habits.forEach((h) => {
      if (!state.completedToday[h.id]) {
        uncompleted.push({ pillar: p, habit: h });
      }
    });
  });

  if (uncompleted.length === 0) {
    spotEl.innerHTML = `
      <div style="font-weight: 800; color: var(--green-400); font-size: 0.94rem;">
        ${escapeHtml(t('spotlightAllDone'))}
      </div>
    `;
    return;
  }

  const pick = uncompleted[spotlightIndex % uncompleted.length];
  const bronzeText = localText(pick.habit.tiers.bronze);

  spotEl.innerHTML = `
    <div style="flex: 1; min-width: 210px;">
      <div style="font-size: 0.78rem; font-weight: 800; color: var(--blue-400); margin-bottom: 3px;">
        ${escapeHtml(t('spotlightTitle'))}
      </div>
      <div style="font-size: 0.96rem; font-weight: 800;">
        ${escapeHtml(pick.pillar.icon)} ${escapeHtml(bronzeText)}
      </div>
      <div style="font-size: 0.76rem; color: var(--text-muted);">
        ${escapeHtml(localText(pick.habit.name))}
      </div>
    </div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <button type="button" id="btn-spotlight-do" class="btn-primary" style="padding: 8px 14px; font-size: 0.82rem;">
        ${escapeHtml(t('spotlightDoBtn'))}
      </button>
      <button type="button" id="btn-spotlight-next" class="btn-secondary" style="padding: 8px 12px; font-size: 0.8rem;">
        ${escapeHtml(t('spotlightNextBtn'))}
      </button>
    </div>
  `;

  spotEl.querySelector('#btn-spotlight-do')?.addEventListener('click', () => {
    handleSelectHabitTier(pick.pillar, pick.habit, 'bronze');
  });

  spotEl.querySelector('#btn-spotlight-next')?.addEventListener('click', () => {
    spotlightIndex++;
    renderSpotlightAndFilter(activePillars);
  });
}

// Render Active Life Pillars & 3-Tier Habits + Mini-Trackers
function renderPillars() {
  const container = document.getElementById('pillars-container');
  if (!container) return;
  container.innerHTML = '';

  const activePillars = state.pillars.filter((p) => p.active);
  renderSpotlightAndFilter(activePillars);

  const currentFilter = state.selectedPillarFilter || 'all';
  const visiblePillars =
    currentFilter === 'all' || !activePillars.some((p) => p.id === currentFilter)
      ? activePillars
      : activePillars.filter((p) => p.id === currentFilter);

  visiblePillars.forEach((pillar) => {
    const card = document.createElement('article');
    card.className = `pillar-card ${state.lowEnergyMode ? 'low-energy-highlight' : ''}`;

    const isCustom = String(pillar.id).startsWith('custom_');
    const deleteCustomBtn = isCustom
      ? `<button type="button" class="mini-btn" data-del-pillar="${escapeHtml(pillar.id)}" title="${escapeHtml(t('deletePillarBtn'))}" style="color: #fb7185;">✕</button>`
      : '';

    const header = document.createElement('div');
    header.className = 'pillar-header';
    header.innerHTML = `
      <div class="pillar-title-group">
        <div class="pillar-icon">${escapeHtml(pillar.icon)}</div>
        <div>
          <h4 class="pillar-name">${escapeHtml(localText(pillar.name))}</h4>
          <p class="pillar-desc">${escapeHtml(localText(pillar.desc))}</p>
        </div>
      </div>
      ${deleteCustomBtn}
    `;

    const delBtn = header.querySelector('[data-del-pillar]');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        state.pillars = state.pillars.filter((p) => p.id !== pillar.id);
        saveState();
        renderAll();
      });
    }

    card.appendChild(header);

    // Habits list
    pillar.habits.forEach((habit) => {
      const currentTier = state.completedToday[habit.id] || null;
      const habitBox = document.createElement('div');
      habitBox.className = 'habit-item';

      const statusBadge = currentTier
        ? `<span class="habit-status-badge" style="background: rgba(16,185,129,0.2); color: var(--green-400);">✓ ${escapeHtml(t('completedBadge'))} (${escapeHtml(currentTier.toUpperCase())})</span>`
        : `<span class="habit-status-badge" style="background: rgba(148,163,184,0.15); color: var(--text-muted);">${escapeHtml(t('pendingBadge'))}</span>`;

      habitBox.innerHTML = `
        <div class="habit-top">
          <span class="habit-name">${escapeHtml(localText(habit.name))}</span>
          ${statusBadge}
        </div>
      `;

      const tiersGrid = document.createElement('div');
      tiersGrid.className = 'tiers-grid';

      ['bronze', 'silver', 'gold'].forEach((tierKey) => {
        const isSelected = currentTier === tierKey;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tier-btn tier-${tierKey} ${isSelected ? 'selected' : ''}`;
        const labelKey = `${tierKey}Label`;
        const medal = tierKey === 'bronze' ? '🥉' : tierKey === 'silver' ? '🥈' : '🥇';

        btn.innerHTML = `
          <div class="tier-btn-header">
            <span class="tier-label">${medal} ${escapeHtml(t(labelKey))}</span>
            <span>${isSelected ? '✓' : ''}</span>
          </div>
          <div class="tier-btn-desc">${escapeHtml(localText(habit.tiers[tierKey]))}</div>
        `;

        btn.addEventListener('click', () => handleSelectHabitTier(pillar, habit, tierKey));
        tiersGrid.appendChild(btn);
      });

      habitBox.appendChild(tiersGrid);
      card.appendChild(habitBox);
    });

    // Specialized Pillar Mini-Tracker
    if (pillar.tracker) {
      const tracker = pillar.tracker;
      const extraInfo =
        pillar.id === 'smoking'
          ? state.lang === 'ar'
            ? ` (وفّرت تقريباً ${tracker.value * 15} ج.م / $${(tracker.value * 0.5).toFixed(1)})`
            : ` (~$${(tracker.value * 0.5).toFixed(2)} saved!)`
          : '';

      const trackerDiv = document.createElement('div');
      trackerDiv.className = 'mini-tracker';
      trackerDiv.innerHTML = `
        <div class="tracker-info">
          <span>📊 ${escapeHtml(localText(tracker.label))}:</span>
          <span class="tracker-value"> ${tracker.value} / ${tracker.goal} ${escapeHtml(localText(tracker.unit))}${escapeHtml(extraInfo)}</span>
        </div>
        <div class="tracker-controls">
          <button type="button" class="mini-btn" data-action="dec">− ${tracker.step}</button>
          <button type="button" class="mini-btn" data-action="inc">+ ${tracker.step}</button>
        </div>
      `;

      trackerDiv.querySelector('[data-action="dec"]').addEventListener('click', () => {
        tracker.value = Math.max(0, tracker.value - tracker.step);
        saveState();
        renderPillars();
      });

      trackerDiv.querySelector('[data-action="inc"]').addEventListener('click', () => {
        tracker.value = tracker.value + tracker.step;
        state.points += 5;
        playTierSound('bronze');
        saveState();
        renderShellStrings();
        renderPillars();
        renderLeaderboard();
      });

      card.appendChild(trackerDiv);
    }

    container.appendChild(card);
  });

  renderProgress();
}

function handleSelectHabitTier(pillar, habit, tierKey) {
  const prevTier = state.completedToday[habit.id];

  // Uncheck if clicking the already selected tier
  if (prevTier === tierKey) {
    state.points = Math.max(0, state.points - TIER_POINTS[prevTier]);
    if (pillar.id === 'faith' && habit.id === 'faith_quran' && pillar.tracker) {
      const removePages = QURAN_TIER_PAGES[prevTier] || 0;
      pillar.tracker.value = Math.max(0, pillar.tracker.value - removePages);
    }
    delete state.completedToday[habit.id];
    saveState();
    renderShellStrings();
    renderPillars();
    renderLeaderboard();
    return;
  }

  // Adjust points & Quran page delta accurately
  if (prevTier) {
    state.points = Math.max(0, state.points - TIER_POINTS[prevTier]);
  }
  state.completedToday[habit.id] = tierKey;
  const gained = TIER_POINTS[tierKey];
  state.points += gained;

  if (pillar.id === 'faith' && habit.id === 'faith_quran' && pillar.tracker) {
    const oldPages = prevTier ? (QURAN_TIER_PAGES[prevTier] || 0) : 0;
    const newPages = QURAN_TIER_PAGES[tierKey] || 1;
    pillar.tracker.value = Math.min(604, Math.max(0, pillar.tracker.value + (newPages - oldPages)));
  }

  playTierSound(tierKey);
  saveState();
  renderShellStrings();
  renderPillars();
  renderLeaderboard();

  const { pct } = renderProgress();
  if (tierKey === 'gold' || pct === 100) {
    launchConfetti();
  }

  const msg =
    state.lang === 'ar'
      ? `أحسنت يا ${state.user.name}! أتممت المستوى الـ${tierKey === 'bronze' ? 'برونزي' : tierKey === 'silver' ? 'فضي' : 'ذهبي'} (+${gained} نقطة)`
      : `Awesome job, ${state.user.name}! Unlocked ${tierKey.toUpperCase()} (+${gained} pts)`;

  showToast(`🎉 ${msg}`);
  speakText(msg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
}

function getDefaultWelcomeMessage() {
  return state.lang === 'ar'
    ? `أهلاً بك يا ${state.user.name} في تطبيق نَوَاة (Nawwa)! أنا مدربك الذكي. اختر لهجتك بالاعلى (عربي مصر، فصحى، أو إنجليزي)، اضغط على الميكروفون وتحدث معي بحرية في أي موضوع—سواء كنت تشعر بالتسويف، أو قرأت وردك من القرآن الكريم، أو تريد جدولة موعد في تقويمك!`
    : `Welcome to Nawwa (نواة), ${state.user.name}! I'm your real-time AI Life Coach. Pick your spoken dialect above (Egyptian Arabic, MSA, or English), tap the mic, and talk to me naturally about anything—I can coach you and even log habits or schedule calendar reminders for you!`;
}

// Render Voice Coach & Chat
function renderCoachSection() {
  document.querySelectorAll('.mic-lang-btn').forEach((btn) => {
    btn.classList.toggle('active-toggle', btn.getAttribute('data-miclang') === state.micLang);
  });

  const engineSel = document.getElementById('select-tts-engine');
  if (engineSel && state.voiceSettings) engineSel.value = state.voiceSettings.engine || 'cloud';
  const rateSel = document.getElementById('select-tts-rate');
  if (rateSel && state.voiceSettings) rateSel.value = String(state.voiceSettings.rate || 1.0);
  const gemInput = document.getElementById('input-gemini-key');
  if (gemInput && state.aiConfig) gemInput.value = state.aiConfig.geminiKey || '';
  const oaiInput = document.getElementById('input-openai-key');
  if (oaiInput && state.aiConfig) oaiInput.value = state.aiConfig.openaiKey || '';

  const promptsBox = document.getElementById('quick-prompts-box');
  if (promptsBox) {
    promptsBox.innerHTML = '';
    ['quickPrompt1', 'quickPrompt2', 'quickPrompt3', 'quickPrompt4', 'quickPrompt5'].forEach((k) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'prompt-chip';
      chip.textContent = t(k);
      chip.addEventListener('click', () => handleUserChatMessage(t(k)));
      promptsBox.appendChild(chip);
    });
  }

  const chatBox = document.getElementById('chat-messages');
  if (!chatBox) return;
  chatBox.innerHTML = '';

  if (state.chatHistory.length === 0) {
    state.chatHistory.push({ sender: 'coach', text: getDefaultWelcomeMessage(), isWelcome: true });
  } else if (state.chatHistory.length === 1 && state.chatHistory[0].isWelcome) {
    state.chatHistory[0].text = getDefaultWelcomeMessage();
  }

  state.chatHistory.forEach((msg) => {
    const div = document.createElement('div');
    div.className = `chat-bubble ${msg.sender === 'user' ? 'user' : 'coach'}`;
    div.textContent = msg.text;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleUserChatMessage(userText) {
  if (!userText || !userText.trim()) return;
  const clean = userText.trim();
  state.chatHistory.push({ sender: 'user', text: clean });
  renderCoachSection();

  const chatBox = document.getElementById('chat-messages');
  const thinkingBubble = document.createElement('div');
  thinkingBubble.className = 'chat-bubble coach';
  thinkingBubble.style.opacity = '0.75';
  thinkingBubble.textContent =
    state.lang === 'ar' ? '⏳ جاري التفكير...' : '⏳ Coach is thinking...';
  if (chatBox) {
    chatBox.appendChild(thinkingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  const { cleanReply, actions } = await generateSmartCoachResponse(clean, state);
  thinkingBubble.remove();

  state.chatHistory.push({ sender: 'coach', text: cleanReply });
  saveState();
  renderCoachSection();

  if (Array.isArray(actions) && actions.length > 0) {
    actions.forEach((act) => {
      if (act.type === 'ENABLE_LOW_ENERGY') {
        state.lowEnergyMode = true;
        saveState();
        renderShellStrings();
        renderPillars();
        showToast(
          state.lang === 'ar'
            ? '🔋 قام المدرب بتفعيل الوضع البرونزي المرن لليوم!'
            : '🔋 Coach enabled Guilt-Free Bronze Mode for today!'
        );
      } else if (act.type === 'OPEN_SOS') {
        setTimeout(() => openSosModal(act.tab || 'urge'), 800);
      } else if (act.type === 'COMPLETE_HABIT') {
        state.pillars.forEach((p) => {
          const found = p.habits.find((h) => h.id === act.habitId);
          if (found && !state.completedToday[found.id]) {
            const tierKey = ['bronze', 'silver', 'gold'].includes(act.tier) ? act.tier : 'bronze';
            state.completedToday[found.id] = tierKey;
            state.points += TIER_POINTS[tierKey];
            if (p.id === 'faith' && found.id === 'faith_quran' && p.tracker) {
              p.tracker.value = Math.min(604, p.tracker.value + (QURAN_TIER_PAGES[tierKey] || 1));
            }
            playTierSound(tierKey);
          }
        });
        saveState();
        renderShellStrings();
        renderPillars();
        renderLeaderboard();
      } else if (act.type === 'ADD_EVENT') {
        state.events.push({
          id: `ev_${Date.now()}`,
          time: act.time || '20:00',
          title: { en: act.title, ar: act.title }
        });
        saveState();
        renderCalendar();
        showToast(`📅 ${act.time} - ${act.title}`);
      }
    });
  }

  const orb = document.getElementById('btn-mic-orb');
  const statusEl = document.getElementById('ui-mic-status');

  speakText(
    cleanReply,
    state.lang,
    state.voiceEnabled,
    () => {
      if (orb) orb.classList.add('speaking');
      if (statusEl) statusEl.textContent = t('micSpeaking');
    },
    () => {
      if (orb) orb.classList.remove('speaking');
      if (statusEl) statusEl.textContent = t('micIdle');
    },
    state.voiceSettings
  );
}

// Render Smart Calendar & Notifications
function renderCalendar() {
  const listEl = document.getElementById('calendar-events-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const sorted = [...state.events].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  sorted.forEach((ev) => {
    const row = document.createElement('div');
    row.className = 'calendar-event-item';
    const titleStr = localText(ev.title);
    const gcalUrl = getGoogleCalendarUrl(ev, state.lang);

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <span class="event-time-badge">⏰ ${escapeHtml(ev.time)}</span>
        <strong style="font-size: 0.9rem;">${escapeHtml(titleStr)}</strong>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <a href="${escapeHtml(gcalUrl)}" target="_blank" rel="noopener noreferrer" class="mini-btn" style="text-decoration: none;">
          📅 ${escapeHtml(t('googleCalBtn'))}
        </a>
        <button type="button" class="mini-btn" data-del="${escapeHtml(ev.id)}" style="color: #fb7185;">
          ✕ ${escapeHtml(t('deleteBtn'))}
        </button>
      </div>
    `;

    row.querySelector('[data-del]').addEventListener('click', () => {
      state.events = state.events.filter((item) => item.id !== ev.id);
      saveState();
      renderCalendar();
    });

    listEl.appendChild(row);
  });
}

// Render Champion Board & Peer Pressure
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;
  container.innerHTML = '';

  const squadBtn = document.getElementById('btn-board-squad');
  const globalBtn = document.getElementById('btn-board-global');
  if (squadBtn && globalBtn) {
    squadBtn.className = state.boardMode === 'squad' ? 'btn-primary' : 'btn-secondary';
    globalBtn.className = state.boardMode === 'global' ? 'btn-primary' : 'btn-secondary';
  }

  const completedAnyToday = Object.keys(state.completedToday).length > 0;
  const meEntry = {
    id: 'me',
    isMe: true,
    name: { en: `${state.user.name} (You)`, ar: `${state.user.name} (أنت)` },
    points: state.points,
    streak: state.streak,
    checkedInToday: completedAnyToday,
    badge: '🌟'
  };

  const sourceList =
    state.boardMode === 'squad' ? state.champions.squadMembers : state.champions.globalMembers;

  const combined = [...sourceList, meEntry].sort((a, b) => b.points - a.points);

  combined.forEach((member, idx) => {
    const rank = idx + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const row = document.createElement('div');
    row.className = `leaderboard-row ${member.isMe ? 'is-me' : ''}`;

    const statusLine = member.checkedInToday
      ? `<span style="color: var(--green-400); font-size: 0.76rem;">✓ ${escapeHtml(t('checkedInToday'))}</span>`
      : `<span style="color: #fb923c; font-size: 0.76rem;">⏳ ${escapeHtml(t('notCheckedInYet'))}</span>`;

    let actionBtnHtml = '';
    if (!member.isMe) {
      if (!member.checkedInToday) {
        actionBtnHtml = `<button type="button" class="mini-btn" data-peer="nudge" style="border-color: #fb923c; color: #fb923c;">${escapeHtml(t('nudgeBtn'))}</button>`;
      } else {
        actionBtnHtml = `<button type="button" class="mini-btn" data-peer="cheer" style="border-color: var(--green-400); color: var(--green-400);">${escapeHtml(t('cheerBtn'))}</button>`;
      }
    }

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="rank-circle ${rankClass}">${rank}</div>
        <div>
          <div style="font-weight: 800; font-size: 0.92rem;">
            ${escapeHtml(member.badge || '')} ${escapeHtml(localText(member.name))}
          </div>
          <div>${statusLine} • 🔥 ${Number(member.streak) || 0}d</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <strong style="color: var(--blue-400); font-size: 0.95rem;">${Number(member.points) || 0} ${escapeHtml(t('pointsLabel'))}</strong>
        ${actionBtnHtml}
      </div>
    `;

    const peerBtn = row.querySelector('[data-peer]');
    if (peerBtn) {
      peerBtn.addEventListener('click', () => {
        const isNudge = peerBtn.getAttribute('data-peer') === 'nudge';
        const friendName = localText(member.name);
        if (isNudge) {
          const msg =
            state.lang === 'ar'
              ? `تم إرسال تنبيه تحفيزي إلى ${friendName}: "لا تكسر السلسلة اليوم! ازرع ولو خطوة برونزية!" (+٥ نقاط لك)`
              : `Sent an accountability nudge to ${friendName}: "Don't break the chain today—plant a 2-min Bronze seed!" (+5 pts for you)`;
          state.points += 5;
          member.checkedInToday = true;
          member.points += 10;
          playTierSound('bronze');
          showToast(`🔔 ${msg}`);
          speakText(msg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
          saveState();
          renderShellStrings();
          renderLeaderboard();
        } else {
          const msg =
            state.lang === 'ar'
              ? `أرسلت تحية وتشجيعاً لـ ${friendName} على التزامه الرائع!`
              : `Sent a high-five & cheer to ${friendName} for staying consistent!`;
          playTierSound('silver');
          showToast(`👏 ${msg}`);
        }
      });
    }

    container.appendChild(row);
  });
}

// Render Profile & Onboarding Pillar Selectors
function renderPillarSelectors() {
  ['profile-pillars-grid', 'onboarding-pillars-list'].forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    state.pillars.forEach((pillar) => {
      const item = document.createElement('div');
      item.className = `pillar-choice-card ${pillar.active ? 'selected' : ''}`;
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 1.3rem;">${escapeHtml(pillar.icon)}</span>
          <strong style="font-size: 0.8rem; color: ${pillar.active ? 'var(--green-400)' : 'var(--text-muted)'};">
            ${escapeHtml(pillar.active ? t('activeBadge') : t('enableBadge'))}
          </strong>
        </div>
        <div style="font-weight: 800; font-size: 0.88rem;">${escapeHtml(localText(pillar.name))}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(localText(pillar.desc))}</div>
      `;

      item.addEventListener('click', () => {
        const activeCount = state.pillars.filter((p) => p.active).length;
        if (pillar.active && activeCount <= 1) {
          showToast(
            state.lang === 'ar'
              ? 'يجب إبقاء ركن واحد نشط على الأقل!'
              : 'Keep at least 1 Life Pillar active!'
          );
          return;
        }
        pillar.active = !pillar.active;
        saveState();
        renderPillarSelectors();
        renderPillars();
      });

      grid.appendChild(item);
    });
  });
}

// Switch Main Bottom Tabs
function switchTab(tabName) {
  state.activeTab = tabName;
  saveState();

  ['today', 'coach', 'calendar', 'champions', 'profile'].forEach((name) => {
    const panel = document.getElementById(`tab-${name}`);
    if (panel) {
      panel.classList.toggle('hidden', name !== tabName);
    }
  });

  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
}

// SOS Rescue Modal & Timer Hygiene
function stopAllSosTimers() {
  if (urgeTimerInterval) {
    clearInterval(urgeTimerInterval);
    urgeTimerInterval = null;
  }
  if (procTimerInterval) {
    clearInterval(procTimerInterval);
    procTimerInterval = null;
  }
  const btnLabel = document.getElementById('ui-start-urge-timer');
  if (btnLabel) btnLabel.textContent = t('startUrgeTimer');
}

function closeSosModal() {
  stopAllSosTimers();
  document.getElementById('sos-modal')?.classList.add('hidden');
}

function openSosModal(subtab = 'urge') {
  const modal = document.getElementById('sos-modal');
  if (modal) modal.classList.remove('hidden');
  switchSosSubtab(subtab);
}

function switchSosSubtab(subtab) {
  ['urge', 'procrastinate', 'energy'].forEach((k) => {
    const panel = document.getElementById(`sos-panel-${k}`);
    if (panel) panel.classList.toggle('hidden', k !== subtab);
  });

  document.querySelectorAll('.sos-subtab-btn').forEach((btn) => {
    const isMatch = btn.getAttribute('data-sostab') === subtab;
    btn.className = `${isMatch ? 'btn-primary' : 'btn-secondary'} sos-subtab-btn`;
  });
}

function resetUrgeTimer() {
  if (urgeTimerInterval) {
    clearInterval(urgeTimerInterval);
    urgeTimerInterval = null;
  }
  urgeSecondsLeft = 180;
  const display = document.getElementById('urge-timer-display');
  if (display) display.textContent = '03:00';
  const btnLabel = document.getElementById('ui-start-urge-timer');
  if (btnLabel) btnLabel.textContent = t('startUrgeTimer');
  const cue = document.getElementById('breathing-cue');
  if (cue) cue.textContent = t('breatheIn');
}

function toggleUrgeTimer() {
  const display = document.getElementById('urge-timer-display');
  const cue = document.getElementById('breathing-cue');
  const btnLabel = document.getElementById('ui-start-urge-timer');

  if (urgeTimerInterval) {
    clearInterval(urgeTimerInterval);
    urgeTimerInterval = null;
    if (btnLabel) btnLabel.textContent = t('startUrgeTimer');
    return;
  }

  if (urgeSecondsLeft <= 0) urgeSecondsLeft = 180;
  if (btnLabel) btnLabel.textContent = t('stopTimer');
  speakText(
    state.lang === 'ar'
      ? 'ابدأ التنفس العميق معي الآن. شهيق بهدوء... احتفظ بالهواء... ثم زفير بطيء. هذه الرغبة ستمر خلال ثلاث دقائق.'
      : 'Start breathing with me now. Inhale slowly... hold gently... and exhale. This craving wave will pass in 3 minutes.',
    state.lang,
    state.voiceEnabled,
    null,
    null,
    state.voiceSettings
  );

  urgeTimerInterval = setInterval(() => {
    urgeSecondsLeft--;
    const m = String(Math.floor(urgeSecondsLeft / 60)).padStart(2, '0');
    const s = String(urgeSecondsLeft % 60).padStart(2, '0');
    if (display) display.textContent = `${m}:${s}`;

    const cycle = urgeSecondsLeft % 12;
    if (cue) {
      if (cycle >= 8) cue.textContent = t('breatheIn');
      else if (cycle >= 4) cue.textContent = t('breatheHold');
      else cue.textContent = t('breatheOut');
    }

    if (urgeSecondsLeft <= 0) {
      clearInterval(urgeTimerInterval);
      urgeTimerInterval = null;
      state.points += 25;
      playTierSound('gold');
      launchConfetti();
      saveState();
      renderShellStrings();
      renderLeaderboard();
      const winMsg =
        state.lang === 'ar'
          ? 'بطل حقيقي! لقد تغلبت على الرغبة الملحة وحصلت على ٢٥ نقطة إضافية!'
          : 'True Champion! You surfed the urge for 3 full minutes and earned +25 bonus points!';
      showToast(`🏆 ${winMsg}`);
      speakText(winMsg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
    }
  }, 1000);
}

function startProcrastinationBreaker() {
  const input = document.getElementById('proc-task-input');
  const resBox = document.getElementById('proc-result-box');
  const stepTxt = document.getElementById('proc-micro-step-text');
  const timerDisp = document.getElementById('proc-timer-display');

  const rawTask = (input && input.value.trim()) || (state.lang === 'ar' ? 'مهمتي الحالية' : 'my task');
  if (resBox) resBox.classList.remove('hidden');

  const msg =
    state.lang === 'ar'
      ? `الخطوة المصغرة لـ "${rawTask}": افتح الأدوات الآن واعمل على أول جزء بسيط جداً لمدة دقيقتين فقط. لا يشترط الإتقان!`
      : `Micro-Step for "${rawTask}": Open it right now and do 1 messy minute of work. Perfection is forbidden—just start!`;

  if (stepTxt) stepTxt.textContent = msg;
  speakText(msg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);

  if (procTimerInterval) clearInterval(procTimerInterval);
  procSecondsLeft = 300;

  procTimerInterval = setInterval(() => {
    procSecondsLeft--;
    const m = String(Math.floor(procSecondsLeft / 60)).padStart(2, '0');
    const s = String(procSecondsLeft % 60).padStart(2, '0');
    if (timerDisp) timerDisp.textContent = `${m}:${s}`;

    if (procSecondsLeft <= 0) {
      clearInterval(procTimerInterval);
      procTimerInterval = null;
      state.points += 25;
      playTierSound('gold');
      launchConfetti();
      saveState();
      renderShellStrings();
      showToast(
        state.lang === 'ar'
          ? '🎉 أتممت ٥ دقائق من التركيز وكسرت التسويف! (+٢٥ نقطة)'
          : '🎉 You crushed the 5-minute starter timer and beat procrastination! (+25 pts)'
      );
    }
  }, 1000);
}

// Wire All Event Listeners
function initEvents() {
  // Language switcher
  const flipLang = () => {
    state.lang = state.lang === 'en' ? 'ar' : 'en';
    state.micLang = state.lang === 'ar' ? 'ar-EG' : 'en-US';
    saveState();
    renderAll();
  };
  document.getElementById('btn-lang-toggle')?.addEventListener('click', flipLang);
  document.getElementById('btn-onboarding-lang')?.addEventListener('click', flipLang);

  // Voice toggle
  document.getElementById('btn-voice-toggle')?.addEventListener('click', () => {
    state.voiceEnabled = !state.voiceEnabled;
    if (!state.voiceEnabled) {
      stopSpeaking();
    }
    saveState();
    renderShellStrings();
  });

  // Theme toggle
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    renderShellStrings();
  });

  // Low-energy toggle
  document.getElementById('btn-low-energy-toggle')?.addEventListener('click', () => {
    state.lowEnergyMode = !state.lowEnergyMode;
    saveState();
    renderShellStrings();
    renderPillars();
    if (state.lowEnergyMode) {
      const msg =
        state.lang === 'ar'
          ? 'تم تفعيل الوضع البرونزي المرن لليوم. خطوة دقيقتين تكفي للحفاظ على التزامك!'
          : 'Guilt-Free Bronze Mode activated! Any 2-minute Bronze step keeps your streak alive today.';
      showToast(`🔋 ${msg}`);
      speakText(msg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
    }
  });

  // Bottom navigation tabs
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  document.getElementById('btn-jump-pillars')?.addEventListener('click', () => {
    switchTab('profile');
  });

  // Voice Coach Mic Dialect Selector, Live Interim Orb, Settings & Form
  document.querySelectorAll('.mic-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.micLang = btn.getAttribute('data-miclang') || 'ar-EG';
      saveState();
      renderCoachSection();
      showToast(
        state.micLang.startsWith('ar')
          ? `🎙️ تم ضبط لغة استماع الميكروفون على: ${state.micLang === 'ar-EG' ? 'العربية (مصر)' : 'العربية (فصحى/الخليج)'}`
          : '🎙️ Microphone listening language set to: English (US)'
      );
    });
  });

  document.getElementById('btn-stop-speaking')?.addEventListener('click', () => {
    stopSpeaking();
    document.getElementById('btn-mic-orb')?.classList.remove('speaking');
    const st = document.getElementById('ui-mic-status');
    if (st) st.textContent = t('micIdle');
  });

  document.getElementById('btn-clear-chat')?.addEventListener('click', () => {
    stopSpeaking();
    state.chatHistory = [];
    saveState();
    renderCoachSection();
  });

  document.getElementById('btn-toggle-ai-settings')?.addEventListener('click', () => {
    document.getElementById('ai-settings-panel')?.classList.toggle('hidden');
  });

  document.getElementById('select-tts-engine')?.addEventListener('change', (e) => {
    state.voiceSettings = state.voiceSettings || {};
    state.voiceSettings.engine = e.target.value;
    saveState();
  });

  document.getElementById('select-tts-rate')?.addEventListener('change', (e) => {
    state.voiceSettings = state.voiceSettings || {};
    state.voiceSettings.rate = parseFloat(e.target.value) || 1.0;
    saveState();
  });

  document.getElementById('btn-save-ai-config')?.addEventListener('click', () => {
    state.aiConfig = {
      geminiKey: document.getElementById('input-gemini-key')?.value.trim() || '',
      openaiKey: document.getElementById('input-openai-key')?.value.trim() || ''
    };
    saveState();
    showToast(
      state.lang === 'ar'
        ? '✓ تم حفظ إعدادات الذكاء الاصطناعي والصوت بنجاح!'
        : '✓ Saved AI & Voice configuration!'
    );
  });

  const orb = document.getElementById('btn-mic-orb');
  const micStatus = document.getElementById('ui-mic-status');
  const liveBox = document.getElementById('live-transcript-box');
  const liveTxt = document.getElementById('live-transcript-text');

  orb?.addEventListener('click', () => {
    toggleVoiceRecognition({
      speechLang: state.micLang || (state.lang === 'ar' ? 'ar-EG' : 'en-US'),
      onInterim: (interimText) => {
        if (liveBox && liveTxt) {
          liveBox.classList.remove('hidden');
          liveTxt.textContent = interimText || '...';
        }
      },
      onFinalResult: (finalTranscript) => {
        if (liveBox) liveBox.classList.add('hidden');
        handleUserChatMessage(finalTranscript);
      },
      onStateChange: (status) => {
        if (!orb || !micStatus) return;
        orb.classList.toggle('listening', status === 'listening');
        micStatus.textContent =
          status === 'listening'
            ? state.lang === 'ar'
              ? '🔴 جاري الاستماع... تحدث الآن (أو اضغط للإرسال)'
              : '🔴 Listening... Speak now (or tap again to send)'
            : t('micIdle');
        if (status === 'idle' && liveBox) {
          setTimeout(() => liveBox.classList.add('hidden'), 400);
        }
      },
      onError: (errMsg) => {
        showToast(`🎙️ ${errMsg}`);
        speakText(errMsg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
      }
    });
  });

  document.getElementById('chat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    const val = input.value;
    input.value = '';
    handleUserChatMessage(val);
  });

  // Calendar & Notifications
  document.getElementById('btn-enable-notif')?.addEventListener('click', async () => {
    const res = await requestNotificationPermission();
    renderShellStrings();
    if (res === 'granted') {
      triggerSmartNotification(
        state.lang === 'ar' ? 'تم تفعيل الإشعارات بنجاح!' : 'Notifications Enabled!',
        state.lang === 'ar'
          ? 'سأذكّرك بمواعيد القرآن، التمرين، والتجمعات العائلية في وقتها.'
          : 'I will remind you when your scheduled habits and family gatherings arrive.',
        state.lang,
        state.voiceEnabled,
        showToast
      );
    } else {
      showToast(
        state.lang === 'ar'
          ? 'التنبيهات الصوتية والداخلية جاهزة للعمل!'
          : 'In-app & voice reminders are active!'
      );
    }
  });

  document.getElementById('btn-test-notif')?.addEventListener('click', () => {
    const title =
      state.lang === 'ar'
        ? `تذكير ذكي من نَوَاة يا ${state.user.name}!`
        : `Nawwa Smart Reminder for ${state.user.name}!`;
    const body =
      state.lang === 'ar'
        ? 'هل قرأت صفحتك من القرآن الكريم اليوم؟ ازرع نواتك الآن ولو بخطوة برونزية لمدة دقيقتين!'
        : 'Did you read your 1 page of Quran or do your 2-minute stretch today? Plant a Bronze seed now!';
    triggerSmartNotification(title, body, state.lang, state.voiceEnabled, showToast);
  });

  document.getElementById('form-add-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const timeEl = document.getElementById('event-time-input');
    const titleEl = document.getElementById('event-title-input');
    if (!timeEl || !titleEl || !titleEl.value.trim()) return;

    state.events.push({
      id: `ev_${Date.now()}`,
      time: timeEl.value,
      title: { en: titleEl.value.trim(), ar: titleEl.value.trim() }
    });
    titleEl.value = '';
    saveState();
    renderCalendar();
    showToast(
      state.lang === 'ar'
        ? '📅 تمت إضافة الموعد وتفعيل التذكير له!'
        : '📅 Added to your schedule with automatic reminder!'
    );
  });

  document.getElementById('btn-export-ics')?.addEventListener('click', () => {
    downloadIcsFile(state.events, state.lang);
    showToast(
      state.lang === 'ar'
        ? '📲 تم تحميل ملف التقويم (.ICS) لإضافته لتقويم الهاتف!'
        : '📲 Downloaded .ICS schedule file for your phone/computer calendar!'
    );
  });

  // Champion Board buttons
  document.getElementById('btn-board-squad')?.addEventListener('click', () => {
    state.boardMode = 'squad';
    saveState();
    renderLeaderboard();
  });

  document.getElementById('btn-board-global')?.addEventListener('click', () => {
    state.boardMode = 'global';
    saveState();
    renderLeaderboard();
  });

  document.getElementById('btn-copy-squad')?.addEventListener('click', () => {
    const inviteText = `Join my Nawwa (نواة) accountability squad! Invite Code: ${state.champions.squadCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteText).catch(() => {});
    }
    showToast(
      state.lang === 'ar'
        ? `📋 تم نسخ رمز الدعوة (${state.champions.squadCode}) لمشاركته مع العائلة والأصدقاء!`
        : `📋 Copied Squad Invite (${state.champions.squadCode}) to share with family & friends!`
    );
  });

  document.getElementById('btn-join-squad')?.addEventListener('click', () => {
    const code = window.prompt(
      state.lang === 'ar' ? 'أدخل رمز دعوة المجموعة:' : 'Enter Squad Invite Code:',
      'NAWWA-2026'
    );
    if (code && code.trim()) {
      state.champions.squadCode = code.trim().toUpperCase();
      saveState();
      renderShellStrings();
      showToast(
        state.lang === 'ar'
          ? `🤝 انضممت بنجاح إلى المجموعة: ${state.champions.squadCode}`
          : `🤝 Joined Squad: ${state.champions.squadCode}`
      );
    }
  });

  // SOS Modal
  document.getElementById('btn-sos')?.addEventListener('click', () => openSosModal('urge'));
  document.getElementById('btn-close-sos')?.addEventListener('click', closeSosModal);
  document.getElementById('btn-reset-urge-timer')?.addEventListener('click', resetUrgeTimer);

  document.querySelectorAll('.sos-subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchSosSubtab(btn.getAttribute('data-sostab')));
  });

  document.getElementById('btn-start-urge-timer')?.addEventListener('click', toggleUrgeTimer);
  document.getElementById('btn-break-proc')?.addEventListener('click', startProcrastinationBreaker);

  document.getElementById('btn-sos-activate-bronze')?.addEventListener('click', () => {
    state.lowEnergyMode = true;
    saveState();
    renderShellStrings();
    renderPillars();
    closeSosModal();
    const msg =
      state.lang === 'ar'
        ? 'تم تفعيل الوضع البرونزي! ابدأ بأي خطوة دقيقتين الآن ولا تضغط على نفسك.'
        : 'Guilt-Free Bronze Mode active! Pick any 2-minute step today.';
    showToast(`🛡️ ${msg}`);
    speakText(msg, state.lang, state.voiceEnabled, null, null, state.voiceSettings);
  });

  // Custom Pillar Modal
  const openCustomModal = () => {
    document.getElementById('custom-pillar-modal')?.classList.remove('hidden');
  };
  const closeCustomModal = () => {
    document.getElementById('custom-pillar-modal')?.classList.add('hidden');
  };
  document.getElementById('btn-open-custom-pillar')?.addEventListener('click', openCustomModal);
  document.getElementById('btn-open-custom-pillar-2')?.addEventListener('click', openCustomModal);
  document.getElementById('btn-close-custom-pillar')?.addEventListener('click', closeCustomModal);
  document.getElementById('btn-cancel-custom-pillar')?.addEventListener('click', closeCustomModal);

  document.getElementById('form-custom-pillar')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const icon = document.getElementById('cp-icon').value.trim() || '🌟';
    const nameEn = document.getElementById('cp-name-en').value.trim();
    const nameAr = document.getElementById('cp-name-ar').value.trim() || nameEn;
    const habitTitle = document.getElementById('cp-habit-title').value.trim();
    const bronze = document.getElementById('cp-bronze').value.trim();
    const silver = document.getElementById('cp-silver').value.trim();
    const gold = document.getElementById('cp-gold').value.trim();
    const unit = document.getElementById('cp-unit').value.trim() || 'mins';

    const newPillar = {
      id: `custom_${Date.now()}`,
      icon,
      active: true,
      name: { en: nameEn, ar: nameAr },
      desc: { en: 'Custom personal growth pillar', ar: 'ركن شخصي مخصص لتطوير الذات' },
      tracker: {
        label: { en: `${nameEn} Progress`, ar: `تقدم ${nameAr}` },
        unit: { en: unit, ar: unit },
        value: 0,
        step: 1,
        goal: 30
      },
      habits: [
        {
          id: `habit_${Date.now()}`,
          name: { en: habitTitle, ar: habitTitle },
          tiers: {
            bronze: { en: bronze, ar: bronze },
            silver: { en: silver, ar: silver },
            gold: { en: gold, ar: gold }
          }
        }
      ]
    };

    state.pillars.push(newPillar);
    saveState();
    e.target.reset();
    document.getElementById('cp-icon').value = '🌟';
    document.getElementById('cp-unit').value = 'mins';
    closeCustomModal();
    renderAll();
    switchTab('today');
    showToast(
      state.lang === 'ar'
        ? `✨ تمت إضافة ركنك المخصص الجديد: ${nameAr}`
        : `✨ Created your new custom pillar: ${nameEn}`
    );
  });

  // Onboarding / Account Modal & Backup Export
  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nawwa-backup-${getTodayIso()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      state.lang === 'ar'
        ? '💾 تم تحميل النسخة الاحتياطية لبياناتك بنجاح!'
        : '💾 Downloaded your Nawwa data backup (.json)!'
    );
  });

  document.getElementById('btn-open-onboarding')?.addEventListener('click', () => {
    document.getElementById('ob-name').value = state.user.name;
    document.getElementById('ob-email').value = state.user.email;
    renderPillarSelectors();
    document.getElementById('onboarding-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-onboarding')?.addEventListener('click', () => {
    document.getElementById('onboarding-modal')?.classList.add('hidden');
  });

  document.getElementById('btn-fill-demo')?.addEventListener('click', () => {
    document.getElementById('ob-name').value = 'Karim';
    document.getElementById('ob-email').value = 'karim@nawwa.app';
    document.getElementById('ob-password').value = 'Nawwa2026!';
    showToast(
      state.lang === 'ar'
        ? '⚡ تم ملء بيانات الدخول التجريبية!'
        : '⚡ Filled default demo credentials!'
    );
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    renderPillarSelectors();
    document.getElementById('onboarding-modal')?.classList.remove('hidden');
    showToast(
      state.lang === 'ar'
        ? '🚪 تم فتح شاشة تسجيل الدخول وتبديل الحساب'
        : '🚪 Logged out — Sign in below or switch account'
    );
  });

  document.getElementById('form-onboarding')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('ob-name').value.trim() || 'Karim';
    const emailVal = document.getElementById('ob-email').value.trim() || 'karim@nawwa.app';
    state.user = { name: nameVal, email: emailVal, onboarded: true };
    saveState();
    document.getElementById('onboarding-modal')?.classList.add('hidden');
    renderAll();
    showToast(
      state.lang === 'ar'
        ? `مرحباً بك يا ${nameVal}! رحلتك في نَوَاة بدأت الآن.`
        : `Welcome, ${nameVal}! Your Nawwa journey is synced.`
    );
  });

  // Close any open modal when clicking backdrop or pressing Escape
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        if (backdrop.id === 'sos-modal') closeSosModal();
        else backdrop.classList.add('hidden');
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSosModal();
      document.getElementById('custom-pillar-modal')?.classList.add('hidden');
      document.getElementById('onboarding-modal')?.classList.add('hidden');
    }
  });
}

function renderAll() {
  renderShellStrings();
  renderPillars();
  renderCoachSection();
  renderCalendar();
  renderLeaderboard();
  renderPillarSelectors();
  switchTab(state.activeTab || 'today');
}

// Boot Application
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initEvents();
    renderAll();
    startScheduleWatcher(() => state, showToast);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  });
}
