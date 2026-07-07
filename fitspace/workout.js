/* FitSpace — Workout System (Plan → Perform → Analyze) */

const FitSpaceWorkout = (() => {
  const REST_DEFAULT = 90;
  let timerInterval = null;
  let timerRunning = false;
  let editingRoutineId = null;
  let dragSrcIdx = null;

  function getState() { return window.state; }
  function persist() { window.saveState(); }
  function fmtDate(d) { return window.formatShortDate(d); }

  function normalizeExercise(ex, idx = 0) {
    return {
      id: ex.id || 'ex' + Date.now() + idx,
      name: ex.name || '운동',
      sets: ex.sets ?? 4,
      reps: ex.reps ?? 10,
      weight: ex.weight ?? 0,
      order: ex.order ?? idx,
    };
  }

  function normalizeRoutine(r) {
    return {
      ...r,
      exercises: (r.exercises || []).map((ex, i) => normalizeExercise(ex, i)),
    };
  }

  function migrateWorkoutData(state) {
    state.exerciseMedia = state.exerciseMedia || {};
    state.routines = (state.routines || []).map(normalizeRoutine);
    (state.workoutHistory || []).forEach(w => {
      const routine = state.routines.find(r => r.id === w.routineId);
      (w.exercises || []).forEach(ex => {
        if (!ex.plan && routine) {
          const tpl = routine.exercises.find(e => e.name === ex.name);
          if (tpl) ex.plan = { sets: tpl.sets, reps: tpl.reps, weight: tpl.weight };
        }
      });
    });
    if (state.activeWorkout) {
      const aw = state.activeWorkout;
      if (aw.currentExIdx == null) aw.currentExIdx = 0;
      if (aw.restDuration == null) aw.restDuration = REST_DEFAULT;
      if (aw.sessionNote == null) aw.sessionNote = '';
      if (aw.aiFeedback == null) aw.aiFeedback = null;
      (aw.exercises || []).forEach(ex => {
        if (!ex.plan) {
          ex.plan = { sets: ex.targetSets, reps: ex.targetReps, weight: ex.targetWeight };
        }
        if (ex.currentWeight == null) {
          const last = ex.sets?.[ex.sets.length - 1];
          ex.currentWeight = last?.weight ?? ex.plan?.weight ?? 0;
          ex.currentReps = last?.reps ?? ex.plan?.reps ?? 10;
        }
      });
    }
    return state;
  }

  function getMedia(name) {
    return getState().exerciseMedia[name] || { video: null, photo: null, link: '', refImage: null };
  }

  function setMedia(name, patch) {
    const s = getState();
    s.exerciseMedia[name] = { ...getMedia(name), ...patch };
    persist();
  }

  function getLastWorkoutForRoutine(routineId) {
    return getState().workoutHistory.find(w => w.routineId === routineId);
  }

  function getLastWorkoutForExercise(name) {
    for (const w of getState().workoutHistory) {
      const ex = w.exercises?.find(e => e.name === name);
      if (ex?.sets?.length) return ex.sets;
    }
    return [];
  }

  function buildSessionExercises(routine) {
    const last = getLastWorkoutForRoutine(routine.id);
    return routine.exercises.map((ex, i) => {
      const prev = last?.exercises?.find(e => e.name === ex.name);
      const prevSets = prev?.sets?.length ? prev.sets : getLastWorkoutForExercise(ex.name);
      const lastSet = prevSets[prevSets.length - 1];
      const plan = { sets: ex.sets, reps: ex.reps, weight: ex.weight };
      return {
        name: ex.name,
        exerciseId: ex.id,
        plan,
        targetSets: ex.sets,
        targetReps: ex.reps,
        targetWeight: ex.weight,
        prevSets,
        sets: [],
        note: '',
        currentWeight: lastSet?.weight ?? ex.weight ?? 0,
        currentReps: lastSet?.reps ?? ex.reps ?? 10,
        currentRpe: null,
      };
    });
  }

  function calcSessionStats(exercises) {
    return FitSpaceWorkoutAI.calcVolume(exercises);
  }

  function getActiveRoutine() {
    const s = getState();
    return s.routines.find(r => r.id === s.activeRoutineId);
  }

  /* ── Timer & Rest ── */

  function tickWorkoutTimer() {
    const aw = getState().activeWorkout;
    if (aw.status !== 'active') return;
    aw.elapsed++;
    updateTimerDisplay();
    if (aw.restSeconds > 0) tickRestTimer();
  }

  function tickRestTimer() {
    const aw = getState().activeWorkout;
    aw.restSeconds = Math.max(0, aw.restSeconds - 1);
    updateRestDisplay();
    if (aw.restSeconds <= 0) onRestComplete();
  }

  function onRestComplete() {
    hideRestBanner();
    const aw = getState().activeWorkout;
    const ex = aw.exercises[aw.currentExIdx];
    if (!ex) return;
    const planned = ex.plan?.sets || ex.targetSets || 4;
    if (ex.sets.length >= planned && aw.currentExIdx < aw.exercises.length - 1) {
      aw.currentExIdx++;
      renderFocusSession();
    }
  }

  function startRestTimer(seconds) {
    const aw = getState().activeWorkout;
    const sec = seconds ?? aw.restDuration ?? REST_DEFAULT;
    aw.restSeconds = sec;
    aw.restTotal = sec;
    updateRestDisplay();
    document.getElementById('restBanner').hidden = false;
  }

  function hideRestBanner() {
    getState().activeWorkout.restSeconds = 0;
    document.getElementById('restBanner').hidden = true;
  }

  function adjustRest(delta) {
    const aw = getState().activeWorkout;
    aw.restDuration = Math.max(15, Math.min(300, (aw.restDuration || REST_DEFAULT) + delta));
    if (aw.restSeconds > 0) {
      aw.restSeconds = Math.max(0, aw.restSeconds + delta);
      aw.restTotal = Math.max(aw.restSeconds, aw.restTotal);
      updateRestDisplay();
    }
    persist();
  }

  function updateTimerDisplay() {
    const total = getState().activeWorkout.elapsed || 0;
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    const el = document.getElementById('workoutTimer');
    if (el) el.textContent = `${m}:${s}`;
  }

  function updateRestDisplay() {
    const aw = getState().activeWorkout;
    const s = aw.restSeconds;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    document.getElementById('restTimer').textContent = `${m}:${String(sec).padStart(2, '0')}`;
    const pct = aw.restTotal ? ((aw.restTotal - s) / aw.restTotal) * 100 : 100;
    document.getElementById('restBarFill').style.width = `${pct}%`;
    document.getElementById('restDurationLabel').textContent = `${aw.restDuration || REST_DEFAULT}초`;
  }

  function ensureTimer() {
    if (timerRunning) return;
    timerRunning = true;
    const aw = getState().activeWorkout;
    if (!aw.startTime) aw.startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(tickWorkoutTimer, 1000);
  }

  function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
  }

  /* ── Session actions ── */

  function startWorkoutSession() {
    const s = getState();
    const routine = getActiveRoutine();
    if (!routine?.exercises?.length) {
      alert('운동을 먼저 추가해주세요.');
      return;
    }

    s.activeWorkout = {
      status: 'active',
      routineId: routine.id,
      elapsed: 0,
      startTime: Date.now(),
      restSeconds: 0,
      restTotal: REST_DEFAULT,
      restDuration: REST_DEFAULT,
      currentExIdx: 0,
      sessionNote: '',
      voiceNoteReady: true,
      aiFeedback: null,
      exercises: buildSessionExercises(routine),
    };
    ensureTimer();
    persist();
    if (typeof FitSpaceAIMemory !== 'undefined') {
      FitSpaceAIMemory.linkWatchToWorkout('aw' + Date.now());
    }
    renderWorkout();
  }

  function adjustCurrent(field, delta) {
    const aw = getState().activeWorkout;
    const ex = aw.exercises[aw.currentExIdx];
    if (!ex) return;
    if (field === 'weight') {
      ex.currentWeight = Math.max(0, Math.round((ex.currentWeight + delta) * 10) / 10);
    } else {
      ex.currentReps = Math.max(1, ex.currentReps + delta);
    }
    persist();
    renderFocusSession();
  }

  function completeSet() {
    const aw = getState().activeWorkout;
    const ex = aw.exercises[aw.currentExIdx];
    if (!ex) return;

    ex.sets.push({
      weight: ex.currentWeight,
      reps: ex.currentReps,
      rpe: ex.currentRpe,
      completedAt: Date.now(),
    });

    if (typeof FitSpaceGrowth !== 'undefined') {
      FitSpaceGrowth.onSetComplete(ex.name, ex.sets[ex.sets.length - 1]);
    }

    ensureTimer();
    const planned = ex.plan?.sets || ex.targetSets || 4;
    const isLastSet = ex.sets.length >= planned;
    const isLastEx = aw.currentExIdx >= aw.exercises.length - 1;

    if (isLastSet) {
      if (typeof FitSpaceGrowth !== 'undefined') {
        FitSpaceGrowth.onExerciseComplete(ex.name, ex.sets);
      }
    }

    if (isLastSet && isLastEx) {
      persist();
      renderFocusSession();
      return;
    }

    startRestTimer();
    persist();
    renderFocusSession();
  }

  function skipExercise() {
    const aw = getState().activeWorkout;
    if (aw.currentExIdx < aw.exercises.length - 1) {
      aw.currentExIdx++;
      hideRestBanner();
      persist();
      renderFocusSession();
    }
  }

  function finishWorkoutSession() {
    const aw = getState().activeWorkout;
    const stats = calcSessionStats(aw.exercises);
    if (stats.sets === 0 && !confirm('기록된 세트가 없습니다. 종료할까요?')) return;

    stopTimer();
    hideRestBanner();
    aw.status = 'summary';
    aw.summaryStats = stats;
    aw.aiFeedback = FitSpaceWorkoutAI.analyzeSession(getState(), aw);
    if (typeof FitSpaceAIMemory !== 'undefined') {
      const watch = FitSpaceAIMemory.finishWatchSession();
      if (watch) aw.watchSummary = watch;
    }
    persist();
    renderWorkout();
  }

  function saveWorkoutAndReset() {
    const s = getState();
    const aw = s.activeWorkout;
    const routine = getActiveRoutine();
    if (!routine) return;

    const stats = aw.summaryStats || calcSessionStats(aw.exercises);
    const sessionPRs = aw.sessionPRs || [];
    s.workoutHistory.unshift({
      date: window.today(),
      name: routine.name,
      routineId: aw.routineId,
      duration: Math.max(1, Math.round(aw.elapsed / 60)),
      sessionNote: aw.sessionNote || '',
      aiFeedback: aw.aiFeedback,
      newPRs: sessionPRs,
      exercises: aw.exercises.map(ex => ({
        name: ex.name,
        plan: ex.plan,
        note: ex.note || '',
        sets: ex.sets.map(set => ({ weight: set.weight, reps: set.reps, rpe: set.rpe })),
      })),
    });

    s.daily.workoutDone = true;
    window.getTodayChecklist().workout = true;

    const savedSession = s.workoutHistory[0];
    let newAch = [];
    if (typeof FitSpaceGrowth !== 'undefined') {
      newAch = FitSpaceGrowth.updateLifetimeAfterWorkout({
        ...savedSession, elapsed: aw.elapsed, exercises: aw.exercises,
      }) || [];
      if (newAch.length) savedSession.newAchievements = newAch.map(a => a.id);
    }

    persist();

    s.activeWorkout = {
      status: 'idle', routineId: s.activeRoutineId, elapsed: 0, startTime: null,
      restSeconds: 0, restTotal: REST_DEFAULT, restDuration: REST_DEFAULT,
      currentExIdx: 0, sessionNote: '', exercises: [], aiFeedback: null, sessionPRs: [],
    };
    persist();

    if (newAch.length) {
      window.showModal('🏆 Achievement 달성!', `
        <div class="achievement-unlock-list">
          ${newAch.map(a => `<div class="achievement-unlock">
            <span class="achievement-unlock__emoji">${a.emoji}</span>
            <strong>${a.title}</strong>
            <p>${a.desc}</p>
          </div>`).join('')}
        </div>
        <button type="button" class="btn btn--primary btn--full" id="achUnlockDone">멋져요!</button>`);
      document.getElementById('achUnlockDone')?.addEventListener('click', () => {
        window.hideModal();
        window.navigate('dashboard');
      });
      return;
    }

    window.navigate('dashboard');
  }

  function formatPrevSets(sets) {
    if (!sets?.length) return '기록 없음';
    return sets.map(s => s.weight ? `${s.weight}kg · ${s.reps}` : `${s.reps}회`).join('  ');
  }

  /* ── Planner ── */

  function renderPlanner() {
    const s = getState();
    const routine = editingRoutineId
      ? s.routines.find(r => r.id === editingRoutineId)
      : getActiveRoutine();

    const plannerEl = document.getElementById('workoutPlanner');
    if (!plannerEl) return;

    if (!routine) {
      plannerEl.innerHTML = '<p class="text-muted">루틴을 선택하거나 새로 만들어주세요.</p>';
      return;
    }

    s.activeRoutineId = routine.id;
    const sorted = [...routine.exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    plannerEl.innerHTML = `
      <div class="planner-header">
        <div>
          <h2 class="planner-title">${routine.name}</h2>
          <p class="planner-sub">${sorted.length}종목 · 드래그하여 순서 변경</p>
        </div>
        <button class="btn btn--primary planner-start" id="startWorkoutBtn">운동 시작</button>
      </div>

      <ul class="planner-list" id="plannerList">
        ${sorted.map((ex, i) => `
          <li class="planner-item" draggable="true" data-idx="${i}" data-id="${ex.id}">
            <span class="planner-drag" aria-hidden="true">⠿</span>
            <div class="planner-item__body">
              <input class="planner-item__name input" data-field="name" data-id="${ex.id}" value="${ex.name}" />
              <div class="planner-item__plan">
                <label><span>kg</span><input type="number" class="input planner-num" data-field="weight" data-id="${ex.id}" value="${ex.weight || ''}" step="0.5" inputmode="decimal" /></label>
                <label><span>회</span><input type="number" class="input planner-num" data-field="reps" data-id="${ex.id}" value="${ex.reps || ''}" inputmode="numeric" /></label>
                <label><span>세트</span><input type="number" class="input planner-num" data-field="sets" data-id="${ex.id}" value="${ex.sets || ''}" inputmode="numeric" /></label>
              </div>
              <div class="planner-media-row">
                <button type="button" class="btn btn--ghost btn--sm planner-media-btn" data-media="${ex.name}">📎 미디어</button>
              </div>
            </div>
            <button class="planner-item__del" data-id="${ex.id}" aria-label="삭제">✕</button>
          </li>`).join('')}
      </ul>

      <form class="planner-add" id="plannerAddForm">
        <input type="text" class="input" id="plannerNewName" placeholder="운동 이름 (예: 랫풀다운)" required />
        <button type="submit" class="btn btn--secondary">+ 추가</button>
      </form>`;

    bindPlannerEvents(routine.id);
  }

  function bindPlannerEvents(routineId) {
    document.getElementById('startWorkoutBtn')?.addEventListener('click', startWorkoutSession);

    document.getElementById('plannerAddForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('plannerNewName').value.trim();
      if (!name) return;
      const routine = getState().routines.find(r => r.id === routineId);
      routine.exercises.push(normalizeExercise({
        name, sets: 4, reps: 12, weight: 0, order: routine.exercises.length,
      }));
      persist();
      renderPlanner();
    });

    document.querySelectorAll('.planner-item__name, .planner-num').forEach(input => {
      input.addEventListener('change', () => {
        const routine = getState().routines.find(r => r.id === routineId);
        const ex = routine.exercises.find(x => x.id === input.dataset.id);
        if (!ex) return;
        const f = input.dataset.field;
        ex[f] = f === 'name' ? input.value.trim() : (+input.value || 0);
        persist();
      });
    });

    document.querySelectorAll('.planner-item__del').forEach(btn => {
      btn.addEventListener('click', () => {
        const routine = getState().routines.find(r => r.id === routineId);
        routine.exercises = routine.exercises.filter(x => x.id !== btn.dataset.id);
        persist();
        renderPlanner();
      });
    });

    document.querySelectorAll('.planner-media-btn').forEach(btn => {
      btn.addEventListener('click', () => openMediaModal(btn.dataset.media));
    });

    setupDragDrop(routineId);
  }

  function setupDragDrop(routineId) {
    const list = document.getElementById('plannerList');
    if (!list) return;

    list.querySelectorAll('.planner-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrcIdx = +item.dataset.idx;
        item.classList.add('planner-item--dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => item.classList.remove('planner-item--dragging'));
      item.addEventListener('dragover', e => {
        e.preventDefault();
        item.classList.add('planner-item--over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('planner-item--over'));
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('planner-item--over');
        const tgtIdx = +item.dataset.idx;
        if (dragSrcIdx == null || dragSrcIdx === tgtIdx) return;
        const routine = getState().routines.find(r => r.id === routineId);
        const sorted = [...routine.exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const [moved] = sorted.splice(dragSrcIdx, 1);
        sorted.splice(tgtIdx, 0, moved);
        sorted.forEach((ex, i) => { ex.order = i; });
        routine.exercises = sorted;
        dragSrcIdx = null;
        persist();
        renderPlanner();
      });
    });
  }

  function openMediaModal(exerciseName) {
    const media = getMedia(exerciseName);
    window.showModal(`${exerciseName} — 미디어`, `
      <div class="media-form">
        <label class="form-group">참고 영상 링크<input type="url" class="input" id="mediaLink" value="${media.link || ''}" placeholder="YouTube URL" /></label>
        <label class="form-group">운동 사진<input type="file" id="mediaPhoto" accept="image/*" /></label>
        ${media.photo ? `<img src="${media.photo}" class="media-preview" alt="" />` : ''}
        <label class="form-group">참고 이미지<input type="file" id="mediaRefImage" accept="image/*" /></label>
        ${media.refImage ? `<img src="${media.refImage}" class="media-preview" alt="" />` : ''}
        <p class="text-muted media-hint">음성 메모는 향후 지원 예정입니다.</p>
        <button type="button" class="btn btn--primary btn--full" id="mediaSaveBtn">저장</button>
      </div>`);

    document.getElementById('mediaSaveBtn').addEventListener('click', () => {
      const patch = { link: document.getElementById('mediaLink').value.trim() };
      setMedia(exerciseName, patch);
      window.hideModal();
    });

    const readFile = (inputId, key) => {
      const file = document.getElementById(inputId)?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { setMedia(exerciseName, { [key]: reader.result }); };
      reader.readAsDataURL(file);
    };
    document.getElementById('mediaPhoto')?.addEventListener('change', () => readFile('mediaPhoto', 'photo'));
    document.getElementById('mediaRefImage')?.addEventListener('change', () => readFile('mediaRefImage', 'refImage'));
  }

  /* ── Focus session ── */

  function renderFocusSession() {
    const aw = getState().activeWorkout;
    const ex = aw.exercises[aw.currentExIdx];
    const el = document.getElementById('gymFocus');
    if (!el || !ex) return;

    const planned = ex.plan?.sets || ex.targetSets || 4;
    const setNum = ex.sets.length + 1;
    const allDone = ex.sets.length >= planned && aw.currentExIdx === aw.exercises.length - 1
      && ex.sets.length > 0;

    const progress = aw.exercises.map((e, i) =>
      `<span class="focus-progress__dot ${i < aw.currentExIdx ? 'focus-progress__dot--done' : ''} ${i === aw.currentExIdx ? 'focus-progress__dot--active' : ''}"></span>`
    ).join('');

    const doneSets = ex.sets.map((s, i) =>
      `<div class="focus-done-set"><span>${i + 1}</span>${s.weight ? s.weight + 'kg' : '—'} × ${s.reps}${s.rpe ? ` · RPE ${s.rpe}` : ''}</div>`
    ).join('');

    el.innerHTML = `
      <div class="focus-progress">${progress}</div>
      <div class="focus-card">
        <p class="focus-plan-label">계획 · ${planned}세트 × ${ex.plan?.reps || ex.targetReps}회 @ ${ex.plan?.weight || ex.targetWeight || 0}kg</p>
        <h2 class="focus-name">${ex.name}</h2>
        <p class="focus-set-label">SET ${Math.min(setNum, planned)} / ${planned}</p>

        <div class="focus-values">
          <div class="focus-value-block">
            <span class="focus-value-label">무게</span>
            <span class="focus-value" id="focusWeight">${ex.currentWeight || 0}</span>
            <span class="focus-value-unit">kg</span>
          </div>
          <div class="focus-value-block">
            <span class="focus-value-label">횟수</span>
            <span class="focus-value" id="focusReps">${ex.currentReps || 0}</span>
            <span class="focus-value-unit">회</span>
          </div>
        </div>

        <div class="focus-adjust">
          <button class="focus-adj-btn" data-adj="weight" data-d="-2.5">−2.5kg</button>
          <button class="focus-adj-btn" data-adj="weight" data-d="2.5">+2.5kg</button>
          <button class="focus-adj-btn" data-adj="reps" data-d="-1">−1회</button>
          <button class="focus-adj-btn" data-adj="reps" data-d="1">+1회</button>
        </div>

        <div class="focus-rpe">
          <span class="focus-rpe-label">RPE (선택)</span>
          <div class="focus-rpe-btns">
            ${[6, 7, 8, 9, 10].map(n =>
              `<button type="button" class="focus-rpe-btn ${ex.currentRpe === n ? 'focus-rpe-btn--on' : ''}" data-rpe="${n}">${n}</button>`
            ).join('')}
          </div>
        </div>

        ${allDone
          ? `<button class="btn btn--primary btn--full focus-complete" id="focusFinishAll">운동 종료하기</button>`
          : `<button class="btn btn--primary btn--full focus-complete" id="focusCompleteSet">세트 완료</button>`}

        ${doneSets ? `<div class="focus-done-sets">${doneSets}</div>` : ''}

        <label class="focus-note">
          <span>운동 메모</span>
          <textarea class="input" id="exerciseNote" rows="2" placeholder="오늘 광배 자극이 잘 왔다...">${ex.note || ''}</textarea>
        </label>
      </div>

      <div class="focus-prev card">
        <h3 class="focus-prev__title">지난 운동</h3>
        <p class="focus-prev__name">${ex.name}</p>
        <div class="focus-prev__sets">${formatPrevSets(ex.prevSets).split('  ').map(s =>
          `<span class="focus-prev__set">${s}</span>`).join('') || '<span class="text-muted">기록 없음</span>'}
        </div>
      </div>

      <div class="focus-nav">
        ${aw.currentExIdx < aw.exercises.length - 1
          ? `<button class="btn btn--ghost" id="focusSkipEx">다음 운동으로 →</button>` : ''}
      </div>`;

    document.querySelectorAll('.focus-adj-btn').forEach(btn => {
      btn.addEventListener('click', () => adjustCurrent(btn.dataset.adj, +btn.dataset.d));
    });
    document.querySelectorAll('.focus-rpe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ex.currentRpe = ex.currentRpe === +btn.dataset.rpe ? null : +btn.dataset.rpe;
        persist();
        renderFocusSession();
      });
    });
    document.getElementById('focusCompleteSet')?.addEventListener('click', completeSet);
    document.getElementById('focusFinishAll')?.addEventListener('click', finishWorkoutSession);
    document.getElementById('focusSkipEx')?.addEventListener('click', skipExercise);
    document.getElementById('exerciseNote')?.addEventListener('input', e => {
      ex.note = e.target.value;
      persist();
    });
  }

  /* ── Summary ── */

  function renderSummary() {
    const aw = getState().activeWorkout;
    const routine = getActiveRoutine();
    const stats = aw.summaryStats || calcSessionStats(aw.exercises);
    const ai = aw.aiFeedback;
    const m = Math.floor(aw.elapsed / 60);
    const s = aw.elapsed % 60;

    document.getElementById('summaryRoutineName').textContent = routine?.name || '';
    document.getElementById('summaryStats').innerHTML = `
      <div class="gym-summary-stat"><span class="gym-summary-stat__val">${m}:${String(s).padStart(2, '0')}</span><span class="gym-summary-stat__lbl">시간</span></div>
      <div class="gym-summary-stat"><span class="gym-summary-stat__val">${stats.sets}</span><span class="gym-summary-stat__lbl">세트</span></div>
      <div class="gym-summary-stat"><span class="gym-summary-stat__val">${(stats.volume / 1000).toFixed(1)}t</span><span class="gym-summary-stat__lbl">볼륨</span></div>
      <div class="gym-summary-stat"><span class="gym-summary-stat__val">${ai?.stats?.completion ?? 0}%</span><span class="gym-summary-stat__lbl">계획 달성</span></div>`;

    document.getElementById('summaryAiCoach').innerHTML = (() => {
      const prs = aw.sessionPRs || [];
      let html = '';
      if (prs.length) {
        html += `<div class="summary-pr-banner">
          <span class="summary-pr-banner__emoji">🎉</span>
          <div>
            <strong>새 Personal Record ${prs.length}개!</strong>
            <p>${prs.map(p => `${p.exercise} ${p.display || p.value}`).slice(0, 3).join(' · ')}</p>
          </div>
        </div>`;
      }
      if (ai) {
        html += `<div class="summary-coach">
          <h3 class="summary-coach__title">🤖 AI 코치</h3>
          <p class="summary-coach__lead">${ai.summary}</p>
          <ul class="summary-coach__list">${ai.messages.map(msg => `<li>${msg}</li>`).join('')}</ul>
        </div>`;
      }
      if (aw.watchSummary) {
        html += `<div class="summary-watch card">
          <h4>⌚ 워치 연동</h4>
          <p>평균 심박 ${aw.watchSummary.heartRateAvg}bpm · 최대 ${aw.watchSummary.heartRateMax}bpm · ${aw.watchSummary.calories}kcal</p>
        </div>`;
      }
      return html;
    })();

    document.getElementById('summaryCompare').innerHTML = aw.exercises
      .filter(ex => ex.sets.length || ex.plan)
      .map(ex => {
        const plan = ex.plan || {};
        const plannedStr = `${plan.weight || 0}kg × ${plan.reps} × ${plan.sets}세트`;
        const actualStr = ex.sets.map(set => `${set.weight || 0}kg · ${set.reps}`).join(' / ') || '—';
        return `<div class="compare-row">
          <div class="compare-row__name">${ex.name}</div>
          <div class="compare-row__cols">
            <div class="compare-col compare-col--plan">
              <span class="compare-col__label">계획</span>
              <span>${plannedStr}</span>
            </div>
            <div class="compare-col compare-col--actual">
              <span class="compare-col__label">실제</span>
              <span>${actualStr}</span>
            </div>
          </div>
          ${ex.note ? `<p class="compare-note">📝 ${ex.note}</p>` : ''}
        </div>`;
      }).join('');

    const noteEl = document.getElementById('sessionNoteInput');
    if (noteEl) {
      noteEl.value = aw.sessionNote || '';
      noteEl.oninput = () => { aw.sessionNote = noteEl.value; persist(); };
    }
  }

  /* ── Routines list ── */

  function renderRoutineList() {
    const el = document.getElementById('routineList');
    if (!el) return;
    el.innerHTML = getState().routines.map(r => `
      <div class="routine-card ${r.id === editingRoutineId ? 'routine-card--active' : ''}" data-routine="${r.id}">
        <div>
          <div class="routine-card__name">${r.name}</div>
          <div class="routine-card__meta">${r.exercises.length}종목 · ${getLastWorkoutForRoutine(r.id) ? '이전 기록 있음' : '신규'}</div>
        </div>
        <div class="routine-card__actions">
          <button class="btn btn--primary btn--sm routine-edit" data-routine="${r.id}">편집</button>
          <button class="btn btn--ghost btn--sm routine-delete" data-routine="${r.id}">✕</button>
        </div>
      </div>`).join('');

    document.querySelectorAll('.routine-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        editingRoutineId = btn.dataset.routine;
        getState().activeRoutineId = editingRoutineId;
        persist();
        switchWorkoutTab('plan');
        renderWorkout();
      });
    });
    document.querySelectorAll('.routine-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('루틴을 삭제할까요?')) return;
        getState().routines = getState().routines.filter(r => r.id !== btn.dataset.routine);
        if (editingRoutineId === btn.dataset.routine) editingRoutineId = getState().routines[0]?.id || null;
        persist();
        renderWorkout();
      });
    });
  }

  function renderGrowth() {
    if (typeof FitSpaceGrowth !== 'undefined') {
      FitSpaceGrowth.renderDashboard(false);
    }
  }

  function renderHistory() {
    const el = document.getElementById('workoutHistory');
    if (!el) return;
    const history = getState().workoutHistory;
    el.innerHTML = history.length
      ? history.map(w => {
        const setCount = (w.exercises || []).reduce((s, e) => s + (e.sets?.length || 0), 0);
        const completion = w.aiFeedback?.stats?.completion;
        return `<div class="history-item history-item--expandable" data-id="${w.date}-${w.routineId}">
          <div class="history-item__head">
            <div>
              <div class="history-item__name">${w.name}</div>
              <div class="history-item__date">${fmtDate(w.date)} · ${setCount}세트 · ${w.duration}분${completion != null ? ` · ${completion}%` : ''}</div>
            </div>
            <span class="history-item__chev">›</span>
          </div>
          <div class="history-item__detail" hidden>
            ${(w.exercises || []).map(ex => {
              const plan = ex.plan || {};
              return `<div class="history-compare">
                <strong>${ex.name}</strong>
                <div class="history-compare__row"><span>계획</span>${plan.weight || 0}kg×${plan.reps}×${plan.sets}</div>
                <div class="history-compare__row"><span>실제</span>${(ex.sets || []).map(s => `${s.weight}×${s.reps}`).join(' · ')}</div>
              </div>`;
            }).join('')}
            ${w.sessionNote ? `<p class="history-note">📝 ${w.sessionNote}</p>` : ''}
          </div>
        </div>`;
      }).join('')
      : '<p class="text-muted">아직 운동 기록이 없어요</p>';

    document.querySelectorAll('.history-item--expandable').forEach(item => {
      item.querySelector('.history-item__head')?.addEventListener('click', () => {
        const detail = item.querySelector('.history-item__detail');
        detail.hidden = !detail.hidden;
        item.classList.toggle('history-item--open');
      });
    });
  }

  function switchWorkoutTab(tab) {
    document.querySelectorAll('[data-workout-tab]').forEach(b =>
      b.classList.toggle('active', b.dataset.workoutTab === tab));
    document.querySelectorAll('.workout-panel').forEach(p => p.classList.remove('active'));
    const panelMap = { plan: 'Plan', routines: 'Routines', growth: 'Growth', history: 'History' };
    document.getElementById(`workoutPanel${panelMap[tab]}`)?.classList.add('active');
  }

  /* ── Main render ── */

  function renderWorkout() {
    const aw = getState().activeWorkout;
    const isActive = aw.status === 'active';
    const isSummary = aw.status === 'summary';
    const isIdle = !isActive && !isSummary;

    document.getElementById('gymBar').hidden = !isActive;
    document.getElementById('gymFocus').hidden = !isActive;
    document.getElementById('gymSummary').hidden = !isSummary;
    document.getElementById('workoutPlannerWrap').hidden = isActive || isSummary;
    document.querySelector('.gym-secondary').style.display = isActive || isSummary ? 'none' : '';

    if (isSummary) {
      stopTimer();
      renderSummary();
      return;
    }

    if (isActive) {
      if (!timerRunning) ensureTimer();
      renderFocusSession();
      updateTimerDisplay();
      updateRestDisplay();
      return;
    }

    if (!editingRoutineId) editingRoutineId = getState().activeRoutineId;
    renderRoutineSelect();
    renderPlanner();
    renderRoutineList();
    renderGrowth();
    renderHistory();
  }

  function renderRoutineSelect() {
    const sel = document.getElementById('gymRoutineSelect');
    if (!sel) return;
    sel.innerHTML = getState().routines.map(r =>
      `<option value="${r.id}" ${r.id === (editingRoutineId || getState().activeRoutineId) ? 'selected' : ''}>${r.name}</option>`
    ).join('');
    sel.onchange = () => {
      editingRoutineId = sel.value;
      getState().activeRoutineId = sel.value;
      persist();
      renderPlanner();
      renderRoutineList();
    };
  }

  function initWorkout() {
    migrateWorkoutData(getState());

    document.getElementById('finishWorkout')?.addEventListener('click', finishWorkoutSession);
    document.getElementById('summaryDone')?.addEventListener('click', saveWorkoutAndReset);
    document.getElementById('restSkip')?.addEventListener('click', hideRestBanner);
    document.getElementById('restMinus')?.addEventListener('click', () => adjustRest(-15));
    document.getElementById('restPlus')?.addEventListener('click', () => adjustRest(15));

    document.querySelectorAll('[data-workout-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchWorkoutTab(btn.dataset.workoutTab);
        if (btn.dataset.workoutTab === 'plan') renderPlanner();
        if (btn.dataset.workoutTab === 'growth') renderGrowth();
      });
    });

    document.getElementById('createRoutineBtn')?.addEventListener('click', () => {
      window.showModal('새 루틴', `
        <form class="form" id="newRoutineForm">
          <div class="form-group"><label>루틴 이름</label>
            <input type="text" class="input" id="newRoutineName" placeholder="Push / Pull / Legs" required /></div>
          <p class="text-muted">빠른 템플릿</p>
          <div class="template-btns">
            <button type="button" class="btn btn--secondary btn--sm template-btn" data-t="pull">Pull (등)</button>
            <button type="button" class="btn btn--secondary btn--sm template-btn" data-t="push">Push (가슴)</button>
            <button type="button" class="btn btn--secondary btn--sm template-btn" data-t="legs">Legs (하체)</button>
          </div>
          <button type="submit" class="btn btn--primary btn--full">만들기</button>
        </form>`);

      const templates = {
        pull: [
          { name: '랫풀다운', sets: 4, reps: 12, weight: 45 },
          { name: '시티드로우', sets: 4, reps: 12, weight: 40 },
          { name: '원암 덤벨로우', sets: 3, reps: 12, weight: 20 },
          { name: '풀오버', sets: 3, reps: 12, weight: 15 },
        ],
        push: [
          { name: '벤치프레스', sets: 4, reps: 10, weight: 60 },
          { name: '체스트프레스', sets: 3, reps: 12, weight: 50 },
          { name: '케이블 플라이', sets: 3, reps: 15, weight: 12 },
        ],
        legs: [
          { name: '스쿼트', sets: 4, reps: 8, weight: 80 },
          { name: '레그프레스', sets: 4, reps: 12, weight: 120 },
          { name: '레그컬', sets: 3, reps: 12, weight: 35 },
          { name: '레그익스텐션', sets: 3, reps: 15, weight: 40 },
        ],
      };

      let picked = [];
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          picked = templates[btn.dataset.t] || [];
          document.getElementById('newRoutineName').value = btn.textContent.split(' ')[0];
        });
      });

      document.getElementById('newRoutineForm').addEventListener('submit', ev => {
        ev.preventDefault();
        const id = 'r' + Date.now();
        const exercises = picked.length
          ? picked.map((ex, i) => normalizeExercise({ ...ex, order: i }))
          : [];
        getState().routines.push({ id, name: document.getElementById('newRoutineName').value.trim(), exercises });
        editingRoutineId = id;
        getState().activeRoutineId = id;
        persist();
        window.hideModal();
        switchWorkoutTab('plan');
        renderWorkout();
      });
    });
  }

  return { initWorkout, renderWorkout, migrateWorkoutData, startWorkoutSession };
})();
