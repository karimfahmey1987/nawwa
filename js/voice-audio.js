// Upgraded 2-Way Voice Recognition (Live Interim Streaming + Dialect Support),
// Natural Neural TTS (Auto AR/EN Detection + Cloud TTS & Best Voice Selection),
// and Real Conversational AI LLM Brain with App Tool-Calling

let audioCtx = null;
let currentAudioElement = null;

function getAudioCtx() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTierSound(tier = 'bronze') {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const chords = {
    bronze: [440, 554.37],
    silver: [523.25, 659.25, 783.99],
    gold: [523.25, 659.25, 783.99, 1046.5]
  };
  const freqs = chords[tier] || chords.bronze;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
    gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.44);
  });
}

export function playNotificationChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [587.33, 880].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + idx * 0.14);
    osc.stop(ctx.currentTime + idx * 0.14 + 0.52);
  });
}

// Detect if text is predominantly Arabic
export function isArabicText(text) {
  if (!text) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars > 2;
}

// Clean emojis & markdown before speaking aloud
function cleanSpeechString(text) {
  if (!text) return '';
  return text
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/[*_#`~>]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✓⚡🕌💪🥗🚭👨‍👩‍👧‍👦🔔👏🥇🥈🥉👑🔥🌟🌱💎🚨🎙️📅🏆⚙️]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Preload browser speechSynthesis voices immediately when available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Rank available browser voices to avoid robotic espeak when better voices exist
export function getBestBrowserVoice(isAr) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const langPrefix = isAr ? 'ar' : 'en';
  const matching = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(langPrefix));
  if (!matching.length) return null;

  // Score voices: prefer Google, Microsoft Natural/Online, Apple, and avoid espeak if possible
  const scored = matching.map((v) => {
    const name = (v.name || '').toLowerCase();
    let score = 0;
    if (name.includes('natural') || name.includes('online')) score += 50;
    if (name.includes('google')) score += 40;
    if (name.includes('microsoft')) score += 35;
    if (name.includes('salma') || name.includes('shakir') || name.includes('hoda') || name.includes('aria') || name.includes('guy')) score += 25;
    if (!v.localService) score += 15;
    if (name.includes('espeak')) score -= 50;
    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].voice;
}

export function stopSpeaking() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (_) {}
    currentAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

// Split long text into natural sentence chunks for smooth playback
function splitIntoChunks(text, maxLen = 175) {
  const sentences = text.split(/(?<=[.!?؟،\n])\s+/);
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Hard split long sentence by words
        const words = s.split(' ');
        let temp = '';
        for (const w of words) {
          if ((temp + ' ' + w).trim().length <= maxLen) {
            temp = (temp + ' ' + w).trim();
          } else {
            if (temp) chunks.push(temp);
            temp = w;
          }
        }
        current = temp;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

// Natural Speech Output (Supports Cloud Neural Audio + High-Quality Browser TTS)
export async function speakText(text, fallbackLang = 'en', voiceEnabled = true, onStart = null, onEnd = null, voiceSettings = {}) {
  if (!voiceEnabled) {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = cleanSpeechString(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();

  // Auto-detect language from the actual text being spoken!
  const isAr = isArabicText(cleanText) || (fallbackLang === 'ar' && !/[a-zA-Z]{4,}/.test(cleanText));
  const rate = Number(voiceSettings.rate) || 1.0;
  const preferCloud = voiceSettings.engine !== 'browser';

  const bestBrowserVoice = getBestBrowserVoice(isAr);
  const browserVoiceIsRobotic =
    !bestBrowserVoice || (bestBrowserVoice.name || '').toLowerCase().includes('espeak');

  // If user selected Cloud Neural TTS or browser only has robotic espeak, try Cloud TTS stream first
  if (preferCloud || browserVoiceIsRobotic) {
    const worked = await tryCloudNeuralTTS(cleanText, isAr, rate, onStart, onEnd);
    if (worked) return;
  }

  // Browser Web Speech Synthesis (with sentence chunking so Chrome never cuts off after 15 seconds)
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const chunks = splitIntoChunks(cleanText, 180);
    let idx = 0;

    const speakNext = () => {
      if (idx >= chunks.length) {
        if (onEnd) onEnd();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[idx]);
      u.lang = isAr ? 'ar-SA' : 'en-US';
      u.rate = rate;
      u.pitch = 1.0;
      if (bestBrowserVoice) {
        u.voice = bestBrowserVoice;
        u.lang = bestBrowserVoice.lang;
      }
      if (idx === 0 && onStart) {
        u.onstart = onStart;
      }
      u.onend = () => {
        idx++;
        speakNext();
      };
      u.onerror = () => {
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(u);
    };

    speakNext();
  } catch (_) {
    if (onEnd) onEnd();
  }
}

// Cloud Neural TTS helper using natural Google/StreamElements TTS audio endpoints
async function tryCloudNeuralTTS(cleanText, isAr, rate, onStart, onEnd) {
  return new Promise((resolve) => {
    const chunks = splitIntoChunks(cleanText, 165);
    let currentIdx = 0;
    let started = false;

    const playChunk = () => {
      if (currentIdx >= chunks.length) {
        if (onEnd) onEnd();
        resolve(true);
        return;
      }

      const chunk = encodeURIComponent(chunks[currentIdx]);
      const tl = isAr ? 'ar' : 'en';
      // StreamElements / Google Translate TTS natural voice endpoint
      const url = isAr
        ? `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ar&dt=t&q=${chunk}`
        : `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${chunk}`;

      const audio = new Audio();
      audio.referrerPolicy = 'no-referrer';
      audio.src = url;
      audio.playbackRate = Math.min(1.5, Math.max(0.75, rate));
      currentAudioElement = audio;

      audio.onplay = () => {
        if (!started) {
          started = true;
          if (onStart) onStart();
        }
      };

      audio.onended = () => {
        currentIdx++;
        playChunk();
      };

      audio.onerror = () => {
        // Fallback to Google GTX for English if StreamElements fails, or resolve(false)
        if (!isAr && !url.includes('translate.googleapis.com')) {
          const backupAudio = new Audio();
          backupAudio.referrerPolicy = 'no-referrer';
          backupAudio.src = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=en&dt=t&q=${chunk}`;
          backupAudio.playbackRate = Math.min(1.5, Math.max(0.75, rate));
          currentAudioElement = backupAudio;
          backupAudio.onplay = () => {
            if (!started) {
              started = true;
              if (onStart) onStart();
            }
          };
          backupAudio.onended = () => {
            currentIdx++;
            playChunk();
          };
          backupAudio.onerror = () => resolve(false);
          backupAudio.play().catch(() => resolve(false));
        } else {
          resolve(false);
        }
      };

      audio.play().catch(() => resolve(false));
    };

    playChunk();
  });
}

// Upgraded Speech Recognition with Live Interim Preview, Silence Timer & Dialect Selection
let recognitionInstance = null;
let isListeningNow = false;
let silenceTimer = null;

export function stopVoiceRecognition() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (_) {}
  }
  isListeningNow = false;
}

export function toggleVoiceRecognition({
  speechLang = 'ar-EG',
  onInterim,
  onFinalResult,
  onStateChange,
  onError
}) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (onError) {
      onError(
        speechLang.startsWith('ar')
          ? 'متصفحك الحالي لا يدعم الميكروفون المباشر (جرّب متصفح Chrome أو Edge)، أو اكتب رسالتك وسأتحدث إليك بالصوت!'
          : 'Your browser does not support Web Speech microphone input (try Chrome or Edge), or type below and I will speak back aloud!'
      );
    }
    return;
  }

  // If already listening, stopping it submits what was captured so far
  if (isListeningNow && recognitionInstance) {
    stopVoiceRecognition();
    return;
  }

  stopSpeaking();

  const rec = new SpeechRec();
  rec.lang = speechLang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  let finalTranscript = '';
  let latestInterim = '';

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (isListeningNow && (finalTranscript.trim() || latestInterim.trim())) {
        try {
          rec.stop();
        } catch (_) {}
      }
    }, 2200);
  };

  rec.onstart = () => {
    isListeningNow = true;
    if (onStateChange) onStateChange('listening');
  };

  rec.onresult = (event) => {
    latestInterim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece + ' ';
      } else {
        latestInterim += transcriptPiece;
      }
    }
    const combined = (finalTranscript + latestInterim).trim();
    if (onInterim) onInterim(combined);
    resetSilenceTimer();
  };

  rec.onerror = (event) => {
    if (silenceTimer) clearTimeout(silenceTimer);
    isListeningNow = false;
    if (onStateChange) onStateChange('idle');
    if (event.error === 'not-allowed' && onError) {
      onError(
        speechLang.startsWith('ar')
          ? 'يرجى السماح بصلاحية الميكروفون في المتصفح للتحدث بصوتك.'
          : 'Please allow microphone permission in your browser to speak aloud.'
      );
    }
  };

  rec.onend = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    isListeningNow = false;
    if (onStateChange) onStateChange('idle');
    const fullText = (finalTranscript + ' ' + latestInterim).trim();
    if (fullText && onFinalResult) {
      onFinalResult(fullText);
    }
  };

  try {
    rec.start();
    recognitionInstance = rec;
  } catch (_) {
    isListeningNow = false;
    if (onStateChange) onStateChange('idle');
  }
}

// Build System Prompt with Live User Context + Tool-Calling Instructions
function buildCoachSystemPrompt(state) {
  const activePillarsSummary = state.pillars
    .filter((p) => p.active)
    .map((p) => {
      const habitsStr = p.habits
        .map((h) => {
          const status = state.completedToday[h.id]
            ? `COMPLETED (${state.completedToday[h.id].toUpperCase()})`
            : 'NOT DONE YET';
          return `${h.id} ("${h.name.en}" / "${h.name.ar}"): ${status}`;
        })
        .join('; ');
      const trackerStr = p.tracker
        ? `Tracker: ${p.tracker.value}/${p.tracker.goal} ${p.tracker.unit.en}`
        : '';
      return `- Pillar [${p.id}] ${p.name.en} (${p.name.ar}): ${habitsStr}. ${trackerStr}`;
    })
    .join('\n');

  const scheduleSummary = (state.events || [])
    .map((ev) => `${ev.time}: ${ev.title.en || ev.title}`)
    .join(', ');

  return `You are "Nawwa Coach" (مدرب تطبيق نَوَاة الذكي), a warm, deeply empathetic, insightful personal life & behavioral psychology coach.
You help the user plant tiny 2-minute seeds (نواة) to overcome procrastination, low motivation, smoking/bad habits, emotional eating/obesity, workout skipping, and strengthen their Islamic faith (reading Quran, daily prayers, Adhkar) and family gatherings (صلة الرحم).

USER LIVE PROFILE & STATUS TODAY:
- User Name: ${state.user.name}
- Total Points: ${state.points} pts | Current Streak: ${state.streak} days
- Low-Energy Bronze Mode Active: ${state.lowEnergyMode ? 'YES' : 'NO'}
- Active Life Pillars & Today's Habit Status:
${activePillarsSummary}
- Today's Calendar Schedule: ${scheduleSummary || 'None'}

CRITICAL COACHING RULES:
1. NEVER give generic or robotic pre-scripted lines. Respond directly and specifically to the exact words, feelings, or questions the user just shared.
2. Match the language the user spoke/wrote in! If the user writes or speaks in Arabic (whether Egyptian Arabic or Modern Standard Arabic), reply in natural, warm, encouraging Arabic with 100% accurate spelling. If the user writes/speaks in English, reply in natural, warm English.
3. Keep your spoken response concise and conversational (2 to 4 sentences) so it sounds natural when read aloud by voice, and ask a supportive follow-up question or propose one tiny concrete 2-minute action.
4. TOOL ACTIONS: If the user says they completed a habit, or asks you to log something, switch to low-energy mode, open the SOS breathing timer, or schedule an event in their calendar, include ONE action tag at the very end of your response in this exact format:
   - To mark a habit complete: [ACTION:COMPLETE_HABIT:habit_id:bronze] (or :silver or :gold. Valid habit_ids: faith_quran, faith_prayers, faith_adhkar, focus_most_important, focus_environment, fitness_workout, nutrition_meals, smoking_control, family_connection)
   - To enable Low-Energy Bronze mode: [ACTION:ENABLE_LOW_ENERGY]
   - To open the 3-minute craving/urge breathing timer: [ACTION:OPEN_SOS:urge]
   - To open the Procrastination 5-min breaker timer: [ACTION:OPEN_SOS:procrastinate]
   - To add a calendar event/reminder: [ACTION:ADD_EVENT:HH:MM:Event Title] (use 24-hour time like 21:00)`;
}

// Parse any [ACTION:...] tags from AI response
export function extractActionsFromReply(rawReply) {
  const actions = [];
  const regex = /\[\s*ACTION\s*:\s*([^\]]+)\]/gi;
  let match;
  while ((match = regex.exec(rawReply)) !== null) {
    const parts = match[1].split(':').map((s) => s.trim());
    const type = (parts[0] || '').toUpperCase();
    if (type === 'COMPLETE_HABIT') {
      actions.push({
        type: 'COMPLETE_HABIT',
        habitId: (parts[1] || '').toLowerCase(),
        tier: (parts[2] || 'bronze').toLowerCase()
      });
    } else if (type === 'ENABLE_LOW_ENERGY') {
      actions.push({ type: 'ENABLE_LOW_ENERGY' });
    } else if (type === 'OPEN_SOS') {
      actions.push({ type: 'OPEN_SOS', tab: (parts[1] || 'urge').toLowerCase() });
    } else if (type === 'ADD_EVENT') {
      const hh = String(parts[1] || '20').padStart(2, '0');
      const isMinNumeric = /^\d{1,2}$/.test(parts[2] || '');
      const mm = isMinNumeric ? String(parts[2]).padStart(2, '0') : '00';
      const titleStartIdx = isMinNumeric ? 3 : 2;
      const title = parts.slice(titleStartIdx).join(':') || 'Scheduled Habit';
      actions.push({ type: 'ADD_EVENT', time: `${hh}:${mm}`, title });
    }
  }
  const cleanReply = rawReply.replace(/\[\s*ACTION\s*:\s*[^\]]+\]/gi, '').trim();
  return { cleanReply, actions };
}

// Real AI LLM Call (Supports Gemini API, OpenAI/Groq API, Local Ollama, and Free Cloud Pollinations OpenAI Endpoint)
export async function generateSmartCoachResponse(userText, state) {
  const isBrowserOnline =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.onLine !== false;

  if (!isBrowserOnline) {
    return buildContextualOfflineReply(userText, state);
  }

  const systemPrompt = buildCoachSystemPrompt(state);
  const recentMessages = (state.chatHistory || []).slice(-8).map((m) => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
    { role: 'user', content: userText }
  ];

  const aiConfig = state.aiConfig || {};

  // 1. If user configured a Google Gemini API Key
  if (aiConfig.geminiKey && aiConfig.geminiKey.trim()) {
    try {
      const key = aiConfig.geminiKey.trim();
      const geminiContents = [
        { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] },
        { role: 'model', parts: [{ text: 'Understood. I will coach warmly, naturally, and use action tags when helpful.' }] },
        ...recentMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: userText }] }
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: geminiContents })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOut) return extractActionsFromReply(textOut);
      }
    } catch (_) {}
  }

  // 2. If user configured an OpenAI / Groq API Key
  if (aiConfig.openaiKey && aiConfig.openaiKey.trim()) {
    try {
      const key = aiConfig.openaiKey.trim();
      const baseUrl = key.startsWith('gsk_')
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = key.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({ model, messages, temperature: 0.7 })
      });
      if (res.ok) {
        const data = await res.json();
        const textOut = data?.choices?.[0]?.message?.content;
        if (textOut) return extractActionsFromReply(textOut);
      }
    } catch (_) {}
  }

  // 3. Free Zero-Config Cloud LLM (Pollinations OpenAI-compatible endpoint)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.75
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const textOut = data?.choices?.[0]?.message?.content;
      if (textOut && textOut.trim().length > 5) {
        return extractActionsFromReply(textOut);
      }
    }
  } catch (_) {}

  // 4. Intelligent Contextual Coach Composer (Instant, Multi-Turn, Full Pillar Coverage)
  return buildContextualOfflineReply(userText, state);
}

// Rich Contextual Conversational Engine (parses exact user topic, actions, times, and live state across all 6 pillars)
function buildContextualOfflineReply(userText, state) {
  const isAr = isArabicText(userText) || (state.lang === 'ar' && !/[a-zA-Z]{3,}/.test(userText));
  const lower = userText.toLowerCase();
  const actions = [];
  const name = state.user.name;
  const completedToday = state.completedToday || {};

  // 1. Schedule a reminder / calendar time
  const timeMatch = userText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|صباحا|صباحاً|مساء|مساءً|العصر|الظهر|بالليل)?/i);
  if (
    (lower.includes('remind') ||
      lower.includes('schedule') ||
      lower.includes('calendar') ||
      lower.includes('ذكرني') ||
      lower.includes('ذكّرني') ||
      lower.includes('موعد') ||
      lower.includes('جدول')) &&
    timeMatch
  ) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] || '00';
    const mer = (timeMatch[3] || '').toLowerCase();
    if ((mer.includes('pm') || mer.includes('مساء') || mer.includes('ليل') || mer.includes('عصر')) && hour < 12) {
      hour += 12;
    }
    const hh = String(Math.min(23, Math.max(0, hour))).padStart(2, '0');
    const cleanTitle = userText.replace(/remind me to|schedule|ذكرني|ذكّرني/gi, '').trim();
    actions.push({ type: 'ADD_EVENT', time: `${hh}:${min}`, title: cleanTitle });

    return {
      cleanReply: isAr
        ? `تم يا ${name}! قمتُ بجدولة "${cleanTitle}" في تقويم نَوَاة الساعة ${hh}:${min} وسأنبهك بالصوت والإشعار في الموعد المحدد. هل تحب أن نضع خطوة برونزية صغيرة تحضيرية له الآن؟`
        : `Done, ${name}! I scheduled "${cleanTitle}" in your Nawwa calendar for ${hh}:${min} with a voice alert. Would you like to set a 2-minute prep seed for it right now?`,
      actions
    };
  }

  // 2. Check if user says they COMPLETED a habit (Quran / Prayer / Workout / Water / Family)
  if (
    lower.includes('i read') ||
    lower.includes('finished reading') ||
    lower.includes('i did') ||
    lower.includes('completed') ||
    lower.includes('قرأت') ||
    lower.includes('قرات') ||
    lower.includes('أتممت') ||
    lower.includes('صليت') ||
    lower.includes('تمرنت') ||
    lower.includes('شربت')
  ) {
    if (lower.includes('quran') || lower.includes('page') || lower.includes('قرآن') || lower.includes('قران') || lower.includes('صفح')) {
      const tier = lower.includes('juz') || lower.includes('جزء') ? 'gold' : lower.includes('5') || lower.includes('خمس') ? 'silver' : 'bronze';
      actions.push({ type: 'COMPLETE_HABIT', habitId: 'faith_quran', tier });
      return {
        cleanReply: isAr
          ? `تقبّل الله منك يا ${name} وجعل القرآن الكريم ربيع قلبك ونور صدرك! قمتُ فوراً بتسجيل إنجاز وردك اليومي وإضافة النقاط إلى رصيدك في لوحة الأبطال. كيف تشعر بعد القراءة؟`
          : `May Allah accept it from you, ${name}! I just logged your Quran reading (${tier.toUpperCase()}) for today and added the points to your Champion score. How does your heart feel after reading?`,
        actions
      };
    }
    if (lower.includes('pray') || lower.includes('صلا') || lower.includes('صليت')) {
      actions.push({ type: 'COMPLETE_HABIT', habitId: 'faith_prayers', tier: 'bronze' });
      return {
        cleanReply: isAr
          ? `تقبّل الله صلاتك يا ${name} وبارك في وقتك ويومك! سجّلتُ لك إتمام الصلاة في ركن الجانب الديني. ما هي خطوتك البسيطة التالية اليوم؟`
          : `May Allah accept your prayers, ${name}! I've marked your daily prayers habit complete. What small seed would you like to plant next?`,
        actions
      };
    }
    if (lower.includes('workout') || lower.includes('pushup') || lower.includes('gym') || lower.includes('تمرين') || lower.includes('تمرنت') || lower.includes('مشيت')) {
      actions.push({ type: 'COMPLETE_HABIT', habitId: 'fitness_workout', tier: 'silver' });
      return {
        cleanReply: isAr
          ? `عاش يا بطل! الحركة تصنع الطاقة وتطرد الكسل. سجّلتُ لك إنجاز تمرين اليوم في ركن اللياقة البدنية وأضفت نقاطك! لا تنسَ شرب كوب ماء الآن لتعويض جسمك.`
          : `Way to go, champion! Movement creates energy. I just logged your workout for today and awarded your points! Don't forget to drink a glass of water now.`,
        actions
      };
    }
  }

  // 3. Asking about Quran / Faith status
  if (lower.includes('quran') || lower.includes('قرآن') || lower.includes('القرآن') || lower.includes('ورد')) {
    const doneTier = completedToday['faith_quran'];
    if (doneTier) {
      return {
        cleanReply: isAr
          ? `ما شاء الله يا ${name}، نعم! لقد أتممت وردك من القرآن الكريم اليوم بالمستوى (${doneTier.toUpperCase()}). إذا أحببت الاستزادة، يمكنك قراءة بضع آيات إضافية أو إتمام أذكار المساء!`
          : `Masha'Allah ${name}, yes! You already completed your Quran reading today at the ${doneTier.toUpperCase()} tier. Would you like to check off your daily Adhkar next?`,
        actions
      };
    }
    return {
      cleanReply: isAr
        ? `لم تسجّل قراءة صفحتك من القرآن الكريم اليوم بعد يا ${name}. الشيطان والتسويف يحاولان دائماً تأجيلها لآخر اليوم—ما رأيك أن تفتح المصحف الآن وتقرأ صفحة واحدة فقط خلال ٣ دقائق ثم تخبرني لأسجّلها لك؟`
        : `You haven't logged your Quran page today yet, ${name}. Procrastination loves to push spiritual habits to "later tonight"—how about opening the Mushaf right now for just 1 page (3 minutes) and telling me when you finish?`,
      actions
    };
  }

  // 4. Low-energy / Bronze Mode switch
  if (
    lower.includes('bronze') ||
    lower.includes('low energy') ||
    lower.includes('tired') ||
    lower.includes('exhausted') ||
    lower.includes('برونز') ||
    lower.includes('متعب') ||
    lower.includes('تعبان') ||
    lower.includes('مرهق') ||
    lower.includes('طاقة منخفضة')
  ) {
    actions.push({ type: 'ENABLE_LOW_ENERGY' });
    return {
      cleanReply: isAr
        ? `سمعتك يا ${name}، والرحمة بالنفس جزء أساسي من الاستمرارية! قمتُ الآن بتفعيل "الوضع البرونزي المرن" لليوم. لا تطالب نفسك بالكمال اليوم؛ خطوة واحدة مدتها دقيقتان تحفظ سلسلة التزامك (${state.streak} أيام).`
        : `I hear you, ${name}, and self-compassion is the secret to consistency! I've switched today to Guilt-Free Bronze Mode. Forget perfection today—one tiny 2-minute seed keeps your ${state.streak}-day streak alive.`,
      actions
    };
  }

  // 5. Smoking / Junk Food Craving
  if (
    lower.includes('smok') ||
    lower.includes('crav') ||
    lower.includes('cigarette') ||
    lower.includes('junk') ||
    lower.includes('sugar') ||
    lower.includes('تدخين') ||
    lower.includes('سيجار') ||
    lower.includes('رغبة') ||
    lower.includes('حلويات')
  ) {
    actions.push({ type: 'OPEN_SOS', tab: 'urge' });
    return {
      cleanReply: isAr
        ? `اثبت يا ${name}! الرغبة في التدخين أو الأكل العاطفي تشبه الموجة: ترتفع بقوة ثم تنكسر وتختفي خلال ١٨٠ ثانية إذا لم تستسلم لها. فتحتُ لك الآن مؤقت الـ ٣ دقائق والتنفس العميق—تنفّس معي الآن!`
        : `Hold steady, ${name}! A craving to smoke or stress-eat is like an ocean wave: it peaks and fades within 180 seconds if you don't feed it. I've opened the 3-Minute Urge Surf Timer—breathe with the circle right now!`,
      actions
    };
  }

  // 6. Procrastination / Stuck / Overwhelmed
  if (
    lower.includes('procrastinat') ||
    lower.includes('stuck') ||
    lower.includes('motivat') ||
    lower.includes('lazy') ||
    lower.includes('overwhelm') ||
    lower.includes('تسويف') ||
    lower.includes('كسل') ||
    lower.includes('مؤجل') ||
    lower.includes('أبدأ') ||
    lower.includes('تحفيز')
  ) {
    actions.push({ type: 'OPEN_SOS', tab: 'procrastinate' });
    return {
      cleanReply: isAr
        ? `تذكّر يا ${name}: التسويف ليس كسلاً، بل هو هروب الدماغ من مهمة تبدو كبيرة أو غامضة! الحل هو تقليص المهمة إلى خطوة سخيفة في صغرها (دقيقتين فقط). فتحتُ لك "كاسر التسويف" الآن—اكتب اسم المهمة ولنبدأ معاً!`
        : `Remember, ${name}: Procrastination isn't laziness—it's your brain avoiding a task that feels too big or vague! The cure is shrinking it to a tiny 2-minute starter step. I've opened the Procrastination Breaker for you—type the task and let's do 5 minutes together!`,
      actions
    };
  }

  // 7. Family Gathering / Kinship
  if (
    lower.includes('family') ||
    lower.includes('gather') ||
    lower.includes('parents') ||
    lower.includes('mom') ||
    lower.includes('dad') ||
    lower.includes('عائل') ||
    lower.includes('أهل') ||
    lower.includes('رحم') ||
    lower.includes('والد') ||
    lower.includes('أمي')
  ) {
    return {
      cleanReply: isAr
        ? `صلة الرحم والجلوس مع الأهل تملأ القلب بالسكينة والبركة يا ${name}. ما رأيك أن ترسل الآن رسالة صوتية دافئة أو تتصل لمدة دقيقتين بأحد والديك أو أقاربك لتحقق النواة البرونزية اليوم، أو نجدول تجمعاً عائلياً في التقويم؟`
        : `Family kinship brings warmth and blessing to your whole week, ${name}. How about sending a 60-second voice note or making a quick call to your parents or relatives right now for your Bronze win, or scheduling a family gathering in the Calendar?`,
      actions
    };
  }

  // 8. Default Personalized Multi-Turn Coaching
  const turnCount = (state.chatHistory || []).length;
  const completedCount = Object.keys(completedToday).length;

  if (isAr) {
    const empathyOpeners = [
      `أفهمك تماماً يا ${name} في قولك: "${userText}".`,
      `شكراً لمشاركتي هذا التفكير يا ${name}.`,
      `نقطة مهمة جداً يا ${name}، ودعنا نحولها إلى خطوة عملية بسيطة.`
    ];
    const opener = empathyOpeners[turnCount % empathyOpeners.length];

    return {
      cleanReply: `${opener} أنت اليوم لديك ${state.points} نقطة وسلسلة التزام لمدة ${state.streak} أيام. بدلاً من الضغط على نفسك، ما هي أصغر "نواة" (خطوة لا تتجاوز دقيقتين) في هذا الأمر يمكنك البدء بها الآن فوراً؟`,
      actions
    };
  } else {
    const empathyOpeners = [
      `I really hear what you're saying about "${userText}", ${name}.`,
      `Thank you for sharing that with me, ${name}.`,
      `Let's turn what you just shared into a tiny, stress-free action, ${name}.`
    ];
    const opener = empathyOpeners[turnCount % empathyOpeners.length];

    return {
      cleanReply: `${opener} You've already completed ${completedCount} habit(s) today and built a ${state.streak}-day streak (${state.points} pts). What is one tiny 2-minute seed we can plant on this right now without worrying about perfection?`,
      actions
    };
  }
}
