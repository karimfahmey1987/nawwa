// Multi-User Profile Isolation, Real-Time Squad Sync (/api/squad + BroadcastChannel),
// and Weekly Growth & AI Insights Generator

import { DEFAULT_PILLARS, DEFAULT_EVENTS } from './data.js';
import { speakText } from './voice-audio.js';

let syncChannel = null;
let appGetState = null;
let appSaveState = null;
let appRenderAll = null;
let appShowToast = null;

// ==========================================
// 1. PER-USER PROFILE STATE ISOLATION
// ==========================================
export function saveUserProfileSnapshot(state) {
  if (!state || !state.currentUser) return;
  const uid = state.currentUser.id || state.currentUser.email?.toLowerCase();
  if (!uid) return;

  state.userProfiles = state.userProfiles || {};
  state.userProfiles[uid] = {
    points: state.points,
    streak: state.streak,
    lastActiveDate: state.lastActiveDate,
    lowEnergyMode: state.lowEnergyMode,
    completedToday: structuredClone(state.completedToday || {}),
    history: structuredClone(state.history || {}),
    gratitudeLog: structuredClone(state.gratitudeLog || []),
    pillars: structuredClone(state.pillars || DEFAULT_PILLARS),
    events: structuredClone(state.events || DEFAULT_EVENTS),
    chatHistory: structuredClone(state.chatHistory || []),
    personalized: Boolean(state.currentUser.personalized)
  };
}

export function loadUserProfileSnapshot(state, targetUser) {
  if (!state || !targetUser) return;
  const uid = targetUser.id || targetUser.email?.toLowerCase();
  state.userProfiles = state.userProfiles || {};

  const snap = state.userProfiles[uid];
  if (snap) {
    state.points = typeof snap.points === 'number' ? snap.points : (targetUser.points || 0);
    state.streak = typeof snap.streak === 'number' ? snap.streak : (targetUser.streak || 0);
    state.lastActiveDate = snap.lastActiveDate || state.lastActiveDate;
    state.lowEnergyMode = Boolean(snap.lowEnergyMode);
    state.completedToday = structuredClone(snap.completedToday || {});
    state.history = structuredClone(snap.history || {});
    state.gratitudeLog = structuredClone(snap.gratitudeLog || []);
    state.pillars = structuredClone(snap.pillars || DEFAULT_PILLARS);
    state.events = structuredClone(snap.events || DEFAULT_EVENTS);
    state.chatHistory = structuredClone(snap.chatHistory || []);
    targetUser.personalized = snap.personalized ?? targetUser.personalized;
  } else {
    // Fresh profile for newly created or first-time switched user
    state.points = typeof targetUser.points === 'number' ? targetUser.points : 0;
    state.streak = typeof targetUser.streak === 'number' ? targetUser.streak : 0;
    state.lowEnergyMode = false;
    state.completedToday = {};
    state.history = {};
    state.gratitudeLog = [];
    state.pillars = structuredClone(DEFAULT_PILLARS);
    state.events = structuredClone(DEFAULT_EVENTS);
    state.chatHistory = [];
  }
}

// ==========================================
// 2. REAL-TIME SQUAD & CLOUD SYNC + WHATSAPP SHARE
// ==========================================
export function shareViaWhatsApp(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareNativeOrWhatsApp(title, text) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url: window.location.origin });
      return;
    } catch (_) {}
  }
  shareViaWhatsApp(text);
}

export function getPlantStageInfo(points = 0, lang = 'en') {
  const pts = Number(points) || 0;
  if (pts >= 1000) {
    return { icon: '🌴', label: lang === 'ar' ? 'نخلة باسقة' : 'Blessed Palm', min: 1000, next: null, nextPts: null };
  }
  if (pts >= 500) {
    return { icon: '🌳', label: lang === 'ar' ? 'شجرة مثمرة' : 'Fruitful Tree', min: 500, next: 1000, nextPts: 1000 };
  }
  if (pts >= 250) {
    return { icon: '🌿', label: lang === 'ar' ? 'شجيرة نامية' : 'Growing Sapling', min: 250, next: 500, nextPts: 500 };
  }
  if (pts >= 100) {
    return { icon: '🌱', label: lang === 'ar' ? 'نبتة خضراء' : 'Green Sprout', min: 100, next: 250, nextPts: 250 };
  }
  return { icon: '🌰', label: lang === 'ar' ? 'بذرة نواة' : 'Nawwa Seed', min: 0, next: 100, nextPts: 100 };
}

// Generate and share/download a 1080x1080 HTML5 Canvas Victory Poster
export async function generateAndShareVictoryCard(state, showToast = null) {
  if (typeof document === 'undefined') return;
  const isAr = state.lang === 'ar';
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stats = computeWeeklyInsights(state);
  const plant = getPlantStageInfo(state.points, state.lang);

  // 1. Deep Emerald & Midnight Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, '#04131a');
  bgGrad.addColorStop(0.5, '#062823');
  bgGrad.addColorStop(1, '#091926');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Decorative glowing circles
  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 290, 260, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.10)';
  ctx.fill();
  ctx.restore();

  // Outer Frame Border
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
  ctx.lineWidth = 6;
  ctx.strokeRect(42, 42, 996, 996);

  // 2. Top Header Branding
  ctx.textAlign = 'center';
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌱 NAWWA | نَوَاة', 540, 118);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    isAr ? 'انزرع خطوة صغيرة اليوم.. تحصد شجرة حياة كاملة' : 'Plant a Tiny Seed Today, Grow Across Every Pillar',
    540,
    162
  );

  // 3. Center Evolution Emblem & User Name
  ctx.font = '135px system-ui, -apple-system, sans-serif';
  ctx.fillText(plant.icon, 540, 325);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
  ctx.fillText(state.user?.name || 'Champion', 540, 415);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${plant.icon} ${plant.label}`, 540, 468);

  // 4. Four Stat Boxes (2x2 Grid)
  const boxes = [
    {
      x: 90,
      y: 520,
      title: isAr ? '🔥 سلسلة الالتزام' : '🔥 Daily Streak',
      val: `${state.streak || 0} ${isAr ? 'يوم' : 'Days'}`,
      color: '#fb923c'
    },
    {
      x: 560,
      y: 520,
      title: isAr ? '⭐ نقاط النمو' : '⭐ Growth Points',
      val: `${state.points || 0} PTS`,
      color: '#38bdf8'
    },
    {
      x: 90,
      y: 715,
      title: isAr ? '📖 ختمة القرآن الكريم' : '📖 Quran Mushaf',
      val: `${stats.quranPages} / 604`,
      color: '#facc15'
    },
    {
      x: 560,
      y: 715,
      title: isAr ? '✅ حصاد آخر ٧ أيام' : '✅ 7-Day Consistency',
      val: `${stats.activeDaysLast7}/7 (${stats.consistencyPct}%)`,
      color: '#34d399'
    }
  ];

  boxes.forEach((b) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(b.x, b.y, 430, 160, 24);
    } else {
      ctx.rect(b.x, b.y, 430, 160);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(b.title, b.x + 215, b.y + 56);

    ctx.fillStyle = b.color;
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.fillText(b.val, b.x + 215, b.y + 122);
  });

  // 5. Squad Code & Date Footer
  const squadCode = state.champions?.squadCode || 'GROW-2026';
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    isAr
      ? `🏆 كود فريق التحدي: ${squadCode}  •  ${new Date().toLocaleDateString('ar-EG')}`
      : `🏆 Accountability Squad: ${squadCode}  •  ${new Date().toLocaleDateString('en-US')}`,
    540,
    955
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText('nawwa.vercel.app — 3-Tier Behavioral Habit & Faith Companion', 540, 1002);

  // Convert to Blob & Share or Download
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const fileName = `nawwa-victory-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: isAr ? 'بطاقة إنجازي في تطبيق نواة 🌱' : 'My Nawwa Victory Card 🌱',
          text: isAr
            ? `🌱 وصلت إلى (${plant.label}) وسلسلة ${state.streak} يوم في تطبيق نَوَاة! انضم لفريقي بكود: ${squadCode}`
            : `🌱 Reached (${plant.label}) with a ${state.streak}-day streak on Nawwa! Join my squad: ${squadCode}`,
          files: [file]
        });
        return;
      } catch (_) {}
    }

    // Fallback: Download PNG directly
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast(
        isAr
          ? '🎨 تم تحميل بطاقة الإنجاز (PNG) الخاصة بك! شاركها مع أصدقائك على واتساب.'
          : '🎨 Downloaded your Nawwa Victory Card (PNG)! Share it on WhatsApp or Stories.'
      );
    }
  }, 'image/png');
}

export async function pushCloudSquadSync(state, eventPayload = null) {
  // Broadcast across open browser tabs immediately
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'SQUAD_SYNC',
        users: state.users,
        champions: state.champions,
        eventPayload
      });
    } catch (_) {}
  }

  const squadCode = state.champions?.squadCode || 'NAWWA-77';
  const cloudConfig = state.cloudConfig || null;

  // Direct Supabase REST upsert if user configured Supabase URL & Key in Admin/Settings
  if (cloudConfig?.supabaseUrl && cloudConfig?.supabaseKey && typeof navigator !== 'undefined' && navigator.onLine !== false) {
    try {
      const cleanUrl = cloudConfig.supabaseUrl.replace(/\/+$/, '');
      await fetch(`${cleanUrl}/rest/v1/nawwa_squads`, {
        method: 'POST',
        headers: {
          apikey: cloudConfig.supabaseKey,
          Authorization: `Bearer ${cloudConfig.supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          squad_code: squadCode,
          payload: {
            squadCode,
            squadMembers: state.champions?.squadMembers || [],
            users: state.users || []
          },
          updated_at: new Date().toISOString()
        })
      });
    } catch (_) {}
  }

  // Sync with Serverless /api/squad endpoint when online
  if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadCode,
          cloudConfig,
          user: state.currentUser
            ? {
                id: state.currentUser.id,
                name: state.currentUser.name,
                email: state.currentUser.email,
                role: state.currentUser.role,
                points: state.points,
                streak: state.streak,
                checkedInToday: Object.keys(state.completedToday || {}).length > 0
              }
            : null,
          users: state.users,
          eventPayload
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.squadMembers) && data.squadMembers.length) {
          state.champions.squadMembers = data.squadMembers;
        }
        if (Array.isArray(data?.users) && data.users.length > (state.users || []).length) {
          state.users = data.users;
        }
      }
    } catch (_) {}
  }
}

export function initLiveSquadSync({ getState, saveState, renderAll, showToast }) {
  appGetState = getState;
  appSaveState = saveState;
  appRenderAll = renderAll;
  appShowToast = showToast;

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      syncChannel = new BroadcastChannel('nawwa_live_sync');
      syncChannel.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || msg.type !== 'SQUAD_SYNC') return;
        const st = appGetState();
        if (Array.isArray(msg.users)) st.users = msg.users;
        if (msg.champions) st.champions = msg.champions;

        if (msg.eventPayload && msg.eventPayload.targetName && appShowToast) {
          const isAr = st.lang === 'ar';
          const { action, fromName, targetName } = msg.eventPayload;
          if (action === 'nudge') {
            appShowToast(
              isAr
                ? `🔔 وصلك تنبيه التزام من ${fromName} إلى ${targetName}!`
                : `🔔 Accountability nudge from ${fromName} to ${targetName}!`
            );
          } else if (action === 'cheer') {
            appShowToast(
              isAr
                ? `👏 وصلك تشجيع حار من ${fromName} إلى ${targetName}!`
                : `👏 High-five & cheer from ${fromName} to ${targetName}!`
            );
          }
        }
        appRenderAll();
      };
    } catch (_) {}
  }
}

// ==========================================
// 3. WEEKLY GROWTH & AI INSIGHTS REPORT
// ==========================================
export function computeWeeklyInsights(state) {
  const history = state.history || {};
  const now = new Date();
  let activeDaysLast7 = 0;
  let totalSeedsLast7 = 0;
  const last30Days = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    const count =
      i === 0 ? Object.keys(state.completedToday || {}).length : Number(history[iso] || 0);
    if (i < 7) {
      if (count > 0) activeDaysLast7++;
      totalSeedsLast7 += count;
    }
    last30Days.push({ iso, dayNum: d.getDate(), count, isToday: i === 0 });
  }

  const findPillar = (id) => (state.pillars || []).find((p) => p.id === id);
  const faithPillar = findPillar('faith');
  const focusPillar = findPillar('focus');
  const fitnessPillar = findPillar('fitness');
  const smokingPillar = findPillar('smoking');

  const quranPages = faithPillar?.tracker?.value || 0;
  const quranPace = Math.max(1, faithPillar?.tracker?.step || 1);
  const pagesRemaining = Math.max(0, 604 - quranPages);
  const daysToKhatmah = Math.ceil(pagesRemaining / quranPace);

  const cigsAvoided = smokingPillar?.tracker?.value || 0;
  const moneySavedUsd = (cigsAvoided * 0.5).toFixed(1);
  const moneySavedEgp = Math.round(cigsAvoided * 15);
  const lifeMinsRegained = cigsAvoided * 11; // Each cigarette avoided ~ 11 mins of life

  const focusMins = focusPillar?.tracker?.value || 0;
  const workoutMins = fitnessPillar?.tracker?.value || 0;
  const consistencyPct = Math.round((activeDaysLast7 / 7) * 100);

  return {
    activeDaysLast7,
    totalSeedsLast7,
    consistencyPct,
    last30Days,
    quranPages,
    daysToKhatmah,
    cigsAvoided,
    moneySavedUsd,
    moneySavedEgp,
    lifeMinsRegained,
    focusMins,
    workoutMins
  };
}

export function openWeeklyInsightsModal() {
  const modal = document.getElementById('weekly-insights-modal');
  if (!modal || !appGetState) return;

  const st = appGetState();
  const isAr = st.lang === 'ar';
  const stats = computeWeeklyInsights(st);

  const titleEl = document.getElementById('ui-insights-modal-title');
  if (titleEl) {
    titleEl.textContent = isAr
      ? '📊 تقرير حصاد الأسبوع وحديقة الـ ٣٠ يوماً'
      : '📊 Weekly Seed Harvest & 30-Day Garden';
  }

  const heatmapCellsHtml = stats.last30Days
    .map((cell) => {
      const bg =
        cell.count >= 3
          ? 'rgba(16, 185, 129, 0.85)'
          : cell.count >= 1
          ? 'rgba(52, 211, 153, 0.38)'
          : 'rgba(148, 163, 184, 0.12)';
      const border = cell.isToday ? '2px solid #facc15' : '1px solid rgba(148,163,184,0.22)';
      return `
        <div title="${cell.iso}: ${cell.count} seeds" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:36px; border-radius:8px; background:${bg}; border:${border}; font-size:0.72rem; font-weight:700; color:${cell.count >= 3 ? '#04131a' : 'var(--text-main)'};">
          <span>${cell.dayNum}</span>
          <span style="font-size:0.62rem; opacity:0.85;">${cell.count > 0 ? `🌱${cell.count}` : '·'}</span>
        </div>
      `;
    })
    .join('');

  const recentGratitude = (st.gratitudeLog || []).slice(-3).reverse();
  const gratitudeListHtml = recentGratitude.length
    ? recentGratitude
        .map(
          (g) => `
          <div style="font-size:0.8rem; padding:6px 10px; border-radius:8px; background:rgba(15,23,42,0.55); border:1px solid var(--border-color); display:flex; justify-content:space-between; gap:8px;">
            <span>${g.mood || '🌿'} ${g.text}</span>
            <span style="color:var(--text-muted); font-size:0.72rem;">${g.date || ''}</span>
          </div>`
        )
        .join('')
    : `<div style="font-size:0.78rem; color:var(--text-muted);">${
        isAr ? 'سجّل أول نعمة تشكر الله عليها اليوم بالأسفل (+١٠ نقاط)' : 'Log your first daily gratitude note below (+10 pts)'
      }</div>`;

  const grid = document.getElementById('weekly-insights-content');
  if (grid) {
    grid.innerHTML = `
      <div class="weekly-insights-grid">
        <div class="insight-stat-card">
          <span class="insight-stat-val">${stats.activeDaysLast7} / 7 (${stats.consistencyPct}%)</span>
          <span class="insight-stat-label">${isAr ? 'أيام الالتزام هذا الأسبوع' : 'Active Days This Week'}</span>
        </div>
        <div class="insight-stat-card">
          <span class="insight-stat-val">🕌 ${stats.quranPages} / 604</span>
          <span class="insight-stat-label">${
            isAr
              ? `صفحات القرآن (الختمة خلال ~${stats.daysToKhatmah} يوم)`
              : `Quran Pages (~${stats.daysToKhatmah}d to Khatmah)`
          }</span>
        </div>
        <div class="insight-stat-card">
          <span class="insight-stat-val">⚡ ${stats.focusMins} ${isAr ? 'د' : 'm'}</span>
          <span class="insight-stat-label">${isAr ? 'دقائق التركيز العميق' : 'Deep Focus Minutes'}</span>
        </div>
        <div class="insight-stat-card">
          <span class="insight-stat-val">🚭 ${stats.cigsAvoided}</span>
          <span class="insight-stat-label">${
            isAr
              ? `سجائر متجنبة (وفرت ${stats.moneySavedEgp} ج.م / $${stats.moneySavedUsd})`
              : `Cigs Avoided ($${stats.moneySavedUsd} / ${stats.moneySavedEgp} EGP saved)`
          }</span>
        </div>
      </div>

      <!-- 30-Day Seed Garden Heatmap -->
      <div style="margin-top:12px; padding:12px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
          <strong style="font-size:0.86rem; color:var(--green-400);">
            🗓️ ${isAr ? 'خريطة الالتزام (آخر ٣٠ يوماً)' : '30-Day Seed Garden Consistency Map'}
          </strong>
          <span style="font-size:0.74rem; color:var(--text-muted);">
            ${isAr ? 'أخضر داكن = ٣+ عادات يومية' : 'Bright Green = 3+ daily seeds'}
          </span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(10, 1fr); gap:6px;">
          ${heatmapCellsHtml}
        </div>
      </div>

      <!-- Daily Gratitude & Mood Reflection -->
      <div style="margin-top:12px; padding:12px; background:var(--bg-surface); border:1px solid rgba(250,204,21,0.35); border-radius:var(--radius-md);">
        <div style="font-weight:800; font-size:0.86rem; color:#facc15; margin-bottom:8px;">
          🤲 ${isAr ? 'سجل الشكر والامتنان اليومي (الحمد لله على...)' : 'Daily Gratitude & Mood Check-In (+10 pts)'}
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
          <select id="select-gratitude-mood" class="text-input" style="width:auto; padding:6px 10px; font-size:0.82rem;">
            <option value="⚡">${isAr ? '⚡ طاقة عالية' : '⚡ High Energy'}</option>
            <option value="🌿" selected>${isAr ? '🌿 مطمئن وهادئ' : '🌿 Calm & Grateful'}</option>
            <option value="🔋">${isAr ? '🔋 مرهق ولكن مستمر' : '🔋 Tired but Resilient'}</option>
          </select>
          <input type="text" id="input-gratitude-note" class="text-input" style="flex:1; min-width:180px; padding:6px 10px; font-size:0.82rem;" placeholder="${
            isAr ? 'اكتب نعمة أو إنجازاً صغيراً تشكر الله عليه اليوم...' : 'Write 1 blessing or small win you are grateful for today...'
          }" />
          <button type="button" id="btn-save-gratitude" class="btn-primary" style="padding:6px 14px; font-size:0.82rem;">
            + ${isAr ? 'حفظ (+١٠ ن)' : 'Log (+10 pts)'}
          </button>
        </div>
        <div id="gratitude-recent-list" style="display:flex; flex-direction:column; gap:5px;">
          ${gratitudeListHtml}
        </div>
      </div>

      <div style="padding:14px; background:var(--gradient-surface); border:1px solid var(--green-400); border-radius:var(--radius-md); margin-top:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
          <div style="font-weight:800; font-size:0.9rem; color:var(--green-400);">
            🎙️ ${isAr ? 'رسالة وتوصية مدرب نَوَاة الذكي:' : "Nawwa AI Coach's Reflection:"}
          </div>
          <button type="button" id="btn-insights-victory-card" class="mini-btn" style="border-color:var(--gold-border); color:#facc15; font-weight:800;">
            🎨 ${isAr ? 'مشاركة بطاقة الإنجاز (PNG)' : 'Share Victory Card (PNG)'}
          </button>
        </div>
        <p id="insights-coach-summary" style="font-size:0.88rem; line-height:1.55;">
          ${
            isAr
              ? `ما شاء الله يا ${st.user.name}! التزمت في ${stats.activeDaysLast7} من آخر ٧ أيام وزرعت ${stats.totalSeedsLast7} نواة إيجابية، ووصلت إلى الصفحة ${stats.quranPages} في ختمة القرآن الكريم، وتجنبت ${stats.cigsAvoided} سيجارة (ما يعادل استعادة ${stats.lifeMinsRegained} دقيقة من صحتك وعافيتك). نصيحتي لك للأسبوع القادم: حافظ على خطوة الدقيقتين البرونزية في الأيام المزدحمة ولا تكسر السلسلة أبداً!`
              : `Masha'Allah, ${st.user.name}! You stayed consistent on ${stats.activeDaysLast7} of the last 7 days, planted ${stats.totalSeedsLast7} habit seeds, reached Page ${stats.quranPages} of the Holy Quran, and avoided ${stats.cigsAvoided} cigarettes (reclaiming ~${stats.lifeMinsRegained} minutes of healthy life). My coaching tip for this week: lean on 2-minute Bronze seeds on busy days so your ${st.streak}-day streak stays unbroken!`
          }
        </p>
      </div>
    `;

    grid.querySelector('#btn-save-gratitude')?.addEventListener('click', () => {
      const noteEl = grid.querySelector('#input-gratitude-note');
      const moodEl = grid.querySelector('#select-gratitude-mood');
      const textVal = noteEl?.value.trim();
      if (!textVal) return;
      st.gratitudeLog = Array.isArray(st.gratitudeLog) ? st.gratitudeLog : [];
      const todayStr = new Date().toISOString().slice(0, 10);
      const alreadyLoggedToday = st.gratitudeLog.some((g) => g.date === todayStr);
      st.gratitudeLog.push({
        id: 'grat_' + Date.now(),
        date: todayStr,
        mood: moodEl?.value || '🌿',
        text: textVal
      });
      if (!alreadyLoggedToday) {
        st.points = (st.points || 0) + 10;
      }
      if (appSaveState) appSaveState();
      if (appRenderAll) appRenderAll();
      if (appShowToast) {
        appShowToast(
          isAr
            ? '🤲 اللهم لك الحمد! تم حفظ نعمة اليوم في سجل الامتنان (+١٠ نقاط)'
            : '🤲 Alhamdulillah! Logged your daily gratitude note (+10 pts)'
        );
      }
      openWeeklyInsightsModal();
    });

    grid.querySelector('#btn-insights-victory-card')?.addEventListener('click', () => {
      generateAndShareVictoryCard(st, appShowToast);
    });
  }

  modal.classList.remove('hidden');
}

export function closeWeeklyInsightsModal() {
  const modal = document.getElementById('weekly-insights-modal');
  if (modal) modal.classList.add('hidden');
}

export function speakWeeklyInsights(state) {
  const summaryEl = document.getElementById('insights-coach-summary');
  if (!summaryEl) return;
  speakText(summaryEl.textContent, state.lang, true, null, null, state.voiceSettings);
}
