// Personalized Onboarding Wizard for Nawwa | نواة
// Allows users to choose ONLY the pillars they want on their first login,
// and answers personalized habit questions to tailor their daily plan.

export const PILLAR_QUESTIONS = [
  {
    pillarId: 'faith',
    icon: '🕌',
    title: { en: 'Faith & Worship', ar: 'الجانب الديني والروحي' },
    q1: {
      question: {
        en: 'What is your primary spiritual focus right now?',
        ar: 'ما هو هدفك الروحي الأساسي في هذه المرحلة؟'
      },
      options: [
        { id: 'quran', en: '📖 Daily Quran recitation with reflection', ar: '📖 ورد يومي ثابت من القرآن الكريم بتدبر' },
        { id: 'prayers', en: '🕌 Guarding all 5 daily prayers on time', ar: '🕌 المحافظة على الصلوات الخمس في أوقاتها' },
        { id: 'adhkar', en: '📿 Morning and evening remembrance & Istighfar', ar: '📿 أذكار الصباح والمساء والاستغفار اليومي' }
      ]
    },
    q2: {
      question: {
        en: 'What daily Quran reading pace feels realistic and inspiring?',
        ar: 'ما هو معدل قراءة القرآن الأنسب لك يومياً؟'
      },
      options: [
        { id: 'bronze_1p', step: 1, en: '🥉 1 Page per day (5 mins — easy starter)', ar: '🥉 صفحة واحدة يومياً (٥ دقائق - بداية سهلة)' },
        { id: 'silver_5p', step: 5, en: '🥈 5 Pages per day / Half Rub (10–15 mins)', ar: '🥈 ٥ صفحات يومياً / نصف حزب (١٠-١٥ دقيقة)' },
        { id: 'gold_20p', step: 20, en: '🥇 1 Full Juz / 20 Pages daily', ar: '🥇 جزء كامل / ٢٠ صفحة يومياً' }
      ]
    }
  },
  {
    pillarId: 'focus',
    icon: '⚡',
    title: { en: 'Focus & Anti-Procrastination', ar: 'التركيز ومكافحة التسويف' },
    q1: {
      question: {
        en: 'What is your biggest daily focus hurdle?',
        ar: 'ما أكبر تحدٍ يواجه تركيزك حالياً؟'
      },
      options: [
        { id: 'proc', en: '⏳ Procrastinating and delaying start of tasks', ar: '⏳ التسويف وصعوبة بدء المهام المؤجلة' },
        { id: 'phone', en: '📱 Phone notifications and social media loops', ar: '📱 مشتتات الهاتف وشبكات التواصل' },
        { id: 'fatigue', en: '🧠 Mental fatigue during long study or work blocks', ar: '🧠 الإرهاق الذهني بعد فترة عمل قصيرة' }
      ]
    },
    q2: {
      question: {
        en: 'What deep work session duration fits you best?',
        ar: 'كم مدة جلسة التركيز العميق اليومية الأنسب لك؟'
      },
      options: [
        { id: '15m', goal: 15, en: '🥉 15 minutes micro-start (low friction)', ar: '🥉 ١٥ دقيقة لبداية سهلة بدون مقاومة' },
        { id: '25m', goal: 25, en: '🥈 25 minutes Pomodoro block (classic)', ar: '🥈 ٢٥ دقيقة بومودورو نموذجية' },
        { id: '60m', goal: 60, en: '🥇 60+ minutes deep focus blocks', ar: '🥇 ٦٠ دقيقة أو أكثر للعمل العميق' }
      ]
    }
  },
  {
    pillarId: 'fitness',
    icon: '🏃',
    title: { en: 'Fitness & Movement', ar: 'اللياقة والصحة البدنية' },
    q1: {
      question: {
        en: 'What type of physical activity fits your routine best?',
        ar: 'ما نوع النشاط البدني المفضل لديك؟'
      },
      options: [
        { id: 'walk', unit: 'steps', goal: 8000, en: '🚶 Daily brisk walking & step count', ar: '🚶 المشي السريع وزيادة الخطوات اليومية' },
        { id: 'gym', unit: 'mins', goal: 45, en: '🏋️ Gym workouts & strength training', ar: '🏋️ تمارين الجيم وبناء القوة العضلية' },
        { id: 'home', unit: 'mins', goal: 20, en: '🧘 Home bodyweight workouts & stretching', ar: '🧘 تمارين منزلية خفيفة وإطالات' }
      ]
    },
    q2: {
      question: {
        en: 'How many days a week do you aim to train?',
        ar: 'كم يوماً في الأسبوع تخطط للتمرين؟'
      },
      options: [
        { id: '3d', en: '🥉 3 days a week (balanced start)', ar: '🥉 ٣ أيام أسبوعياً كبداية متوازنة' },
        { id: '5d', en: '🥈 5 days a week (active routine)', ar: '🥈 ٥ أيام أسبوعياً لنشاط متقدم' },
        { id: '7d', en: '🥇 Daily movement & stretching', ar: '🥇 حركة ونشاط يومي بلا انقطاع' }
      ]
    }
  },
  {
    pillarId: 'nutrition',
    icon: '🥗',
    title: { en: 'Clean Nutrition & Water', ar: 'التغذية الصحية وشرب الماء' },
    q1: {
      question: {
        en: 'What healthy eating habit do you want to master first?',
        ar: 'ما العادة الغذائية التي تريد ترسيخها أولاً؟'
      },
      options: [
        { id: 'water', en: '💧 Drinking 2–3 Liters of water daily', ar: '💧 شرب ٢–٣ لتر ماء نقي يومياً' },
        { id: 'sugar', en: '🚫 Cutting out added refined sugar and soda', ar: '🚫 الامتناع عن السكريات والمشروبات الغازية' },
        { id: 'home_food', en: '🥗 Eating balanced clean home-cooked meals', ar: '🥗 تناول وجبات صحية متوازنة ومعدة بالمنزل' }
      ]
    },
    q2: {
      question: {
        en: 'What is your daily hydration target?',
        ar: 'ما هو هدفك اليومي من شرب الماء؟'
      },
      options: [
        { id: '8c', goal: 8, en: '🥉 2 Liters (approx. 8 cups)', ar: '🥉 ٢ لتر (حوالي ٨ أكواب يومياً)' },
        { id: '12c', goal: 12, en: '🥈 3 Liters (approx. 12 cups)', ar: '🥈 ٣ لتر (حوالي ١٢ كوباً)' },
        { id: '14c', goal: 14, en: '🥇 3.5+ Liters (athletic hydration)', ar: '🥇 ٣.٥ لتر أو أكثر للرياضيين' }
      ]
    }
  },
  {
    pillarId: 'smoke',
    icon: '🚭',
    title: { en: 'Smoke-Free & Clean Lungs', ar: 'الإقلاع عن التدخين' },
    q1: {
      question: {
        en: 'What is your current objective regarding smoking?',
        ar: 'ما هو هدفك المباشر في رحلة التعافي من التدخين؟'
      },
      options: [
        { id: 'quit', en: '🛑 Complete smoke-free days starting today', ar: '🛑 يوم كامل بدون تدخين نهائياً' },
        { id: 'cut', en: '📉 Cutting daily cigarette count by half', ar: '📉 تقليل عدد السجائر اليومية للنصف' },
        { id: 'surf', en: '🌊 Surfing sudden 3-minute craving waves safely', ar: '🌊 تجاوز نوبات الرغبة الملحة (٣ دقائق)' }
      ]
    },
    q2: {
      question: {
        en: 'When do your strongest cigarette cravings strike?',
        ar: 'متى تشعر بأقوى رغبة في التدخين؟'
      },
      options: [
        { id: 'morning', en: '☕ Morning with first coffee', ar: '☕ الصباح الباكر مع القهوة' },
        { id: 'stress', en: '💼 During work stress and anxiety', ar: '💼 أثناء ضغوط العمل والتوتر' },
        { id: 'meals', en: '🍽️ Right after meals and social gatherings', ar: '🍽️ مباشرة بعد الوجبات أو مع الأصدقاء' }
      ]
    }
  },
  {
    pillarId: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: { en: 'Family Ties & Gathering', ar: 'صلة الرحم والتواصل العائلي' },
    q1: {
      question: {
        en: 'What is your primary relationship and family goal?',
        ar: 'ما هو هدفك الأساسي في صلة الرحم والعائلة؟'
      },
      options: [
        { id: 'call', en: '📞 Daily phone call with parents / family', ar: '📞 اتصال يومي ببر الوالدين والأهل' },
        { id: 'dinner', en: '🍽️ Weekly distraction-free family dinner', ar: '🍽️ جلسة عائلية أسبوعية دافئة بدون هواتف' },
        { id: 'visit', en: '🤝 Regular visits to relatives & strengthening ties', ar: '🤝 زيارات منتظمة للأقارب وصلة الرحم' }
      ]
    },
    q2: {
      question: {
        en: 'What quality time habit matters most to you?',
        ar: 'ما العادة التي تعزز دفء علاقاتك؟'
      },
      options: [
        { id: 'phone_away', en: '📵 Putting phone completely away during conversations', ar: '📵 إبعاد الهاتف تماماً أثناء الجلسة' },
        { id: 'listen', en: '👂 Active listening and asking about their day', ar: '👂 الاستماع الفعلي والاهتمام الصادق بيومهم' },
        { id: 'kindness', en: '🎁 Thoughtful acts of service, help & gifts', ar: '🎁 المبادرة بالمساعدة والهدايا الطيبة' }
      ]
    }
  }
];

let selectedPillarIds = ['faith', 'focus', 'fitness'];
let wizardAnswers = {};
let currentWizardStep = 1;

let appGetState = null;
let appSaveState = null;
let appRenderAll = null;
let appShowToast = null;
let appLaunchConfetti = null;

export function openPersonalizationWizard() {
  const modal = document.getElementById('personalization-modal');
  if (!modal) return;

  const st = appGetState();
  // Preload currently active pillars
  if (Array.isArray(st.pillars)) {
    const activeIds = st.pillars.filter((p) => p.active).map((p) => p.id);
    if (activeIds.length > 0) {
      selectedPillarIds = [...activeIds];
    }
  }

  currentWizardStep = 1;
  modal.classList.remove('hidden');
  renderWizard();
}

export function closePersonalizationWizard() {
  const modal = document.getElementById('personalization-modal');
  if (modal) modal.classList.add('hidden');
}

export function renderWizard() {
  const st = appGetState();
  const isAr = st.lang === 'ar';

  const step1Container = document.getElementById('wizard-step-1');
  const step2Container = document.getElementById('wizard-step-2');

  if (currentWizardStep === 1) {
    if (step1Container) step1Container.classList.remove('hidden');
    if (step2Container) step2Container.classList.add('hidden');
    renderStep1Pillars(isAr);
  } else {
    if (step1Container) step1Container.classList.add('hidden');
    if (step2Container) step2Container.classList.remove('hidden');
    renderStep2Questions(isAr);
  }
}

function renderStep1Pillars(isAr) {
  const grid = document.getElementById('wizard-pillars-selection-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const countBadge = document.getElementById('wizard-selected-count');
  if (countBadge) {
    countBadge.textContent = isAr
      ? `تم اختيار ${selectedPillarIds.length} من ٦ أركان`
      : `${selectedPillarIds.length} of 6 selected`;
  }

  PILLAR_QUESTIONS.forEach((item) => {
    const isSelected = selectedPillarIds.includes(item.pillarId);
    const card = document.createElement('div');
    card.className = `wizard-pillar-card ${isSelected ? 'selected' : ''}`;

    card.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-size:1.8rem;">${item.icon}</span>
        <div class="wizard-checkbox ${isSelected ? 'checked' : ''}">
          ${isSelected ? '✓' : ''}
        </div>
      </div>
      <strong style="font-size:0.92rem; display:block;">${isAr ? item.title.ar : item.title.en}</strong>
      <p style="font-size:0.75rem; color:var(--text-muted); margin-top:3px; line-height:1.35;">
        ${isAr ? item.q1.question.ar : item.q1.question.en}
      </p>
    `;

    card.addEventListener('click', () => {
      if (selectedPillarIds.includes(item.pillarId)) {
        if (selectedPillarIds.length <= 1) {
          appShowToast(
            isAr ? '⚠️ يجب اختيار ركن واحد على الأقل للتركيز عليه!' : '⚠️ Please keep at least 1 active pillar!'
          );
          return;
        }
        selectedPillarIds = selectedPillarIds.filter((id) => id !== item.pillarId);
      } else {
        selectedPillarIds.push(item.pillarId);
      }
      renderStep1Pillars(isAr);
    });

    grid.appendChild(card);
  });
}

function renderStep2Questions(isAr) {
  const container = document.getElementById('wizard-questions-list');
  if (!container) return;
  container.innerHTML = '';

  const activePillarConfigs = PILLAR_QUESTIONS.filter((p) => selectedPillarIds.includes(p.pillarId));

  activePillarConfigs.forEach((pConfig) => {
    const block = document.createElement('div');
    block.className = 'wizard-question-block';

    const pTitle = isAr ? pConfig.title.ar : pConfig.title.en;

    block.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; border-bottom:1px dashed var(--border-color); padding-bottom:8px;">
        <span style="font-size:1.5rem;">${pConfig.icon}</span>
        <strong style="font-size:1.02rem; color:var(--green-400);">${pTitle}</strong>
      </div>

      <!-- Question 1 -->
      <div style="margin-bottom:12px;">
        <label style="font-size:0.86rem; font-weight:700; color:var(--text-main); display:block; margin-bottom:6px;">
          1. ${isAr ? pConfig.q1.question.ar : pConfig.q1.question.en}
        </label>
        <div class="wizard-options-grid" data-pillar="${pConfig.pillarId}" data-q="q1">
          ${pConfig.q1.options
            .map((opt, oIdx) => {
              const currentChoice = wizardAnswers[pConfig.pillarId]?.q1 ?? 0;
              const isChecked = currentChoice === oIdx;
              return `
              <button type="button" class="wizard-opt-btn ${isChecked ? 'selected' : ''}" data-opt-idx="${oIdx}">
                ${isAr ? opt.ar : opt.en}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>

      <!-- Question 2 -->
      <div>
        <label style="font-size:0.86rem; font-weight:700; color:var(--text-main); display:block; margin-bottom:6px;">
          2. ${isAr ? pConfig.q2.question.ar : pConfig.q2.question.en}
        </label>
        <div class="wizard-options-grid" data-pillar="${pConfig.pillarId}" data-q="q2">
          ${pConfig.q2.options
            .map((opt, oIdx) => {
              const currentChoice = wizardAnswers[pConfig.pillarId]?.q2 ?? 0;
              const isChecked = currentChoice === oIdx;
              return `
              <button type="button" class="wizard-opt-btn ${isChecked ? 'selected' : ''}" data-opt-idx="${oIdx}">
                ${isAr ? opt.ar : opt.en}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;

    // Attach click events to options
    block.querySelectorAll('.wizard-options-grid').forEach((grid) => {
      const pId = grid.dataset.pillar;
      const qKey = grid.dataset.q;

      grid.querySelectorAll('.wizard-opt-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const optIdx = Number(btn.dataset.optIdx);
          wizardAnswers[pId] = wizardAnswers[pId] || { q1: 0, q2: 0 };
          wizardAnswers[pId][qKey] = optIdx;

          grid.querySelectorAll('.wizard-opt-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
    });

    container.appendChild(block);
  });
}

export function saveAndApplyPersonalization() {
  const st = appGetState();
  const isAr = st.lang === 'ar';

  if (!selectedPillarIds.length) {
    selectedPillarIds = ['faith', 'focus'];
  }

  // Set active state for each pillar:
  // User ONLY sees what they chose!
  st.pillars.forEach((pillar) => {
    pillar.active = selectedPillarIds.includes(pillar.id);

    // If active and user selected specific goals, tailor the tracker values!
    if (pillar.active && wizardAnswers[pillar.id]) {
      const ans = wizardAnswers[pillar.id];
      const pConfig = PILLAR_QUESTIONS.find((p) => p.pillarId === pillar.id);

      if (pConfig && pConfig.q2 && pConfig.q2.options[ans.q2]) {
        const chosenOpt = pConfig.q2.options[ans.q2];
        if (chosenOpt.step && pillar.tracker) {
          pillar.tracker.step = chosenOpt.step;
        }
        if (chosenOpt.goal && pillar.tracker) {
          pillar.tracker.goal = chosenOpt.goal;
        }
        if (chosenOpt.unit && pillar.tracker) {
          pillar.tracker.unit = { en: chosenOpt.unit, ar: chosenOpt.unit };
        }
      }
    }
  });

  // Mark currentUser as personalized
  if (st.currentUser) {
    st.currentUser.personalized = true;
    st.currentUser.onboarded = true;
    st.currentUser.preferences = wizardAnswers;

    // Sync with users list
    if (Array.isArray(st.users)) {
      const u = st.users.find((x) => x.id === st.currentUser.id || x.email === st.currentUser.email);
      if (u) {
        u.personalized = true;
        u.onboarded = true;
        u.preferences = wizardAnswers;
      }
    }
  }

  if (st.user) {
    st.user.onboarded = true;
    st.user.personalized = true;
  }

  appSaveState();
  closePersonalizationWizard();
  appRenderAll();
  appLaunchConfetti?.();

  appShowToast(
    isAr
      ? `🎉 ما شاء الله! تم تخصيص خطتك بنجاح لتشمل فقط ${selectedPillarIds.length} أركان اخترتها.`
      : `🎉 Awesome! Your dashboard is now tailored with only your ${selectedPillarIds.length} chosen pillars.`
  );
}

export function initPersonalizationWizard(getState, saveState, renderAll, showToast, launchConfetti) {
  appGetState = getState;
  appSaveState = saveState;
  appRenderAll = renderAll;
  appShowToast = showToast;
  appLaunchConfetti = launchConfetti;

  // Open & Close triggers
  document.getElementById('btn-open-personalization')?.addEventListener('click', () => {
    openPersonalizationWizard();
  });
  document.getElementById('btn-profile-repersonalize')?.addEventListener('click', () => {
    openPersonalizationWizard();
  });
  document.getElementById('btn-close-personalization')?.addEventListener('click', closePersonalizationWizard);

  // Step navigation buttons
  document.getElementById('btn-wizard-step1-next')?.addEventListener('click', () => {
    if (!selectedPillarIds.length) {
      showToast('Please select at least 1 pillar!');
      return;
    }
    currentWizardStep = 2;
    renderWizard();
  });

  document.getElementById('btn-wizard-step2-back')?.addEventListener('click', () => {
    currentWizardStep = 1;
    renderWizard();
  });

  document.getElementById('btn-wizard-finish')?.addEventListener('click', saveAndApplyPersonalization);
}
