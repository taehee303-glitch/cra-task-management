/* FitSpace — AI Health Assistant */

const STORAGE_KEY = 'fitspace_data';

const DEFAULT_DATA = {
  profile: { name: 'Alex Morgan', height: 178, age: 28 },
  healthProfile: {
    currentWeight: 78.2,
    targetWeight: 75,
    workoutFrequency: 4,
    allergies: ['견과류'],
    preferredFoods: ['닭가슴살', '연어', '두부', '현미'],
    dislikedFoods: ['브로콜리'],
    stapleIngredients: ['계란', '현미', '올리브오일', '닭가슴살'],
    householdSize: 2,
    budgetWeekly: 80000,
    diningOutPerWeek: 2,
  },
  goals: { calories: 2200, protein: 130, water: 8, waterLiters: 2, sleepHours: 7, steps: 8000, weight: 75, workouts: 7, bodyFat: 18, muscle: 36, bmi: 23, visceralFat: 6, bmr: 1680 },
  dailyChecklists: {},
  daily: {
    water: 6,
    steps: 8420,
    sleep: '7h 32m',
    workoutDone: false,
  },
  meals: {},
  chat: { messages: [] },
  aiMemory: {
    consent: {
      rememberHealth: true, rememberWorkout: true, rememberMeals: true,
      rememberLifestyle: true, proactiveCoach: true,
    },
    disabledKeys: [],
    facts: [],
    insights: [],
    lastSynced: null,
  },
  healthIntegrations: {
    enabled: false,
    platforms: {
      appleHealth: { connected: false, lastSync: null },
      samsungHealth: { connected: false, lastSync: null },
      googleHealthConnect: { connected: false, lastSync: null },
      garmin: { connected: false, lastSync: null },
      fitbit: { connected: false, lastSync: null },
    },
    syncedData: {},
    watchSession: { active: false, linkedWorkoutId: null },
  },
  pendingMealPlan: null,
  pantry: { items: [] },
  exerciseMedia: {},
  personalRecords: {},
  exerciseGoals: {
    '랫풀다운': { targetWeight: 60, targetReps: 10 },
    '벤치프레스': { targetWeight: 70, targetReps: 8 },
    '스쿼트': { targetWeight: 100, targetReps: 8 },
    '레그프레스': { targetWeight: 150, targetReps: 10 },
  },
  achievements: { unlocked: [], unlockedAt: {}, newPrCount: 0 },
  workoutLifetime: {
    totalWorkouts: 3, totalMinutes: 145, totalSets: 42, totalVolume: 48500,
    consecutiveDays: 0, lastWorkoutDate: null, prCount: 0,
  },
  routines: [
    {
      id: 'r1',
      name: 'Pull (등)',
      exercises: [
        { id: 'ex1', name: '랫풀다운', sets: 4, reps: 12, weight: 45, order: 0 },
        { id: 'ex2', name: '시티드로우', sets: 4, reps: 12, weight: 40, order: 1 },
        { id: 'ex3', name: '원암 덤벨로우', sets: 3, reps: 12, weight: 20, order: 2 },
        { id: 'ex4', name: '풀오버', sets: 3, reps: 12, weight: 15, order: 3 },
      ],
    },
    {
      id: 'r2',
      name: 'Push (가슴)',
      exercises: [
        { id: 'ex5', name: '벤치프레스', sets: 4, reps: 10, weight: 60, order: 0 },
        { id: 'ex6', name: '체스트프레스', sets: 3, reps: 12, weight: 50, order: 1 },
        { id: 'ex7', name: '케이블 플라이', sets: 3, reps: 15, weight: 12, order: 2 },
      ],
    },
    {
      id: 'r3',
      name: 'Legs (하체)',
      exercises: [
        { id: 'ex8', name: '스쿼트', sets: 4, reps: 8, weight: 80, order: 0 },
        { id: 'ex9', name: '레그프레스', sets: 4, reps: 12, weight: 120, order: 1 },
        { id: 'ex10', name: '레그컬', sets: 3, reps: 12, weight: 35, order: 2 },
        { id: 'ex11', name: '레그익스텐션', sets: 3, reps: 15, weight: 40, order: 3 },
      ],
    },
  ],
  activeRoutineId: 'r1',
  activeWorkout: {
    status: 'idle',
    routineId: null,
    elapsed: 0,
    startTime: null,
    restSeconds: 0,
    restTotal: 90,
    restDuration: 90,
    currentExIdx: 0,
    sessionNote: '',
    voiceNoteReady: true,
    aiFeedback: null,
    exercises: [],
  },
  workoutHistory: [
    {
      date: daysAgo(1), name: 'Legs (하체)', routineId: 'r3', duration: 52,
      sessionNote: '스쿼트 자세가 안정적이었다.',
      exercises: [
        { name: '스쿼트', plan: { sets: 4, reps: 8, weight: 80 }, sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }, { weight: 80, reps: 7 }, { weight: 80, reps: 6 }] },
        { name: '레그프레스', plan: { sets: 4, reps: 12, weight: 120 }, sets: [{ weight: 120, reps: 12 }, { weight: 120, reps: 12 }, { weight: 120, reps: 10 }] },
        { name: '레그컬', plan: { sets: 3, reps: 12, weight: 35 }, sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }, { weight: 35, reps: 11 }] },
        { name: '레그익스텐션', plan: { sets: 3, reps: 15, weight: 40 }, sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 14 }, { weight: 40, reps: 14 }] },
      ],
    },
    {
      date: daysAgo(3), name: 'Push (가슴)', routineId: 'r2', duration: 45,
      exercises: [
        { name: '벤치프레스', plan: { sets: 4, reps: 10, weight: 60 }, sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 9 }, { weight: 60, reps: 8 }] },
        { name: '체스트프레스', plan: { sets: 3, reps: 12, weight: 50 }, sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 11 }, { weight: 50, reps: 10 }] },
        { name: '케이블 플라이', plan: { sets: 3, reps: 15, weight: 12 }, sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 14 }, { weight: 12, reps: 12 }] },
      ],
    },
    {
      date: daysAgo(5), name: 'Pull (등)', routineId: 'r1', duration: 48,
      exercises: [
        { name: '랫풀다운', plan: { sets: 4, reps: 12, weight: 45 }, sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }, { weight: 45, reps: 10 }, { weight: 42.5, reps: 10 }] },
        { name: '시티드로우', plan: { sets: 4, reps: 12, weight: 40 }, sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 11 }] },
        { name: '원암 덤벨로우', plan: { sets: 3, reps: 12, weight: 20 }, sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }, { weight: 20, reps: 11 }] },
      ],
    },
  ],
  metrics: [
    { date: daysAgo(28), weight: 80.6, bodyFat: 22.1, muscle: 34.2, bmi: 25.4, visceralFat: 9, bmr: 1620 },
    { date: daysAgo(21), weight: 79.8, bodyFat: 21.5, muscle: 34.5, bmi: 25.2, visceralFat: 8, bmr: 1635 },
    { date: daysAgo(14), weight: 79.1, bodyFat: 20.8, muscle: 34.8, bmi: 25.0, visceralFat: 8, bmr: 1648 },
    { date: daysAgo(7), weight: 78.6, bodyFat: 20.2, muscle: 35.0, bmi: 24.8, visceralFat: 7, bmr: 1660 },
    { date: today(), weight: 78.2, bodyFat: 19.8, muscle: 35.2, bmi: 24.7, visceralFat: 7, bmr: 1672 },
  ],
  calendarEvents: {},
  shoppingList: [],
  selectedMealDay: today(),
  selectedCalDay: today(),
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  ai: { apiKey: '' },
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ── State ── */

seedDefaultMeals();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = {
        ...structuredClone(DEFAULT_DATA),
        ...parsed,
        dailyChecklists: parsed.dailyChecklists || {},
        ai: { ...DEFAULT_DATA.ai, ...(parsed.ai || {}) },
        healthProfile: { ...DEFAULT_DATA.healthProfile, ...(parsed.healthProfile || {}) },
        chat: { messages: [], ...(parsed.chat || {}) },
        aiMemory: {
          ...DEFAULT_DATA.aiMemory,
          ...(parsed.aiMemory || {}),
          consent: { ...DEFAULT_DATA.aiMemory.consent, ...(parsed.aiMemory?.consent || {}) },
        },
        healthIntegrations: {
          ...DEFAULT_DATA.healthIntegrations,
          ...(parsed.healthIntegrations || {}),
          platforms: { ...DEFAULT_DATA.healthIntegrations.platforms, ...(parsed.healthIntegrations?.platforms || {}) },
        },
        pantry: { items: [], ...(parsed.pantry || {}) },
      };
      if (merged.activeWorkout && !merged.activeWorkout.exercises) {
        merged.activeWorkout = structuredClone(DEFAULT_DATA.activeWorkout);
        merged.activeWorkout.routineId = merged.activeRoutineId;
      }
      merged.metrics = (merged.metrics || []).map(m => normalizeMetric(m, merged.profile?.height || 170, merged.profile?.age || 28));
      merged.workoutHistory = (merged.workoutHistory || []).map(w =>
        Array.isArray(w.exercises) ? w : { ...w, routineId: w.routineId || '', exercises: [] }
      );
      if (typeof FitSpaceWorkout !== 'undefined') FitSpaceWorkout.migrateWorkoutData(merged);
      if (typeof FitSpaceGrowth !== 'undefined') FitSpaceGrowth.migrate(merged);
      if (typeof FitSpaceAIMemory !== 'undefined') FitSpaceAIMemory.migrate(merged);
      merged.goals = { ...DEFAULT_DATA.goals, ...(merged.goals || {}) };
      return merged;
    }
  } catch (_) { /* ignore */ }
  return structuredClone(DEFAULT_DATA);
}

let state = loadState();
let charts = {};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedDefaultMeals() {
  const t = today();
  DEFAULT_DATA.meals[t] = {
    breakfast: [
      { id: 'm1', name: '그릭 요거트 파르페', calories: 320, protein: 24, carbs: 38, fat: 8, emoji: '🥣', ingredients: ['greek yogurt', 'granola', 'berries', 'honey'] },
      { id: 'm2', name: '그린 스무디', calories: 180, protein: 8, carbs: 28, fat: 4, emoji: '🥤', ingredients: ['spinach', 'banana', 'almond milk'] },
    ],
    lunch: [
      { id: 'm3', name: '그릴드 치킨 샐러드', calories: 450, protein: 42, carbs: 18, fat: 22, emoji: '🥗', ingredients: ['chicken breast', 'mixed greens', 'cherry tomatoes', 'olive oil', 'feta cheese'] },
    ],
    dinner: [
      { id: 'm4', name: '연어 퀴노아', calories: 520, protein: 38, carbs: 42, fat: 18, emoji: '🐟', ingredients: ['salmon fillet', 'quinoa', 'asparagus', 'lemon', 'garlic'] },
    ],
    snack: [
      { id: 'm5', name: '프로틴 바', calories: 210, protein: 20, carbs: 22, fat: 7, emoji: '🍫', ingredients: ['protein bar'] },
      { id: 'm6', name: '사과 & 아몬드 버터', calories: 160, protein: 4, carbs: 20, fat: 8, emoji: '🍎', ingredients: ['apple', 'almond butter'] },
    ],
  };
  seedCalendarEvents();
  seedShoppingList();
}

function seedCalendarEvents() {
  const events = {};
  for (let i = 0; i < 30; i++) {
    const d = daysAgo(-i);
    const dayOfWeek = new Date(d + 'T12:00:00').getDay();
    const ev = [];
    if (dayOfWeek !== 0) ev.push('workout');
    if (dayOfWeek === 0) ev.push('cheat');
    if (i % 7 === 0) ev.push('measure');
    if (DEFAULT_DATA.meals[d] || DEFAULT_DATA.meals[today()]) ev.push('meal');
    if (ev.length) events[d] = ev;
  }
  DEFAULT_DATA.calendarEvents = events;
}

function seedShoppingList() {
  DEFAULT_DATA.shoppingList = [
    { id: 's1', name: 'Chicken breast', checked: false, source: 'meals' },
    { id: 's2', name: 'Salmon fillet', checked: false, source: 'meals' },
    { id: 's3', name: 'Greek yogurt', checked: true, source: 'meals' },
    { id: 's4', name: 'Mixed greens', checked: false, source: 'meals' },
    { id: 's5', name: 'Quinoa', checked: false, source: 'meals' },
    { id: 's6', name: 'Asparagus', checked: false, source: 'meals' },
    { id: 's7', name: 'Almond butter', checked: false, source: 'meals' },
    { id: 's8', name: 'Berries', checked: true, source: 'meals' },
    { id: 's9', name: 'Eggs', checked: false, source: 'manual' },
    { id: 's10', name: 'Olive oil', checked: false, source: 'meals' },
  ];
}

if (!localStorage.getItem(STORAGE_KEY)) {
  saveState();
}

/* ── Navigation ── */

const VIEW_TITLES = {
  chat: 'AI 건강 비서',
  dashboard: '홈',
  meals: '식단',
  workout: '운동',
  growth: '성장',
  progress: 'Progress',
  metrics: '체중 관리',
  calendar: 'Calendar',
  shopping: '장보기',
  ai: 'AI Coach',
  settings: 'Settings',
};

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add('view--active');

  const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (nav) nav.classList.add('active');

  document.getElementById('pageTitle').textContent = VIEW_TITLES[view] || view;
  document.getElementById('pageSubtitle').textContent =
    view === 'dashboard' ? formatHomeDate()
      : view === 'chat' ? '대화로 건강을 관리하세요'
        : view === 'growth' ? '과거의 나와 비교하는 성장'
        : view === 'ai' ? 'Personalized insights powered by your data' : '';

  document.querySelector('.main')?.classList.toggle('main--chat', view === 'chat');

  location.hash = view;
  renderView(view);
  document.getElementById('sidebar').classList.remove('open');
}

function renderView(view) {
  switch (view) {
    case 'chat': renderChat(); break;
    case 'dashboard': renderDashboard(); break;
    case 'meals': renderMeals(); break;
    case 'workout': FitSpaceWorkout.renderWorkout(); break;
    case 'growth': FitSpaceGrowth.renderDashboard(true); break;
    case 'progress': renderProgress(); break;
    case 'metrics': renderMetrics(); break;
    case 'calendar': renderCalendar(); break;
    case 'shopping': renderShopping(); break;
    case 'ai': renderAI(); break;
    case 'settings': renderSettings(); break;
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigate(item.dataset.view);
  });
});

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.nav));
});

document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

window.addEventListener('hashchange', () => {
  const view = location.hash.slice(1) || 'dashboard';
  navigate(view);
});

/* ── Dashboard ── */

function getTodayMeals() {
  const dayMeals = state.meals[today()] || {};
  return dayMeals;
}

function getMealTotals(meals) {
  let cal = 0, pro = 0, carbs = 0, fat = 0;
  Object.values(meals).flat().forEach(m => {
    cal += m.calories || 0;
    pro += m.protein || 0;
    carbs += m.carbs || 0;
    fat += m.fat || 0;
  });
  return { cal, pro, carbs, fat };
}

/* ── AI Chat ── */

let chatBound = false;
let chatPendingFile = null;

function ensureChatWelcome() {
  if (!state.chat) state.chat = { messages: [] };
  if (!state.chat.messages.length) {
    state.chat.messages.push({
      id: 'sys1',
      role: 'assistant',
      text: FitSpaceChat.getWelcomeMessage(state),
      time: Date.now(),
    });
    saveState();
  }
}

function formatChatText(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderChatCard(card, msgId) {
  if (!card) return '';
  if (card.type === 'meal_plan') {
    const days = card.data.days.slice(0, 3).map(d =>
      `<div class="chat-card__meal-day"><strong>${d.dayLabel}</strong> — ${d.meals.breakfast.name}, ${d.meals.lunch.name}, ${d.meals.dinner.name}</div>`
    ).join('');
    return `<div class="chat-card">
      ${days}
      <div class="text-muted" style="font-size:0.75rem;margin-top:6px">+ ${card.data.days.length - 3}일 더</div>
      <div class="chat-card__actions">
        <button type="button" class="btn btn--primary btn--sm" data-chat-action="save_meal_plan" data-msg="${msgId}">캘린더에 저장</button>
        <button type="button" class="btn btn--secondary btn--sm" data-chat-action="navigate" data-target="meals">식단 보기</button>
      </div>
    </div>`;
  }
  if (card.type === 'food_analysis') {
    const a = card.data;
    return `<div class="chat-card">
      ${card.previewUrl ? `<img class="chat-card__photo" src="${card.previewUrl}" alt="식사" />` : ''}
      <div class="chat-card__actions">
        <button type="button" class="btn btn--primary btn--sm" data-chat-action="save_food" data-msg="${msgId}">저장</button>
        <button type="button" class="btn btn--ghost btn--sm" data-chat-action="edit_food" data-msg="${msgId}">수정</button>
      </div>
    </div>`;
  }
  return '';
}

function renderChatMessages() {
  ensureChatWelcome();
  const el = document.getElementById('chatMessages');
  el.innerHTML = state.chat.messages.map(msg => {
    const isUser = msg.role === 'user';
    return `<div class="chat-msg chat-msg--${isUser ? 'user' : 'assistant'}">
      <span class="chat-msg__avatar">${isUser ? '👤' : '✨'}</span>
      <div class="chat-msg__bubble">${formatChatText(msg.text)}${renderChatCard(msg.card, msg.id)}</div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function renderChatSuggestions(suggestions) {
  const chips = suggestions || [
    '이번 주 식단 짜줘',
    '이번 달 운동 어땠어?',
    '타임라인 보여줘',
    '내 정보 뭐 기억해?',
    '오늘 뭐 남았어?',
  ];
  document.getElementById('chatSuggestions').innerHTML = chips.map(s =>
    `<button type="button" class="chat-chip" data-suggestion="${s}">${s}</button>`
  ).join('');
}

function renderChat() {
  const proactive = FitSpaceChat.getProactiveMessage(state);
  document.getElementById('chatProactive').innerHTML = `
    <div class="chat-proactive__label">Smart Health Coach</div>
    ${proactive}`;

  renderChatMessages();
  renderChatSuggestions();

  if (!chatBound) {
    chatBound = true;
    document.getElementById('chatForm').addEventListener('submit', e => {
      e.preventDefault();
      sendChatMessage(document.getElementById('chatInput').value.trim());
    });
    document.getElementById('chatPhotoBtn').addEventListener('click', () => {
      document.getElementById('chatPhotoInput').click();
    });
    document.getElementById('chatPhotoInput').addEventListener('change', () => {
      const file = document.getElementById('chatPhotoInput').files[0];
      if (file) {
        chatPendingFile = file;
        sendChatMessage('식사 사진 분석해줘', file);
        document.getElementById('chatPhotoInput').value = '';
      }
    });
    document.getElementById('chatSuggestions').addEventListener('click', e => {
      const chip = e.target.closest('[data-suggestion]');
      if (chip) sendChatMessage(chip.dataset.suggestion);
    });
    document.getElementById('chatMessages').addEventListener('click', e => {
      const btn = e.target.closest('[data-chat-action]');
      if (!btn) return;
      handleChatAction(btn.dataset.chatAction, btn.dataset.msg, btn.dataset.target);
    });
  }
}

function appendChatMessage(role, text, card = null) {
  if (!state.chat) state.chat = { messages: [] };
  const msg = { id: 'c' + Date.now(), role, text, card, time: Date.now() };
  state.chat.messages.push(msg);
  if (state.chat.messages.length > 100) state.chat.messages = state.chat.messages.slice(-100);
  saveState();
  return msg;
}

function showChatTyping() {
  const el = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-msg--assistant';
  typing.id = 'chatTyping';
  typing.innerHTML = `<span class="chat-msg__avatar">✨</span><div class="chat-typing"><span></span><span></span><span></span></div>`;
  el.appendChild(typing);
  el.scrollTop = el.scrollHeight;
}

function hideChatTyping() {
  document.getElementById('chatTyping')?.remove();
}

async function sendChatMessage(text, file = null) {
  if (!text && !file) return;
  if (text) appendChatMessage('user', text);
  document.getElementById('chatInput').value = '';
  renderChatMessages();
  showChatTyping();

  try {
    const response = await FitSpaceChat.processMessage(text || '사진 분석', state, file || chatPendingFile);
    chatPendingFile = null;
    hideChatTyping();

    if (response.memoryUpdate) {
      state.healthProfile = { ...state.healthProfile, ...response.memoryUpdate };
    }
    if (typeof FitSpaceAIMemory !== 'undefined') {
      FitSpaceAIMemory.rebuildFromAppData(state);
    }
    if (response.card?.type === 'meal_plan') {
      state.pendingMealPlan = response.card.data;
    }

    const msg = appendChatMessage('assistant', response.text, response.card);
    if (response.suggestions) renderChatSuggestions(response.suggestions);
    renderChatMessages();
  } catch (_) {
    hideChatTyping();
    appendChatMessage('assistant', '잠시 문제가 생겼어요. 다시 시도해 주세요.');
    renderChatMessages();
  }
}

function handleChatAction(action, msgId, target) {
  const msg = state.chat.messages.find(m => m.id === msgId);
  switch (action) {
    case 'save_meal_plan':
      if (state.pendingMealPlan) saveMealPlanToCalendar(state.pendingMealPlan);
      appendChatMessage('assistant', '✅ 이번 주 식단을 캘린더에 저장했어요. 장보기 리스트도 업데이트했습니다!');
      renderChatMessages();
      break;
    case 'save_food':
      if (msg?.card?.data) saveFoodFromAnalysis(msg.card.data, msg.card.previewUrl);
      appendChatMessage('assistant', '✅ 식단에 저장했어요!');
      renderChatMessages();
      break;
    case 'edit_food':
      navigate('meals');
      break;
    case 'navigate':
      navigate(target || 'dashboard');
      break;
  }
}

function saveMealPlanToCalendar(plan) {
  plan.days.forEach(day => {
    if (!state.meals[day.date]) state.meals[day.date] = {};
    ['breakfast', 'lunch', 'dinner'].forEach(slot => {
      const m = day.meals[slot];
      if (!state.meals[day.date][slot]) state.meals[day.date][slot] = [];
      state.meals[day.date][slot] = [{
        id: 'm' + day.date + slot,
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs || 0,
        fat: m.fat || 0,
        emoji: m.emoji,
        ingredients: m.ingredients || [],
      }];
    });
    if (!state.calendarEvents[day.date]) state.calendarEvents[day.date] = [];
    if (!state.calendarEvents[day.date].includes('meal')) state.calendarEvents[day.date].push('meal');
  });
  generateShoppingFromMealPlan(plan);
  saveState();
}

function mergeShoppingItem(name, qty = 1, unit = '', source = 'mealplan') {
  const key = name.toLowerCase().trim();
  const existing = state.shoppingList.find(s => s.name.toLowerCase() === key);
  if (existing) {
    existing.qty = (existing.qty || 1) + qty;
    existing.source = source;
  } else {
    state.shoppingList.push({
      id: 's' + Date.now() + Math.random().toString(36).slice(2, 6),
      name,
      qty,
      unit,
      checked: false,
      source,
      category: 'general',
    });
  }
}

function generateShoppingFromMealPlan(plan) {
  const ingredientCounts = {};
  plan.days.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(slot => {
      (day.meals[slot]?.ingredients || []).forEach(ing => {
        if (ing === '외식') return;
        const servings = day.meals[slot].servings || plan.options?.householdSize || 1;
        ingredientCounts[ing] = (ingredientCounts[ing] || 0) + servings;
      });
    });
  });
  Object.entries(ingredientCounts).forEach(([name, qty]) => mergeShoppingItem(name, qty, '개', 'mealplan'));
  syncPantryFromShopping();
}

function syncPantryFromShopping() {
  if (!state.pantry) state.pantry = { items: [] };
  state.shoppingList.forEach(s => {
    const key = s.name.toLowerCase();
    if (!state.pantry.items.find(p => p.name.toLowerCase() === key)) {
      state.pantry.items.push({ name: s.name, qty: 0, unit: s.unit || '', inStock: false });
    }
  });
}

function saveFoodFromAnalysis(analysis, photoUrl) {
  const day = today();
  if (!state.meals[day]) state.meals[day] = {};
  const slot = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 21) return 'dinner';
    return 'snack';
  })();
  if (!state.meals[day][slot]) state.meals[day][slot] = [];

  let photo = null;
  if (photoUrl && photoUrl.startsWith('blob:')) {
    /* blob URLs expire; meal screen uses emoji fallback */
  }

  state.meals[day][slot].push({
    id: 'm' + Date.now(),
    name: analysis.name,
    calories: analysis.calories,
    protein: analysis.protein,
    carbs: analysis.carbs || 0,
    fat: analysis.fat || 0,
    emoji: analysis.emoji || '🍽️',
    ingredients: analysis.ingredients || [],
    photo,
  });
  saveState();
}

function renderHomeAiProactive() {
  const el = document.getElementById('homeAiProactive');
  if (!el) return;
  el.innerHTML = `
    <div class="home-ai-proactive__head">
      <span class="home-ai-proactive__badge">✨ AI가 먼저 말 걸어요</span>
      <button class="btn btn--ghost btn--sm" data-nav="chat">대화하기</button>
    </div>
    <p class="home-ai-proactive__text">${FitSpaceChat.getProactiveMessage(state)}</p>`;
  el.querySelector('[data-nav]')?.addEventListener('click', () => navigate('chat'));
}

function renderHomeGaps() {
  const g = state.goals;
  const meals = getTodayMeals();
  const totals = getMealTotals(meals);
  const waterL = (state.daily.water || 0) * 0.25;
  const gaps = [
    { label: '단백질', val: totals.pro >= g.protein ? '달성' : `${g.protein - totals.pro}g 부족` },
    { label: '물', val: waterL >= g.waterLiters ? '달성' : `${Math.round((g.waterLiters - waterL) * 1000)}mL` },
    { label: '칼로리', val: `${totals.cal} / ${g.calories}` },
  ];
  document.getElementById('homeGaps').innerHTML = gaps.map(gap =>
    `<div class="home-gap"><div class="home-gap__label">${gap.label}</div><div class="home-gap__val">${gap.val}</div></div>`
  ).join('');
}

/* ── Today Mission ── */

const MISSION_IDS = ['water', 'protein', 'workout', 'steps', 'sleep', 'vitamins'];

function getMissionDefinitions() {
  const g = state.goals;
  const waterL = g.waterLiters ?? (g.water ? g.water * 0.25 : 2);
  const sleepH = g.sleepHours ?? 7;
  return [
    { id: 'water', label: `물 ${waterL}L 마시기`, emoji: '💧', auto: true, action: 'water' },
    { id: 'protein', label: `단백질 ${g.protein}g 섭취`, emoji: '🥩', auto: true, nav: 'meals' },
    { id: 'workout', label: '운동 완료', emoji: '🏋️', auto: true, nav: 'workout' },
    { id: 'steps', label: `${g.steps.toLocaleString()}보 걷기`, emoji: '👟', auto: true, action: 'steps' },
    { id: 'sleep', label: `${sleepH}시간 이상 수면`, emoji: '😴', auto: true },
    { id: 'vitamins', label: '영양제 복용', emoji: '💊', manual: true },
  ];
}

const CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';

function parseSleepHours(str) {
  if (!str) return 0;
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  return (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
}

function getWaterLiters() {
  const g = state.goals;
  const cups = state.daily.water || 0;
  const goalCups = g.water || (g.waterLiters ? g.waterLiters * 4 : 8);
  const goalL = g.waterLiters ?? goalCups * 0.25;
  return { current: cups * 0.25, goal: goalL, cups, goalCups };
}

function getTodayChecklist() {
  const d = today();
  if (!state.dailyChecklists[d]) {
    state.dailyChecklists[d] = {
      water: false, protein: false, workout: false,
      steps: false, sleep: false, vitamins: false,
    };
  }
  return state.dailyChecklists[d];
}

function syncMissionAuto() {
  const cl = getTodayChecklist();
  const meals = getTodayMeals();
  const totals = getMealTotals(meals);
  const g = state.goals;
  const water = getWaterLiters();

  if (state.daily.workoutDone) cl.workout = true;
  if (water.current >= water.goal - 0.01) cl.water = true;
  if (totals.pro >= g.protein) cl.protein = true;
  if (state.daily.steps >= g.steps) cl.steps = true;
  if (parseSleepHours(state.daily.sleep) >= (g.sleepHours ?? 7)) cl.sleep = true;
}

function getMissionProgress() {
  syncMissionAuto();
  const cl = getTodayChecklist();
  const done = MISSION_IDS.filter(id => cl[id]).length;
  const pct = Math.round(done / MISSION_IDS.length * 100);
  return { done, total: MISSION_IDS.length, pct, cl };
}

function getMissionItemProgress(item, cl, meals, totals, g) {
  const water = getWaterLiters();
  switch (item.id) {
    case 'water': {
      const pct = Math.min(100, Math.round(water.current / water.goal * 100));
      return { pct, sub: `${water.current.toFixed(1)}L / ${water.goal}L`, current: water.current, goal: water.goal };
    }
    case 'protein': {
      const pct = Math.min(100, Math.round(totals.pro / g.protein * 100));
      return { pct, sub: `${totals.pro}g / ${g.protein}g`, current: totals.pro, goal: g.protein };
    }
    case 'workout': {
      const routine = state.routines.find(r => r.id === state.activeRoutineId);
      return { pct: cl.workout ? 100 : 0, sub: cl.workout ? '완료' : routine ? routine.name : '시작하기', current: cl.workout ? 1 : 0, goal: 1 };
    }
    case 'steps': {
      const pct = Math.min(100, Math.round(state.daily.steps / g.steps * 100));
      return { pct, sub: `${state.daily.steps.toLocaleString()} / ${g.steps.toLocaleString()}보`, current: state.daily.steps, goal: g.steps };
    }
    case 'sleep': {
      const hrs = parseSleepHours(state.daily.sleep);
      const goal = g.sleepHours ?? 7;
      const pct = Math.min(100, Math.round(hrs / goal * 100));
      return { pct, sub: cl.sleep ? `${state.daily.sleep} 기록` : `어젯밤 ${state.daily.sleep || '—'}`, current: hrs, goal };
    }
    case 'vitamins':
      return { pct: cl.vitamins ? 100 : 0, sub: cl.vitamins ? '복용 완료' : '탭하여 체크', current: cl.vitamins ? 1 : 0, goal: 1 };
    default:
      return { pct: 0, sub: '', current: 0, goal: 1 };
  }
}

function getMissionHint(pct, done) {
  if (pct === 100) return '오늘 미션 모두 완료! 정말 대단해요 🌟';
  if (pct >= 66) return '거의 다 왔어요. 조금만 더!';
  if (pct >= 33) return '좋은 페이스예요. 하나씩 체크해 나가요.';
  if (done > 0) return '작은 실천이 큰 변화를 만듭니다.';
  return '오늘의 건강 목표가 자동으로 생성됐어요.';
}

function getDailyCheer(pct, done) {
  const name = state.profile.name.split(' ')[0];
  if (pct === 100) return `${name}님, 오늘 미션 완벽 달성! 🌟`;
  if (pct >= 75) return '거의 다 왔어요. 조금만 더 힘내면 오늘 목표 달성!';
  if (pct >= 50) return '절반 이상 완료. 이 페이스 그대로 가면 돼요.';
  if (pct >= 25) return '좋은 시작이에요. 미션 하나씩 완료해 나가봐요.';
  if (done > 0) return '작은 실천이 모이면 큰 변화가 됩니다.';
  const hour = new Date().getHours();
  if (hour < 12) return `${name}님, 좋은 아침! 오늘의 미션부터 시작해볼까요?`;
  if (hour < 18) return `${name}님, 오후도 화이팅. 미션 하나만 더 해볼까요?`;
  return '오늘 하루도 수고 많았어요. 남은 미션 하나만 더 해볼까요?';
}

function getMissionCompleteMessage() {
  const name = state.profile.name.split(' ')[0];
  if (typeof FitSpaceAI !== 'undefined' && FitSpaceAI.getMissionCompleteCoach) {
    return FitSpaceAI.getMissionCompleteCoach(state);
  }
  const messages = [
    `${name}님, 오늘의 미션 100% 달성! 꾸준함이 몸을 바꿉니다. 내일도 이 기세로 이어가요. 💪`,
    `${name}님, 완벽한 하루! 수분·단백질·운동·수면까지 챙긴 ${name}님, 정말 멋져요. 🌟`,
    `오늘 모든 미션 클리어! ${name}님의 노력이 쌓이면 곧 몸에서 변화를 느낄 거예요. 🔥`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function spawnConfetti(container) {
  container.innerHTML = '';
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  for (let i = 0; i < 48; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
    container.appendChild(p);
  }
}

function showMissionCelebration() {
  const overlay = document.getElementById('missionCelebrate');
  const msg = document.getElementById('missionCelebrateMsg');
  if (!overlay || !msg) return;
  msg.textContent = getMissionCompleteMessage();
  spawnConfetti(document.getElementById('missionConfetti'));
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('mission-celebrate--show'));
}

function hideMissionCelebration() {
  const overlay = document.getElementById('missionCelebrate');
  if (!overlay) return;
  overlay.classList.remove('mission-celebrate--show');
  setTimeout(() => { overlay.hidden = true; }, 300);
}

function maybeCelebrateMission(prevPct, newPct) {
  if (newPct === 100 && prevPct < 100) {
    const cl = getTodayChecklist();
    if (!cl._celebrated) {
      cl._celebrated = true;
      saveState();
      setTimeout(showMissionCelebration, 400);
    }
  }
}

let missionCelebrateBound = false;
function bindMissionCelebration() {
  if (missionCelebrateBound) return;
  missionCelebrateBound = true;
  document.getElementById('missionCelebrateClose')?.addEventListener('click', hideMissionCelebration);
  document.getElementById('missionCelebrate')?.addEventListener('click', e => {
    if (e.target.id === 'missionCelebrate') hideMissionCelebration();
  });
}

function formatHomeDate() {
  const d = new Date();
  return d.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getHeroMessage(pct, done, total) {
  return getDailyCheer(pct, done);
}

function getDashboardGreeting() {
  return formatHomeDate();
}

function renderDashboard() {
  bindMissionCelebration();
  const prevPct = state._missionPctRendered ?? 0;

  const meals = getTodayMeals();
  const totals = getMealTotals(meals);
  const g = state.goals;
  const { done, total, pct, cl } = getMissionProgress();

  state._missionPctRendered = pct;

  document.getElementById('homeDate').textContent = formatHomeDate();
  document.getElementById('homeCheer').textContent = getDailyCheer(pct, done);
  document.getElementById('missionHint').textContent = getMissionHint(pct, done);

  const ring = document.getElementById('missionRingFill');
  const circumference = 2 * Math.PI * 52;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  if (pct === 100) ring.classList.add('mission-ring__fill--complete');
  else ring.classList.remove('mission-ring__fill--complete');

  document.getElementById('dailyProgressValue').textContent = `${pct}%`;
  document.getElementById('heroSub').textContent = `${done} / ${total} 완료`;
  document.getElementById('heroBarFill').style.width = `${pct}%`;
  document.getElementById('checklistProgress').textContent = `${done}/${total}`;

  renderHomeAiProactive();
  renderHomeGaps();
  renderTodayMission(cl, meals, totals, g);
  renderHomeMeals(meals, totals, g);
  renderHomeWorkout(cl);
  renderHomeAiCoach();

  maybeCelebrateMission(prevPct, pct);

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}

function renderTodayMission(cl, meals, totals, g) {
  const missions = getMissionDefinitions();
  const list = document.getElementById('todayMission');

  list.innerHTML = missions.map(item => {
    const isDone = cl[item.id];
    const prog = getMissionItemProgress(item, cl, meals, totals, g);
    const actionBtn = item.action === 'water'
      ? `<button type="button" class="mission-action" data-action="water">+250ml</button>`
      : item.action === 'steps'
        ? `<button type="button" class="mission-action" data-action="steps">+500</button>`
        : '';

    return `<li class="mission-item ${isDone ? 'mission-item--done' : ''}" data-id="${item.id}">
      <button type="button" class="mission-item__check" aria-label="${item.label}" aria-pressed="${isDone}">
        ${isDone ? CHECK_SVG : ''}
      </button>
      <span class="mission-item__emoji">${item.emoji}</span>
      <div class="mission-item__body">
        <span class="mission-item__label">${item.label}</span>
        <div class="mission-item__track">
          <div class="mission-item__bar"><div class="mission-item__fill ${isDone ? 'mission-item__fill--done' : ''}" style="width:${prog.pct}%"></div></div>
          <span class="mission-item__sub">${prog.sub}</span>
        </div>
      </div>
      ${actionBtn}
    </li>`;
  }).join('');

  list.querySelectorAll('.mission-item').forEach(row => {
    const id = row.dataset.id;
    const item = missions.find(i => i.id === id);

    row.querySelector('.mission-item__check').addEventListener('click', e => {
      e.stopPropagation();
      if (item.auto && id !== 'sleep') return;
      const before = getMissionProgress().pct;
      cl[id] = !cl[id];
      saveState();
      renderDashboard();
      maybeCelebrateMission(before, getMissionProgress().pct);
    });

    row.querySelector('.mission-item__body').addEventListener('click', () => {
      if (item.nav) navigate(item.nav);
      else if (item.manual || id === 'sleep') {
        const before = getMissionProgress().pct;
        cl[id] = !cl[id];
        saveState();
        renderDashboard();
        maybeCelebrateMission(before, getMissionProgress().pct);
      }
    });

    row.querySelector('[data-action="water"]')?.addEventListener('click', e => {
      e.stopPropagation();
      const before = getMissionProgress().pct;
      const water = getWaterLiters();
      state.daily.water = Math.min(water.goalCups, state.daily.water + 1);
      syncMissionAuto();
      saveState();
      renderDashboard();
      maybeCelebrateMission(before, getMissionProgress().pct);
    });

    row.querySelector('[data-action="steps"]')?.addEventListener('click', e => {
      e.stopPropagation();
      const before = getMissionProgress().pct;
      state.daily.steps += 500;
      syncMissionAuto();
      saveState();
      renderDashboard();
      maybeCelebrateMission(before, getMissionProgress().pct);
    });
  });
}

function renderHomeMeals(meals, totals, g) {
  const slots = [
    { id: 'breakfast', label: '아침', emoji: '🌅' },
    { id: 'lunch', label: '점심', emoji: '☀️' },
    { id: 'dinner', label: '저녁', emoji: '🌙' },
  ];

  document.getElementById('homeMeals').innerHTML = slots.map(slot => {
    const items = meals[slot.id] || [];
    const names = items.map(m => m.name).join(', ');
    const cal = items.reduce((s, m) => s + (m.calories || 0), 0);
    return `<div class="home-meal-row">
      <span class="home-meal-row__label">${slot.emoji} ${slot.label}</span>
      <span class="home-meal-row__name">${names || '—'}</span>
      <span class="home-meal-row__cal">${cal ? cal + 'kcal' : ''}</span>
    </div>`;
  }).join('');

  const calPct = Math.min(100, Math.round(totals.cal / g.calories * 100));
  document.getElementById('homeMealsTotal').innerHTML = `
    <span>${totals.cal.toLocaleString()} / ${g.calories.toLocaleString()} kcal</span>
    <span>단백질 ${totals.pro}g / ${g.protein}g</span>
    <div class="home-meals-total__bar"><div style="width:${calPct}%"></div></div>`;
}

function renderHomeWorkout(cl) {
  const routine = state.routines.find(r => r.id === state.activeRoutineId);
  const el = document.getElementById('homeWorkout');

  if (cl.workout) {
    el.innerHTML = `<div class="home-workout home-workout--done">
      <span class="badge badge--success">완료</span>
      <p class="home-workout__name">${routine?.name || '운동'}</p>
      <p class="text-muted">오늘 운동 잘 마치셨어요</p>
    </div>`;
    return;
  }

  if (!routine) {
    el.innerHTML = `<p class="home-workout__empty">오늘은 휴식일이에요 🧘</p>`;
    return;
  }

  el.innerHTML = `<div class="home-workout">
    <p class="home-workout__name">${routine.name}</p>
    <p class="home-workout__meta">${routine.exercises.length}가지 · 약 45분</p>
    <ul class="home-workout__list">${routine.exercises.slice(0, 3).map(ex =>
      `<li>${ex.name} · ${ex.sets}×${ex.reps}</li>`
    ).join('')}${routine.exercises.length > 3 ? `<li class="text-muted">+${routine.exercises.length - 3} more</li>` : ''}</ul>
  </div>`;
}

function renderHomeWater() {}
function renderHomeSteps() {}

function getHomeAiMessage() {
  if (typeof FitSpaceAIMemory !== 'undefined') {
    const msgs = FitSpaceAIMemory.getSmartCoachMessages(state);
    if (msgs.length) return msgs[0];
  }
  const meals = getTodayMeals();
  const totals = getMealTotals(meals);
  const g = state.goals;
  const { pct, cl } = getMissionProgress();
  const proGap = g.protein - totals.pro;
  const water = getWaterLiters();

  if (pct === 100) {
    return '오늘 미션 100% 달성! 회복과 휴식도 오늘의 성과만큼 중요해요.';
  }
  if (state.daily.workoutDone) {
    return '운동 완료! 지금은 스트레칭과 수분 보충, 단백질 식사가 회복에 도움이 돼요.';
  }
  if (proGap > 0 && proGap <= 30) {
    return `단백질 ${totals.pro}g 섭취 중, ${proGap}g만 더 채우면 미션 달성!`;
  }
  if (proGap > 30) {
    return `단백질 미션이 ${proGap}g 남았어요. 다음 식사에 닭가슴살이나 두부를 추가해보세요.`;
  }
  if (water.current < water.goal) {
    const left = (water.goal - water.current).toFixed(1);
    return `물 ${left}L 더 마시면 수분 미션 완료!`;
  }
  if (!cl.workout && new Date().getHours() >= 9 && new Date().getHours() <= 20) {
    const routine = state.routines.find(r => r.id === state.activeRoutineId);
    return routine
      ? `운동 미션: ${routine.name}. 30분만 투자해볼까요?`
      : '운동 미션이 남았어요. 짧은 산책부터 시작해볼까요?';
  }
  if (state.daily.steps < g.steps * 0.7) {
    return `걸음 미션 ${Math.round(state.daily.steps / g.steps * 100)}% — 저녁 산책 15분이면 충분해요.`;
  }
  return '오늘 페이스 좋아요. 미션 하나씩 완료하며 하루를 마무리해봐요.';
}

function renderHomeAiCoach() {
  const el = document.getElementById('homeAiCoach');
  if (!el) return;

  el.innerHTML = `
    <div class="home-ai">
      <div class="home-ai__head">
        <span class="home-ai__badge">✨ AI 코칭</span>
        <button class="btn btn--ghost btn--sm" data-nav="ai">더보기</button>
      </div>
      <p class="home-ai__text">${getHomeAiMessage()}</p>
    </div>`;

  el.querySelector('[data-nav]')?.addEventListener('click', () => navigate('ai'));
}

/* ── Meals ── */

const MEAL_SLOTS = [
  { id: 'breakfast', label: '아침', emoji: '🌅' },
  { id: 'lunch', label: '점심', emoji: '☀️' },
  { id: 'dinner', label: '저녁', emoji: '🌙' },
  { id: 'snack', label: '간식', emoji: '🍎' },
];

let pendingMealPhoto = null;
let foodAddBound = false;

function renderMeals() {
  renderMealDayTabs();
  renderFoodDailyTotal();
  renderMealSlots();
  setupFoodAddSheet();
}

function renderMealDayTabs() {
  const tabs = document.getElementById('mealDayTabs');
  const days = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }

  tabs.innerHTML = days.map(d => {
    const dt = new Date(d + 'T12:00:00');
    const isToday = d === today();
    const isActive = d === state.selectedMealDay;
    return `<button class="day-tab ${isActive ? 'active' : ''}" data-day="${d}">
      ${isToday ? '오늘' : dt.toLocaleDateString('ko-KR', { weekday: 'short' })}
      <span class="day-tab__date">${dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
    </button>`;
  }).join('');

  tabs.querySelectorAll('.day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedMealDay = btn.dataset.day;
      saveState();
      renderMeals();
    });
  });
}

function renderFoodDailyTotal() {
  const dayMeals = state.meals[state.selectedMealDay] || {};
  const totals = getMealTotals(dayMeals);
  const g = state.goals;
  const calPct = Math.min(100, Math.round(totals.cal / g.calories * 100));

  const macros = [
    { label: '단백질', current: totals.pro, goal: g.protein, cls: 'protein' },
    { label: '탄수화물', current: totals.carbs, goal: 250, cls: 'carbs' },
    { label: '지방', current: totals.fat, goal: 70, cls: 'fat' },
  ];

  document.getElementById('foodDailyTotal').innerHTML = `
    <div class="food-daily__hero">
      <div class="food-daily__cal">
        <span class="food-daily__cal-val">${totals.cal.toLocaleString()}</span>
        <span class="food-daily__cal-unit">kcal</span>
        <span class="food-daily__cal-goal">/ ${g.calories.toLocaleString()} 목표</span>
      </div>
      <div class="food-daily__bar"><div class="food-daily__bar-fill" style="width:${calPct}%"></div></div>
    </div>
    <div class="food-daily__macros">
      ${macros.map(m => {
        const pct = Math.min(100, Math.round(m.current / m.goal * 100));
        return `<div class="food-daily__macro">
          <span class="food-daily__macro-label">${m.label}</span>
          <div class="food-daily__macro-track"><div class="food-daily__macro-fill food-daily__macro-fill--${m.cls}" style="width:${pct}%"></div></div>
          <span class="food-daily__macro-val">${m.current}<span class="food-daily__macro-unit">g</span> / ${m.goal}g</span>
        </div>`;
      }).join('')}
    </div>`;
}

function renderMealPhotoThumb(meal) {
  if (meal.photo) {
    return `<img class="food-entry__img" src="${meal.photo}" alt="${meal.name}" />`;
  }
  return `<span class="food-entry__emoji">${meal.emoji || '🍽️'}</span>`;
}

function renderMealSlots() {
  const dayMeals = state.meals[state.selectedMealDay] || {};

  document.getElementById('mealSlots').innerHTML = MEAL_SLOTS.map(slot => {
    const items = dayMeals[slot.id] || [];
    const slotTotals = items.reduce((s, m) => ({
      cal: s.cal + (m.calories || 0),
      pro: s.pro + (m.protein || 0),
      carbs: s.carbs + (m.carbs || 0),
      fat: s.fat + (m.fat || 0),
    }), { cal: 0, pro: 0, carbs: 0, fat: 0 });

    const entries = items.length
      ? items.map(m => `
          <article class="food-entry">
            <div class="food-entry__photo">${renderMealPhotoThumb(m)}</div>
            <div class="food-entry__body">
              <div class="food-entry__name">${m.name}</div>
              <div class="food-entry__macros">
                <span class="food-entry__cal">${m.calories || 0} kcal</span>
                <span>단백질 ${m.protein || 0}g</span>
                <span>탄수 ${m.carbs || 0}g</span>
                <span>지방 ${m.fat || 0}g</span>
              </div>
            </div>
            <button class="food-entry__del" data-meal="${m.id}" data-slot="${slot.id}" aria-label="삭제">✕</button>
          </article>`).join('')
      : `<button type="button" class="food-section__empty" data-slot="${slot.id}">
          <span class="food-section__empty-icon">+</span>
          <span>${slot.label} 기록하기</span>
        </button>`;

    return `<section class="food-section">
      <header class="food-section__head">
        <h3 class="food-section__title">${slot.emoji} ${slot.label}</h3>
        <span class="food-section__total">${slotTotals.cal ? slotTotals.cal + ' kcal' : ''}</span>
        ${items.length ? `<button type="button" class="food-section__add" data-slot="${slot.id}">+ 추가</button>` : ''}
      </header>
      <div class="food-section__list">${entries}</div>
    </section>`;
  }).join('');

  document.querySelectorAll('.food-entry__del').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = state.meals[state.selectedMealDay];
      if (day && day[btn.dataset.slot]) {
        day[btn.dataset.slot] = day[btn.dataset.slot].filter(m => m.id !== btn.dataset.meal);
        saveState();
        renderMeals();
      }
    });
  });

  document.querySelectorAll('[data-slot]').forEach(btn => {
    if (btn.classList.contains('food-entry__del')) return;
    btn.addEventListener('click', () => openFoodAddSheet(btn.dataset.slot));
  });
}

function resetFoodAddForm() {
  pendingMealPhoto = null;
  const form = document.getElementById('addMealForm');
  form?.reset();
  const preview = document.getElementById('mealPhotoPreview');
  const placeholder = document.getElementById('mealPhotoPlaceholder');
  if (preview) { preview.hidden = true; preview.src = ''; }
  if (placeholder) placeholder.hidden = false;
}

function openFoodAddSheet(slot) {
  const slotInfo = MEAL_SLOTS.find(s => s.id === slot) || MEAL_SLOTS[0];
  document.getElementById('mealType').value = slotInfo.id;
  document.getElementById('foodAddTitle').textContent = `${slotInfo.label} 추가`;
  resetFoodAddForm();
  document.getElementById('mealType').value = slotInfo.id;
  document.getElementById('foodAddSheet').hidden = false;
  document.getElementById('foodAddBackdrop').hidden = false;
  document.getElementById('mealName').focus();
}

function closeFoodAddSheet() {
  document.getElementById('foodAddSheet').hidden = true;
  document.getElementById('foodAddBackdrop').hidden = true;
  resetFoodAddForm();
}

function compressImage(file, maxW = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setupFoodAddSheet() {
  if (foodAddBound) return;
  foodAddBound = true;

  document.getElementById('foodAddClose').addEventListener('click', closeFoodAddSheet);
  document.getElementById('foodAddBackdrop').addEventListener('click', closeFoodAddSheet);

  document.getElementById('mealPhotoBtn').addEventListener('click', () => {
    document.getElementById('mealPhotoInput').click();
  });

  document.getElementById('mealPhotoInput').addEventListener('change', async () => {
    const file = document.getElementById('mealPhotoInput').files[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      pendingMealPhoto = await compressImage(file);
      const preview = document.getElementById('mealPhotoPreview');
      preview.src = pendingMealPhoto;
      preview.hidden = false;
      document.getElementById('mealPhotoPlaceholder').hidden = true;
    } catch (_) { /* ignore */ }
  });

  document.getElementById('addMealForm').addEventListener('submit', e => {
    e.preventDefault();
    const day = state.selectedMealDay;
    if (!state.meals[day]) state.meals[day] = {};

    const type = document.getElementById('mealType').value;
    const meal = {
      id: 'm' + Date.now(),
      name: document.getElementById('mealName').value.trim(),
      calories: +document.getElementById('mealCalories').value || 0,
      protein: +document.getElementById('mealProtein').value || 0,
      carbs: +document.getElementById('mealCarbs').value || 0,
      fat: +document.getElementById('mealFat').value || 0,
      emoji: '🍽️',
      photo: pendingMealPhoto || null,
    };

    if (!state.meals[day][type]) state.meals[day][type] = [];
    state.meals[day][type].push(meal);
    saveState();
    closeFoodAddSheet();
    renderMeals();
  });
}

/* ── Workout — see workout.js ── */

/* ── Progress Charts ── */

function miniChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    interaction: { intersect: false },
  };
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#a1a1aa' },
        border: { display: false },
      },
      y: {
        grid: { color: '#f4f4f5' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#a1a1aa' },
        border: { display: false },
      },
    },
  };
}

function renderProgress() {
  renderProgressAiPredictions();
  const metrics = state.metrics;
  const labels = metrics.map(m => m.date.slice(5));

  const chartConfigs = [
    { id: 'chartWeight', key: 'weight', label: 'Weight (kg)', color: '#22c55e' },
    { id: 'chartBodyFat', key: 'bodyFat', label: 'Body Fat (%)', color: '#f59e0b' },
    { id: 'chartMuscle', key: 'muscle', label: 'Muscle (kg)', color: '#3b82f6' },
  ];

  chartConfigs.forEach(cfg => {
    const ctx = document.getElementById(cfg.id);
    if (charts[cfg.id]) charts[cfg.id].destroy();
    charts[cfg.id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: cfg.label,
          data: metrics.map(m => m[cfg.key]),
          borderColor: cfg.color,
          backgroundColor: cfg.color + '14',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: cfg.color,
          borderWidth: 2,
        }],
      },
      options: chartOptions(cfg.label),
    });
  });

  const calData = [1920, 2100, 1840, 2050, 1980, 1840, 1760];
  const proData = [135, 148, 128, 142, 138, 128, 120];
  const workoutData = [1, 0, 1, 1, 0, 1, 1];

  ['chartCalories', 'chartProtein'].forEach((id, i) => {
    const ctx = document.getElementById(id);
    if (charts[id]) charts[id].destroy();
    const data = i === 0 ? calData : proData;
    const color = i === 0 ? '#22c55e' : '#3b82f6';
    charts[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data,
          backgroundColor: color + '99',
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: chartOptions(id),
    });
  });

  const ctx = document.getElementById('chartWorkouts');
  if (charts.chartWorkouts) charts.chartWorkouts.destroy();
  charts.chartWorkouts = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        data: [5, 6, 4, 5],
        backgroundColor: '#22c55e99',
        borderRadius: 6,
      }],
    },
    options: chartOptions('Workouts'),
  });
}

/* ── Body Metrics (InBody) ── */

const INBODY_METRICS = [
  { id: 'weight', label: '체중', unit: 'kg', goalKey: 'weight', lowerBetter: true, color: '#22c55e', decimals: 1 },
  { id: 'muscle', label: '골격근량', unit: 'kg', goalKey: 'muscle', lowerBetter: false, color: '#3b82f6', decimals: 1 },
  { id: 'bodyFat', label: '체지방률', unit: '%', goalKey: 'bodyFat', lowerBetter: true, color: '#f59e0b', decimals: 1 },
  { id: 'bmi', label: 'BMI', unit: '', goalKey: 'bmi', lowerBetter: true, color: '#8b5cf6', decimals: 1 },
  { id: 'visceralFat', label: '내장지방', unit: 'Lv', goalKey: 'visceralFat', lowerBetter: true, color: '#ef4444', decimals: 0 },
  { id: 'bmr', label: '기초대사량', unit: 'kcal', goalKey: 'bmr', lowerBetter: false, color: '#06b6d4', decimals: 0 },
];

let inbodyChartMetric = 'weight';
let inbodyFormBound = false;

function calcBMI(weight, height) {
  const h = height / 100;
  return +(weight / (h * h)).toFixed(1);
}

function estimateBmr(weight, height, age) {
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
}

function normalizeMetric(m, height, age = 28) {
  const weight = m.weight ?? 0;
  const bodyFat = m.bodyFat ?? 0;
  return {
    date: m.date,
    weight,
    muscle: m.muscle ?? 0,
    bodyFat,
    bmi: m.bmi ?? (weight ? calcBMI(weight, height) : 0),
    visceralFat: m.visceralFat ?? (m.waist ? Math.min(20, Math.max(1, Math.round((m.waist - 70) / 2.5))) : 0),
    bmr: m.bmr ?? (weight ? estimateBmr(weight, height, age) : 0),
  };
}

function createEmptyMetric(last = {}) {
  return {
    date: today(),
    weight: last.weight ?? 0,
    muscle: last.muscle ?? 0,
    bodyFat: last.bodyFat ?? 0,
    bmi: last.bmi ?? 0,
    visceralFat: last.visceralFat ?? 0,
    bmr: last.bmr ?? 0,
  };
}

function getWeekAgoMetric(metrics) {
  if (!metrics.length) return null;
  const target = new Date(daysAgo(7) + 'T12:00:00').getTime();
  let best = metrics[0];
  let bestDiff = Math.abs(new Date(best.date + 'T12:00:00').getTime() - target);
  for (const m of metrics) {
    const diff = Math.abs(new Date(m.date + 'T12:00:00').getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = m;
    }
  }
  const latest = metrics[metrics.length - 1];
  return best.date === latest.date && metrics.length > 1 ? metrics[metrics.length - 2] : best;
}

function formatMetricValue(value, cfg) {
  if (value == null || value === '') return '—';
  const n = +value;
  if (Number.isNaN(n)) return '—';
  return cfg.decimals ? n.toFixed(cfg.decimals) : Math.round(n).toString();
}

function getWeekChange(current, weekAgo, cfg) {
  if (weekAgo == null || weekAgo[cfg.id] == null) return { text: '—', cls: 'neutral' };
  const diff = current[cfg.id] - weekAgo[cfg.id];
  if (Math.abs(diff) < 0.05) return { text: '변화 없음', cls: 'neutral' };
  const sign = diff > 0 ? '+' : '';
  const text = `${sign}${cfg.decimals ? diff.toFixed(cfg.decimals) : Math.round(diff)}${cfg.unit ? ' ' + cfg.unit : ''}`;
  const isGood = cfg.lowerBetter ? diff < 0 : diff > 0;
  return { text: `지난주 ${text}`, cls: isGood ? 'good' : 'warn' };
}

function getGoalGap(current, goal, cfg, metrics = state.metrics) {
  if (goal == null) return { text: '', pct: 0 };
  const val = current[cfg.id];
  if (val == null) return { text: '', pct: 0 };

  if (cfg.lowerBetter) {
    if (val <= goal) return { text: '목표 달성', pct: 100 };
    const gap = val - goal;
    const start = metrics[0]?.[cfg.id] ?? val;
    const total = Math.max(start - goal, 0.1);
    const done = Math.max(start - val, 0);
    const pct = Math.min(100, Math.round(done / total * 100));
    return {
      text: `목표까지 ${cfg.decimals ? gap.toFixed(cfg.decimals) : Math.round(gap)}${cfg.unit ? ' ' + cfg.unit : ''}`,
      pct: Math.max(0, pct),
    };
  }

  if (val >= goal) return { text: '목표 달성', pct: 100 };
  const gap = goal - val;
  const pct = Math.min(100, Math.round(val / goal * 100));
  return {
    text: `목표까지 ${cfg.decimals ? gap.toFixed(cfg.decimals) : Math.round(gap)}${cfg.unit ? ' ' + cfg.unit : ''}`,
    pct,
  };
}

function renderMetrics() {
  const metrics = state.metrics;
  const latest = metrics[metrics.length - 1];
  const weekAgo = getWeekAgoMetric(metrics);
  const g = state.goals;

  if (!latest) {
    document.getElementById('inbodyHero').innerHTML = '<p class="text-muted">첫 인바디 기록을 추가해 보세요.</p>';
    document.getElementById('inbodyStats').innerHTML = '';
    document.getElementById('inbodyChartTabs').innerHTML = '';
    document.getElementById('metricsTableBody').innerHTML = '';
    return;
  }

  document.getElementById('inbodyHero').innerHTML = `
    <div class="inbody-hero__main">
      <span class="inbody-hero__label">최근 측정 · ${formatShortDate(latest.date)}</span>
      <div class="inbody-hero__weight">
        <span class="inbody-hero__val">${latest.weight}</span>
        <span class="inbody-hero__unit">kg</span>
      </div>
      ${weekAgo ? `<span class="inbody-hero__week ${getWeekChange(latest, weekAgo, INBODY_METRICS[0]).cls}">
        ${getWeekChange(latest, weekAgo, INBODY_METRICS[0]).text}
      </span>` : ''}
    </div>
    <div class="inbody-hero__goal">
      <span class="inbody-hero__goal-label">목표 체중</span>
      <span class="inbody-hero__goal-val">${g.weight} kg</span>
      <span class="inbody-hero__goal-gap">${getGoalGap(latest, g.weight, INBODY_METRICS[0], metrics).text}</span>
    </div>`;

  document.getElementById('inbodyStats').innerHTML = INBODY_METRICS.map(cfg => {
    const week = getWeekChange(latest, weekAgo, cfg);
    const goal = getGoalGap(latest, g[cfg.goalKey], cfg, metrics);
    const display = cfg.id === 'weight'
      ? `${formatMetricValue(latest[cfg.id], cfg)} ${cfg.unit}`
      : cfg.unit === 'kcal'
        ? `${formatMetricValue(latest[cfg.id], cfg)} ${cfg.unit}`
        : cfg.unit === '%'
          ? `${formatMetricValue(latest[cfg.id], cfg)}%`
          : cfg.unit === 'Lv'
            ? `Lv ${formatMetricValue(latest[cfg.id], cfg)}`
            : `${formatMetricValue(latest[cfg.id], cfg)} ${cfg.unit}`;

    return `<article class="inbody-stat">
      <div class="inbody-stat__head">
        <span class="inbody-stat__label">${cfg.label}</span>
        <span class="inbody-stat__week inbody-stat__week--${week.cls}">${week.text.replace('지난주 ', '')}</span>
      </div>
      <div class="inbody-stat__value">${display}</div>
      <div class="inbody-stat__goal">
        <div class="inbody-stat__bar"><div class="inbody-stat__bar-fill" style="width:${goal.pct}%;background:${cfg.color}"></div></div>
        <span class="inbody-stat__goal-text">${goal.text || `목표 ${g[cfg.goalKey]}${cfg.unit ? ' ' + cfg.unit : ''}`}</span>
      </div>
    </article>`;
  }).join('');

  renderInbodyChart(metrics);
  renderInbodyChartTabs();

  const height = state.profile.height;
  document.getElementById('metricsTableBody').innerHTML = [...metrics].reverse().map(m => `
    <tr>
      <td>${formatShortDate(m.date)}</td>
      <td>${m.weight} kg</td>
      <td>${m.muscle} kg</td>
      <td>${m.bodyFat}%</td>
      <td>${m.bmi || calcBMI(m.weight, height)}</td>
      <td>Lv ${m.visceralFat}</td>
      <td>${m.bmr} kcal</td>
    </tr>`).join('');

  prefillInbodyForm(latest);
  setupInbodyForm();
}

function renderInbodyChartTabs() {
  const tabs = document.getElementById('inbodyChartTabs');
  tabs.innerHTML = INBODY_METRICS.map(cfg => `
    <button type="button" class="inbody-chart-tab ${inbodyChartMetric === cfg.id ? 'active' : ''}" data-metric="${cfg.id}">
      ${cfg.label}
    </button>`).join('');

  tabs.querySelectorAll('.inbody-chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      inbodyChartMetric = btn.dataset.metric;
      renderInbodyChartTabs();
      renderInbodyChart(state.metrics);
    });
  });
}

function renderInbodyChart(metrics) {
  const cfg = INBODY_METRICS.find(m => m.id === inbodyChartMetric) || INBODY_METRICS[0];
  const ctx = document.getElementById('chartInbody');
  if (!ctx) return;

  const labels = metrics.map(m => m.date.slice(5).replace('-', '/'));
  const data = metrics.map(m => m[cfg.id]);
  const goal = state.goals[cfg.goalKey];

  if (charts.chartInbody) charts.chartInbody.destroy();
  charts.chartInbody = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: cfg.label,
          data,
          borderColor: cfg.color,
          backgroundColor: cfg.color + '18',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: cfg.color,
          borderWidth: 2.5,
        },
        ...(goal ? [{
          label: '목표',
          data: labels.map(() => goal),
          borderColor: '#a1a1aa',
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        }] : []),
      ],
    },
    options: {
      ...chartOptions(cfg.label),
      plugins: {
        ...chartOptions(cfg.label).plugins,
        legend: { display: false },
        tooltip: {
          ...chartOptions(cfg.label).plugins.tooltip,
          callbacks: {
            label: ctx => {
              const val = cfg.decimals ? ctx.parsed.y.toFixed(cfg.decimals) : Math.round(ctx.parsed.y);
              return ctx.dataset.label === '목표'
                ? `목표 ${val}${cfg.unit ? ' ' + cfg.unit : ''}`
                : `${val}${cfg.unit ? ' ' + cfg.unit : ''}`;
            },
          },
        },
      },
    },
  });
}

function prefillInbodyForm(latest) {
  const todayEntry = state.metrics.find(m => m.date === today());
  const src = todayEntry || latest;
  document.getElementById('inbodyFormDate').textContent = todayEntry ? '오늘 수정 중' : '새 기록';
  document.getElementById('inbodyWeight').value = src.weight || '';
  document.getElementById('inbodyMuscle').value = src.muscle || '';
  document.getElementById('inbodyBodyFat').value = src.bodyFat || '';
  document.getElementById('inbodyBmi').value = src.bmi || '';
  document.getElementById('inbodyVisceral').value = src.visceralFat || '';
  document.getElementById('inbodyBmr').value = src.bmr || '';
}

function setupInbodyForm() {
  if (inbodyFormBound) return;
  inbodyFormBound = true;

  document.getElementById('inbodyWeight').addEventListener('input', e => {
    const bmiInput = document.getElementById('inbodyBmi');
    if (bmiInput.value) return;
    const w = +e.target.value;
    if (w > 0) bmiInput.placeholder = calcBMI(w, state.profile.height);
  });

  document.getElementById('inbodyForm').addEventListener('submit', e => {
    e.preventDefault();
    const last = state.metrics[state.metrics.length - 1] || {};
    let entry = state.metrics.find(m => m.date === today());
    if (!entry) {
      entry = createEmptyMetric(last);
      state.metrics.push(entry);
    }

    const weight = +document.getElementById('inbodyWeight').value;
    entry.weight = weight;
    entry.muscle = +document.getElementById('inbodyMuscle').value || 0;
    entry.bodyFat = +document.getElementById('inbodyBodyFat').value || 0;
    entry.bmi = +document.getElementById('inbodyBmi').value || calcBMI(weight, state.profile.height);
    entry.visceralFat = +document.getElementById('inbodyVisceral').value || 0;
    entry.bmr = +document.getElementById('inbodyBmr').value || 0;

    if (!state.calendarEvents[today()]) state.calendarEvents[today()] = [];
    if (!state.calendarEvents[today()].includes('measure')) state.calendarEvents[today()].push('measure');

    saveState();
    renderMetrics();
  });
}

/* ── Calendar ── */

function renderCalendar() {
  const year = state.calYear;
  const month = state.calMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  document.getElementById('calTitle').textContent =
    firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    html += `<div class="cal-day cal-day--other">${prevMonthDays - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today();
    const isSelected = dateStr === state.selectedCalDay;
    const events = state.calendarEvents[dateStr] || [];

    const dots = events.map(ev => `<span class="cal-dot cal-dot--${ev === 'cheat' ? 'cheat' : ev}"></span>`).join('');

    html += `<div class="cal-day ${isToday ? 'cal-day--today' : ''} ${isSelected ? 'cal-day--selected' : ''}" data-date="${dateStr}">
      ${d}
      ${dots ? `<div class="cal-day__dots">${dots}</div>` : ''}
    </div>`;
  }

  const totalCells = startDow + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day cal-day--other">${i}</div>`;
  }

  document.getElementById('calendarGrid').innerHTML = html;

  document.querySelectorAll('.cal-day[data-date]').forEach(day => {
    day.addEventListener('click', () => {
      state.selectedCalDay = day.dataset.date;
      saveState();
      renderCalendar();
      renderCalDayDetail();
    });
  });

  renderCalDayDetail();
}

function renderCalDayDetail() {
  const date = state.selectedCalDay;
  const events = state.calendarEvents[date] || [];
  const dayMeals = state.meals[date];
  const el = document.getElementById('calDayDetail');

  if (!events.length && !dayMeals) {
    el.innerHTML = `<p class="text-muted">${formatShortDate(date)}</p><p class="text-muted">No events</p>`;
    return;
  }

  let html = `<p style="font-weight:600;margin-bottom:8px">${formatShortDate(date)}</p>`;

  const labels = { workout: '🏋️ Workout', meal: '🍽️ Meals Planned', cheat: '🎉 Cheat Day', measure: '📏 Body Measurement' };
  events.forEach(ev => {
    html += `<div class="cal-detail-item">${labels[ev] || ev}</div>`;
  });

  if (dayMeals) {
    const count = Object.values(dayMeals).flat().length;
    if (count && !events.includes('meal')) {
      html += `<div class="cal-detail-item">🍽️ ${count} meals planned</div>`;
    }
  }

  el.innerHTML = html;
}

document.getElementById('calPrev').addEventListener('click', () => {
  state.calMonth--;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  saveState();
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  state.calMonth++;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  saveState();
  renderCalendar();
});

document.getElementById('markDayForm').addEventListener('submit', e => {
  e.preventDefault();
  const type = document.getElementById('markDayType').value;
  const date = state.selectedCalDay;
  if (!state.calendarEvents[date]) state.calendarEvents[date] = [];
  if (!state.calendarEvents[date].includes(type)) state.calendarEvents[date].push(type);
  saveState();
  renderCalendar();
});

/* ── Shopping List ── */

function generateShoppingFromMeals() {
  const ingredients = new Set();
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  weekDates.forEach(date => {
    const dayMeals = state.meals[date];
    if (!dayMeals) return;
    Object.values(dayMeals).flat().forEach(meal => {
      (meal.ingredients || []).forEach(ing => ingredients.add(ing));
    });
  });

  const existing = new Set(state.shoppingList.map(s => s.name.toLowerCase()));
  ingredients.forEach(ing => {
    if (!existing.has(ing.toLowerCase())) {
      state.shoppingList.push({ id: 's' + Date.now() + Math.random(), name: ing, checked: false, source: 'meals' });
    }
  });

  saveState();
}

function renderShopping() {
  const list = document.getElementById('shoppingList');
  list.innerHTML = state.shoppingList.length
    ? state.shoppingList.map(item => `
      <li class="shopping-item ${item.checked ? 'shopping-item--checked' : ''}" data-id="${item.id}">
        <span class="shopping-item__check">${item.checked ? '<svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}</span>
        <span class="shopping-item__name">${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}${item.unit ? item.unit : ''}</span>
        <span class="shopping-item__source">${item.source === 'mealplan' ? '식단' : item.source}</span>
        <button class="shopping-item__delete" data-id="${item.id}">✕</button>
      </li>`).join('')
    : '<p class="text-muted">AI에게 "이번 주 식단 짜줘"라고 하면 장보기 리스트가 자동 생성돼요.</p>';

  list.querySelectorAll('.shopping-item').forEach(item => {
    item.querySelector('.shopping-item__check').addEventListener('click', () => {
      const s = state.shoppingList.find(x => x.id === item.dataset.id);
      if (s) { s.checked = !s.checked; saveState(); renderShopping(); }
    });
    item.querySelector('.shopping-item__delete')?.addEventListener('click', () => {
      state.shoppingList = state.shoppingList.filter(x => x.id !== item.dataset.id);
      saveState();
      renderShopping();
    });
  });

  const total = state.shoppingList.length;
  const checked = state.shoppingList.filter(s => s.checked).length;
  document.getElementById('shoppingSummary').innerHTML = `
    <div class="shopping-summary__row"><span>Total items</span><span>${total}</span></div>
    <div class="shopping-summary__row"><span>Checked off</span><span>${checked}</span></div>
    <div class="shopping-summary__row"><span>Remaining</span><span>${total - checked}</span></div>`;
}

document.getElementById('regenerateList').addEventListener('click', () => {
  generateShoppingFromMeals();
  renderShopping();
});

document.getElementById('clearChecked').addEventListener('click', () => {
  state.shoppingList = state.shoppingList.filter(s => !s.checked);
  saveState();
  renderShopping();
});

document.getElementById('addShoppingForm').addEventListener('submit', e => {
  e.preventDefault();
  state.shoppingList.push({
    id: 's' + Date.now(),
    name: document.getElementById('shoppingItem').value,
    checked: false,
    source: 'manual',
  });
  saveState();
  e.target.reset();
  renderShopping();
});

/* ── AI Features ── */

function renderInsightCard(insight) {
  return `<div class="ai-insight ai-insight--${insight.type || 'tip'}">
    <div class="ai-insight__icon">${insight.icon}</div>
    <div class="ai-insight__title">${insight.title}</div>
    <div class="ai-insight__body">${insight.body}</div>
  </div>`;
}

function renderMealRecCard(rec, showAdd = false, index = 0) {
  return `<div class="ai-rec-card">
    <div class="ai-rec-card__top">
      <span class="ai-rec-card__emoji">${rec.emoji}</span>
      <span class="ai-rec-card__name">${rec.name}</span>
      <span class="ai-rec-card__meta">${rec.calories} cal</span>
    </div>
    <p class="ai-rec-card__reason">${rec.reason}</p>
    <div class="ai-rec-card__tags">
      <span class="ai-rec-tag">${rec.protein}g protein</span>
      <span class="ai-rec-tag">${rec.carbs}g carbs</span>
      ${rec.fitsBudget !== false ? '<span class="ai-rec-tag">Fits today</span>' : ''}
    </div>
    ${showAdd ? `<button class="btn btn--secondary btn--sm btn--full ai-add-meal" style="margin-top:8px" data-rec-idx="${index}">Add to ${rec.slot || 'plan'}</button>` : ''}
  </div>`;
}

function bindMealRecButtons(container, recs) {
  container.querySelectorAll('.ai-add-meal').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = recs[+btn.dataset.recIdx];
      if (rec) addMealFromAi(rec);
    });
  });
}

function renderWorkoutSuggestionCard(s, showStart = false) {
  return `<div class="ai-workout-card ${s.priority === 'high' ? 'ai-workout-card--priority' : ''}">
    <div class="ai-workout-card__header">
      <span class="ai-workout-card__title">${s.title}</span>
      <span class="ai-workout-card__duration">${s.duration}</span>
    </div>
    <p class="ai-workout-card__reason">${s.reason}</p>
    <div class="ai-workout-card__exercises">
      ${s.exercises.map(e => `<span class="ai-rec-tag ${s.priority === 'high' ? 'ai-rec-tag--high' : ''}">${e}</span>`).join('')}
    </div>
    ${showStart && s.routineId ? `<button class="btn btn--primary btn--sm btn--full ai-start-routine" style="margin-top:10px" data-routine="${s.routineId}">Start this workout</button>` : ''}
  </div>`;
}

function renderPredictionsBlock(preds) {
  return `
    <div class="ai-prediction">
      <div class="ai-prediction__header">
        <span class="ai-prediction__label">⚖️ Weight</span>
        ${preds.weight.weeks ? `<span class="ai-prediction__score">~${preds.weight.weeks} wks to goal</span>` : ''}
      </div>
      <p class="ai-prediction__text">${preds.weight.text}</p>
    </div>
    <div class="ai-prediction">
      <div class="ai-prediction__header">
        <span class="ai-prediction__label">🏋️ Fitness</span>
        ${preds.fitness.score != null ? `<span class="ai-prediction__score">${preds.fitness.score}/100</span>` : ''}
      </div>
      <p class="ai-prediction__text">${preds.fitness.text}</p>
    </div>
    <div class="ai-prediction">
      <div class="ai-prediction__header">
        <span class="ai-prediction__label">🍽️ Nutrition</span>
        ${preds.nutrition.score != null ? `<span class="ai-prediction__score">${preds.nutrition.score}/100</span>` : ''}
      </div>
      <p class="ai-prediction__text">${preds.nutrition.text}</p>
    </div>`;
}

function renderAI() {
  const coach = FitSpaceAI.getDailyCoach(state);
  const weekly = FitSpaceAI.getWeeklyReview(state);
  const workouts = FitSpaceAI.getWorkoutSuggestions(state);
  const meals = FitSpaceAI.getMealRecommendations(state);
  const preds = FitSpaceAI.getProgressPredictions(state);

  document.getElementById('aiDailyCoach').innerHTML = `
    <p class="ai-coach-hero__greeting">Your daily coach</p>
    <p class="ai-coach-hero__headline">${coach.headline}</p>
    <p class="ai-coach-hero__sub">${coach.subline}</p>`;

  document.getElementById('aiInsightsGrid').innerHTML =
    coach.insights.map(renderInsightCard).join('') ||
    '<p class="text-muted">You\'re all caught up today. Enjoy the momentum!</p>';

  document.getElementById('aiMealRecs').innerHTML =
    meals.map((r, i) => renderMealRecCard(r, true, i)).join('') ||
    '<p class="text-muted">All meal slots look planned. Nice work!</p>';

  document.getElementById('aiWorkoutRecs').innerHTML =
    workouts.map(s => renderWorkoutSuggestionCard(s, true)).join('');

  document.getElementById('aiPredictions').innerHTML = renderPredictionsBlock(preds);

  document.getElementById('aiWeeklyReview').innerHTML = `
    <div class="ai-weekly-stat">
      <span>Workouts this week</span>
      <div class="ai-weekly-stat__bar"><div class="ai-weekly-stat__fill" style="width:${weekly.workoutPct}%"></div></div>
      <span>${weekly.workouts}/${weekly.workoutGoal}</span>
    </div>
    <p class="ai-weekly-review__summary">${weekly.summary}</p>
    <div class="ai-weekly-review__cols">
      <div class="ai-weekly-review__col">
        <h4>Highlights</h4>
        <ul>${weekly.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
      <div class="ai-weekly-review__col">
        <h4>Next week focus</h4>
        <ul>${weekly.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
    </div>`;

  setupPhotoUpload('aiPhotoInput', 'aiPhotoZone', 'aiPhotoResult');

  bindMealRecButtons(document.getElementById('aiMealRecs'), meals);

  document.querySelectorAll('.ai-start-routine').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeRoutineId = btn.dataset.routine;
      saveState();
      navigate('workout');
      FitSpaceWorkout.startWorkoutSession();
    });
  });
}

function renderMealAiRecommendations() {
  const el = document.getElementById('mealAiRecommendations');
  if (!el) return;
  const meals = FitSpaceAI.getMealRecommendations(state);
  el.innerHTML = meals.length
    ? meals.map((r, i) => renderMealRecCard(r, true, i)).join('')
    : '<p class="text-muted">Meals look planned for now.</p>';

  bindMealRecButtons(el, meals);
}

function renderProgressAiPredictions() {
  const el = document.getElementById('progressAiPredictions');
  if (!el) return;
  const preds = FitSpaceAI.getProgressPredictions(state);
  el.innerHTML = `
    <h3 class="card__title">✨ AI Progress Insights</h3>
    <div class="ai-predictions-banner__grid">${renderPredictionsBlock(preds)}</div>`;
}

function addMealFromAi(rec) {
  const day = state.selectedMealDay || today();
  if (!state.meals[day]) state.meals[day] = {};
  const slot = rec.slot || 'lunch';
  if (!state.meals[day][slot]) state.meals[day][slot] = [];

  state.meals[day][slot].push({
    id: 'm' + Date.now(),
    name: rec.name,
    calories: rec.calories,
    protein: rec.protein,
    carbs: rec.carbs || 0,
    fat: rec.fat || 0,
    emoji: rec.emoji || '🍽️',
    photo: rec.photo || null,
    ingredients: rec.ingredients || [],
  });
  saveState();
  renderMeals();
}

function setupPhotoUpload(inputId, zoneId, resultId) {
  const input = document.getElementById(inputId);
  const zone = document.getElementById(zoneId);
  const result = document.getElementById(resultId);
  if (!input || !zone || zone.dataset.bound) return;
  zone.dataset.bound = '1';

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('photo-upload__zone--drag');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('photo-upload__zone--drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('photo-upload__zone--drag');
    if (e.dataTransfer.files[0]) handleMealPhoto(e.dataTransfer.files[0], result, zone);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleMealPhoto(input.files[0], result, zone);
  });
}

async function handleMealPhoto(file, resultEl, zoneEl) {
  if (!file.type.startsWith('image/')) return;

  const previewUrl = URL.createObjectURL(file);
  resultEl.hidden = false;
  resultEl.innerHTML = `<div class="photo-loading">
    <div class="photo-loading__dots">
      <span class="photo-loading__dot"></span>
      <span class="photo-loading__dot"></span>
      <span class="photo-loading__dot"></span>
    </div>
    Analyzing your meal...
  </div>`;
  zoneEl.style.display = 'none';

  try {
    const analysis = await FitSpaceAI.analyzeMealPhoto(file, state);
    resultEl.innerHTML = `
      <div class="photo-result">
        <img class="photo-result__img" src="${previewUrl}" alt="Meal photo" />
        <div class="photo-result__name">${analysis.emoji} ${analysis.name}</div>
        <div class="photo-result__macros">
          <span class="photo-result__macro">${analysis.calories} cal</span>
          <span class="photo-result__macro">${analysis.protein}g protein</span>
          <span class="photo-result__macro">${analysis.carbs}g carbs</span>
          <span class="photo-result__macro">${analysis.fat}g fat</span>
        </div>
        <p class="photo-result__insight">${analysis.insight}</p>
        <div class="photo-result__actions">
          <button class="btn btn--primary btn--sm photo-add-meal">Add to plan</button>
          <button class="btn btn--ghost btn--sm photo-retry">Try another</button>
        </div>
      </div>`;

    resultEl.querySelector('.photo-add-meal').addEventListener('click', async () => {
      const slot = (() => {
        const h = new Date().getHours();
        if (h < 11) return 'breakfast';
        if (h < 15) return 'lunch';
        if (h < 21) return 'dinner';
        return 'snack';
      })();
      let photoData = null;
      try { photoData = await compressImage(file); } catch (_) { /* ignore */ }
      addMealFromAi({ ...analysis, slot, photo: photoData });
      resultEl.hidden = true;
      zoneEl.style.display = '';
      URL.revokeObjectURL(previewUrl);
    });

    resultEl.querySelector('.photo-retry').addEventListener('click', () => {
      resultEl.hidden = true;
      zoneEl.style.display = '';
      URL.revokeObjectURL(previewUrl);
    });
  } catch (_) {
    resultEl.innerHTML = `<p class="text-muted">Couldn't analyze that photo. Try another angle with good lighting.</p>
      <button class="btn btn--ghost btn--sm photo-retry" style="margin-top:8px">Try again</button>`;
    resultEl.querySelector('.photo-retry').addEventListener('click', () => {
      resultEl.hidden = true;
      zoneEl.style.display = '';
    });
  }
}

/* ── Settings ── */

function renderSettings() {
  const hp = state.healthProfile || {};
  document.getElementById('settingsName').value = state.profile.name;
  document.getElementById('settingsHeight').value = state.profile.height;
  document.getElementById('settingsAge').value = state.profile.age;
  document.getElementById('hpCurrentWeight').value = hp.currentWeight ?? '';
  document.getElementById('hpHousehold').value = hp.householdSize ?? 1;
  document.getElementById('hpBudget').value = hp.budgetWeekly ?? '';
  document.getElementById('hpDiningOut').value = hp.diningOutPerWeek ?? 0;
  document.getElementById('hpAllergies').value = (hp.allergies || []).join(', ');
  document.getElementById('hpPreferred').value = (hp.preferredFoods || []).join(', ');
  document.getElementById('hpDisliked').value = (hp.dislikedFoods || []).join(', ');
  document.getElementById('hpStaples').value = (hp.stapleIngredients || []).join(', ');
  document.getElementById('goalCalories').value = state.goals.calories;
  document.getElementById('goalProtein').value = state.goals.protein;
  document.getElementById('goalWater').value = state.goals.water;
  document.getElementById('goalWaterLiters').value = state.goals.waterLiters ?? 2;
  document.getElementById('goalSteps').value = state.goals.steps;
  document.getElementById('goalSleepHours').value = state.goals.sleepHours ?? 7;
  document.getElementById('goalWeight').value = state.goals.weight;
  document.getElementById('goalBodyFat').value = state.goals.bodyFat ?? 18;
  document.getElementById('goalMuscle').value = state.goals.muscle ?? 36;
  document.getElementById('goalBmi').value = state.goals.bmi ?? 23;
  document.getElementById('goalVisceral').value = state.goals.visceralFat ?? 6;
  document.getElementById('goalBmr').value = state.goals.bmr ?? 1680;
  document.getElementById('goalWorkouts').value = state.goals.workouts;
  if (!state.ai) state.ai = { apiKey: '' };
  document.getElementById('aiApiKey').value = state.ai.apiKey || '';

  if (typeof FitSpaceAIMemory !== 'undefined') {
    FitSpaceAIMemory.renderMemorySettings('aiMemorySettings');
    FitSpaceAIMemory.renderHealthIntegrations('healthIntegrations');
  }
}

document.getElementById('settingsProfileForm').addEventListener('submit', e => {
  e.preventDefault();
  state.profile.name = document.getElementById('settingsName').value;
  state.profile.height = +document.getElementById('settingsHeight').value;
  state.profile.age = +document.getElementById('settingsAge').value;
  saveState();
  document.getElementById('userName').textContent = state.profile.name;
  document.querySelector('.sidebar__avatar').textContent = state.profile.name.charAt(0);
});

document.getElementById('settingsHealthForm').addEventListener('submit', e => {
  e.preventDefault();
  const split = id => document.getElementById(id).value.split(',').map(s => s.trim()).filter(Boolean);
  state.healthProfile = {
    ...state.healthProfile,
    currentWeight: +document.getElementById('hpCurrentWeight').value,
    householdSize: +document.getElementById('hpHousehold').value,
    budgetWeekly: +document.getElementById('hpBudget').value,
    diningOutPerWeek: +document.getElementById('hpDiningOut').value,
    allergies: split('hpAllergies'),
    preferredFoods: split('hpPreferred'),
    dislikedFoods: split('hpDisliked'),
    stapleIngredients: split('hpStaples'),
    targetWeight: state.goals.weight,
  };
  if (typeof FitSpaceAIMemory !== 'undefined') FitSpaceAIMemory.rebuildFromAppData(state);
  saveState();
});

document.getElementById('settingsGoalsForm').addEventListener('submit', e => {
  e.preventDefault();
  state.goals.calories = +document.getElementById('goalCalories').value;
  state.goals.protein = +document.getElementById('goalProtein').value;
  state.goals.water = +document.getElementById('goalWater').value;
  state.goals.waterLiters = +document.getElementById('goalWaterLiters').value;
  state.goals.steps = +document.getElementById('goalSteps').value;
  state.goals.sleepHours = +document.getElementById('goalSleepHours').value;
  state.goals.weight = +document.getElementById('goalWeight').value;
  state.goals.bodyFat = +document.getElementById('goalBodyFat').value;
  state.goals.muscle = +document.getElementById('goalMuscle').value;
  state.goals.bmi = +document.getElementById('goalBmi').value;
  state.goals.visceralFat = +document.getElementById('goalVisceral').value;
  state.goals.bmr = +document.getElementById('goalBmr').value;
  state.goals.workouts = +document.getElementById('goalWorkouts').value;
  saveState();
});

document.getElementById('settingsAiForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.ai) state.ai = {};
  state.ai.apiKey = document.getElementById('aiApiKey').value.trim();
  saveState();
});

document.getElementById('exportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fitspace-export.json';
  a.click();
});

document.getElementById('resetData').addEventListener('click', () => {
  if (confirm('Reset all data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

/* ── Modal ── */

function showModal(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalOverlay').hidden = false;
}

function hideModal() {
  document.getElementById('modalOverlay').hidden = true;
}

document.getElementById('modalClose').addEventListener('click', hideModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) hideModal();
});

/* ── Init ── */

window.state = state;
window.saveState = saveState;
window.today = today;
window.navigate = navigate;
window.getTodayChecklist = getTodayChecklist;
window.formatShortDate = formatShortDate;
window.showModal = showModal;
window.hideModal = hideModal;

FitSpaceWorkout.initWorkout();
FitSpaceGrowth.init();
if (typeof FitSpaceAIMemory !== 'undefined') FitSpaceAIMemory.migrate(state);

const initialView = location.hash.slice(1) || 'chat';
navigate(initialView);

document.getElementById('userName').textContent = state.profile.name;
document.querySelector('.sidebar__avatar').textContent = state.profile.name.charAt(0);
