import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PILLARS, DEFAULT_USERS, I18N } from '../js/data.js';
import { extractActionsFromReply, isArabicText } from '../js/voice-audio.js';
import {
  getPlantStageInfo,
  computeWeeklyInsights,
  saveUserProfileSnapshot,
  loadUserProfileSnapshot
} from '../js/cloud-sync.js';
import { getHijriDateInfo, getNextPrayerSummary } from '../js/quran-prayer.js';
import { checkDailyRollover, getTodayIso } from '../js/app.js';
import squadHandler from '../api/squad.js';

test('1. Bilingual Data & 6 Core Life Pillars integrity', () => {
  assert.equal(DEFAULT_PILLARS.length, 6, 'Should have 6 core life pillars');
  const ids = DEFAULT_PILLARS.map((p) => p.id);
  assert.deepEqual(ids, ['faith', 'focus', 'fitness', 'nutrition', 'smoking', 'family']);
  assert.ok(I18N.en.victoryCardBtn && I18N.ar.victoryCardBtn, 'Bilingual keys should exist');
  assert.ok(DEFAULT_USERS.some((u) => u.email === 'karim@nawwa.app' && u.role === 'admin'));
});

test('2. Daily Rollover & Streak Shield Protection', () => {
  const todayIso = getTodayIso();

  // Case A: User completed habits yesterday -> streak increments
  const stateActive = {
    lastActiveDate: '2026-01-01',
    streak: 6,
    streakShields: 1,
    completedToday: { faith_quran: 'bronze', focus_most_important: 'silver' },
    history: {}
  };
  checkDailyRollover(stateActive);
  assert.equal(stateActive.streak, 7, 'Streak should increment when habits were completed');
  assert.equal(stateActive.streakShields, 1, 'Shields should remain untouched when active');
  assert.equal(stateActive.history['2026-01-01'], 2, 'History should record 2 completed habits');
  assert.equal(stateActive.lastActiveDate, todayIso);

  // Case B: User missed yesterday (0 completions) WITH a Streak Shield -> shield protects streak!
  const stateProtected = {
    lastActiveDate: '2026-01-01',
    streak: 10,
    streakShields: 2,
    completedToday: {},
    history: {}
  };
  checkDailyRollover(stateProtected);
  assert.equal(stateProtected.streak, 10, 'Streak Shield must protect streak from resetting');
  assert.equal(stateProtected.streakShields, 1, '1 Streak Shield should be consumed');

  // Case C: User missed yesterday WITHOUT any Streak Shield -> streak resets to 0
  const stateReset = {
    lastActiveDate: '2026-01-01',
    streak: 10,
    streakShields: 0,
    completedToday: {},
    history: {}
  };
  checkDailyRollover(stateReset);
  assert.equal(stateReset.streak, 0, 'Streak should reset to 0 when no shields remain');
});

test('3. Living Nawwa Tree Evolution Stages (5 Stages)', () => {
  assert.equal(getPlantStageInfo(0, 'en').icon, '🌰');
  assert.equal(getPlantStageInfo(120, 'en').icon, '🌱');
  assert.equal(getPlantStageInfo(300, 'ar').icon, '🌿');
  assert.equal(getPlantStageInfo(600, 'ar').icon, '🌳');
  assert.equal(getPlantStageInfo(1250, 'ar').icon, '🌴');
});

test('4. Weekly Insights, 30-Day Heatmap & Khatmah Math', () => {
  const sampleState = {
    completedToday: { faith_quran: 'gold', focus_most_important: 'silver' },
    history: {},
    pillars: structuredClone(DEFAULT_PILLARS)
  };
  const stats = computeWeeklyInsights(sampleState);
  assert.equal(stats.last30Days.length, 30, 'Should compute 30-day garden heatmap');
  assert.ok(stats.activeDaysLast7 >= 1);
  assert.equal(stats.quranPages, 18);
  assert.equal(stats.daysToKhatmah, 604 - 18);
});

test('5. Multi-User Profile Snapshot Isolation', () => {
  const state = {
    currentUser: { id: 'u1', email: 'karim@nawwa.app', personalized: true },
    points: 550,
    streak: 14,
    completedToday: { faith_quran: 'gold' },
    history: { '2026-11-14': 4 },
    gratitudeLog: [{ id: 'g1', date: '2026-11-15', mood: '🌿', text: 'Alhamdulillah' }],
    pillars: structuredClone(DEFAULT_PILLARS),
    events: [],
    chatHistory: [],
    userProfiles: {}
  };
  saveUserProfileSnapshot(state);

  // Switch to a brand new user u2
  const user2 = { id: 'u2', email: 'friend@nawwa.app', points: 20, streak: 1 };
  loadUserProfileSnapshot(state, user2);
  assert.equal(state.points, 20);
  assert.deepEqual(state.completedToday, {});
  assert.equal(state.gratitudeLog.length, 0);

  // Switch back to u1 and verify restoration
  loadUserProfileSnapshot(state, state.currentUser);
  assert.equal(state.points, 550);
  assert.equal(state.completedToday.faith_quran, 'gold');
  assert.equal(state.gratitudeLog.length, 1);
});

test('6. AI Coach Action Tag Parser & Arabic Detection', () => {
  assert.equal(isArabicText('الحمد لله رب العالمين'), true);
  assert.equal(isArabicText('Hello Coach'), false);

  const reply =
    'Great job! [ACTION:COMPLETE_HABIT:faith_quran:gold] [ACTION:OPEN_ADHKAR] [ACTION:OPEN_FOCUS_TIMER] [ACTION:ADD_EVENT:21:30:Family Tea]';
  const { cleanReply, actions } = extractActionsFromReply(reply);
  assert.equal(cleanReply, 'Great job!');
  assert.equal(actions.length, 4);
  assert.deepEqual(actions[0], { type: 'COMPLETE_HABIT', habitId: 'faith_quran', tier: 'gold' });
  assert.deepEqual(actions[1], { type: 'OPEN_ADHKAR' });
  assert.deepEqual(actions[2], { type: 'OPEN_FOCUS_TIMER' });
  assert.deepEqual(actions[3], { type: 'ADD_EVENT', time: '21:30', title: 'Family Tea' });
});

test('7. Hijri Calendar & Next Prayer Summary', () => {
  const hijriAr = getHijriDateInfo('ar');
  const hijriEn = getHijriDateInfo('en');
  assert.ok(hijriAr.label.length > 0);
  assert.ok(hijriEn.label.length > 0);
  assert.ok(hijriAr.sunnahFastNote.length > 0);

  const nextPrayer = getNextPrayerSummary('ar');
  assert.ok(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(nextPrayer.key));
  assert.ok(nextPrayer.time.includes(':'));
});

test('8. Serverless /api/squad Endpoint (POST & GET)', async () => {
  let statusCode = 200;
  let responseBody = null;
  const mockRes = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
    end() {}
  };

  await squadHandler(
    {
      method: 'POST',
      query: {},
      body: {
        squadCode: 'TEST-2026',
        user: {
          id: 'u_test',
          name: 'Karim',
          email: 'karim@nawwa.app',
          role: 'admin',
          points: 420,
          streak: 9,
          checkedInToday: true
        }
      }
    },
    mockRes
  );

  assert.equal(statusCode, 200);
  assert.equal(responseBody.squadCode, 'TEST-2026');
  assert.ok(Array.isArray(responseBody.squadMembers));
  assert.ok(responseBody.squadMembers.some((m) => m.points === 420));
});
