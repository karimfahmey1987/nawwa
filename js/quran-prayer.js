// In-App Quran Mushaf Reader (604 Pages + Mishary Alafasy Audio Recitation + English Translation)
// and Local Prayer Times (Aladhan API + GPS/City Auto-Sync into Smart Calendar)

const QURAN_CACHE_KEY = 'nawwa_quran_pages_v1';
const PRAYER_CACHE_KEY = 'nawwa_prayer_times_v1';

const OFFLINE_FALLBACK_PAGES = {
  1: {
    page: 1,
    surahNameAr: 'سُورَةُ ٱلْفَاتِحَةِ',
    surahNameEn: 'Al-Faatiha (The Opening)',
    juz: 1,
    ayahs: [
      {
        numberInSurah: 1,
        text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        en: 'In the name of God, the Most Gracious, the Dispenser of Grace:',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3'
      },
      {
        numberInSurah: 2,
        text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
        en: 'All praise is due to God alone, the Sustainer of all the worlds,',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3'
      },
      {
        numberInSurah: 3,
        text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        en: 'the Most Gracious, the Dispenser of Grace,',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/3.mp3'
      },
      {
        numberInSurah: 4,
        text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
        en: 'Lord of the Day of Judgment!',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/4.mp3'
      },
      {
        numberInSurah: 5,
        text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        en: 'Thee alone do we worship; and unto Thee alone do we turn for aid.',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/5.mp3'
      },
      {
        numberInSurah: 6,
        text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
        en: 'Guide us the straight way -',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6.mp3'
      },
      {
        numberInSurah: 7,
        text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
        en: 'the way of those upon whom Thou hast bestowed Thy blessings, not of those who have been condemned [by Thee], nor of those who go astray!',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/7.mp3'
      }
    ]
  },
  604: {
    page: 604,
    surahNameAr: 'سُورَةُ ٱلْإِخْلَاصِ • ٱلْفَلَقِ • ٱلنَّاسِ',
    surahNameEn: 'Al-Ikhlaas • Al-Falaq • An-Naas',
    juz: 30,
    ayahs: [
      {
        numberInSurah: 1,
        text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
        en: 'Say: "He is the One God:',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6222.mp3'
      },
      {
        numberInSurah: 2,
        text: 'ٱللَّهُ ٱلصَّمَدُ',
        en: 'God the Eternal, the Uncaused Cause of all Being.',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6223.mp3'
      },
      {
        numberInSurah: 3,
        text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        en: 'He begets not, and neither is He begotten;',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6224.mp3'
      },
      {
        numberInSurah: 4,
        text: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
        en: 'and there is nothing that could be compared with Him.',
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6225.mp3'
      }
    ]
  }
};

const CITIES_PRESETS = {
  'Cairo,Egypt': { city: 'Cairo', country: 'Egypt', labelEn: '🇪🇬 Cairo, Egypt', labelAr: '🇪🇬 القاهرة، مصر', method: 5 },
  'Alexandria,Egypt': { city: 'Alexandria', country: 'Egypt', labelEn: '🇪🇬 Alexandria, Egypt', labelAr: '🇪🇬 الإسكندرية، مصر', method: 5 },
  'Makkah,Saudi Arabia': { city: 'Makkah', country: 'Saudi Arabia', labelEn: '🇸🇦 Makkah, KSA', labelAr: '🇸🇦 مكة المكرمة، السعودية', method: 4 },
  'Riyadh,Saudi Arabia': { city: 'Riyadh', country: 'Saudi Arabia', labelEn: '🇸🇦 Riyadh, KSA', labelAr: '🇸🇦 الرياض، السعودية', method: 4 },
  'Dubai,UAE': { city: 'Dubai', country: 'United Arab Emirates', labelEn: '🇦🇪 Dubai, UAE', labelAr: '🇦🇪 دبي، الإمارات', method: 8 },
  'Amman,Jordan': { city: 'Amman', country: 'Jordan', labelEn: '🇯🇴 Amman, Jordan', labelAr: '🇯🇴 عمّان، الأردن', method: 4 },
  'London,UK': { city: 'London', country: 'United Kingdom', labelEn: '🇬🇧 London, UK', labelAr: '🇬🇧 لندن، بريطانيا', method: 2 }
};

let currentPageNumber = 1;
let currentPageData = null;
let showEnglishTranslation = false;
let quranAudioPlayer = null;
let isPlayingQuranAudio = false;
let currentAyahPlayIndex = -1;

let appGetState = null;
let appSaveState = null;
let appRenderAll = null;
let appShowToast = null;
let appLaunchConfetti = null;
let appCompleteQuranPage = null;
let appCompleteAdhkar = null;

// ==========================================
// INTERACTIVE SMART TASBIH & ADHKAR COUNTER
// ==========================================
const ADHKAR_COLLECTIONS = {
  morning: [
    {
      id: 'ayat_kursi',
      target: 1,
      ar: '﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...﴾ [آية الكرسي]',
      en: 'Ayat Al-Kursi (2:255) — Whoever recites it in the morning is protected until evening.'
    },
    {
      id: 'sayyid_istighfar',
      target: 1,
      ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
      en: 'Sayyid Al-Istighfar (Master Supplication for Forgiveness).'
    },
    {
      id: 'bismillah_ladhi',
      target: 3,
      ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
      en: 'In the Name of Allah with Whose Name nothing on earth or in heaven can cause harm (3x).'
    },
    {
      id: 'hasbiya_allah',
      target: 7,
      ar: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.',
      en: 'Allah is sufficient for me; there is no deity except Him. On Him I rely (7x).'
    }
  ],
  evening: [
    {
      id: 'amsayna',
      target: 1,
      ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ.',
      en: 'We have reached the evening and unto Allah belongs all sovereignty and praise.'
    },
    {
      id: 'audhu_bikalimat',
      target: 3,
      ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.',
      en: 'I seek refuge in the Perfect Words of Allah from the evil of what He has created (3x).'
    },
    {
      id: 'raditu_billahi',
      target: 3,
      ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.',
      en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet (3x).'
    }
  ],
  tasbih: [
    {
      id: 'istighfar_salawat',
      target: 33,
      ar: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ • اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ ﷺ',
      en: 'Astaghfirullah (I seek forgiveness of Allah) & Salawat upon the Prophet ﷺ (33x)'
    },
    {
      id: 'subhanallah_wabihamdihi',
      target: 33,
      ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ • سُبْحَانَ اللَّهِ الْعَظِيمِ',
      en: 'Glory and praise be to Allah; Glory be to Allah the Almighty (33x)'
    },
    {
      id: 'la_hawla',
      target: 34,
      ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
      en: 'There is no power and no strength except through Allah — a treasure of Paradise (34x)'
    }
  ]
};

let activeAdhkarTab = 'morning';
let adhkarCounts = {};
let totalTasbihTapsSession = 0;

function playTasbihTick(isDone = false) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(isDone ? [30, 50, 40] : 16);
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDone ? 784 : 520, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isDone ? 0.25 : 0.07));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isDone ? 0.27 : 0.08));
    setTimeout(() => ctx.close().catch(() => {}), 350);
  } catch (_) {}
}

export function openAdhkarTasbihModal(initialTab = 'morning') {
  const modal = document.getElementById('adhkar-tasbih-modal');
  if (!modal) return;
  activeAdhkarTab = initialTab;
  modal.classList.remove('hidden');
  renderAdhkarTasbihDom();
}

export function closeAdhkarTasbihModal() {
  const modal = document.getElementById('adhkar-tasbih-modal');
  if (modal) modal.classList.add('hidden');
}

export function renderAdhkarTasbihDom() {
  const container = document.getElementById('adhkar-cards-container');
  const totalBadge = document.getElementById('adhkar-session-total');
  if (!container) return;

  const isAr = appGetState?.()?.lang === 'ar';

  document.querySelectorAll('.adhkar-tab-btn').forEach((btn) => {
    const key = btn.getAttribute('data-adhkar-tab');
    btn.className = `${key === activeAdhkarTab ? 'btn-primary' : 'btn-secondary'} adhkar-tab-btn`;
  });

  if (totalBadge) {
    totalBadge.textContent = isAr ? `📿 التسبيحات: ${totalTasbihTapsSession}` : `📿 Taps: ${totalTasbihTapsSession}`;
  }

  const list = ADHKAR_COLLECTIONS[activeAdhkarTab] || ADHKAR_COLLECTIONS.morning;
  container.innerHTML = '';

  list.forEach((item) => {
    const current = adhkarCounts[item.id] || 0;
    const isCompleted = current >= item.target;

    const card = document.createElement('div');
    card.className = 'pillar-card';
    card.style.marginBottom = '12px';
    card.style.padding = '16px';
    card.style.borderColor = isCompleted ? 'var(--green-400)' : 'var(--border-color)';

    card.innerHTML = `
      <div style="font-size:1.18rem; line-height:1.95; font-weight:700; text-align:right; direction:rtl; margin-bottom:8px; color:var(--text-main);">
        ${item.ar}
      </div>
      <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">
        ${item.en}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <button type="button" class="btn-primary adhkar-tap-btn" style="flex:1; padding:12px; font-size:0.96rem; ${
          isCompleted ? 'background: rgba(16,185,129,0.22); color: var(--green-400); border: 1px solid var(--green-400);' : ''
        }">
          ${
            isCompleted
              ? isAr
                ? `✓ تم الإتمام (${current} / ${item.target})`
                : `✓ Completed (${current} / ${item.target})`
              : isAr
                ? `📿 اضغط للتسبيح (${current} / ${item.target})`
                : `📿 Tap to Count (${current} / ${item.target})`
          }
        </button>
        <button type="button" class="mini-btn adhkar-reset-btn" title="Reset">↺</button>
      </div>
    `;

    card.querySelector('.adhkar-tap-btn')?.addEventListener('click', () => {
      if (current < item.target) {
        adhkarCounts[item.id] = current + 1;
        totalTasbihTapsSession++;
        const justFinished = adhkarCounts[item.id] >= item.target;
        playTasbihTick(justFinished);
        renderAdhkarTasbihDom();

        // Check if all items in current tab are completed
        const allTabDone = list.every((entry) => (adhkarCounts[entry.id] || 0) >= entry.target);
        if (allTabDone && typeof appCompleteAdhkar === 'function') {
          const tier = activeAdhkarTab === 'tasbih' ? 'bronze' : 'silver';
          appCompleteAdhkar(tier);
        }
      }
    });

    card.querySelector('.adhkar-reset-btn')?.addEventListener('click', () => {
      adhkarCounts[item.id] = 0;
      renderAdhkarTasbihDom();
    });

    container.appendChild(card);
  });
}

function toArabicDigits(num) {
  return String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function getCachedQuranPage(pageNum) {
  try {
    const raw = localStorage.getItem(QURAN_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[pageNum] || null;
  } catch (_) {
    return null;
  }
}

function saveCachedQuranPage(pageNum, pageData) {
  try {
    const raw = localStorage.getItem(QURAN_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    // Keep cache compact (max 25 pages)
    const keys = Object.keys(map);
    if (keys.length > 25) {
      delete map[keys[0]];
    }
    map[pageNum] = pageData;
    localStorage.setItem(QURAN_CACHE_KEY, JSON.stringify(map));
  } catch (_) {}
}

export async function fetchQuranPageData(pageNumber) {
  const safePage = Math.min(604, Math.max(1, Number(pageNumber) || 1));
  const cached = getCachedQuranPage(safePage);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/page/${safePage}/editions/quran-uthmani,ar.alafasy,en.asad`
    );
    if (res.ok) {
      const json = await res.json();
      const editions = json?.data;
      if (Array.isArray(editions) && editions.length >= 2) {
        const uthmani = editions[0];
        const audioEd = editions[1];
        const transEd = editions[2] || null;

        const firstAyah = uthmani.ayahs?.[0];
        const surahNamesAr = [];
        const surahNamesEn = [];
        (uthmani.ayahs || []).forEach((a) => {
          if (a.surah?.name && !surahNamesAr.includes(a.surah.name)) {
            surahNamesAr.push(a.surah.name);
          }
          if (a.surah?.englishName && !surahNamesEn.includes(a.surah.englishName)) {
            surahNamesEn.push(a.surah.englishName);
          }
        });

        const formatted = {
          page: safePage,
          juz: firstAyah?.juz || 1,
          surahNameAr: surahNamesAr.join(' • ') || 'القرآن الكريم',
          surahNameEn: surahNamesEn.join(' • ') || 'Holy Quran',
          ayahs: (uthmani.ayahs || []).map((a, idx) => ({
            number: a.number,
            numberInSurah: a.numberInSurah,
            surahNameAr: a.surah?.name || '',
            surahNumber: a.surah?.number || 1,
            text: a.text,
            audio: audioEd.ayahs?.[idx]?.audio || `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
            en: transEd?.ayahs?.[idx]?.text || ''
          }))
        };

        saveCachedQuranPage(safePage, formatted);
        return formatted;
      }
    }
  } catch (_) {}

  return OFFLINE_FALLBACK_PAGES[safePage] || OFFLINE_FALLBACK_PAGES[1];
}

export function stopQuranAudio() {
  if (quranAudioPlayer) {
    try {
      quranAudioPlayer.pause();
      quranAudioPlayer.currentTime = 0;
    } catch (_) {}
    quranAudioPlayer = null;
  }
  isPlayingQuranAudio = false;
  currentAyahPlayIndex = -1;
  document.querySelectorAll('.quran-ayah-span').forEach((el) => el.classList.remove('playing-ayah'));
  updateAudioPlayButtonLabel();
}

function updateAudioPlayButtonLabel() {
  const btn = document.getElementById('btn-quran-audio-toggle');
  if (!btn || !appGetState) return;
  const isAr = appGetState().lang === 'ar';
  if (isPlayingQuranAudio) {
    btn.innerHTML = isAr ? '⏹️ إيقاف التلاوة' : '⏹️ Stop Recitation';
    btn.classList.add('active-toggle');
  } else {
    btn.innerHTML = isAr ? '🎧 استماع للتلاوة (العفاسي)' : '🎧 Listen Aloud (Alafasy)';
    btn.classList.remove('active-toggle');
  }
}

export function playQuranPageFromAyah(startIndex = 0) {
  if (!currentPageData || !Array.isArray(currentPageData.ayahs) || !currentPageData.ayahs.length) return;

  stopQuranAudio();
  isPlayingQuranAudio = true;
  currentAyahPlayIndex = startIndex;
  updateAudioPlayButtonLabel();

  const playNext = () => {
    if (!isPlayingQuranAudio || currentAyahPlayIndex >= currentPageData.ayahs.length) {
      stopQuranAudio();
      return;
    }

    const ayah = currentPageData.ayahs[currentAyahPlayIndex];
    document.querySelectorAll('.quran-ayah-span').forEach((el, idx) => {
      el.classList.toggle('playing-ayah', idx === currentAyahPlayIndex);
      if (idx === currentAyahPlayIndex) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    const audio = new Audio(ayah.audio);
    quranAudioPlayer = audio;

    audio.onended = () => {
      currentAyahPlayIndex++;
      playNext();
    };

    audio.onerror = () => {
      stopQuranAudio();
      if (appShowToast && appGetState) {
        appShowToast(
          appGetState().lang === 'ar'
            ? '⚠️ تعذر تشغيل الصوت حالياً — تأكد من اتصالك بالإنترنت.'
            : '⚠️ Could not stream audio recitation right now.'
        );
      }
    };

    audio.play().catch(() => {
      stopQuranAudio();
    });
  };

  playNext();
}

export async function openQuranReaderModal(targetPage = null) {
  const modal = document.getElementById('quran-reader-modal');
  if (!modal) return;

  const st = appGetState();
  const faithPillar = (st.pillars || []).find((p) => p.id === 'faith');
  const currentTrackedPage = faithPillar?.tracker?.value || 18;

  // Next unread page is currentTrackedPage + 1 (clamped 1..604)
  currentPageNumber = targetPage
    ? Math.min(604, Math.max(1, Number(targetPage)))
    : Math.min(604, Math.max(1, currentTrackedPage + 1));

  modal.classList.remove('hidden');
  await loadAndRenderQuranPage(currentPageNumber);
}

export function closeQuranReaderModal() {
  stopQuranAudio();
  const modal = document.getElementById('quran-reader-modal');
  if (modal) modal.classList.add('hidden');
}

export async function loadAndRenderQuranPage(pageNum) {
  stopQuranAudio();
  currentPageNumber = Math.min(604, Math.max(1, Number(pageNum) || 1));

  const pageInput = document.getElementById('quran-page-input');
  if (pageInput) pageInput.value = String(currentPageNumber);

  const container = document.getElementById('quran-mushaf-content');
  const metaHeader = document.getElementById('quran-page-meta');
  const isAr = appGetState()?.lang === 'ar';

  if (container) {
    container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted); font-family:system-ui;">⏳ ${
      isAr ? 'جاري تحميل صفحة المصحف الشريف...' : 'Loading Quran Mushaf Page...'
    }</div>`;
  }

  const data = await fetchQuranPageData(currentPageNumber);
  currentPageData = data;

  if (metaHeader) {
    metaHeader.textContent = isAr
      ? `${data.surahNameAr} • الصفحة ${toArabicDigits(data.page)} من ٦٠٤ • الجزء ${toArabicDigits(data.juz)}`
      : `${data.surahNameEn} • Page ${data.page} of 604 • Juz ${data.juz}`;
  }

  renderCurrentQuranPageDom();
}

function renderCurrentQuranPageDom() {
  const container = document.getElementById('quran-mushaf-content');
  if (!container || !currentPageData) return;

  const isAr = appGetState()?.lang === 'ar';
  const btnTrans = document.getElementById('btn-quran-toggle-trans');
  if (btnTrans) {
    btnTrans.classList.toggle('active-toggle', showEnglishTranslation);
    btnTrans.textContent = isAr ? '🌐 التفسير/الترجمة (EN)' : '🌐 English Meaning';
  }

  updateAudioPlayButtonLabel();

  let html = `<div class="quran-surah-banner">${currentPageData.surahNameAr}</div><div>`;

  currentPageData.ayahs.forEach((ayah, idx) => {
    const numAr = toArabicDigits(ayah.numberInSurah);
    html += `
      <span class="quran-ayah-span" data-ayah-idx="${idx}" title="${isAr ? 'اضغط للاستماع لهذه الآية' : 'Tap to listen to this Ayah'}">
        ${ayah.text}
        <span class="quran-ayah-num">${numAr}</span>
      </span>
    `;
  });

  html += `</div>`;

  if (showEnglishTranslation) {
    const transLines = currentPageData.ayahs
      .filter((a) => a.en)
      .map((a) => `<div style="margin-bottom:6px;"><strong>[${a.numberInSurah}]</strong> ${a.en}</div>`)
      .join('');
    if (transLines) {
      html += `<div class="quran-translation-block">${transLines}</div>`;
    }
  }

  container.innerHTML = html;

  container.querySelectorAll('.quran-ayah-span').forEach((span) => {
    span.addEventListener('click', () => {
      const idx = Number(span.getAttribute('data-ayah-idx')) || 0;
      playQuranPageFromAyah(idx);
    });
  });
}

// ==========================================
// LOCAL PRAYER TIMES (ALADHAN API + SCHEDULE SYNC)
// ==========================================
const DEFAULT_PRAYER_TIMINGS = {
  Fajr: '05:00',
  Dhuhr: '12:05',
  Asr: '15:25',
  Maghrib: '18:00',
  Isha: '19:20'
};

const PRAYER_NAMES = [
  { key: 'Fajr', en: 'Fajr', ar: 'الفجر', icon: '🌅' },
  { key: 'Dhuhr', en: 'Dhuhr', ar: 'الظهر', icon: '☀️' },
  { key: 'Asr', en: 'Asr', ar: 'العصر', icon: '🌤️' },
  { key: 'Maghrib', en: 'Maghrib', ar: 'المغرب', icon: '🌇' },
  { key: 'Isha', en: 'Isha', ar: 'العشاء', icon: '🌙' }
];

let currentPrayerTimings = { ...DEFAULT_PRAYER_TIMINGS };
let selectedCityKey = 'Cairo,Egypt';
let currentHijriInfo = null;

export function getHijriDateInfo(lang = 'en') {
  const now = new Date();
  const dow = now.getDay(); // 1 = Monday, 4 = Thursday
  const isMonOrThu = dow === 1 || dow === 4;

  let dayNum = currentHijriInfo?.dayNum || null;
  let formattedAr = currentHijriInfo?.ar || '';
  let formattedEn = currentHijriInfo?.en || '';

  if (!formattedAr || !formattedEn) {
    try {
      formattedAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);
      formattedEn = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);
      const dayPart = new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric' }).format(now);
      dayNum = parseInt(dayPart, 10) || null;
    } catch (_) {
      formattedAr = 'التقويم الهجري';
      formattedEn = 'Hijri Calendar';
    }
  }

  const isWhiteDay = dayNum === 13 || dayNum === 14 || dayNum === 15;
  let sunnahFastNote = '';
  if (isWhiteDay) {
    sunnahFastNote =
      lang === 'ar'
        ? '🌕 اليوم من الأيام البيض المباركة (١٣-١٥ هـ) — يُستحب صيامه!'
        : '🌕 Today is one of the Blessed White Days (13–15 Hijri) — Sunnah Fasting!';
  } else if (isMonOrThu) {
    sunnahFastNote =
      lang === 'ar'
        ? `🌙 اليوم ${dow === 1 ? 'الاثنين' : 'الخميس'} — سنة صيام الاثنين والخميس (السحور قبل ${currentPrayerTimings.Fajr} • الإفطار ${currentPrayerTimings.Maghrib})`
        : `🌙 Today is ${dow === 1 ? 'Monday' : 'Thursday'} — Sunnah Fasting Day (Suhoor before ${currentPrayerTimings.Fajr} • Iftar at ${currentPrayerTimings.Maghrib})`;
  } else {
    sunnahFastNote =
      lang === 'ar'
        ? `🌅 الفجر (السحور): ${currentPrayerTimings.Fajr}  •  🌇 المغرب (الإفطار): ${currentPrayerTimings.Maghrib}`
        : `🌅 Fajr (Suhoor): ${currentPrayerTimings.Fajr}  •  🌇 Maghrib (Iftar): ${currentPrayerTimings.Maghrib}`;
  }

  return {
    label: lang === 'ar' ? formattedAr : formattedEn,
    isMonOrThu,
    isWhiteDay,
    sunnahFastNote
  };
}

export function getNextPrayerSummary(lang = 'en') {
  const nextKey = getNextPrayerKey();
  const p = PRAYER_NAMES.find((x) => x.key === nextKey) || PRAYER_NAMES[0];
  const timeStr = currentPrayerTimings[p.key] || '12:00';
  return {
    key: p.key,
    name: lang === 'ar' ? p.ar : p.en,
    time: timeStr,
    icon: p.icon
  };
}

function loadCachedPrayerTimes() {
  try {
    const raw = localStorage.getItem(PRAYER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.timings) currentPrayerTimings = parsed.timings;
      if (parsed.cityKey) selectedCityKey = parsed.cityKey;
      if (parsed.hijri) currentHijriInfo = parsed.hijri;
    }
  } catch (_) {}
}

function saveCachedPrayerTimes() {
  try {
    localStorage.setItem(
      PRAYER_CACHE_KEY,
      JSON.stringify({
        cityKey: selectedCityKey,
        timings: currentPrayerTimings,
        hijri: currentHijriInfo,
        updatedAt: new Date().toISOString()
      })
    );
  } catch (_) {}
}

export async function fetchPrayerTimesByCity(cityKey = 'Cairo,Egypt') {
  selectedCityKey = cityKey;
  const preset = CITIES_PRESETS[cityKey] || CITIES_PRESETS['Cairo,Egypt'];

  try {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
      preset.city
    )}&country=${encodeURIComponent(preset.country)}&method=${preset.method || 5}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const t = json?.data?.timings;
      const h = json?.data?.date?.hijri;
      if (h && h.day && h.month) {
        currentHijriInfo = {
          dayNum: parseInt(h.day, 10) || null,
          ar: `${h.day} ${h.month.ar} ${h.year} هـ`,
          en: `${h.day} ${h.month.en} ${h.year} AH`
        };
      }
      if (t && t.Fajr) {
        const cleanTime = (str) => String(str || '').split(' ')[0].slice(0, 5);
        currentPrayerTimings = {
          Fajr: cleanTime(t.Fajr),
          Dhuhr: cleanTime(t.Dhuhr),
          Asr: cleanTime(t.Asr),
          Maghrib: cleanTime(t.Maghrib),
          Isha: cleanTime(t.Isha)
        };
        saveCachedPrayerTimes();
      }
    }
  } catch (_) {}

  renderPrayerTimesWidget();
  return currentPrayerTimings;
}

export async function fetchPrayerTimesByGPS() {
  if (!('geolocation' in navigator)) {
    return fetchPrayerTimesByCity(selectedCityKey);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=5`
          );
          if (res.ok) {
            const json = await res.json();
            const t = json?.data?.timings;
            if (t && t.Fajr) {
              const cleanTime = (str) => String(str || '').split(' ')[0].slice(0, 5);
              currentPrayerTimings = {
                Fajr: cleanTime(t.Fajr),
                Dhuhr: cleanTime(t.Dhuhr),
                Asr: cleanTime(t.Asr),
                Maghrib: cleanTime(t.Maghrib),
                Isha: cleanTime(t.Isha)
              };
              saveCachedPrayerTimes();
              renderPrayerTimesWidget();
              if (appShowToast && appGetState) {
                appShowToast(
                  appGetState().lang === 'ar'
                    ? '📍 تم تحديث مواقيت الصلاة حسب موقعك الجغرافي!'
                    : '📍 Updated Prayer Times using your GPS location!'
                );
              }
              resolve(currentPrayerTimings);
              return;
            }
          }
        } catch (_) {}
        resolve(await fetchPrayerTimesByCity(selectedCityKey));
      },
      async () => {
        resolve(await fetchPrayerTimesByCity(selectedCityKey));
      },
      { timeout: 6000 }
    );
  });
}

function getNextPrayerKey() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const p of PRAYER_NAMES) {
    const [hh, mm] = (currentPrayerTimings[p.key] || '00:00').split(':').map(Number);
    const pMins = hh * 60 + mm;
    if (pMins > nowMins) {
      return p.key;
    }
  }
  return 'Fajr';
}

export function renderPrayerTimesWidget() {
  const container = document.getElementById('prayer-times-widget');
  if (!container || !appGetState) return;

  const st = appGetState();
  const isAr = st.lang === 'ar';
  const nextKey = getNextPrayerKey();
  const hijri = getHijriDateInfo(st.lang);
  const fastDoneToday = Boolean(st.completedToday?.['faith_sunnah_fast']);
  const sadaqahDoneToday = Boolean(st.completedToday?.['faith_sadaqah']);

  const cityOptionsHtml = Object.entries(CITIES_PRESETS)
    .map(
      ([k, val]) =>
        `<option value="${k}" ${k === selectedCityKey ? 'selected' : ''}>${isAr ? val.labelAr : val.labelEn}</option>`
    )
    .join('');

  const pillsHtml = PRAYER_NAMES.map((p) => {
    const isNext = p.key === nextKey;
    const timeStr = currentPrayerTimings[p.key] || '--:--';
    return `
      <div class="prayer-pill ${isNext ? 'next-prayer' : ''}">
        <span class="prayer-pill-name">${p.icon} ${isAr ? p.ar : p.en} ${isNext ? (isAr ? '(القادمة)' : '(Next)') : ''}</span>
        <span class="prayer-pill-time">${timeStr}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <div>
        <strong style="font-size:0.92rem; color:var(--green-400);">
          🕌 ${isAr ? 'مواقيت الصلاة اليوم والمزامنة الذكية' : "Today's Prayer Times & Smart Sync"}
        </strong>
        <div style="font-size:0.78rem; color:#facc15; font-weight:700; margin-top:2px;">
          🌙 ${hijri.label}
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
        <select id="select-prayer-city" class="text-input" style="padding:5px 10px; font-size:0.78rem; width:auto;">
          ${cityOptionsHtml}
        </select>
        <button type="button" id="btn-prayer-gps" class="mini-btn" title="GPS">📍 GPS</button>
        <button type="button" id="btn-sync-prayers-cal" class="btn-primary" style="padding:6px 12px; font-size:0.78rem;">
          🔔 ${isAr ? 'إضافة الصلوات الخمس للتقويم' : 'Sync 5 Prayers to Schedule'}
        </button>
      </div>
    </div>
    <div class="prayer-pills-grid">
      ${pillsHtml}
    </div>
    <div style="margin-top:8px; padding:8px 12px; border-radius:10px; background:rgba(15,23,42,0.55); border:1px solid rgba(250,204,21,0.3); display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
      <span style="font-size:0.78rem; color:var(--text-main); font-weight:600;">
        ${hijri.sunnahFastNote}
      </span>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" id="btn-log-sunnah-fast" class="mini-btn" style="border-color:${fastDoneToday ? 'var(--green-400)' : 'var(--gold-border)'}; color:${fastDoneToday ? 'var(--green-400)' : '#facc15'};">
          ${fastDoneToday ? '✓ ' : '🌙 '}${isAr ? (fastDoneToday ? 'تم تسجيل الصيام (+٢٥ ن)' : 'تسجيل صيام اليوم (+٢٥ ن)') : (fastDoneToday ? 'Fasting Logged (+25)' : 'Log Sunnah Fast (+25 pts)')}
        </button>
        <button type="button" id="btn-log-daily-sadaqah" class="mini-btn" style="border-color:rgba(16,185,129,0.5); color:var(--green-400);">
          ${sadaqahDoneToday ? '✓ ' : '🤲 '}${isAr ? (sadaqahDoneToday ? 'تمت صدقة اليوم (+١٥ ن)' : 'صدقة / جبر خاطر (+١٥ ن)') : (sadaqahDoneToday ? 'Sadaqah Logged (+15)' : 'Daily Sadaqah (+15 pts)')}
        </button>
      </div>
    </div>
  `;

  container.querySelector('#select-prayer-city')?.addEventListener('change', (e) => {
    fetchPrayerTimesByCity(e.target.value);
  });

  container.querySelector('#btn-prayer-gps')?.addEventListener('click', () => {
    fetchPrayerTimesByGPS();
  });

  container.querySelector('#btn-sync-prayers-cal')?.addEventListener('click', () => {
    syncFivePrayersToSchedule();
  });

  container.querySelector('#btn-log-sunnah-fast')?.addEventListener('click', () => {
    st.completedToday = st.completedToday || {};
    if (st.completedToday['faith_sunnah_fast']) return;
    st.completedToday['faith_sunnah_fast'] = 'silver';
    st.points = (st.points || 0) + 25;
    if (appSaveState) appSaveState();
    if (appRenderAll) appRenderAll();
    if (appLaunchConfetti) appLaunchConfetti();
    if (appShowToast) {
      appShowToast(
        isAr
          ? '🌙 تقبّل الله صيامك وطاعتك! تمت إضافة +٢٥ نقطة في ميزان نموك.'
          : '🌙 May Allah accept your fasting! Added +25 pts to your growth.'
      );
    }
  });

  container.querySelector('#btn-log-daily-sadaqah')?.addEventListener('click', () => {
    st.completedToday = st.completedToday || {};
    if (st.completedToday['faith_sadaqah']) return;
    st.completedToday['faith_sadaqah'] = 'bronze';
    st.points = (st.points || 0) + 15;
    if (appSaveState) appSaveState();
    if (appRenderAll) appRenderAll();
    if (appLaunchConfetti) appLaunchConfetti();
    if (appShowToast) {
      appShowToast(
        isAr
          ? '🤲 تقبّل الله صدقتك وجبر خاطرك! تمت إضافة +١٥ نقطة.'
          : '🤲 May Allah accept your Sadaqah & kindness! Added +15 pts.'
      );
    }
  });
}

export function syncFivePrayersToSchedule() {
  if (!appGetState || !appSaveState || !appRenderAll) return;
  const st = appGetState();
  const isAr = st.lang === 'ar';

  // Remove old auto-synced prayer events so we don't duplicate
  st.events = (st.events || []).filter((ev) => !String(ev.id).startsWith('ev_prayer_'));

  PRAYER_NAMES.forEach((p) => {
    const timeVal = currentPrayerTimings[p.key] || '12:00';
    st.events.push({
      id: `ev_prayer_${p.key.toLowerCase()}`,
      time: timeVal,
      pillarId: 'faith',
      title: {
        en: `🕌 ${p.en} Prayer on Time + Sunnah / 1 Page Quran`,
        ar: `🕌 صلاة ${p.ar} في وقتها + السنن / ورد القرآن`
      }
    });
  });

  appSaveState();
  appRenderAll();
  if (appLaunchConfetti) appLaunchConfetti();
  if (appShowToast) {
    appShowToast(
      isAr
        ? '🕌 تمت مزامنة الصلوات الخمس في تقويمك الذكي مع التنبيه الصوتي!'
        : '🕌 Synced all 5 daily prayers into your Smart Schedule with voice alerts!'
    );
  }
}

export function initQuranAndPrayerModule({
  getState,
  saveState,
  renderAll,
  showToast,
  launchConfetti,
  onCompleteQuranPage,
  onCompleteAdhkar
}) {
  appGetState = getState;
  appSaveState = saveState;
  appRenderAll = renderAll;
  appShowToast = showToast;
  appLaunchConfetti = launchConfetti;
  appCompleteQuranPage = onCompleteQuranPage;
  appCompleteAdhkar = onCompleteAdhkar;

  loadCachedPrayerTimes();

  document.getElementById('btn-close-adhkar-modal')?.addEventListener('click', closeAdhkarTasbihModal);
  document.querySelectorAll('.adhkar-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeAdhkarTab = btn.getAttribute('data-adhkar-tab') || 'morning';
      renderAdhkarTasbihDom();
    });
  });

  document.getElementById('btn-adhkar-claim-win')?.addEventListener('click', () => {
    if (typeof appCompleteAdhkar === 'function') {
      appCompleteAdhkar('silver');
    }
    closeAdhkarTasbihModal();
  });

  document.getElementById('btn-close-quran-reader')?.addEventListener('click', closeQuranReaderModal);

  document.getElementById('btn-quran-prev')?.addEventListener('click', () => {
    if (currentPageNumber > 1) {
      loadAndRenderQuranPage(currentPageNumber - 1);
    }
  });

  document.getElementById('btn-quran-next')?.addEventListener('click', () => {
    if (currentPageNumber < 604) {
      loadAndRenderQuranPage(currentPageNumber + 1);
    }
  });

  document.getElementById('quran-page-input')?.addEventListener('change', (e) => {
    const val = Number(e.target.value);
    if (val >= 1 && val <= 604) {
      loadAndRenderQuranPage(val);
    }
  });

  document.getElementById('btn-quran-audio-toggle')?.addEventListener('click', () => {
    if (isPlayingQuranAudio) {
      stopQuranAudio();
    } else {
      playQuranPageFromAyah(0);
    }
  });

  document.getElementById('btn-quran-toggle-trans')?.addEventListener('click', () => {
    showEnglishTranslation = !showEnglishTranslation;
    renderCurrentQuranPageDom();
  });

  document.getElementById('btn-quran-complete-page')?.addEventListener('click', () => {
    if (typeof appCompleteQuranPage === 'function') {
      appCompleteQuranPage(currentPageNumber);
    }
    if (currentPageNumber < 604) {
      loadAndRenderQuranPage(currentPageNumber + 1);
    }
  });

  // Fetch updated prayer times in background
  fetchPrayerTimesByCity(selectedCityKey);
}
