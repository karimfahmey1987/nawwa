import { playBrainTone, playBrainError, playBrainFanfare } from './voice-audio.js';

const STORAGE_KEY_SCORES = 'nawwa_brain_scores';

// Audio frequencies for the 9 pattern tiles (C4 to D5)
const TILE_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];

const STROOP_ITEMS = [
  { id: 'red', textEn: 'RED', textAr: 'أحمر', color: '#f43f5e' },
  { id: 'blue', textEn: 'BLUE', textAr: 'أزرق', color: '#38bdf8' },
  { id: 'green', textEn: 'GREEN', textAr: 'أخضر', color: '#10b981' },
  { id: 'yellow', textEn: 'YELLOW', textAr: 'أصفر', color: '#facc15' }
];

const CARD_PAIRS = [
  { id: 'faith', icon: '🕌', labelEn: 'Faith', labelAr: 'إيمان' },
  { id: 'focus', icon: '⚡', labelEn: 'Focus', labelAr: 'تركيز' },
  { id: 'fitness', icon: '🏃', labelEn: 'Fitness', labelAr: 'لياقة' },
  { id: 'nutrition', icon: '🥗', labelEn: 'Food', labelAr: 'تغذية' },
  { id: 'smoke', icon: '🚭', labelEn: 'No Smoke', labelAr: 'إقلاع' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', labelEn: 'Family', labelAr: 'عائلة' },
  { id: 'mind', icon: '🧠', labelEn: 'Mind', labelAr: 'عقل' },
  { id: 'star', icon: '🌟', labelEn: 'Champion', labelAr: 'تميز' }
];

let appGetState = null;
let appAwardPoints = null;
let appShowToast = null;
let appLaunchConfetti = null;
let appT = null;

let activeTab = 'pattern';

// ------------------------------
// High Scores Storage
// ------------------------------
function loadBrainScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { patternMaxLevel: 1, stroopHighScore: 0, cardsBestMoves: 99, totalBrainPoints: 0 };
}

function saveBrainScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
  } catch (_) {}
}

let brainScores = loadBrainScores();

// ==========================================
// GAME 1: Pattern Sequence Memory
// ==========================================
let patternSequence = [];
let patternPlayerIndex = 0;
let patternLevel = 1;
let patternIsPlaying = false;
let patternCanClick = false;

function initPatternGame() {
  const container = document.getElementById('pattern-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 9; i++) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'pattern-tile';
    tile.dataset.tileIndex = i;
    tile.innerHTML = `<span>${i + 1}</span>`;
    tile.addEventListener('click', () => handlePatternTileClick(i));
    container.appendChild(tile);
  }

  updatePatternStats();
}

function updatePatternStats() {
  const lvlEl = document.getElementById('pattern-stat-level');
  const hsEl = document.getElementById('pattern-stat-highscore');
  if (lvlEl) lvlEl.textContent = patternLevel;
  if (hsEl) hsEl.textContent = brainScores.patternMaxLevel || 1;
}

function startPatternGame() {
  patternSequence = [];
  patternLevel = 1;
  patternIsPlaying = true;
  patternPlayerIndex = 0;
  patternCanClick = false;

  const startBtn = document.getElementById('btn-pattern-start');
  if (startBtn) startBtn.classList.add('hidden');

  updatePatternStatus(appT('patternWatch'));
  updatePatternStats();

  nextPatternRound();
}

function nextPatternRound() {
  patternPlayerIndex = 0;
  patternCanClick = false;
  updatePatternStats();
  updatePatternStatus(appT('patternWatch'));

  // Add random tile (0-8)
  const nextTile = Math.floor(Math.random() * 9);
  patternSequence.push(nextTile);

  // Play sequence visually & audibly
  playSequenceAnimation();
}

function playSequenceAnimation() {
  const speed = Math.max(320, 680 - patternLevel * 25);
  const flashDuration = Math.max(200, speed - 120);

  patternSequence.forEach((tileIdx, step) => {
    setTimeout(() => {
      flashTile(tileIdx, flashDuration);
    }, step * speed + 400);
  });

  setTimeout(() => {
    patternCanClick = true;
    updatePatternStatus(appT('patternYourTurn'));
  }, patternSequence.length * speed + 500);
}

function flashTile(idx, duration = 300) {
  const tiles = document.querySelectorAll('.pattern-tile');
  const tile = tiles[idx];
  if (!tile) return;

  tile.classList.add('active');
  playBrainTone(TILE_FREQUENCIES[idx] || 440, 'triangle', duration / 1000);

  setTimeout(() => {
    tile.classList.remove('active');
  }, duration);
}

function handlePatternTileClick(idx) {
  if (!patternIsPlaying || !patternCanClick) return;

  flashTile(idx, 220);

  if (idx === patternSequence[patternPlayerIndex]) {
    patternPlayerIndex++;

    // Completed full sequence for this level
    if (patternPlayerIndex === patternSequence.length) {
      patternCanClick = false;
      patternLevel++;

      if (patternLevel > (brainScores.patternMaxLevel || 1)) {
        brainScores.patternMaxLevel = patternLevel;
        saveBrainScores(brainScores);
      }

      // Reward points at milestone levels (every 3 levels)
      if (patternLevel % 3 === 0) {
        awardPoints(10, 'Pattern Memory');
      }

      setTimeout(() => {
        playBrainFanfare();
        nextPatternRound();
      }, 700);
    }
  } else {
    // Incorrect tile clicked -> Game Over
    patternIsPlaying = false;
    patternCanClick = false;
    playBrainError();

    const finalLevel = patternLevel;
    updatePatternStatus(`${appT('patternGameOver')} ${finalLevel}`);

    if (finalLevel >= 3) {
      awardPoints(10, 'Pattern Memory');
    }

    const startBtn = document.getElementById('btn-pattern-start');
    if (startBtn) {
      startBtn.textContent = appT('patternPlayAgain');
      startBtn.classList.remove('hidden');
    }
  }
}

function updatePatternStatus(msg) {
  const el = document.getElementById('pattern-status-msg');
  if (el) el.textContent = msg;
}

// ==========================================
// GAME 2: Stroop Concentration Reflex
// ==========================================
let stroopTimeLeft = 30;
let stroopInterval = null;
let stroopScore = 0;
let stroopTotalAttempts = 0;
let stroopCorrect = 0;
let stroopStreak = 0;
let stroopCurrentQuestion = null;
let stroopStartTime = 0;
let stroopReactionTimes = [];

function initStroopGame() {
  const btnGrid = document.getElementById('stroop-buttons-grid');
  if (!btnGrid) return;
  btnGrid.innerHTML = '';

  STROOP_ITEMS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stroop-btn';
    btn.dataset.colorId = item.id;
    btn.style.borderColor = item.color;

    const labelKey = `color${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`;
    btn.textContent = appT(labelKey);
    btn.addEventListener('click', () => handleStroopPick(item.id));
    btnGrid.appendChild(btn);
  });

  updateStroopStats();
}

function updateStroopStats() {
  const timeEl = document.getElementById('stroop-stat-time');
  const scoreEl = document.getElementById('stroop-stat-score');
  const streakEl = document.getElementById('stroop-stat-streak');

  if (timeEl) timeEl.textContent = `${stroopTimeLeft}s`;
  if (scoreEl) scoreEl.textContent = stroopScore;
  if (streakEl) streakEl.textContent = `x${stroopStreak}`;
}

function startStroopGame() {
  clearInterval(stroopInterval);
  stroopTimeLeft = 30;
  stroopScore = 0;
  stroopTotalAttempts = 0;
  stroopCorrect = 0;
  stroopStreak = 0;
  stroopReactionTimes = [];

  const startBtn = document.getElementById('btn-stroop-start');
  if (startBtn) startBtn.classList.add('hidden');

  updateStroopStats();
  nextStroopQuestion();

  stroopInterval = setInterval(() => {
    stroopTimeLeft--;
    updateStroopStats();

    if (stroopTimeLeft <= 0) {
      clearInterval(stroopInterval);
      endStroopGame();
    }
  }, 1000);
}

function nextStroopQuestion() {
  // Pick random word and DIFFERENT color (classic Stroop conflict)
  const wordItem = STROOP_ITEMS[Math.floor(Math.random() * STROOP_ITEMS.length)];
  const remainingColors = STROOP_ITEMS.filter((i) => i.id !== wordItem.id);
  const colorItem = remainingColors[Math.floor(Math.random() * remainingColors.length)];

  stroopCurrentQuestion = {
    word: appGetState().lang === 'ar' ? wordItem.textAr : wordItem.textEn,
    correctColorId: colorItem.id,
    colorValue: colorItem.color
  };

  const displayEl = document.getElementById('stroop-word-display');
  if (displayEl) {
    displayEl.textContent = stroopCurrentQuestion.word;
    displayEl.style.color = stroopCurrentQuestion.colorValue;
  }

  stroopStartTime = performance.now();
}

function handleStroopPick(pickedColorId) {
  if (stroopTimeLeft <= 0 || !stroopCurrentQuestion) return;

  const reactionMs = Math.round(performance.now() - stroopStartTime);
  stroopReactionTimes.push(reactionMs);
  stroopTotalAttempts++;

  if (pickedColorId === stroopCurrentQuestion.correctColorId) {
    stroopCorrect++;
    stroopStreak++;
    const bonus = stroopStreak >= 5 ? 15 : 10;
    stroopScore += bonus;
    playBrainTone(523.25 + Math.min(stroopStreak * 30, 400), 'triangle', 0.14);
  } else {
    stroopStreak = 0;
    stroopScore = Math.max(0, stroopScore - 5);
    playBrainError();
  }

  updateStroopStats();
  nextStroopQuestion();
}

function endStroopGame() {
  stroopCurrentQuestion = null;
  const displayEl = document.getElementById('stroop-word-display');

  const accuracy = stroopTotalAttempts > 0 ? Math.round((stroopCorrect / stroopTotalAttempts) * 100) : 0;
  const avgSpeed =
    stroopReactionTimes.length > 0
      ? Math.round(stroopReactionTimes.reduce((a, b) => a + b, 0) / stroopReactionTimes.length)
      : 0;

  if (displayEl) {
    displayEl.style.color = 'var(--text-main)';
    displayEl.textContent = `${appT('stroopFinished')} ${stroopScore} (${accuracy}% Accuracy • ~${avgSpeed}ms)`;
  }

  if (stroopScore > (brainScores.stroopHighScore || 0)) {
    brainScores.stroopHighScore = stroopScore;
    saveBrainScores(brainScores);
  }

  // Award points based on performance
  if (stroopScore >= 100) {
    awardPoints(25, 'Stroop Master');
    playBrainFanfare();
    appLaunchConfetti?.();
  } else if (stroopScore >= 40) {
    awardPoints(10, 'Stroop Reflex');
    playBrainFanfare();
  }

  const startBtn = document.getElementById('btn-stroop-start');
  if (startBtn) {
    startBtn.textContent = appT('patternPlayAgain');
    startBtn.classList.remove('hidden');
  }
}

// ==========================================
// GAME 3: Pillars Card Match
// ==========================================
let cardsList = [];
let cardsFlipped = [];
let cardsMatchedCount = 0;
let cardsMoves = 0;
let cardsTimerSeconds = 0;
let cardsTimerInterval = null;
let cardsLock = false;

function initCardsGame() {
  resetCardsGame();
}

function resetCardsGame() {
  clearInterval(cardsTimerInterval);
  cardsTimerSeconds = 0;
  cardsMoves = 0;
  cardsMatchedCount = 0;
  cardsFlipped = [];
  cardsLock = false;

  updateCardsStats();

  const container = document.getElementById('memory-cards-grid');
  if (!container) return;
  container.innerHTML = '';

  // Duplicate the 8 pillar pairs to make 16 cards
  const deck = [];
  CARD_PAIRS.forEach((item) => {
    deck.push({ ...item, key: `${item.id}_a` });
    deck.push({ ...item, key: `${item.id}_b` });
  });

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  cardsList = deck;

  deck.forEach((card, idx) => {
    const cardEl = document.createElement('button');
    cardEl.type = 'button';
    cardEl.className = 'memory-card';
    cardEl.dataset.cardIdx = idx;

    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-front">🌱</div>
        <div class="card-back">
          <span style="font-size:1.6rem;">${card.icon}</span>
          <span style="font-size:0.68rem; font-weight:700; margin-top:2px;">
            ${appGetState().lang === 'ar' ? card.labelAr : card.labelEn}
          </span>
        </div>
      </div>
    `;

    cardEl.addEventListener('click', () => handleCardClick(idx));
    container.appendChild(cardEl);
  });

  // Start timer on first flip
}

function updateCardsStats() {
  const movesEl = document.getElementById('cards-stat-moves');
  const matchedEl = document.getElementById('cards-stat-matched');
  const timeEl = document.getElementById('cards-stat-time');

  if (movesEl) movesEl.textContent = cardsMoves;
  if (matchedEl) matchedEl.textContent = `${cardsMatchedCount} / 8`;

  if (timeEl) {
    const m = String(Math.floor(cardsTimerSeconds / 60)).padStart(2, '0');
    const s = String(cardsTimerSeconds % 60).padStart(2, '0');
    timeEl.textContent = `${m}:${s}`;
  }
}

function handleCardClick(idx) {
  if (cardsLock) return;

  const cardEls = document.querySelectorAll('.memory-card');
  const cardEl = cardEls[idx];
  const cardData = cardsList[idx];

  if (!cardEl || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) {
    return;
  }

  // Start timer on first move
  if (cardsMoves === 0 && cardsTimerSeconds === 0 && !cardsTimerInterval) {
    cardsTimerInterval = setInterval(() => {
      cardsTimerSeconds++;
      updateCardsStats();
    }, 1000);
  }

  // Flip card
  cardEl.classList.add('flipped');
  playBrainTone(330, 'sine', 0.12);
  cardsFlipped.push({ idx, data: cardData, el: cardEl });

  if (cardsFlipped.length === 2) {
    cardsMoves++;
    cardsLock = true;
    updateCardsStats();

    const [first, second] = cardsFlipped;

    if (first.data.id === second.data.id) {
      // MATCH FOUND
      setTimeout(() => {
        first.el.classList.add('matched');
        second.el.classList.add('matched');
        playBrainTone(587.33, 'triangle', 0.28);
        cardsMatchedCount++;
        cardsFlipped = [];
        cardsLock = false;
        updateCardsStats();

        // All 8 pairs matched -> VICTORY!
        if (cardsMatchedCount === 8) {
          clearInterval(cardsTimerInterval);
          handleCardsVictory();
        }
      }, 350);
    } else {
      // MISMATCH -> Flip back
      setTimeout(() => {
        first.el.classList.remove('flipped');
        second.el.classList.remove('flipped');
        playBrainError();
        cardsFlipped = [];
        cardsLock = false;
      }, 750);
    }
  }
}

function handleCardsVictory() {
  playBrainFanfare();
  appLaunchConfetti?.();

  if (cardsMoves < (brainScores.cardsBestMoves || 99)) {
    brainScores.cardsBestMoves = cardsMoves;
    saveBrainScores(brainScores);
  }

  awardPoints(15, 'Pillars Memory Match');

  const statusMsg = document.getElementById('cards-status-msg');
  if (statusMsg) {
    statusMsg.textContent = `${appT('cardsWon')} ${cardsMoves} ${appT('cardsMoves')} (${cardsTimerSeconds}s)!`;
  }
}

// ------------------------------
// Points Awarding Helper
// ------------------------------
function awardPoints(pts, gameName) {
  brainScores.totalBrainPoints = (brainScores.totalBrainPoints || 0) + pts;
  saveBrainScores(brainScores);

  const displayEl = document.getElementById('brain-score-display');
  if (displayEl) displayEl.textContent = brainScores.totalBrainPoints;

  if (typeof appAwardPoints === 'function') {
    appAwardPoints(pts, gameName);
  }

  if (typeof appShowToast === 'function') {
    const template = appT('brainRewardToast');
    const msg = template.replace('{pts}', pts);
    appShowToast(msg);
  }
}

// ==========================================
// Brain Games Modal & Tab Navigation
// ==========================================
export function switchBrainGameTab(gameKey) {
  activeTab = gameKey;

  document.querySelectorAll('.brain-nav-btn').forEach((btn) => {
    btn.className = btn.dataset.game === gameKey ? 'btn-primary brain-nav-btn' : 'btn-secondary brain-nav-btn';
  });

  document.getElementById('game-panel-pattern')?.classList.toggle('hidden', gameKey !== 'pattern');
  document.getElementById('game-panel-stroop')?.classList.toggle('hidden', gameKey !== 'stroop');
  document.getElementById('game-panel-cards')?.classList.toggle('hidden', gameKey !== 'cards');

  if (gameKey === 'pattern') {
    initPatternGame();
  } else if (gameKey === 'stroop') {
    initStroopGame();
  } else if (gameKey === 'cards') {
    initCardsGame();
  }
}

export function openBrainGamesModal(initialTab = 'pattern') {
  const modal = document.getElementById('brain-games-modal');
  if (!modal) return;

  modal.classList.remove('hidden');

  const displayEl = document.getElementById('brain-score-display');
  if (displayEl) displayEl.textContent = brainScores.totalBrainPoints || 0;

  switchBrainGameTab(initialTab);
}

export function closeBrainGamesModal() {
  const modal = document.getElementById('brain-games-modal');
  if (modal) modal.classList.add('hidden');

  clearInterval(stroopInterval);
  clearInterval(cardsTimerInterval);
  patternIsPlaying = false;
  patternCanClick = false;
}

// Public Initializer
export function initBrainGames(getState, onAwardPoints, showToast, launchConfetti, t) {
  appGetState = getState;
  appAwardPoints = onAwardPoints;
  appShowToast = showToast;
  appLaunchConfetti = launchConfetti;
  appT = t;

  // Modal open & close buttons
  document.getElementById('btn-open-brain-games')?.addEventListener('click', () => openBrainGamesModal('pattern'));
  document.getElementById('btn-sos-brain-game')?.addEventListener('click', () => {
    document.getElementById('sos-modal')?.classList.add('hidden');
    openBrainGamesModal('stroop');
  });
  document.getElementById('btn-close-brain-games')?.addEventListener('click', closeBrainGamesModal);

  // Tab switching buttons
  document.querySelectorAll('.brain-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchBrainGameTab(btn.dataset.game);
    });
  });

  // Game start buttons
  document.getElementById('btn-pattern-start')?.addEventListener('click', startPatternGame);
  document.getElementById('btn-stroop-start')?.addEventListener('click', startStroopGame);
  document.getElementById('btn-cards-restart')?.addEventListener('click', resetCardsGame);

  // Initial render of default game
  initPatternGame();
  initStroopGame();
  initCardsGame();
}
