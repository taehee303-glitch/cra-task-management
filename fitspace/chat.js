/* FitSpace AI Chat — conversational health assistant */

const FitSpaceChat = (() => {
  const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
  const SLOTS = ['breakfast', 'lunch', 'dinner'];
  const SLOT_KO = { breakfast: '아침', lunch: '점심', dinner: '저녁' };

  const MEAL_POOL = {
    breakfast: [
      { name: '그릭 요거트 & 베리', calories: 320, protein: 24, carbs: 38, fat: 8, emoji: '🫐', ingredients: ['그릭요거트', '블루베리', '그래놀라'] },
      { name: '계란 스크램블 & 통밀토스트', calories: 380, protein: 28, carbs: 32, fat: 14, emoji: '🍳', ingredients: ['계란', '통밀빵', '시금치'] },
      { name: '단백질 오트밀', calories: 350, protein: 30, carbs: 42, fat: 9, emoji: '🥣', ingredients: ['오트밀', '프로틴파우더', '바나나'] },
    ],
    lunch: [
      { name: '닭가슴살 샐러드', calories: 420, protein: 42, carbs: 18, fat: 16, emoji: '🥗', ingredients: ['닭가슴살', '믹스그린', '방울토마토', '올리브오일'] },
      { name: '연어 덮밥', calories: 520, protein: 38, carbs: 48, fat: 18, emoji: '🐟', ingredients: ['연어', '현미', '김', '간장'] },
      { name: '두부 채소 볶음 & 밥', calories: 450, protein: 22, carbs: 52, fat: 14, emoji: '🍛', ingredients: ['두부', '브로콜리', '당근', '현미'] },
    ],
    dinner: [
      { name: '소고기 야채 볶음', calories: 480, protein: 36, carbs: 28, fat: 22, emoji: '🥩', ingredients: ['소고기', '파프리카', '양파', '현미'] },
      { name: '닭다리살 구이 & 구운 채소', calories: 510, protein: 40, carbs: 22, fat: 26, emoji: '🍗', ingredients: ['닭다리살', '아스파라거스', '버섯'] },
      { name: '새우 토마토 파스타', calories: 460, protein: 28, carbs: 55, fat: 14, emoji: '🍝', ingredients: ['새우', '파스타', '토마토', '마늘'] },
    ],
    diningOut: [
      { name: '외식 — 샐러드 & 단백질 메인', calories: 580, protein: 38, carbs: 32, fat: 28, emoji: '🍽️', ingredients: ['외식'], diningOut: true },
      { name: '외식 — 회 또는 구이', calories: 620, protein: 42, carbs: 40, fat: 30, emoji: '🍣', ingredients: ['외식'], diningOut: true },
    ],
    protein: [
      { name: '닭가슴살 200g & 현미', calories: 480, protein: 52, carbs: 38, fat: 8, emoji: '🥩', ingredients: ['닭가슴살', '현미'] },
      { name: '연어 180g & 채소', calories: 520, protein: 45, carbs: 12, fat: 28, emoji: '🐟', ingredients: ['연어', '브로콜리'] },
      { name: '두부 300g & 샐러드', calories: 380, protein: 32, carbs: 18, fat: 16, emoji: '🥗', ingredients: ['두부', '믹스그린'] },
    ],
  };

  function firstName(state) {
    return (state.profile?.name || '회원').split(' ')[0];
  }

  function getMealTotals(meals) {
    let cal = 0, pro = 0;
    Object.values(meals || {}).flat().forEach(m => {
      cal += m.calories || 0;
      pro += m.protein || 0;
    });
    return { cal, pro };
  }

  function parseSleepHours(str) {
    if (!str) return 0;
    const h = str.match(/(\d+)h/);
    const m = str.match(/(\d+)m/);
    return (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
  }

  function getMissionProgress(state) {
    const d = new Date().toISOString().split('T')[0];
    const cl = state.dailyChecklists?.[d] || {};
    const ids = ['water', 'protein', 'workout', 'steps', 'sleep', 'vitamins'];
    const done = ids.filter(id => cl[id]).length;
    return { done, total: ids.length, pct: Math.round(done / ids.length * 100), cl };
  }

  function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  function pickMeal(pool, avoid = []) {
    const options = pool.filter(m => !avoid.some(a => m.name.includes(a)));
    return options[Math.floor(Math.random() * options.length)] || pool[0];
  }

  function parseMealPlanOptions(text, state) {
    const hp = state.healthProfile || {};
    const opts = {
      householdSize: hp.householdSize || 1,
      budget: hp.budgetWeekly || 80000,
      diningOut: hp.diningOutPerWeek || 0,
      proteinFocus: false,
      forTwo: false,
    };
    const t = text.toLowerCase();
    const budgetMatch = text.match(/(\d+)\s*만\s*원/);
    if (budgetMatch) opts.budget = +budgetMatch[1] * 10000;
    const budgetMatch2 = text.match(/예산\s*(\d+)/);
    if (budgetMatch2) opts.budget = +budgetMatch2[1];

    const outMatch = text.match(/외식\s*(\d+)/);
    if (outMatch) opts.diningOut = +outMatch[1];
    else if (/외식/.test(text)) opts.diningOut = Math.max(opts.diningOut, 1);

    const peopleMatch = text.match(/(\d)\s*인\s*식단/);
    if (peopleMatch) opts.householdSize = +peopleMatch[1];
    if (/남자친구|여자친구|같이|함께|2인|둘이/.test(text)) {
      opts.householdSize = 2;
      opts.forTwo = true;
    }
    if (/단백질/.test(text)) opts.proteinFocus = true;
    return opts;
  }

  function generateWeeklyMealPlan(state, options = {}) {
    const hp = state.healthProfile || {};
    const g = state.goals || {};
    const avoid = hp.dislikedFoods || [];
    const prefer = hp.preferredFoods || [];
    const weekStart = getWeekStart();
    const diningDays = new Set();
    let diningLeft = options.diningOut ?? hp.diningOutPerWeek ?? 0;
    while (diningLeft > 0 && diningDays.size < 7) {
      diningDays.add(Math.floor(Math.random() * 7));
      diningLeft--;
    }

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const isDining = diningDays.has(i);
      const meals = {};
      SLOTS.forEach(slot => {
        let pool = MEAL_POOL[slot];
        if (options.proteinFocus || /단백질/.test(prefer.join(''))) pool = MEAL_POOL.protein.length ? [...pool, ...MEAL_POOL.protein] : pool;
        if (isDining && slot === 'dinner') pool = MEAL_POOL.diningOut;
        const meal = { ...pickMeal(pool, avoid), id: 'mp' + Date.now() + i + slot };
        if (options.householdSize > 1) {
          meal.servings = options.householdSize;
          meal.note = `${options.householdSize}인분`;
        }
        meals[slot] = meal;
      });
      days.push({ date, dayLabel: DAY_LABELS[i], meals, isDining });
    }

    const totalCal = days.reduce((s, d) =>
      s + SLOTS.reduce((ss, sl) => ss + (d.meals[sl]?.calories || 0), 0), 0);
    const avgPro = Math.round(days.reduce((s, d) =>
      s + SLOTS.reduce((ss, sl) => ss + (d.meals[sl]?.protein || 0), 0), 0) / 7);

    return {
      weekStart,
      days,
      options,
      summary: {
        avgCalories: Math.round(totalCal / 7),
        avgProtein: avgPro,
        budget: options.budget,
        householdSize: options.householdSize,
        diningOutDays: diningDays.size,
        goalCalories: g.calories,
        goalProtein: g.protein,
      },
    };
  }

  function formatMealPlanText(plan) {
    let text = `이번 주 식단을 ${plan.options.householdSize}인 기준으로 짰어요.\n`;
    if (plan.options.budget) text += `예산 약 ${(plan.options.budget / 10000).toFixed(0)}만원, 외식 ${plan.summary.diningOutDays}회 반영.\n`;
    text += `하루 평균 ${plan.summary.avgCalories}kcal · 단백질 ${plan.summary.avgProtein}g\n\n`;

    plan.days.forEach(day => {
      text += `**${day.dayLabel}요일**${day.isDining ? ' 🍽️' : ''}\n`;
      SLOTS.forEach(slot => {
        const m = day.meals[slot];
        text += `  ${SLOT_KO[slot]}: ${m.emoji} ${m.name} (${m.calories}kcal, P${m.protein}g)\n`;
      });
      text += '\n';
    });
    text += '마음에 들면 아래 **캘린더에 저장**을 눌러주세요. 장보기 리스트도 자동으로 만들어 드릴게요.';
    return text;
  }

  function getProactiveMessage(state) {
    if (typeof FitSpaceAIMemory !== 'undefined') {
      const msgs = FitSpaceAIMemory.getSmartCoachMessages(state);
      if (msgs.length) return msgs[0];
    }
    const name = firstName(state);
    const g = state.goals || {};
    const d = new Date().toISOString().split('T')[0];
    const meals = state.meals?.[d] || {};
    const totals = getMealTotals(meals);
    const { pct, cl } = getMissionProgress(state);
    const waterL = (state.daily?.water || 0) * 0.25;
    const waterGoal = g.waterLiters || 2;
    const messages = [];

    if (pct === 100) {
      return `${name}님, 오늘 미션 100% 달성! 정말 멋진 하루예요. 내일도 이 페이스 유지해봐요. 🌟`;
    }

    const proGap = g.protein - totals.pro;
    if (proGap > 0 && proGap <= 40) {
      messages.push(`오늘 단백질이 ${proGap}g 부족해요. 저녁에 닭가슴살이나 두부 어때요?`);
    } else if (proGap > 40) {
      messages.push(`단백질 ${totals.pro}g / ${g.protein}g — ${proGap}g 더 필요해요.`);
    }

    const waterGap = waterGoal - waterL;
    if (waterGap > 0.2) {
      messages.push(`물을 ${Math.round(waterGap * 1000)}mL만 더 마시면 수분 목표 달성!`);
    }

    if (!cl.workout && !state.daily?.workoutDone) {
      const left = getMissionProgress(state).total - getMissionProgress(state).done;
      messages.push(`운동까지 완료하면 오늘 미션 ${left}개만 더 채우면 돼요.`);
    } else if (!cl.workout && state.daily?.workoutDone === false && new Date().getHours() >= 18) {
      messages.push('오늘 운동 아직이에요. 짧은 산책이라도 어때요?');
    }

    if (messages.length === 0) {
      return `${name}님, 오늘 진행률 ${pct}%. 편하게 말 걸어주세요 — "오늘 외식이 있어"처럼요.`;
    }
    return `${name}님, ${messages[0]}`;
  }

  function getWelcomeMessage(state) {
    const name = firstName(state);
    const hour = new Date().getHours();
    const greet = hour < 12 ? '좋은 아침' : hour < 18 ? '좋은 오후' : '좋은 저녁';
    return `${greet}이에요, ${name}님! 저는 ${name}님의 **AI Health Companion**이에요.\n\n기억하고 있는 정보를 바탕으로 식단·운동·건강을 함께 관리해요. 매번 처음부터 묻지 않아요.\n\n예: "이번 주 식단 짜줘", "오늘 운동 못 했어", "이번 달 운동 어땠어?", "타임라인 보여줘"`;
  }

  function detectIntent(text) {
    const t = text.trim();
    if (/인바디|체지방|골격근/.test(t)) return 'inbody';
    if (/이번\s*달\s*운동|운동\s*어땠|월간\s*운동/.test(t)) return 'monthly_workout';
    if (/타임라인|1년|성장\s*여정|과거\s*비교/.test(t)) return 'timeline';
    if (/기억|내\s*정보|알고\s*있/.test(t)) return 'memory_recall';
    if (/주간|이번\s*주|식단\s*짜|식단\s*만들|meal\s*plan/i.test(t)) return 'meal_plan';
    if (/외식|나가서\s*먹|회식/.test(t)) return 'dining_out';
    if (/단백질|프로틴|protein/i.test(t) && /추천|식단|메뉴/.test(t)) return 'protein_meals';
    if (/운동\s*못|운동\s*안|못\s*했/.test(t)) return 'workout_missed';
    if (/주간\s*리뷰|이번\s*주\s*리뷰|리포트|weekly/i.test(t)) return 'weekly_review';
    if (/장보기|쇼핑|재료/.test(t)) return 'shopping';
    if (/미션|목표|오늘\s*뭐/.test(t)) return 'today_status';
    if (/안녕|hello|hi/i.test(t)) return 'greeting';
    return 'general';
  }

  function getWeeklyReviewText(state) {
    if (typeof FitSpaceAI !== 'undefined' && FitSpaceAI.getWeeklyReview) {
      const w = FitSpaceAI.getWeeklyReview(state);
      const wt = state.metrics?.length >= 2
        ? state.metrics[state.metrics.length - 1].weight - state.metrics[state.metrics.length - 2].weight
        : 0;
      const bf = state.metrics?.length >= 2
        ? (state.metrics[state.metrics.length - 1].bodyFat - state.metrics[state.metrics.length - 2].bodyFat).toFixed(1)
        : 0;

      let text = `📊 **이번 주 건강 리포트**\n\n`;
      text += `⚖️ 체중: ${wt >= 0 ? '+' : ''}${wt.toFixed(1)}kg\n`;
      text += `📉 체지방: ${bf >= 0 ? '+' : ''}${bf}%\n`;
      text += `🏋️ 운동: ${w.workouts}/${w.workoutGoal}회\n\n`;
      text += `**잘한 점**\n${w.highlights.map(h => `• ${h}`).join('\n')}\n\n`;
      text += `**아쉬운 점**\n${w.improvements.slice(0, 2).map(i => `• ${i}`).join('\n')}\n\n`;
      text += `**다음 주 추천**\n${w.improvements.slice(-1)[0] || '현재 페이스를 유지하세요.'}\n\n`;
      text += w.summary;
      return text;
    }
    return '이번 주 데이터를 더 모으면 상세 리포트를 드릴게요.';
  }

  async function processMessage(text, state, file = null) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

    if (typeof FitSpaceAIMemory !== 'undefined') {
      FitSpaceAIMemory.extractFromChat(text);
    }

    if (file) {
      const analysis = await FitSpaceAI.analyzeMealPhoto(file, state);
      return {
        text: `${analysis.emoji} **${analysis.name}**으로 보여요.\n\n예상 영양: ${analysis.calories}kcal · 단백질 ${analysis.protein}g · 탄수 ${analysis.carbs}g · 지방 ${analysis.fat}g\n\n${analysis.insight || ''}\n\n수정이 필요하면 알려주시고, 맞으면 **저장**을 눌러주세요.`,
        card: { type: 'food_analysis', data: analysis, previewUrl: URL.createObjectURL(file) },
      };
    }

    const intent = detectIntent(text);
    const name = firstName(state);
    const opts = parseMealPlanOptions(text, state);

    switch (intent) {
      case 'meal_plan': {
        const plan = generateWeeklyMealPlan(state, opts);
        const memHint = state.healthProfile?.householdSize > 1
          ? `\n\n💡 ${state.healthProfile.householdSize}인 식단으로 기억하고 있어요.`
          : '';
        return {
          text: formatMealPlanText(plan) + memHint,
          card: { type: 'meal_plan', data: plan },
          memoryUpdate: opts.forTwo ? { householdSize: 2 } : null,
        };
      }
      case 'dining_out': {
        const hp = state.healthProfile || {};
        hp.diningOutPerWeek = (hp.diningOutPerWeek || 0) + 1;
        return {
          text: `알겠어요! 외식 일정 반영할게요.\n\n외식 날은 **단백질 위주·기름 적은 메뉴**를 추천해요:\n• 샐러드 + 구운 닭/연어\n• 회 또는 초밥 (밥량 조절)\n• 국물 적은 구이/찜\n\n"이번 주 식단 짜줘"라고 하시면 외식 ${hp.diningOutPerWeek}회 포함해서 다시 짜 드릴게요.`,
          memoryUpdate: { diningOutPerWeek: hp.diningOutPerWeek },
        };
      }
      case 'protein_meals': {
        const plan = generateWeeklyMealPlan(state, { ...opts, proteinFocus: true });
        return {
          text: `단백질 목표 ${state.goals?.protein || 130}g에 맞춰 이번 주 식단을 구성했어요.\n\n` + formatMealPlanText(plan),
          card: { type: 'meal_plan', data: plan },
        };
      }
      case 'workout_missed': {
        const routine = state.routines?.find(r => r.id === state.activeRoutineId);
        return {
          text: `괜찮아요, ${name}님! 하루 쉬는 것도 회복의 일부예요.\n\n• 오늘은 가벼운 산책 20분\n• 단백질 섭취 유지\n• 내일 ${routine?.name || '루틴'} 가볍게 재개\n\n혼내지 않을게요 — 내일 다시 함께해요. 💚`,
        };
      }
      case 'weekly_review':
        return { text: getWeeklyReviewText(state) };
      case 'inbody':
        return {
          text: typeof FitSpaceAIMemory !== 'undefined'
            ? FitSpaceAIMemory.getInbodyResponse(state)
            : '체중 관리 탭에서 인바디를 기록해 주세요.',
          actions: [{ label: '체중 관리', action: 'navigate', target: 'metrics' }],
        };
      case 'monthly_workout':
        return {
          text: typeof FitSpaceAIMemory !== 'undefined'
            ? FitSpaceAIMemory.getMonthlyWorkoutReview(state)
            : getWeeklyReviewText(state),
          actions: [{ label: '성장 대시보드', action: 'navigate', target: 'growth' }],
        };
      case 'timeline':
        if (typeof FitSpaceAIMemory !== 'undefined') {
          const tl = FitSpaceAIMemory.getTimeline(state);
          return { text: FitSpaceAIMemory.formatTimelineText(tl) };
        }
        return { text: '기록이 더 쌓이면 타임라인을 보여드릴게요.' };
      case 'memory_recall': {
        if (typeof FitSpaceAIMemory === 'undefined') {
          return { text: '아직 기억된 정보가 없어요.' };
        }
        FitSpaceAIMemory.rebuildFromAppData(state);
        const facts = state.aiMemory?.facts?.filter(f =>
          !state.aiMemory.disabledKeys?.includes(f.id)) || [];
        const name = firstName(state);
        if (!facts.length) {
          return { text: `${name}님, 아직 많이 기억하지 못했어요. 대화를 나누면 자동으로 학습해요.` };
        }
        let text = `${name}님에 대해 기억하고 있는 정보예요:\n\n`;
        const byCat = {};
        facts.forEach(f => {
          if (!byCat[f.category]) byCat[f.category] = [];
          byCat[f.category].push(`• ${FitSpaceAIMemory.formatFactLabel(f.key)}: ${f.value}`);
        });
        Object.entries(byCat).forEach(([cat, lines]) => {
          text += `**${FitSpaceAIMemory.MEMORY_CATEGORIES[cat] || cat}**\n${lines.join('\n')}\n\n`;
        });
        text += '설정 → AI 기억 관리에서 수정하거나 삭제할 수 있어요.';
        return { text };
      }
      case 'shopping': {
        const count = state.shoppingList?.length || 0;
        return {
          text: count
            ? `장보기 리스트에 ${count}개 항목이 있어요. **장보기** 메뉴에서 확인하세요.\n식단 저장 시 재료는 자동으로 합산돼요.`
            : '아직 장보기 리스트가 비어 있어요. "이번 주 식단 짜줘" 후 캘린더에 저장하면 자동 생성돼요.',
          actions: [{ label: '장보기 보기', action: 'navigate', target: 'shopping' }],
        };
      }
      case 'today_status': {
        const { pct, done, total } = getMissionProgress(state);
        const d = new Date().toISOString().split('T')[0];
        const totals = getMealTotals(state.meals?.[d] || {});
        return {
          text: `📋 **오늘 현황**\n\n• 미션: ${done}/${total} (${pct}%)\n• 칼로리: ${totals.cal} / ${state.goals?.calories}kcal\n• 단백질: ${totals.pro} / ${state.goals?.protein}g\n• 물: ${((state.daily?.water || 0) * 0.25).toFixed(1)}L / ${state.goals?.waterLiters || 2}L\n\n${getProactiveMessage(state)}`,
          actions: [{ label: '홈 보기', action: 'navigate', target: 'dashboard' }],
        };
      }
      case 'greeting':
        return { text: getWelcomeMessage(state) };
      default: {
        const coachCtx = typeof FitSpaceAIMemory !== 'undefined'
          ? FitSpaceAIMemory.getSmartCoachMessages(state)[0] : null;
        return {
          text: coachCtx
            ? `${coachCtx}\n\n${name}님, 이렇게도 도와드릴 수 있어요:\n\n• "이번 주 식단 짜줘"\n• "오늘 인바디 했어"\n• "이번 달 운동 어땠어?"\n• "타임라인 보여줘"\n• "내 정보 뭐 기억해?"\n\n편하게 말씀해 주세요!`
            : `${name}님, 이렇게 도와드릴 수 있어요:\n\n• "이번 주 식단 짜줘" — 주간 식단 생성\n• "오늘 외식이 있어" — 외식 반영\n• "이번 달 운동 어땠어?" — 운동 리뷰\n• "타임라인 보여줘" — 성장 여정\n• 사진 업로드 — 음식 분석\n\n편하게 말씀해 주세요!`,
          suggestions: ['이번 주 식단 짜줘', '이번 달 운동 어땠어?', '타임라인 보여줘', '내 정보 뭐 기억해?'],
        };
      }
    }
  }

  return {
    processMessage,
    getProactiveMessage,
    getWelcomeMessage,
    generateWeeklyMealPlan,
    parseMealPlanOptions,
    formatMealPlanText,
    DAY_LABELS,
    SLOT_KO,
  };
})();
