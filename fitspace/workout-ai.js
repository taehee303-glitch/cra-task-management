/* FitSpace — AI Workout Coach (post-session analysis only) */

const FitSpaceWorkoutAI = (() => {
  function calcVolume(exercises) {
    let sets = 0, reps = 0, volume = 0;
    (exercises || []).forEach(ex => {
      (ex.sets || []).forEach(s => {
        sets++;
        reps += s.reps || 0;
        volume += (s.weight || 0) * (s.reps || 0);
      });
    });
    return { sets, reps, volume };
  }

  function getLastSessionForRoutine(state, routineId) {
    return (state.workoutHistory || []).find(w => w.routineId === routineId);
  }

  function getLastWeekSessions(state) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return (state.workoutHistory || []).filter(w => new Date(w.date + 'T12:00:00') >= weekAgo);
  }

  function planCompletionRate(session) {
    const exercises = session.exercises || [];
    if (!exercises.length) return 0;
    let planned = 0, done = 0;
    exercises.forEach(ex => {
      const target = ex.plan?.sets || ex.targetSets || 0;
      planned += target;
      done += Math.min((ex.sets || []).length, target || (ex.sets || []).length);
    });
    if (!planned) return exercises.every(e => (e.sets || []).length) ? 100 : 0;
    return Math.round((done / planned) * 100);
  }

  function comparePlanActual(ex) {
    const plan = ex.plan || { sets: ex.targetSets, reps: ex.targetReps, weight: ex.targetWeight };
    const plannedSets = plan.sets || 0;
    const actual = ex.sets || [];
    const matched = actual.slice(0, plannedSets);
    let hit = 0;
    matched.forEach((s, i) => {
      const pw = plan.weight || 0;
      const pr = plan.reps || 0;
      if ((s.weight || 0) >= pw * 0.95 && (s.reps || 0) >= pr * 0.9) hit++;
    });
    return { plannedSets, actualSets: actual.length, hitRate: plannedSets ? Math.round(hit / plannedSets * 100) : 100 };
  }

  function analyzeSession(state, session) {
    const stats = calcVolume(session.exercises);
    const last = getLastSessionForRoutine(state, session.routineId);
    const lastStats = last ? calcVolume(last.exercises) : null;
    const completion = planCompletionRate(session);

    const messages = [];
    const name = state.profile?.name?.split(' ')[0] || '회원';

    messages.push(`오늘 ${stats.sets}세트, 총 볼륨 ${(stats.volume / 1000).toFixed(1)}톤을 수행했습니다.`);

    if (lastStats) {
      const volDiff = stats.volume - lastStats.volume;
      if (volDiff > 0) messages.push(`지난 ${last.name || '운동'} 대비 볼륨이 ${(volDiff / 1000).toFixed(1)}톤 증가했습니다.`);
      else if (volDiff < -500) messages.push(`볼륨이 지난번보다 줄었지만, 회복 주간으로 활용해도 좋습니다.`);
    }

    session.exercises.forEach(ex => {
      if (!ex.sets?.length) return;
      const cmp = comparePlanActual(ex);
      const lastSet = ex.sets[ex.sets.length - 1];
      const firstSet = ex.sets[0];
      if (ex.sets.length >= 2 && lastSet.reps < firstSet.reps) {
        messages.push(`${ex.name}: 마지막 세트에서 반복 횟수가 감소했지만 좋은 페이스를 유지했습니다.`);
      }
      if (cmp.hitRate >= 90) {
        messages.push(`${ex.name}: 계획 대비 ${cmp.hitRate}% 달성 — 훌륭합니다.`);
      } else if (cmp.hitRate < 70 && cmp.plannedSets) {
        messages.push(`${ex.name}: 계획 대비 ${cmp.hitRate}% — 다음에는 중량 또는 횟수를 조정해보세요.`);
      }
      const planW = ex.plan?.weight;
      if (planW && firstSet.weight >= planW && cmp.hitRate >= 80) {
        messages.push(`다음 주 ${ex.name} 첫 세트만 ${planW + 2.5}kg 도전을 추천합니다.`);
      }
    });

    messages.push(`오늘 계획한 운동의 ${completion}%를 완료했습니다.`);

    const durationMin = Math.max(1, Math.round((session.elapsed || 0) / 60));
    return {
      summary: `${name}님, 수고하셨습니다!`,
      messages: messages.slice(0, 6),
      stats: { ...stats, durationMin, completion },
      vsLast: lastStats ? {
        volumeDelta: stats.volume - lastStats.volume,
        setsDelta: stats.sets - lastStats.sets,
      } : null,
    };
  }

  function getExerciseProgress(state, exerciseName, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const sessions = (state.workoutHistory || []).filter(w =>
      new Date(w.date + 'T12:00:00') >= cutoff
    );
    const points = [];
    sessions.slice().reverse().forEach(w => {
      const ex = (w.exercises || []).find(e => e.name === exerciseName);
      if (!ex?.sets?.length) return;
      const topWeight = Math.max(...ex.sets.map(s => s.weight || 0));
      const vol = ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
      points.push({ date: w.date, topWeight, volume: vol });
    });
    return points;
  }

  function getPersonalGrowth(state) {
    const exerciseNames = new Set();
    (state.workoutHistory || []).forEach(w =>
      (w.exercises || []).forEach(e => exerciseNames.add(e.name))
    );

    const growers = [];
    const plateaus = [];

    exerciseNames.forEach(name => {
      const pts = getExerciseProgress(state, name, 30);
      if (pts.length < 2) return;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const weightDelta = last.topWeight - first.topWeight;
      const volDelta = last.volume - first.volume;
      if (weightDelta >= 5 || volDelta >= 500) {
        growers.push({ name, weightDelta, volDelta });
      } else if (pts.length >= 4 && Math.abs(weightDelta) < 2.5) {
        plateaus.push({ name, sessions: pts.length });
      }
    });

    growers.sort((a, b) => b.weightDelta - a.weightDelta);
    plateaus.sort((a, b) => b.sessions - a.sessions);

    const tips = [];
    if (plateaus.length) {
      tips.push('정체된 운동은 휴식 시간을 15–30초 늘려보세요.');
      tips.push('반복 횟수를 2–3회 조정하거나 템포를 천천히 해보세요.');
      tips.push('다음 주에는 중량보다 자세에 집중하는 가벼운 세트를 추가해보세요.');
    } else if (growers.length) {
      tips.push('성장세를 유지하려면 수면과 단백질 섭취를 꾸준히 챙기세요.');
    } else {
      tips.push('꾸준한 기록이 쌓이면 더 정확한 분석을 제공할 수 있어요.');
    }

    return {
      topGrowers: growers.slice(0, 5),
      plateaus: plateaus.slice(0, 5),
      tips: tips.slice(0, 3),
      monthlySessions: getLastWeekSessions(state).length * 4,
    };
  }

  function getWeeksOfProgress(state, exerciseName) {
    const pts = getExerciseProgress(state, exerciseName, 42);
    return pts.length;
  }

  function getPRCelebrationMessage(state, evt) {
    const msgs = [];
    const weeks = getWeeksOfProgress(state, evt.exercise);
    if (weeks >= 4) msgs.push(`지난 ${weeks}주 동안 꾸준히 성장한 결과입니다.`);
    msgs.push('오늘 정말 좋은 컨디션이었습니다.');
    if (evt.type === 'maxWeight' && typeof evt.value === 'number') {
      msgs.push(`다음 목표는 ${evt.value + 2.5}kg입니다.`);
    }
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  function getGrowthCoachInsights(state) {
    const insights = [];
    const exerciseNames = new Set();
    (state.workoutHistory || []).forEach(w =>
      (w.exercises || []).forEach(e => exerciseNames.add(e.name))
    );

    exerciseNames.forEach(name => {
      const pts = getExerciseProgress(state, name, 42);
      if (pts.length < 3) return;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const wDelta = last.topWeight - first.topWeight;
      const weeks = pts.length;
      if (wDelta >= 5) {
        insights.push(`${name}은(는) 최근 ${weeks}주 동안 꾸준히 성장하고 있습니다.`);
      } else if (weeks >= 3 && Math.abs(wDelta) < 2.5) {
        insights.push(`${name}은(는) 최근 ${weeks}주 동안 기록 변화가 없습니다.`);
      }
    });

    const legVol = getExerciseProgress(state, '레그프레스', 14);
    const squatVol = getExerciseProgress(state, '스쿼트', 14);
    if (legVol.length >= 2 && legVol[legVol.length - 1].volume > legVol[0].volume * 1.2) {
      insights.push('최근 하체 운동의 볼륨이 크게 증가했습니다.');
    } else if (squatVol.length >= 2 && squatVol[squatVol.length - 1].volume > squatVol[0].volume * 1.2) {
      insights.push('최근 하체 운동의 볼륨이 크게 증가했습니다.');
    }

    const growth = getPersonalGrowth(state);
    if (growth.topGrowers[0]) {
      insights.push(`이번 달 가장 많이 성장한 운동은 ${growth.topGrowers[0].name}입니다.`);
    }

    return insights.slice(0, 5);
  }

  function getMonthlyReview(state) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessions = (state.workoutHistory || []).filter(w =>
      new Date(w.date + 'T12:00:00') >= monthStart
    );
    const volume = sessions.reduce((s, w) =>
      s + calcVolume(w.exercises).volume, 0);
    const hours = Math.round(sessions.reduce((s, w) => s + (w.duration || 0), 0) / 60 * 10) / 10;
    const growth = getPersonalGrowth(state);

    const tips = [];
    if (growth.plateaus.length) {
      tips.push(`다음 달에는 ${growth.plateaus[0].name}의 반복 횟수를 먼저 늘려보세요.`);
    }
    if (sessions.length >= 12) {
      tips.push('현재 운동 패턴이 매우 안정적입니다.');
    } else {
      tips.push('꾸준한 빈도가 성장의 핵심입니다. 주 3–4회를 목표로 해보세요.');
    }

    return {
      workouts: sessions.length,
      hours,
      volumeT: (volume / 1000).toFixed(0),
      newPRs: sessions.reduce((s, w) => s + (w.newPRs?.length || 0), 0),
      topGrowers: growth.topGrowers.slice(0, 3),
      plateaus: growth.plateaus.map(p => p.name),
      tips,
    };
  }

  function recommendGoal(state, exerciseName) {
    const pr = state.personalRecords?.[exerciseName];
    const goal = state.exerciseGoals?.[exerciseName];
    if (!pr || !goal) return '';
    const pts = getExerciseProgress(state, exerciseName, 28);
    if (pts.length < 2) return `다음 주에는 첫 세트만 ${(pr.maxWeight || 0) + 2.5}kg로 시도해보세요.`;
    const wDelta = pts[pts.length - 1].topWeight - pts[0].topWeight;
    const weeksToGoal = wDelta > 0
      ? Math.max(1, Math.ceil((goal.targetWeight - (pr.maxWeight || 0)) / wDelta * pts.length))
      : null;
    if (weeksToGoal) {
      return `현재 성장 속도를 고려하면 약 ${weeksToGoal}주 후 목표 달성이 가능할 것으로 예상됩니다.`;
    }
    return `다음 주에는 첫 세트만 ${(pr.maxWeight || 0) + 2.5}kg로 시도해보세요.`;
  }

  return {
    analyzeSession, getPersonalGrowth, calcVolume, planCompletionRate, comparePlanActual,
    getPRCelebrationMessage, getGrowthCoachInsights, getMonthlyReview, recommendGoal,
    getExerciseProgress,
  };
})();
