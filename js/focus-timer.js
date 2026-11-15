// Interactive Pomodoro & Deep Focus Timer + Web Audio Synthesized Focus Soundscapes
// (Calm Rain / Brown Noise & 40Hz Binaural Focus Hum — 0 external MP3 dependencies)

import { playTierSound } from './voice-audio.js';

let focusInterval = null;
let totalSeconds = 25 * 60;
let remainingSeconds = 25 * 60;
let activePresetMins = 25;
let isRunning = false;
let soundscapeMode = 'off'; // 'off' | 'rain' | 'binaural'

let noiseAudioCtx = null;
let noiseSourceNode = null;
let noiseGainNode = null;
let binauralOscLeft = null;
let binauralOscRight = null;

let appGetState = null;
let appOnCompleteFocusSession = null;
let appShowToast = null;

// ==========================================
// WEB AUDIO SYNTHESIZED FOCUS SOUNDSCAPES
// ==========================================
function ensureNoiseCtx() {
  if (!noiseAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    noiseAudioCtx = new Ctx();
  }
  if (noiseAudioCtx && noiseAudioCtx.state === 'suspended') {
    noiseAudioCtx.resume().catch(() => {});
  }
  return noiseAudioCtx;
}

export function stopFocusSoundscape() {
  if (noiseSourceNode) {
    try {
      noiseSourceNode.stop();
      noiseSourceNode.disconnect();
    } catch (_) {}
    noiseSourceNode = null;
  }
  if (binauralOscLeft) {
    try {
      binauralOscLeft.stop();
      binauralOscLeft.disconnect();
    } catch (_) {}
    binauralOscLeft = null;
  }
  if (binauralOscRight) {
    try {
      binauralOscRight.stop();
      binauralOscRight.disconnect();
    } catch (_) {}
    binauralOscRight = null;
  }
  if (noiseGainNode) {
    try {
      noiseGainNode.disconnect();
    } catch (_) {}
    noiseGainNode = null;
  }
}

export function startFocusSoundscape(mode = soundscapeMode) {
  stopFocusSoundscape();
  soundscapeMode = mode;
  if (mode === 'off' || !isRunning) return;

  const ctx = ensureNoiseCtx();
  if (!ctx) return;

  try {
    if (mode === 'rain') {
      // Generate warm Brown/Pink Rain Noise buffer (3 seconds looped)
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.22; // gentle level
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.6);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(0);

      noiseSourceNode = whiteNoise;
      noiseGainNode = gain;
    } else if (mode === 'binaural') {
      // Soft 200Hz + 240Hz (40Hz Gamma Focus Beat)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gain = ctx.createGain();

      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.value = 200;
      oscR.frequency.value = 240;

      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.6);

      oscL.connect(gain);
      oscR.connect(gain);
      gain.connect(ctx.destination);

      oscL.start();
      oscR.start();

      binauralOscLeft = oscL;
      binauralOscRight = oscR;
      noiseGainNode = gain;
    }
  } catch (_) {}
}

// ==========================================
// POMODORO & DEEP FOCUS TIMER CONTROLS
// ==========================================
function formatMmSs(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateFocusTimerDom() {
  const isAr = appGetState?.()?.lang === 'ar';
  const timeEl = document.getElementById('focus-timer-digits');
  const barEl = document.getElementById('focus-timer-progress-fill');
  const startBtn = document.getElementById('btn-focus-timer-toggle');
  const statusEl = document.getElementById('focus-timer-status');

  if (timeEl) {
    timeEl.textContent = formatMmSs(remainingSeconds);
  }

  if (barEl && totalSeconds > 0) {
    const pct = Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100));
    barEl.style.width = `${pct}%`;
  }

  if (startBtn) {
    if (isRunning) {
      startBtn.innerHTML = isAr ? '⏸️ إيقاف مؤقت' : '⏸️ Pause Session';
    } else if (remainingSeconds < totalSeconds && remainingSeconds > 0) {
      startBtn.innerHTML = isAr ? '▶️ استئناف التركيز' : '▶️ Resume Focus';
    } else {
      startBtn.innerHTML = isAr ? '🚀 ابدأ جلسة التركيز الآن' : '🚀 Start Focus Session';
    }
  }

  if (statusEl) {
    const tierBadge =
      activePresetMins >= 45
        ? isAr
          ? 'ذهبي • +٥٠ نقطة'
          : 'GOLD • +50 pts'
        : activePresetMins >= 25
          ? isAr
            ? 'فضي • +٢٥ نقطة'
            : 'SILVER • +25 pts'
          : isAr
            ? 'برونزي • +١٠ نقاط'
            : 'BRONZE • +10 pts';
    statusEl.textContent = `${activePresetMins} ${isAr ? 'دقيقة' : 'mins'} (${tierBadge})`;
  }

  document.querySelectorAll('.focus-preset-btn').forEach((btn) => {
    const mins = Number(btn.getAttribute('data-mins'));
    btn.className = `${mins === activePresetMins ? 'btn-primary' : 'btn-secondary'} focus-preset-btn`;
  });

  document.querySelectorAll('.focus-sound-btn').forEach((btn) => {
    const mode = btn.getAttribute('data-sound');
    btn.classList.toggle('active-toggle', mode === soundscapeMode);
  });
}

export function selectFocusPreset(mins) {
  pauseFocusTimer();
  activePresetMins = Number(mins) || 25;
  totalSeconds = activePresetMins * 60;
  remainingSeconds = totalSeconds;
  updateFocusTimerDom();
}

export function pauseFocusTimer() {
  if (focusInterval) {
    clearInterval(focusInterval);
    focusInterval = null;
  }
  isRunning = false;
  stopFocusSoundscape();
  updateFocusTimerDom();
}

export function resetFocusTimer() {
  pauseFocusTimer();
  remainingSeconds = totalSeconds;
  updateFocusTimerDom();
}

export function toggleFocusTimer() {
  if (isRunning) {
    pauseFocusTimer();
    return;
  }

  if (remainingSeconds <= 0) {
    remainingSeconds = totalSeconds;
  }

  isRunning = true;
  startFocusSoundscape(soundscapeMode);
  updateFocusTimerDom();

  focusInterval = setInterval(() => {
    remainingSeconds--;
    updateFocusTimerDom();

    if (remainingSeconds <= 0) {
      pauseFocusTimer();
      completeFocusSessionNow(activePresetMins);
    }
  }, 1000);
}

export function completeFocusSessionNow(loggedMins = activePresetMins) {
  pauseFocusTimer();
  const tier = loggedMins >= 45 ? 'gold' : loggedMins >= 25 ? 'silver' : 'bronze';
  const taskInput = document.getElementById('focus-session-task-input');
  const taskName = taskInput?.value.trim() || '';

  if (typeof appOnCompleteFocusSession === 'function') {
    appOnCompleteFocusSession({
      minutes: loggedMins,
      tier,
      taskName
    });
  }
}

export function openFocusTimerModal(defaultMins = 25) {
  const modal = document.getElementById('focus-timer-modal');
  if (!modal) return;

  if (!isRunning) {
    selectFocusPreset(defaultMins);
  } else {
    updateFocusTimerDom();
  }

  modal.classList.remove('hidden');
}

export function closeFocusTimerModal() {
  // Keep timer running in background if user just closes modal, or stop sound if not running
  if (!isRunning) {
    stopFocusSoundscape();
  }
  const modal = document.getElementById('focus-timer-modal');
  if (modal) modal.classList.add('hidden');
}

export function initFocusTimerModule({ getState, onCompleteFocusSession, showToast }) {
  appGetState = getState;
  appOnCompleteFocusSession = onCompleteFocusSession;
  appShowToast = showToast;

  document.getElementById('btn-close-focus-timer')?.addEventListener('click', closeFocusTimerModal);
  document.getElementById('btn-focus-timer-toggle')?.addEventListener('click', toggleFocusTimer);
  document.getElementById('btn-focus-timer-reset')?.addEventListener('click', resetFocusTimer);

  document.getElementById('btn-focus-complete-early')?.addEventListener('click', () => {
    const elapsedMins = Math.max(2, Math.round((totalSeconds - remainingSeconds) / 60) || activePresetMins);
    completeFocusSessionNow(elapsedMins);
    closeFocusTimerModal();
  });

  document.querySelectorAll('.focus-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectFocusPreset(Number(btn.getAttribute('data-mins')) || 25);
    });
  });

  document.querySelectorAll('.focus-sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-sound') || 'off';
      soundscapeMode = mode;
      if (isRunning) {
        startFocusSoundscape(mode);
      }
      updateFocusTimerDom();
    });
  });

  updateFocusTimerDom();
}
