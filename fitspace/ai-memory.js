/* FitSpace — AI Memory & Health Companion */

const FitSpaceAIMemory = (() => {
  const MEMORY_CATEGORIES = {
    health: '기본 건강',
    workout: '운동',
    meals: '식단',
    lifestyle: '생활 습관',
    custom: '기타',
  };

  const DEFAULT_CONSENT = {
    rememberHealth: true,
    rememberWorkout: true,
    rememberMeals: true,
    rememberLifestyle: true,
    proactiveCoach: true,
  };

  function getState() { return window.state; }
  function persist() { window.saveState(); }
  function today() { return window.today?.() || new Date().toISOString().slice(0, 10); }

  function ensureMemory(state) {
    if (!state.aiMemory) {
      state.aiMemory = {
        consent: { ...DEFAULT_CONSENT },
        disabledKeys: [],
        facts: [],
        insights: [],
        lastSynced: null,
      };
    }
    if (!state.healthIntegrations) {
      state.healthIntegrations = {
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
      };
    }
    return state.aiMemory;
  }

  function upsertFact(category, key, value, source = 'auto', stateParam = null) {
    const s = stateParam || getState();
    if (!isAllowed(category, s)) return;
    const mem = ensureMemory(s);
    if (mem.disabledKeys.includes(`${category}:${key}`)) return;

    const id = `${category}:${key}`;
    const existing = mem.facts.find(f => f.id === id);
    const entry = {
      id, category, key, value: String(value),
      source, updatedAt: today(),
    };
    if (existing) Object.assign(existing, entry);
    else mem.facts.push(entry);
    mem.lastSynced = today();
    if (!stateParam) persist();
  }

  function isAllowed(category, stateParam = null) {
    const mem = ensureMemory(stateParam || getState());
    const map = {
      health: mem.consent.rememberHealth,
      workout: mem.consent.rememberWorkout,
      meals: mem.consent.rememberMeals,
      lifestyle: mem.consent.rememberLifestyle,
    };
    return map[category] !== false;
  }

  function deleteFact(id) {
    const mem = ensureMemory(getState());
    mem.facts = mem.facts.filter(f => f.id !== id);
    persist();
  }

  function disableKey(category, key) {
    const mem = ensureMemory(getState());
    const id = `${category}:${key}`;
    if (!mem.disabledKeys.includes(id)) mem.disabledKeys.push(id);
    mem.facts = mem.facts.filter(f => f.id !== id);
    persist();
  }

  function clearAllMemory() {
    const mem = ensureMemory(getState());
    mem.facts = [];
    mem.insights = [];
    mem.lastSynced = null;
    persist();
  }

  function getFacts(category) {
    return ensureMemory(getState()).facts.filter(f =>
      f.category === category && !getState().aiMemory.disabledKeys.includes(f.id)
    );
  }

  function rebuildFromAppData(state) {
    ensureMemory(state);
    const hp = state.healthProfile || {};
    const g = state.goals || {};
    const p = state.profile || {};

    if (isAllowed('health', state)) {
      upsertFact('health', 'height', `${p.height}cm`, 'auto', state);
      upsertFact('health', 'current_weight', `${hp.currentWeight || '—'}kg`, 'auto', state);
      upsertFact('health', 'target_weight', `${g.weight || hp.targetWeight}kg`, 'auto', state);
      upsertFact('health', 'target_body_fat', `${g.bodyFat}%`, 'auto', state);
      upsertFact('health', 'target_muscle', `${g.muscle}kg`, 'auto', state);
      upsertFact('health', 'target_calories', `${g.calories}kcal`, 'auto', state);
      upsertFact('health', 'target_protein', `${g.protein}g`, 'auto', state);
    }

    if (isAllowed('meals', state)) {
      if (hp.preferredFoods?.length) upsertFact('meals', 'preferred_foods', hp.preferredFoods.join(', '), 'auto', state);
      if (hp.dislikedFoods?.length) upsertFact('meals', 'disliked_foods', hp.dislikedFoods.join(', '), 'auto', state);
      if (hp.allergies?.length) upsertFact('meals', 'allergies', hp.allergies.join(', '), 'auto', state);
      if (hp.stapleIngredients?.length) upsertFact('meals', 'staples', hp.stapleIngredients.join(', '), 'auto', state);
      upsertFact('meals', 'household_size', `${hp.householdSize || 1}인`, 'auto', state);
      upsertFact('meals', 'budget_weekly', `${((hp.budgetWeekly || 0) / 10000).toFixed(0)}만원`, 'auto', state);
      upsertFact('meals', 'dining_out_weekly', `주 ${hp.diningOutPerWeek || 0}회`, 'auto', state);
    }

    if (isAllowed('workout', state)) {
      const routines = (state.routines || []).map(r => r.name);
      if (routines.length) upsertFact('workout', 'favorite_routines', routines.slice(0, 5).join(', '), 'auto', state);
      upsertFact('workout', 'workout_frequency', `주 ${state.healthProfile?.workoutFrequency || g.workouts || 4}회`, 'auto', state);

      const exCounts = {};
      (state.workoutHistory || []).forEach(w => {
        (w.exercises || []).forEach(ex => { exCounts[ex.name] = (exCounts[ex.name] || 0) + 1; });
      });
      const topEx = Object.entries(exCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (topEx.length) upsertFact('workout', 'frequent_exercises', topEx.map(([n]) => n).join(', '), 'auto', state);

      const prs = state.personalRecords || {};
      const recentPR = Object.entries(prs)
        .filter(([, pr]) => pr.maxWeight)
        .sort((a, b) => (b[1].updatedAt || '').localeCompare(a[1].updatedAt || ''))
        .slice(0, 3)
        .map(([name, pr]) => `${name} ${pr.maxWeight}kg`);
      if (recentPR.length) upsertFact('workout', 'recent_prs', recentPR.join(' · '), 'auto', state);

      if (typeof FitSpaceWorkoutAI !== 'undefined') {
        const growth = FitSpaceWorkoutAI.getPersonalGrowth(state);
        if (growth.plateaus.length) {
          upsertFact('workout', 'plateau_exercises',
            growth.plateaus.map(p => p.name).join(', '), 'auto', state);
        }
      }

      const notes = [];
      (state.workoutHistory || []).slice(0, 10).forEach(w => {
        (w.exercises || []).forEach(ex => { if (ex.note) notes.push(ex.note); });
        if (w.sessionNote) notes.push(w.sessionNote);
      });
      if (notes.length) upsertFact('workout', 'common_notes', notes.slice(0, 3).join(' / '), 'auto', state);
    }

    if (isAllowed('lifestyle', state)) {
      upsertFact('lifestyle', 'avg_sleep', state.daily?.sleep || `${g.sleepHours || 7}시간`, 'auto', state);
      upsertFact('lifestyle', 'avg_steps', `${state.daily?.steps || g.steps || 8000}보`, 'auto', state);
      upsertFact('lifestyle', 'water_goal', `${g.waterLiters || 2}L`, 'auto', state);

      const hi = state.healthIntegrations?.syncedData || {};
      if (hi.sleepHours) upsertFact('lifestyle', 'synced_sleep', `${hi.sleepHours}시간`, 'health_sync', state);
      if (hi.steps) upsertFact('lifestyle', 'synced_steps', `${hi.steps}보`, 'health_sync', state);
    }

    state.aiMemory.lastSynced = today();
    return state;
  }

  function extractFromChat(text) {
    const updates = [];
    const t = text.trim();

    const budgetMatch = t.match(/예산\s*(\d+)\s*만/);
    if (budgetMatch) {
      upsertFact('meals', 'budget_weekly', `${budgetMatch[1]}만원`, 'user');
      updates.push({ category: 'meals', key: 'budget_weekly' });
    }

    const outMatch = t.match(/외식\s*(\d+)/);
    if (outMatch || /외식/.test(t)) {
      const n = outMatch ? +outMatch[1] : null;
      if (n) upsertFact('meals', 'dining_out_weekly', `주 ${n}회`, 'user');
      updates.push({ category: 'meals', key: 'dining_out' });
    }

    const peopleMatch = t.match(/(\d)\s*인/);
    if (peopleMatch || /2인|둘이|함께/.test(t)) {
      upsertFact('meals', 'household_size', peopleMatch ? `${peopleMatch[1]}인` : '2인', 'user');
      updates.push({ category: 'meals', key: 'household_size' });
    }

    if (/금요일.*외식|외식.*금요일/.test(t)) {
      upsertFact('meals', 'dining_pattern', '금요일 저녁 외식이 잦음', 'user');
    }

    if (/닭다리|소불고기/.test(t)) {
      const foods = [];
      if (/닭다리/.test(t)) foods.push('닭다리살');
      if (/소불고기/.test(t)) foods.push('소불고기');
      if (foods.length) upsertFact('meals', 'staples', foods.join(', '), 'user');
    }

    if (/운동\s*못|못\s*했/.test(t)) {
      upsertFact('workout', 'last_missed', today(), 'user');
    }

    if (/인바디|체중\s*측정/.test(t)) {
      upsertFact('health', 'last_inbody', today(), 'user');
    }

    if (/약한\s*부위|부족/.test(t)) {
      const weak = t.match(/(등|가슴|하체|어깨|팔|코어)/);
      if (weak) upsertFact('workout', 'weak_areas', weak[1], 'user');
    }

    return updates;
  }

  function buildCoachContext(state) {
    rebuildFromAppData(state);
    const mem = state.aiMemory;
    const lines = ['[사용자 기억 — 개인화 코칭용]'];

    Object.keys(MEMORY_CATEGORIES).forEach(cat => {
      const facts = getFacts(cat);
      if (!facts.length) return;
      lines.push(`\n## ${MEMORY_CATEGORIES[cat]}`);
      facts.forEach(f => lines.push(`- ${formatFactLabel(f.key)}: ${f.value}`));
    });

    const name = (state.profile?.name || '회원').split(' ')[0];
    lines.push(`\n사용자 이름: ${name}`);
    return lines.join('\n');
  }

  function formatFactLabel(key) {
    const labels = {
      height: '키', current_weight: '현재 체중', target_weight: '목표 체중',
      target_body_fat: '목표 체지방', target_muscle: '목표 골격근',
      target_calories: '목표 칼로리', target_protein: '목표 단백질',
      favorite_routines: '자주 쓰는 루틴', workout_frequency: '운동 빈도',
      frequent_exercises: '자주 하는 운동', recent_prs: '최근 PR',
      plateau_exercises: '정체 운동', common_notes: '운동 메모',
      preferred_foods: '좋아하는 음식', disliked_foods: '싫어하는 음식',
      allergies: '알레르기', staples: '자주 쓰는 재료',
      household_size: '식사 인원', budget_weekly: '주간 예산',
      dining_out_weekly: '주간 외식', dining_pattern: '외식 패턴',
      avg_sleep: '수면', avg_steps: '걸음 수', water_goal: '물 목표',
      weak_areas: '약한 부위',
    };
    return labels[key] || key;
  }

  function getSmartCoachMessages(state) {
    if (!state.aiMemory?.consent?.proactiveCoach) return [];
    rebuildFromAppData(state);
    const name = (state.profile?.name || '회원').split(' ')[0];
    const g = state.goals || {};
    const messages = [];

    const waterL = (state.daily?.water || 0) * 0.25;
    const waterGap = (g.waterLiters || 2) - waterL;
    if (waterGap > 0 && waterGap <= 0.6) {
      messages.push(`오늘 물을 ${Math.round(waterGap * 1000)}mL만 더 마시면 목표를 달성합니다.`);
    }

    const d = today();
    let proTotal = 0;
    Object.values(state.meals?.[d] || {}).flat().forEach(m => { proTotal += m.protein || 0; });
    const proGap = (g.protein || 130) - proTotal;
    if (proGap > 20) {
      const recent = getFacts('meals').find(f => f.key === 'preferred_foods');
      const hint = recent ? ` ${recent.value.split(',')[0]} 어때요?` : ' 단백질 간식을 추천해요.';
      messages.push(`최근 3일 단백질 섭취가 부족할 수 있어요. 오늘 ${proGap}g 더 필요합니다.${hint}`);
    }

    const sleepH = parseSleepHours(state.daily?.sleep);
    if (sleepH > 0 && sleepH < (g.sleepHours || 7) - 1) {
      messages.push('오늘은 수면 시간이 짧았기 때문에 운동 강도를 조금 낮추는 것을 추천합니다.');
    }

    const diningPattern = getFacts('meals').find(f => f.key === 'dining_pattern');
    const dow = new Date().getDay();
    if (diningPattern?.value.includes('금요일') && dow === 5) {
      messages.push('금요일은 외식 예정이므로 점심을 조금 가볍게 구성해볼까요?');
    }

    if (typeof FitSpaceWorkoutAI !== 'undefined') {
      const plateaus = getFacts('workout').find(f => f.key === 'plateau_exercises');
      if (plateaus?.value) {
        messages.push(`${plateaus.value.split(',')[0]}은(는) 최근 기록 변화가 없어요. 반복 횟수 조정을 고려해보세요.`);
      }
    }

    if (!messages.length) {
      messages.push(`${name}님, 오늘도 과거의 ${name}님보다 한 걸음 나아가면 충분해요.`);
    }

    return messages.slice(0, 2);
  }

  function parseSleepHours(str) {
    if (!str) return 0;
    const h = str.match(/(\d+)h/);
    const m = str.match(/(\d+)m/);
    return (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
  }

  function getTimeline(state) {
    const metrics = state.metrics || [];
    const now = metrics[metrics.length - 1];
    const yearAgo = metrics.find(m => {
      const diff = (new Date() - new Date(m.date + 'T12:00:00')) / 86400000;
      return diff >= 330 && diff <= 400;
    }) || metrics[0];

    const lt = state.workoutLifetime || {};
    const prs = state.personalRecords || {};
    const prGrowth = Object.entries(prs)
      .filter(([, pr]) => pr.maxWeight)
      .map(([name, pr]) => ({ name, weight: pr.maxWeight }));

    const aiSummary = [];
    if (now && yearAgo) {
      const wDelta = (now.weight - yearAgo.weight).toFixed(1);
      const bfDelta = ((now.bodyFat || 0) - (yearAgo.bodyFat || 0)).toFixed(1);
      const mDelta = ((now.muscle || 0) - (yearAgo.muscle || 0)).toFixed(1);
      if (Math.abs(wDelta) >= 0.5) {
        aiSummary.push(`1년 전보다 체중은 ${Math.abs(wDelta)}kg ${wDelta < 0 ? '감소' : '증가'}했습니다.`);
      }
      if (mDelta > 0) aiSummary.push(`골격근량은 ${mDelta}kg 증가했습니다.`);
      if (bfDelta < 0) aiSummary.push(`체지방률은 ${Math.abs(bfDelta)}% 감소했습니다.`);
    }

    const topPR = prGrowth.sort((a, b) => b.weight - a.weight)[0];
    if (topPR) aiSummary.push(`${topPR.name} 최고 중량 ${topPR.weight}kg — 꾸준함이 가장 큰 성과였습니다.`);

    return {
      yearAgo: yearAgo ? { date: yearAgo.date, weight: yearAgo.weight, bodyFat: yearAgo.bodyFat, muscle: yearAgo.muscle } : null,
      current: now ? { date: now.date, weight: now.weight, bodyFat: now.bodyFat, muscle: now.muscle } : null,
      workouts: { total: lt.totalWorkouts || 0, hours: Math.floor((lt.totalMinutes || 0) / 60) },
      prs: prGrowth.slice(0, 5),
      aiSummary,
    };
  }

  function formatTimelineText(timeline) {
    let text = '📅 **AI Timeline — 성장 여정**\n\n';
    if (timeline.yearAgo && timeline.current) {
      text += `| | 1년 전 | 현재 |\n|---|---|---|\n`;
      text += `| 체중 | ${timeline.yearAgo.weight}kg | ${timeline.current.weight}kg |\n`;
      text += `| 체지방 | ${timeline.yearAgo.bodyFat || '—'}% | ${timeline.current.bodyFat || '—'}% |\n`;
      text += `| 골격근 | ${timeline.yearAgo.muscle || '—'}kg | ${timeline.current.muscle || '—'}kg |\n\n`;
    }
    text += `🏋️ 누적 운동 ${timeline.workouts.total}회 · ${timeline.workouts.hours}시간\n\n`;
    if (timeline.prs.length) {
      text += '**PR 기록**\n' + timeline.prs.map(p => `• ${p.name}: ${p.weight}kg`).join('\n') + '\n\n';
    }
    if (timeline.aiSummary.length) {
      text += '**AI 코멘트**\n' + timeline.aiSummary.map(s => `• ${s}`).join('\n');
    } else {
      text += '기록이 더 쌓이면 1년 전과의 비교를 자세히 보여드릴게요.';
    }
    return text;
  }

  function getMonthlyWorkoutReview(state) {
    if (typeof FitSpaceWorkoutAI === 'undefined') return '운동 기록을 더 모으면 분석해 드릴게요.';
    const monthly = FitSpaceWorkoutAI.getMonthlyReview(state);
    const name = (state.profile?.name || '회원').split(' ')[0];
    let text = `📊 **${name}님, 이번 달 운동 리뷰**\n\n`;
    text += `• 운동 ${monthly.workouts}회 · ${monthly.hours}분 · 볼륨 ${monthly.volumeT}톤\n`;
    text += `• 새 PR ${monthly.newPRs}개\n\n`;
    if (monthly.topGrowers.length) {
      text += '**가장 성장한 운동**\n' + monthly.topGrowers.map(g => `• ${g.name} +${g.weightDelta}kg`).join('\n') + '\n\n';
    }
    if (monthly.plateaus.length) {
      text += `**정체:** ${monthly.plateaus.join(', ')}\n\n`;
    }
    text += '**AI 추천**\n' + monthly.tips.map(t => `• ${t}`).join('\n');

    const freq = getFacts('workout').find(f => f.key === 'frequent_exercises');
    if (freq) text += `\n\n💡 기억하고 있어요: ${name}님은 ${freq.value}을(를) 자주 수행합니다.`;
    return text;
  }

  function getInbodyResponse(state) {
    const latest = state.metrics?.[state.metrics.length - 1];
    const name = (state.profile?.name || '회원').split(' ')[0];
    upsertFact('health', 'last_inbody', today(), 'user');
    if (!latest) {
      return `${name}님, 인바디 기록을 **체중 관리** 탭에서 입력해 주세요. 입력 후 변화 추이를 분석해 드릴게요.`;
    }
    const prev = state.metrics.length >= 2 ? state.metrics[state.metrics.length - 2] : null;
    let text = `📋 **최근 인바디 (${latest.date})**\n\n`;
    text += `• 체중 ${latest.weight}kg · 체지방 ${latest.bodyFat}% · 골격근 ${latest.muscle}kg\n`;
    if (prev) {
      text += `\n지난 측정 대비: 체중 ${(latest.weight - prev.weight).toFixed(1)}kg · 체지방 ${(latest.bodyFat - prev.bodyFat).toFixed(1)}%\n`;
    }
    const g = state.goals || {};
    text += `\n목표 체중 ${g.weight}kg까지 ${(latest.weight - g.weight).toFixed(1)}kg ${latest.weight > g.weight ? '남음' : '달성!'}`;
    return text;
  }

  function renderMemorySettings(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    rebuildFromAppData(getState());
    const mem = getState().aiMemory;
    const facts = mem.facts.filter(f => !mem.disabledKeys.includes(f.id));

    el.innerHTML = `
      <div class="memory-consent">
        <h4>기억 허용 범위</h4>
        ${Object.entries({
          rememberHealth: '기본 건강 정보',
          rememberWorkout: '운동 정보',
          rememberMeals: '식단 정보',
          rememberLifestyle: '생활 습관',
          proactiveCoach: '능동적 코칭',
        }).map(([key, label]) => `
          <label class="memory-toggle">
            <input type="checkbox" data-consent="${key}" ${mem.consent[key] ? 'checked' : ''} />
            <span>${label}</span>
          </label>`).join('')}
      </div>

      <div class="memory-facts">
        <div class="memory-facts__head">
          <h4>AI가 기억하는 정보 (${facts.length})</h4>
          <button type="button" class="btn btn--ghost btn--sm" id="memoryClearAll">전체 초기화</button>
        </div>
        ${facts.length ? facts.map(f => `
          <div class="memory-fact" data-id="${f.id}">
            <div class="memory-fact__meta">
              <span class="memory-fact__cat">${MEMORY_CATEGORIES[f.category] || f.category}</span>
              <span class="memory-fact__src">${f.source === 'user' ? '직접 입력' : f.source === 'health_sync' ? '건강 연동' : '자동'}</span>
            </div>
            <div class="memory-fact__row">
              <strong>${formatFactLabel(f.key)}</strong>
              <input class="input memory-fact__input" value="${f.value.replace(/"/g, '&quot;')}" data-edit="${f.id}" />
            </div>
            <button type="button" class="btn btn--ghost btn--sm memory-fact__del" data-del="${f.id}">기억 안 함</button>
          </div>`).join('')
          : '<p class="text-muted">아직 기억된 정보가 없어요. 대화를 나누면 자동으로 쌓입니다.</p>'}
      </div>
      <p class="memory-privacy text-muted">건강 데이터는 사용자 동의 하에만 저장됩니다. 언제든 수정·삭제할 수 있어요.</p>`;

    el.querySelectorAll('[data-consent]').forEach(cb => {
      cb.addEventListener('change', () => {
        mem.consent[cb.dataset.consent] = cb.checked;
        persist();
        if (cb.checked) rebuildFromAppData(getState());
        renderMemorySettings(containerId);
      });
    });

    el.querySelectorAll('[data-edit]').forEach(input => {
      input.addEventListener('change', () => {
        const fact = mem.facts.find(f => f.id === input.dataset.edit);
        if (fact) { fact.value = input.value; fact.source = 'user'; fact.updatedAt = today(); persist(); }
      });
    });

    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [cat, key] = btn.dataset.del.split(':');
        disableKey(cat, key);
        renderMemorySettings(containerId);
      });
    });

    document.getElementById('memoryClearAll')?.addEventListener('click', () => {
      if (confirm('AI가 기억하는 모든 정보를 삭제할까요?')) {
        clearAllMemory();
        renderMemorySettings(containerId);
      }
    });
  }

  function renderHealthIntegrations(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const hi = getState().healthIntegrations;
    const platforms = [
      { id: 'appleHealth', name: 'Apple Health', icon: '🍎' },
      { id: 'samsungHealth', name: 'Samsung Health', icon: '📱' },
      { id: 'googleHealthConnect', name: 'Google Health Connect', icon: '🔵' },
      { id: 'garmin', name: 'Garmin Connect', icon: '⌚' },
      { id: 'fitbit', name: 'Fitbit', icon: '💚' },
    ];

    el.innerHTML = `
      <p class="text-muted memory-privacy">건강 앱 연동은 사용자 동의 후에만 작동합니다. 브라우저에서는 데모 동기화를 지원하며, 네이티브 앱에서 전체 연동이 가능합니다.</p>
      <div class="health-platforms">
        ${platforms.map(p => {
          const conn = hi.platforms[p.id];
          return `<div class="health-platform ${conn.connected ? 'health-platform--on' : ''}">
            <span class="health-platform__icon">${p.icon}</span>
            <div class="health-platform__info">
              <strong>${p.name}</strong>
              <span>${conn.connected ? `연결됨 · ${conn.lastSync || '동기화됨'}` : '미연결'}</span>
            </div>
            <button type="button" class="btn btn--sm ${conn.connected ? 'btn--ghost' : 'btn--secondary'}"
              data-platform="${p.id}">${conn.connected ? '해제' : '연결'}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="health-sync-data">
        <h4>동기화된 데이터</h4>
        <div class="health-sync-grid">
          ${renderSyncItem('걸음 수', hi.syncedData.steps)}
          ${renderSyncItem('수면', hi.syncedData.sleepHours ? hi.syncedData.sleepHours + 'h' : null)}
          ${renderSyncItem('활동 칼로리', hi.syncedData.activeCalories)}
          ${renderSyncItem('심박수', hi.syncedData.heartRate)}
          ${renderSyncItem('체중', hi.syncedData.weight ? hi.syncedData.weight + 'kg' : null)}
        </div>
      </div>`;

    el.querySelectorAll('[data-platform]').forEach(btn => {
      btn.addEventListener('click', () => togglePlatform(btn.dataset.platform, containerId));
    });
  }

  function renderSyncItem(label, val) {
    return `<div class="health-sync-item"><span>${label}</span><strong>${val ?? '—'}</strong></div>`;
  }

  function togglePlatform(id, containerId) {
    const hi = getState().healthIntegrations;
    const p = hi.platforms[id];
    if (p.connected) {
      p.connected = false;
      p.lastSync = null;
      hi.enabled = Object.values(hi.platforms).some(x => x.connected);
    } else {
      if (!confirm(`${id} 연동을 위해 건강 데이터 접근에 동의하시겠습니까?\n(데모: 로컬 데이터를 동기화합니다)`)) return;
      p.connected = true;
      p.lastSync = today();
      hi.enabled = true;
      demoSyncFromDaily();
    }
    persist();
    renderHealthIntegrations(containerId);
  }

  function demoSyncFromDaily() {
    const s = getState();
    const d = s.daily || {};
    const g = s.goals || {};
    const hi = s.healthIntegrations;
    hi.syncedData = {
      steps: d.steps || g.steps,
      sleepHours: parseSleepHours(d.sleep) || g.sleepHours,
      activeCalories: Math.round((d.steps || 0) * 0.04),
      heartRate: hi.watchSession.heartRateAvg || null,
      restingHeartRate: 62,
      weight: s.healthProfile?.currentWeight || s.metrics?.slice(-1)[0]?.weight,
      lastSync: today(),
    };
    rebuildFromAppData(s);
  }

  function linkWatchToWorkout(workoutSessionId) {
    const hi = getState().healthIntegrations;
    if (!hi.enabled) return;
    hi.watchSession = {
      active: true,
      linkedWorkoutId: workoutSessionId,
      heartRateAvg: 128 + Math.floor(Math.random() * 20),
      heartRateMax: 155 + Math.floor(Math.random() * 15),
      calories: 180 + Math.floor(Math.random() * 120),
      startedAt: Date.now(),
    };
    persist();
  }

  function finishWatchSession() {
    const hi = getState().healthIntegrations;
    const ws = hi.watchSession;
    if (!ws.active) return null;
    const summary = {
      duration: ws.duration,
      heartRateAvg: ws.heartRateAvg,
      heartRateMax: ws.heartRateMax,
      calories: ws.calories,
    };
    hi.syncedData.activeCalories = (hi.syncedData.activeCalories || 0) + (ws.calories || 0);
    ws.active = false;
    persist();
    return summary;
  }

  function migrate(state) {
    ensureMemory(state);
    rebuildFromAppData(state);
    return state;
  }

  return {
    migrate, rebuildFromAppData, buildCoachContext, getSmartCoachMessages,
    extractFromChat, getTimeline, formatTimelineText, getMonthlyWorkoutReview,
    getInbodyResponse, renderMemorySettings, renderHealthIntegrations,
    upsertFact, deleteFact, disableKey, clearAllMemory, getFacts,
    linkWatchToWorkout, finishWatchSession, demoSyncFromDaily,
    MEMORY_CATEGORIES, formatFactLabel,
  };
})();
