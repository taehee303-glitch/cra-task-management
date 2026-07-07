/* FitSpace — PR, Achievements & Growth Dashboard */

const FitSpaceGrowth = (() => {
  const MUSCLE_MAP = {
    '랫풀다운': '등', '시티드로우': '등', '원암 덤벨로우': '등', '풀오버': '등',
    '벤치프레스': '가슴', '체스트프레스': '가슴', '케이블 플라이': '가슴',
    '스쿼트': '하체', '레그프레스': '하체', '레그컬': '하체', '레그익스텐션': '하체',
    'Bench Press': '가슴', 'Squats': '하체', 'Leg Press': '하체',
  };

  const ACHIEVEMENTS = [
    { id: 'first_workout', title: '첫 운동 완료', desc: '첫 운동을 완료했어요', emoji: '🏁' },
    { id: 'first_pr', title: '첫 PR 달성', desc: '첫 Personal Record!', emoji: '🎯' },
    { id: 'workouts_10', title: '운동 10회', desc: '10회 운동 완료', emoji: '🔟' },
    { id: 'workouts_50', title: '운동 50회', desc: '50회 운동 완료', emoji: '🏅' },
    { id: 'workouts_100', title: '운동 100회', desc: '100회 운동 완료', emoji: '💯' },
    { id: 'hours_100', title: '100시간', desc: '누적 운동 100시간', emoji: '⏱️' },
    { id: 'sets_1000', title: '1,000세트', desc: '누적 1,000세트', emoji: '📊' },
    { id: 'volume_100t', title: '100톤', desc: '누적 볼륨 100톤', emoji: '🏋️' },
    { id: 'volume_1000t', title: '1,000톤', desc: '누적 볼륨 1,000톤', emoji: '🦾' },
    { id: 'streak_30', title: '30일 연속', desc: '30일 연속 운동 기록', emoji: '🔥' },
    { id: 'legpress_100', title: '100kg 레그프레스', desc: '레그프레스 100kg 돌파', emoji: '🦵' },
    { id: 'latpulldown_60', title: '60kg 랫풀다운', desc: '랫풀다운 60kg 돌파', emoji: '💪' },
  ];

  const MILESTONES = [
    { id: 'workouts', thresholds: [1, 10, 50, 100, 200], label: '운동 횟수', unit: '회' },
    { id: 'hours', thresholds: [1, 10, 50, 100, 200], label: '누적 시간', unit: '시간' },
    { id: 'sets', thresholds: [100, 500, 1000, 5000], label: '누적 세트', unit: '세트' },
    { id: 'volume', thresholds: [10, 50, 100, 500, 1000], label: '누적 볼륨', unit: '톤', scale: 1000 },
  ];

  let growthChart = null;
  let prQueue = [];
  let showingPR = false;

  function getState() { return window.state; }
  function persist() { window.saveState(); }

  function estimate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  }

  function emptyPR() {
    return {
      maxWeight: 0, maxWeightReps: 0,
      bestSet: { weight: 0, reps: 0 },
      maxVolume: 0, maxVolumeDate: null,
      estimated1RM: 0,
      updatedAt: null,
    };
  }

  function getPR(name) {
    const s = getState();
    if (!s.personalRecords) s.personalRecords = {};
    if (!s.personalRecords[name]) s.personalRecords[name] = emptyPR();
    return s.personalRecords[name];
  }

  function getMuscle(name) {
    return MUSCLE_MAP[name] || '기타';
  }

  function getLifetime() {
    const s = getState();
    if (!s.workoutLifetime) {
      s.workoutLifetime = {
        totalWorkouts: 0, totalMinutes: 0, totalSets: 0, totalVolume: 0,
        consecutiveDays: 0, lastWorkoutDate: null, prCount: 0,
      };
    }
    return s.workoutLifetime;
  }

  function getAchievements() {
    const s = getState();
    if (!s.achievements) s.achievements = { unlocked: [], unlockedAt: {}, newPrCount: 0 };
    return s.achievements;
  }

  function checkSetPR(name, set) {
    const pr = getPR(name);
    const w = set.weight || 0;
    const r = set.reps || 0;
    const e1rm = estimate1RM(w, r);
    const events = [];

    if (w > pr.maxWeight) {
      events.push({
        type: 'maxWeight', exercise: name, value: w, unit: 'kg',
        prev: pr.maxWeight || null,
        delta: pr.maxWeight ? w - pr.maxWeight : w,
        display: `${w}kg`,
      });
      pr.maxWeight = w;
      pr.maxWeightReps = r;
    } else if (w === pr.maxWeight && r > pr.maxWeightReps) {
      pr.maxWeightReps = r;
      events.push({
        type: 'maxRepsAtWeight', exercise: name,
        value: r, prev: null, delta: 0,
        display: `${w}kg × ${r}회`,
      });
    }

    const bs = pr.bestSet || { weight: 0, reps: 0 };
    if (w > bs.weight || (w === bs.weight && r > bs.reps)) {
      if (!events.some(e => e.type === 'maxWeight')) {
        events.push({
          type: 'bestSet', exercise: name,
          value: `${w}kg × ${r}회`, weight: w, reps: r,
          prev: bs.weight ? `${bs.weight}kg × ${bs.reps}회` : null,
          delta: w - bs.weight,
          display: `${w}kg × ${r}회`,
        });
      }
      pr.bestSet = { weight: w, reps: r };
    }

    if (e1rm > pr.estimated1RM) {
      events.push({
        type: 'estimated1RM', exercise: name,
        value: e1rm, unit: 'kg', prev: pr.estimated1RM || null,
        delta: pr.estimated1RM ? e1rm - pr.estimated1RM : e1rm,
        display: `${e1rm}kg`,
      });
      pr.estimated1RM = e1rm;
    }

    if (events.length) {
      pr.updatedAt = new Date().toISOString().slice(0, 10);
      persist();
    }
    return events;
  }

  function checkSessionVolumePR(name, sets) {
    const vol = sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
    const pr = getPR(name);
    if (vol <= pr.maxVolume) return null;
    const evt = {
      type: 'maxVolume', exercise: name,
      value: vol, prev: pr.maxVolume || null,
      delta: pr.maxVolume ? vol - pr.maxVolume : vol,
      display: `${vol.toLocaleString()}kg`,
    };
    pr.maxVolume = vol;
    pr.maxVolumeDate = window.today?.() || new Date().toISOString().slice(0, 10);
    pr.updatedAt = pr.maxVolumeDate;
    persist();
    return evt;
  }

  function onSetComplete(exerciseName, set) {
    const events = checkSetPR(exerciseName, set);
    if (events.length) {
      getAchievements().newPrCount = (getAchievements().newPrCount || 0) + events.length;
      getLifetime().prCount = (getLifetime().prCount || 0) + events.length;
      const aw = getState().activeWorkout;
      if (aw) {
        aw.sessionPRs = aw.sessionPRs || [];
        aw.sessionPRs.push(...events);
      }
      queuePR(events[0]);
      persist();
    }
    return events;
  }

  function onExerciseComplete(exerciseName, sets) {
    const evt = checkSessionVolumePR(exerciseName, sets);
    if (evt) {
      const aw = getState().activeWorkout;
      if (aw) {
        aw.sessionPRs = aw.sessionPRs || [];
        aw.sessionPRs.push(evt);
      }
      getLifetime().prCount = (getLifetime().prCount || 0) + 1;
      queuePR(evt);
      persist();
    }
  }

  function queuePR(event) {
    prQueue.push(event);
    if (!showingPR) showNextPR();
  }

  function spawnConfetti(container) {
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-piece';
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = `${Math.random() * 0.5}s`;
      p.style.animationDuration = `${1 + Math.random()}s`;
      container.appendChild(p);
    }
  }

  function showNextPR() {
    if (!prQueue.length) { showingPR = false; return; }
    showingPR = true;
    const evt = prQueue.shift();
    const overlay = document.getElementById('prCelebrate');
    if (!overlay) { showingPR = false; return; }

    const typeLabels = {
      maxWeight: '최고 중량',
      bestSet: '최고 반복',
      maxRepsAtWeight: '최고 반복',
      maxVolume: '최고 볼륨',
      estimated1RM: '예상 1RM',
    };

    document.getElementById('prCelebrateType').textContent = typeLabels[evt.type] || 'Personal Record';
    document.getElementById('prCelebrateExercise').textContent = evt.exercise;
    document.getElementById('prCelebrateValue').textContent = evt.display || evt.value;

    const deltaEl = document.getElementById('prCelebrateDelta');
    if (evt.delta > 0 && evt.type === 'maxWeight') {
      deltaEl.textContent = `지난 최고 기록보다 +${evt.delta}kg 증가했습니다.`;
      deltaEl.hidden = false;
    } else if (evt.prev && evt.type !== 'maxVolume') {
      deltaEl.textContent = `이전: ${evt.prev}`;
      deltaEl.hidden = false;
    } else {
      deltaEl.hidden = true;
    }

    const aiMsg = typeof FitSpaceWorkoutAI !== 'undefined'
      ? FitSpaceWorkoutAI.getPRCelebrationMessage(getState(), evt)
      : '축하합니다! 새로운 기록을 달성했습니다.';
    document.getElementById('prCelebrateAi').textContent = aiMsg;

    spawnConfetti(document.getElementById('prConfetti'));
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('pr-celebrate--show'));
  }

  function hidePR() {
    const overlay = document.getElementById('prCelebrate');
    if (!overlay) return;
    overlay.classList.remove('pr-celebrate--show');
    setTimeout(() => {
      overlay.hidden = true;
      showingPR = false;
      showNextPR();
    }, 300);
  }

  function rebuildPRsFromHistory(state) {
    state.personalRecords = {};
    (state.workoutHistory || []).slice().reverse().forEach(w => {
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(set => checkSetPR(ex.name, set));
        checkSessionVolumePR(ex.name, ex.sets || []);
      });
    });
  }

  function migrate(state) {
    state.personalRecords = state.personalRecords || {};
    state.exerciseGoals = state.exerciseGoals || {
      '랫풀다운': { targetWeight: 60, targetReps: 10 },
      '벤치프레스': { targetWeight: 70, targetReps: 8 },
      '스쿼트': { targetWeight: 100, targetReps: 8 },
      '레그프레스': { targetWeight: 150, targetReps: 10 },
    };
    getAchievements();
    getLifetime();
    if (!Object.keys(state.personalRecords).length && state.workoutHistory?.length) {
      rebuildPRsFromHistory(state);
    }
    syncLifetimeFromHistory(state);
    return state;
  }

  function syncLifetimeFromHistory(state) {
    const lt = getLifetime();
    const history = state.workoutHistory || [];
    if (lt.totalWorkouts > 0 && lt.totalSets > 0) return;
    lt.totalWorkouts = history.length;
    lt.totalMinutes = history.reduce((s, w) => s + (w.duration || 0), 0);
    let sets = 0, vol = 0;
    history.forEach(w => {
      const st = FitSpaceWorkoutAI.calcVolume(w.exercises);
      sets += st.sets;
      vol += st.volume;
    });
    lt.totalSets = sets;
    lt.totalVolume = vol;
  }

  function evalAchievement(id, lt, ach, state) {
    const prs = state.personalRecords || {};
    switch (id) {
      case 'first_workout': return lt.totalWorkouts >= 1;
      case 'first_pr': return (ach.newPrCount || 0) >= 1 || lt.prCount >= 1;
      case 'workouts_10': return lt.totalWorkouts >= 10;
      case 'workouts_50': return lt.totalWorkouts >= 50;
      case 'workouts_100': return lt.totalWorkouts >= 100;
      case 'hours_100': return lt.totalMinutes >= 6000;
      case 'sets_1000': return lt.totalSets >= 1000;
      case 'volume_100t': return lt.totalVolume >= 100000;
      case 'volume_1000t': return lt.totalVolume >= 1000000;
      case 'streak_30': return lt.consecutiveDays >= 30;
      case 'legpress_100': return (prs['레그프레스']?.maxWeight || prs['Leg Press']?.maxWeight || 0) >= 100;
      case 'latpulldown_60': return (prs['랫풀다운']?.maxWeight || 0) >= 60;
      default: return false;
    }
  }

  function checkAchievements() {
    const state = getState();
    const ach = getAchievements();
    const lt = getLifetime();
    const today = window.today?.() || new Date().toISOString().slice(0, 10);
    const newly = [];

    ACHIEVEMENTS.forEach(a => {
      if (ach.unlocked.includes(a.id)) return;
      if (evalAchievement(a.id, lt, ach, state)) {
        ach.unlocked.push(a.id);
        ach.unlockedAt[a.id] = today;
        newly.push(a);
      }
    });
    if (newly.length) persist();
    return newly;
  }

  function updateLifetimeAfterWorkout(session) {
    const lt = getLifetime();
    const today = window.today?.() || new Date().toISOString().slice(0, 10);
    const stats = FitSpaceWorkoutAI.calcVolume(session.exercises);

    lt.totalWorkouts++;
    lt.totalMinutes += session.duration || Math.round((session.elapsed || 0) / 60);
    lt.totalSets += stats.sets;
    lt.totalVolume += stats.volume;

    if (lt.lastWorkoutDate) {
      const prev = new Date(lt.lastWorkoutDate + 'T12:00:00');
      const curr = new Date(today + 'T12:00:00');
      const diff = Math.round((curr - prev) / 86400000);
      lt.consecutiveDays = diff === 1 ? lt.consecutiveDays + 1 : diff === 0 ? lt.consecutiveDays : 1;
    } else {
      lt.consecutiveDays = 1;
    }
    lt.lastWorkoutDate = today;
    persist();
    return checkAchievements();
  }

  function getGoalProgress(name) {
    const goal = getState().exerciseGoals?.[name];
    const pr = getPR(name);
    if (!goal) return null;
    const currentW = pr.bestSet?.weight || pr.maxWeight || 0;
    const currentR = pr.bestSet?.reps || pr.maxWeightReps || 0;
    const weightPct = goal.targetWeight ? Math.min(100, Math.round(currentW / goal.targetWeight * 100)) : 100;
    const repsPct = goal.targetReps ? Math.min(100, Math.round(currentR / goal.targetReps * 100)) : 100;
    const pct = Math.round((weightPct + repsPct) / 2);
    return { goal, currentW, currentR, pct };
  }

  function getMilestoneProgress() {
    const lt = getLifetime();
    return MILESTONES.map(m => {
      let val;
      if (m.id === 'hours') val = Math.floor(lt.totalMinutes / 60);
      else if (m.id === 'volume') val = Math.round(lt.totalVolume / 1000);
      else if (m.id === 'sets') val = lt.totalSets;
      else val = lt.totalWorkouts;
      const next = m.thresholds.find(t => val < t) || m.thresholds[m.thresholds.length - 1];
      const prev = m.thresholds.filter(t => t <= val).pop() || 0;
      const pct = next > prev ? Math.min(100, Math.round((val - prev) / (next - prev) * 100)) : 100;
      return { ...m, val, next, prev, pct, reached: val >= next };
    });
  }

  function getTopExercises(limit = 5) {
    const counts = {};
    (getState().workoutHistory || []).forEach(w => {
      (w.exercises || []).forEach(ex => {
        counts[ex.name] = (counts[ex.name] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  function getMuscleRatio() {
    const ratio = {};
    (getState().workoutHistory || []).forEach(w => {
      (w.exercises || []).forEach(ex => {
        const m = getMuscle(ex.name);
        ratio[m] = (ratio[m] || 0) + (ex.sets?.length || 0);
      });
    });
    const total = Object.values(ratio).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(ratio).map(([muscle, sets]) => ({
      muscle, sets, pct: Math.round(sets / total * 100),
    })).sort((a, b) => b.pct - a.pct);
  }

  function getMonthlyVolumeData() {
    const months = {};
    (getState().workoutHistory || []).forEach(w => {
      const m = w.date.slice(0, 7);
      const vol = (w.exercises || []).reduce((s, ex) =>
        s + (ex.sets || []).reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0);
      months[m] = (months[m] || 0) + vol;
    });
    const keys = Object.keys(months).sort().slice(-6);
    return { labels: keys.map(k => k.slice(5) + '월'), values: keys.map(k => Math.round(months[k] / 1000)) };
  }

  function renderPRList(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const prs = getState().personalRecords || {};
    const names = Object.keys(prs).sort();
    el.innerHTML = names.length
      ? names.map(name => {
        const pr = prs[name];
        return `<div class="pr-card">
          <div class="pr-card__name">${name}</div>
          <div class="pr-card__stats">
            <div><span>최고 중량</span><strong>${pr.maxWeight || '—'}kg</strong></div>
            <div><span>최고 반복</span><strong>${pr.bestSet?.weight ? `${pr.bestSet.weight}kg × ${pr.bestSet.reps}회` : '—'}</strong></div>
            <div><span>최고 볼륨</span><strong>${pr.maxVolume ? pr.maxVolume.toLocaleString() + 'kg' : '—'}</strong></div>
            <div><span>예상 1RM</span><strong>${pr.estimated1RM || '—'}kg</strong></div>
          </div>
        </div>`;
      }).join('')
      : '<p class="text-muted">운동 기록이 쌓이면 PR이 자동으로 표시됩니다.</p>';
  }

  function renderAchievements(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const ach = getAchievements();
    el.innerHTML = `<div class="achievement-grid">${ACHIEVEMENTS.map(a => {
      const unlocked = ach.unlocked.includes(a.id);
      return `<div class="achievement-card ${unlocked ? 'achievement-card--unlocked' : ''}">
        <span class="achievement-card__emoji">${unlocked ? a.emoji : '🔒'}</span>
        <span class="achievement-card__title">${a.title}</span>
        <span class="achievement-card__desc">${a.desc}</span>
        ${unlocked && ach.unlockedAt[a.id] ? `<span class="achievement-card__date">${ach.unlockedAt[a.id]}</span>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  function renderGoals(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const goals = getState().exerciseGoals || {};
    const names = Object.keys(goals);
    el.innerHTML = names.map(name => {
      const g = getGoalProgress(name);
      if (!g) return '';
      const rec = typeof FitSpaceWorkoutAI !== 'undefined'
        ? FitSpaceWorkoutAI.recommendGoal(getState(), name) : '';
      return `<div class="goal-card">
        <div class="goal-card__head"><strong>${name}</strong><span>${g.pct}%</span></div>
        <div class="goal-card__row"><span>목표</span>${g.goal.targetWeight}kg × ${g.goal.targetReps}회</div>
        <div class="goal-card__row"><span>현재</span>${g.currentW}kg × ${g.currentR}회</div>
        <div class="goal-card__bar"><div style="width:${g.pct}%"></div></div>
        ${rec ? `<p class="goal-card__ai">💡 ${rec}</p>` : ''}
      </div>`;
    }).join('');
  }

  function renderMilestones(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = getMilestoneProgress().map(m => `
      <div class="milestone-row">
        <div class="milestone-row__head">
          <span>${m.label}</span>
          <span>${m.val}${m.unit} / ${m.next}${m.unit}</span>
        </div>
        <div class="milestone-row__bar"><div style="width:${m.pct}%"></div></div>
      </div>`).join('');
  }

  function renderGrowthChart() {
    const canvas = document.getElementById('chartGrowthVolume');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = getMonthlyVolumeData();
    if (growthChart) growthChart.destroy();
    growthChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: '볼륨 (톤)',
          data: data.values,
          backgroundColor: '#22c55e88',
          borderColor: '#22c55e',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f4f4f5' }, beginAtZero: true },
        },
      },
    });
  }

  function renderDashboard(full = true) {
    const root = document.getElementById(full ? 'growthDashboard' : 'workoutGrowth');
    if (!root) return;

    const growth = typeof FitSpaceWorkoutAI !== 'undefined'
      ? FitSpaceWorkoutAI.getPersonalGrowth(getState()) : { topGrowers: [], plateaus: [], tips: [] };
    const coach = typeof FitSpaceWorkoutAI !== 'undefined'
      ? FitSpaceWorkoutAI.getGrowthCoachInsights(getState()) : [];
    const monthly = typeof FitSpaceWorkoutAI !== 'undefined'
      ? FitSpaceWorkoutAI.getMonthlyReview(getState()) : null;
    const lt = getLifetime();
    const topEx = getTopExercises(5);
    const muscles = getMuscleRatio();

    root.innerHTML = `
      ${full ? `<div class="growth-hero card">
        <p class="growth-hero__label">과거의 나와 비교하는 성장</p>
        <p class="growth-hero__stat">${lt.totalWorkouts}회 운동 · ${Math.floor(lt.totalMinutes / 60)}시간 · ${(lt.totalVolume / 1000).toFixed(0)}톤</p>
      </div>` : ''}

      ${monthly && full ? `<div class="card growth-monthly">
        <h3 class="card__title">📅 이번 달 리뷰</h3>
        <div class="growth-monthly__stats">
          <div><strong>${monthly.workouts}</strong><span>운동</span></div>
          <div><strong>${monthly.hours}h</strong><span>시간</span></div>
          <div><strong>${monthly.volumeT}t</strong><span>볼륨</span></div>
          <div><strong>${monthly.newPRs}</strong><span>새 PR</span></div>
        </div>
        ${monthly.topGrowers.length ? `<p class="growth-monthly__grow">가장 성장: ${monthly.topGrowers.map(g => `${g.name} +${g.weightDelta}kg`).join(', ')}</p>` : ''}
        ${monthly.plateaus.length ? `<p class="growth-monthly__plateau">정체: ${monthly.plateaus.join(', ')}</p>` : ''}
        <ul class="growth-tips">${monthly.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>` : ''}

      <div class="growth-section card">
        <h3 class="card__title">🤖 AI Growth Coach</h3>
        <ul class="growth-coach-list">${coach.length
          ? coach.map(c => `<li>${c}</li>`).join('')
          : '<li class="text-muted">더 많은 기록이 쌓이면 분석을 제공합니다.</li>'}</ul>
      </div>

      <div class="growth-section">
        <h4>이번 달 성장 TOP5</h4>
        ${growth.topGrowers.length
          ? `<ul class="growth-list">${growth.topGrowers.map(x =>
            `<li><strong>${x.name}</strong> <span class="growth-delta">+${x.weightDelta}kg</span></li>`).join('')}</ul>`
          : '<p class="text-muted">기록이 더 필요해요</p>'}
      </div>

      <div class="growth-section">
        <h4>최근 많이 한 운동</h4>
        ${topEx.length
          ? `<ul class="growth-list">${topEx.map(x =>
            `<li><strong>${x.name}</strong> <span>${x.count}회</span></li>`).join('')}</ul>`
          : '<p class="text-muted">—</p>'}
      </div>

      <div class="growth-section">
        <h4>근육 부위별 비율</h4>
        <div class="muscle-ratio">${muscles.map(m =>
          `<div class="muscle-ratio__item"><span>${m.muscle}</span><div class="muscle-ratio__bar"><div style="width:${m.pct}%"></div></div><span>${m.pct}%</span></div>`
        ).join('')}</div>
      </div>

      ${full ? `<div class="card growth-chart-card">
        <h3 class="card__title">월별 볼륨 (톤)</h3>
        <div class="growth-chart-wrap"><canvas id="chartGrowthVolume" height="180"></canvas></div>
      </div>

      <div class="card"><h3 class="card__title">🏆 Personal Records</h3><div id="growthPRList"></div></div>
      <div class="card"><h3 class="card__title">🎯 Smart Goals</h3><div id="growthGoals"></div></div>
      <div class="card"><h3 class="card__title">📈 Milestones</h3><div id="growthMilestones"></div></div>
      <div class="card"><h3 class="card__title">🎖️ Achievements</h3><div id="growthAchievements"></div></div>` : ''}`;

    if (full) {
      renderPRList('growthPRList');
      renderGoals('growthGoals');
      renderMilestones('growthMilestones');
      renderAchievements('growthAchievements');
      renderGrowthChart();
    }
  }

  function init() {
    migrate(getState());
    document.getElementById('prCelebrateClose')?.addEventListener('click', hidePR);
    document.getElementById('prCelebrate')?.addEventListener('click', e => {
      if (e.target.id === 'prCelebrate') hidePR();
    });
  }

  return {
    migrate, init, onSetComplete, onExerciseComplete, updateLifetimeAfterWorkout,
    checkAchievements, getPR, getGoalProgress, renderDashboard, renderPRList,
    renderAchievements, rebuildPRsFromHistory, queuePR, hidePR, ACHIEVEMENTS,
  };
})();
