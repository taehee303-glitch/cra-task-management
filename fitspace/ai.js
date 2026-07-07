/* FitSpace AI Engine — friendly coach powered by your data */

const FitSpaceAI = (() => {
  const MEAL_IDEAS = {
    breakfast: [
      { name: 'Protein Oatmeal Bowl', calories: 380, protein: 28, carbs: 45, fat: 10, emoji: '🥣', reason: 'High protein to kickstart your morning and hit your daily target.' },
      { name: 'Veggie Egg Scramble', calories: 320, protein: 26, carbs: 12, fat: 18, emoji: '🍳', reason: 'Light but filling — great if you have a workout planned later.' },
      { name: 'Greek Yogurt & Berries', calories: 290, protein: 24, carbs: 32, fat: 6, emoji: '🫐', reason: 'Quick, refreshing, and easy on calories while boosting protein.' },
    ],
    lunch: [
      { name: 'Grilled Chicken Bowl', calories: 480, protein: 42, carbs: 38, fat: 14, emoji: '🥗', reason: 'Balanced macros to keep energy steady through the afternoon.' },
      { name: 'Turkey & Avocado Wrap', calories: 420, protein: 32, carbs: 35, fat: 16, emoji: '🌯', reason: 'Portable and protein-rich — perfect for busy days.' },
      { name: 'Quinoa Buddha Bowl', calories: 450, protein: 18, carbs: 58, fat: 16, emoji: '🥙', reason: 'Plant-forward option with complex carbs for sustained energy.' },
    ],
    dinner: [
      { name: 'Baked Salmon & Asparagus', calories: 520, protein: 40, carbs: 18, fat: 28, emoji: '🐟', reason: 'Omega-3s support recovery — ideal after training days.' },
      { name: 'Lean Beef Stir-Fry', calories: 490, protein: 38, carbs: 42, fat: 16, emoji: '🥩', reason: 'Iron and protein combo to close your protein gap.' },
      { name: 'Tofu Veggie Curry', calories: 410, protein: 22, carbs: 48, fat: 14, emoji: '🍛', reason: 'Lighter dinner that still delivers on flavor and nutrition.' },
    ],
    snack: [
      { name: 'Protein Shake', calories: 200, protein: 30, carbs: 8, fat: 4, emoji: '🥤', reason: 'Fast way to close your protein gap before bed.' },
      { name: 'Apple & Almond Butter', calories: 180, protein: 5, carbs: 22, fat: 9, emoji: '🍎', reason: 'Satisfying crunch with healthy fats — great pre-workout.' },
    ],
  };

  const PHOTO_MEALS = [
    { name: 'Grilled Chicken Salad', calories: 420, protein: 38, carbs: 16, fat: 20, emoji: '🥗', ingredients: ['chicken', 'mixed greens', 'tomatoes', 'olive oil'] },
    { name: 'Pasta with Marinara', calories: 540, protein: 16, carbs: 78, fat: 14, emoji: '🍝', ingredients: ['pasta', 'tomato sauce', 'parmesan', 'basil'] },
    { name: 'Rice Bowl with Vegetables', calories: 480, protein: 14, carbs: 72, fat: 12, emoji: '🍚', ingredients: ['rice', 'broccoli', 'carrots', 'soy sauce'] },
    { name: 'Burger & Fries', calories: 820, protein: 32, carbs: 68, fat: 44, emoji: '🍔', ingredients: ['beef patty', 'bun', 'fries', 'cheese'] },
    { name: 'Avocado Toast & Eggs', calories: 380, protein: 18, carbs: 32, fat: 22, emoji: '🥑', ingredients: ['bread', 'avocado', 'eggs', 'salt'] },
    { name: 'Sushi Platter', calories: 450, protein: 24, carbs: 58, fat: 10, emoji: '🍣', ingredients: ['rice', 'salmon', 'tuna', 'nori'] },
    { name: 'Steak with Vegetables', calories: 620, protein: 48, carbs: 14, fat: 38, emoji: '🥩', ingredients: ['steak', 'asparagus', 'butter', 'garlic'] },
    { name: 'Smoothie Bowl', calories: 340, protein: 12, carbs: 52, fat: 8, emoji: '🥤', ingredients: ['banana', 'berries', 'granola', 'yogurt'] },
  ];

  function firstName(state) {
    return (state.profile?.name || 'there').split(' ')[0];
  }

  function getMealTotals(meals) {
    let cal = 0, pro = 0, carbs = 0, fat = 0;
    Object.values(meals || {}).flat().forEach(m => {
      cal += m.calories || 0;
      pro += m.protein || 0;
      carbs += m.carbs || 0;
      fat += m.fat || 0;
    });
    return { cal, pro, carbs, fat };
  }

  function getMissionIds() {
    return ['water', 'protein', 'workout', 'steps', 'sleep', 'vitamins'];
  }

  function getChecklistDone(state) {
    const d = new Date().toISOString().split('T')[0];
    const cl = state.dailyChecklists?.[d] || {};
    return getMissionIds().filter(id => cl[id]).length;
  }

  function getMissionCompleteCoach(state) {
    const name = firstName(state);
    const tips = [
      `${name}님, 오늘의 미션 100% 달성! 수분·영양·운동·수면까지 완벽한 하루였어요. 내일도 이 리듬을 유지해보세요. 🌟`,
      `모든 미션 클리어! ${name}님의 꾸준함이 가장 강력한 무기예요. 오늘 밤은 충분히 쉬며 몸을 회복하세요. 💪`,
      `${name}님, 완벽한 하루! 작은 습관의 반복이 ${name}님을 원하는 몸으로 이끌 거예요. 정말 자랑스러워요. 🔥`,
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  function weekWorkouts(state) {
    const now = new Date();
    return (state.workoutHistory || []).filter(w => {
      const diff = (now - new Date(w.date + 'T12:00:00')) / 86400000;
      return diff <= 7;
    });
  }

  function weightTrend(state) {
    const m = state.metrics || [];
    if (m.length < 2) return { diff: 0, weekly: 0 };
    const latest = m[m.length - 1].weight;
    const first = m[0].weight;
    const prev = m[m.length - 2].weight;
    return { diff: latest - first, weekly: latest - prev, latest, goal: state.goals?.weight };
  }

  function nextMealSlot() {
    const h = new Date().getHours();
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 21) return 'dinner';
    return 'snack';
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* ── Daily Coach ── */

  function getDailyCoach(state) {
    const name = firstName(state);
    const g = state.goals || {};
    const meals = state.meals?.[new Date().toISOString().split('T')[0]] || {};
    const totals = getMealTotals(meals);
    const done = getChecklistDone(state);
    const total = getMissionIds().length;
    const pct = Math.round(done / total * 100);
    const proGap = g.protein - totals.pro;
    const calGap = g.calories - totals.cal;
    const hour = new Date().getHours();

    let headline;
    if (pct === 100) headline = `${name}, you nailed today. That's the energy we love to see! 🌟`;
    else if (pct >= 66) headline = `You're ${pct}% through today, ${name} — the finish line is right there!`;
    else if (pct >= 33) headline = `Solid progress so far, ${name}. A few more wins and today's yours.`;
    else headline = `Fresh day, ${name}. Pick one thing from your checklist and start there — momentum builds fast.`;

    const insights = [];

    if (proGap > 0 && proGap <= 40) {
      insights.push({
        icon: '🥩',
        title: 'Protein is almost there',
        body: `You're ${totals.pro}g in with ${proGap}g to go. A Greek yogurt or protein shake tonight would close the gap nicely.`,
        type: 'tip',
      });
    } else if (proGap > 40) {
      insights.push({
        icon: '💪',
        title: 'Protein needs attention',
        body: `Only ${totals.pro}g of your ${g.protein}g goal so far. Try adding lean protein to your next meal — chicken, fish, or tofu all work great.`,
        type: 'alert',
      });
    } else if (totals.pro >= g.protein) {
      insights.push({
        icon: '✅',
        title: 'Protein goal crushed',
        body: `${totals.pro}g logged today — your muscles are thanking you. Recovery starts with fuel like this.`,
        type: 'win',
      });
    }

    if (state.daily?.water < g.water) {
      const left = g.water - state.daily.water;
      insights.push({
        icon: '💧',
        title: `${left} cup${left > 1 ? 's' : ''} of water to go`,
        body: 'Hydration boosts energy and workout performance. Keep a bottle nearby and sip through the afternoon.',
        type: 'tip',
      });
    }

    if (!state.daily?.workoutDone && hour >= 9 && hour <= 20) {
      const routine = state.routines?.find(r => r.id === state.activeRoutineId);
      insights.push({
        icon: '🏋️',
        title: 'Workout still on the board',
        body: routine
          ? `${routine.name} is queued up. Even 30 minutes counts — you'll feel better after.`
          : 'Movement is medicine. A quick session today keeps your weekly streak alive.',
        type: 'tip',
      });
    } else if (state.daily?.workoutDone) {
      insights.push({
        icon: '🔥',
        title: 'Workout done — nice!',
        body: 'Recovery matters now. Stretch, hydrate, and give yourself a protein-rich meal within the next couple hours.',
        type: 'win',
      });
    }

    const uncheckedMeals = ['breakfast', 'lunch', 'dinner'].filter(slot => {
      const cl = state.dailyChecklists?.[new Date().toISOString().split('T')[0]] || {};
      return !cl[slot];
    });
    if (uncheckedMeals.length && hour >= 7) {
      const next = nextMealSlot();
      if (uncheckedMeals.includes(next)) {
        insights.push({
          icon: '🍽️',
          title: `Time for ${next}`,
          body: `Your ${next} isn't checked off yet. Planning ahead makes it easier to stay on track — no guesswork at mealtime.`,
          type: 'tip',
        });
      }
    }

    if (state.daily?.steps < g.steps * 0.7 && hour >= 14) {
      insights.push({
        icon: '👟',
        title: 'Steps running low',
        body: `At ${state.daily.steps.toLocaleString()} steps, a 15-minute walk after dinner could push you toward your ${g.steps.toLocaleString()} goal.`,
        type: 'tip',
      });
    }

    if (insights.length < 3 && calGap > 300 && calGap < 800) {
      insights.push({
        icon: '📊',
        title: 'Calories on track',
        body: `${totals.cal} of ${g.calories} cal today — you're pacing well. No need to force extra food unless you're genuinely hungry.`,
        type: 'tip',
      });
    }

    return {
      headline,
      subline: `${done} of ${total} missions complete · ${totals.cal} cal · ${totals.pro}g protein`,
      insights: insights.slice(0, 4),
    };
  }

  /* ── Weekly Review ── */

  function getWeeklyReview(state) {
    const name = firstName(state);
    const workouts = weekWorkouts(state);
    const g = state.goals || {};
    const wt = weightTrend(state);
    const workoutGoal = g.workouts || 7;
    const workoutPct = Math.round(workouts.length / workoutGoal * 100);

    let summary;
    if (workoutPct >= 100) summary = `${name}, this was a strong week. You hit your workout target and stayed consistent — that's what real progress looks like.`;
    else if (workoutPct >= 70) summary = `Good week, ${name}! ${workouts.length} workouts logged — you're close to your ${workoutGoal}-day goal. One more session seals it.`;
    else summary = `Tough week? It happens, ${name}. ${workouts.length} of ${workoutGoal} workouts isn't failure — it's data. Let's plan a stronger week ahead.`;

    const highlights = [];
    const improvements = [];

    if (workouts.length >= 4) {
      highlights.push(`💪 ${workouts.length} workouts completed — average ${Math.round(workouts.reduce((s, w) => s + w.duration, 0) / workouts.length)} min each`);
    } else {
      improvements.push('Schedule workouts like meetings — same time, same days. Consistency beats motivation.');
    }

    if (wt.weekly < 0) {
      highlights.push(`⚖️ Down ${Math.abs(wt.weekly).toFixed(1)} kg this week — steady and sustainable`);
    } else if (wt.weekly > 0) {
      improvements.push('Weight ticked up slightly — review weekend meals and sleep. Small adjustments, not drastic cuts.');
    }

    const latestMetric = state.metrics?.[state.metrics.length - 1];
    if (latestMetric?.muscle && state.metrics.length >= 2) {
      const muscleDiff = latestMetric.muscle - state.metrics[0].muscle;
      if (muscleDiff > 0) highlights.push(`🏋️ Muscle mass up ${muscleDiff.toFixed(1)} kg over your tracking period`);
    }

    const checklistDays = Object.keys(state.dailyChecklists || {}).length;
    if (checklistDays >= 5) highlights.push(`✅ Active ${checklistDays} days on your daily checklist`);

    if (!highlights.length) highlights.push('🌱 You showed up and tracked — that alone puts you ahead of most');

    if (!improvements.length) improvements.push('Keep your current rhythm. Maybe add one new healthy habit next week.');

    return { summary, highlights, improvements, workoutPct, workouts: workouts.length, workoutGoal };
  }

  /* ── Workout Suggestions ── */

  function getWorkoutSuggestions(state) {
    const name = firstName(state);
    const workouts = weekWorkouts(state);
    const lastWorkout = state.workoutHistory?.[0];
    const routines = state.routines || [];
    const dow = new Date().getDay();

    const suggestions = [];

    if (state.daily?.workoutDone) {
      suggestions.push({
        title: 'Active Recovery',
        duration: '20–30 min',
        reason: 'You already trained today. A light walk or yoga session aids recovery without overloading.',
        exercises: ['Walking', 'Foam rolling', 'Stretching', 'Mobility drills'],
        priority: 'low',
      });
    } else {
      const lastLower = lastWorkout?.name?.toLowerCase().includes('lower');
      const lastUpper = lastWorkout?.name?.toLowerCase().includes('upper');
      const lastHiit = lastWorkout?.name?.toLowerCase().includes('hiit');

      let pick;
      if (lastLower) pick = routines.find(r => r.name.toLowerCase().includes('upper')) || routines[0];
      else if (lastUpper) pick = routines.find(r => r.name.toLowerCase().includes('lower')) || routines[1] || routines[0];
      else if (lastHiit) pick = routines.find(r => !r.name.toLowerCase().includes('hiit')) || routines[0];
      else pick = routines[dow % routines.length] || routines[0];

      if (pick) {
        suggestions.push({
          title: pick.name,
          duration: '~45 min',
          reason: lastWorkout
            ? `After ${lastWorkout.name} on ${lastWorkout.date.slice(5)}, alternating muscle groups keeps you balanced and reduces injury risk.`
            : `${name}, this routine matches your current split. Start with the first exercise and build momentum.`,
          exercises: pick.exercises.map(e => e.name),
          priority: 'high',
          routineId: pick.id,
        });
      }

      if (workouts.length < (state.goals?.workouts || 7) && dow !== 0) {
        suggestions.push({
          title: 'Quick HIIT Finisher',
          duration: '15 min',
          reason: `Only ${workouts.length} workouts this week. A short HIIT session counts toward your goal without a huge time commitment.`,
          exercises: ['Burpees', 'Jump squats', 'Mountain climbers', 'High knees'],
          priority: 'medium',
        });
      }
    }

    if (dow === 0 || dow === 6) {
      suggestions.push({
        title: 'Weekend Mobility',
        duration: '25 min',
        reason: 'Weekends are perfect for flexibility work. It improves every lift and reduces Monday soreness.',
        exercises: ['Hip openers', 'Thoracic rotation', 'Hamstring stretches', 'Cat-cow'],
        priority: 'medium',
      });
    }

    return suggestions.slice(0, 3);
  }

  /* ── Meal Recommendations ── */

  function getMealRecommendations(state) {
    const slot = nextMealSlot();
    const g = state.goals || {};
    const d = new Date().toISOString().split('T')[0];
    const meals = state.meals?.[d] || {};
    const totals = getMealTotals(meals);
    const proGap = g.protein - totals.pro;
    const calRemaining = g.calories - totals.cal;

    const pool = MEAL_IDEAS[slot] || MEAL_IDEAS.snack;
    let ranked = [...pool];

    if (proGap > 30) ranked.sort((a, b) => b.protein - a.protein);
    else if (calRemaining < 400) ranked.sort((a, b) => a.calories - b.calories);

    const existing = Object.values(meals).flat().map(m => m.name.toLowerCase());
    ranked = ranked.filter(r => !existing.some(e => e.includes(r.name.toLowerCase().slice(0, 8))));

    return ranked.slice(0, 3).map(r => ({
      ...r,
      slot,
      fitsBudget: r.calories <= calRemaining,
      calRemaining,
      proGap,
    }));
  }

  /* ── Progress Predictions ── */

  function getProgressPredictions(state) {
    const wt = weightTrend(state);
    const g = state.goals || {};
    const workouts = weekWorkouts(state);
    const name = firstName(state);

    if (!wt.latest || !g.weight) {
      return {
        weight: { text: 'Log a few more weigh-ins and I\'ll forecast your trend.', weeks: null },
        fitness: { text: 'Complete workouts consistently to unlock fitness predictions.', score: null },
        nutrition: { text: 'Track meals for a week to get personalized nutrition insights.', score: null },
      };
    }

    const weeksToGoal = wt.weekly < 0
      ? Math.ceil((wt.latest - g.weight) / Math.abs(wt.weekly))
      : wt.weekly > 0
        ? null
        : Math.ceil((wt.latest - g.weight) / 0.3);

    let weightText;
    if (wt.latest <= g.weight) {
      weightText = `${name}, you're already at your ${g.weight} kg goal! Focus on maintaining with consistent habits.`;
    } else if (weeksToGoal && weeksToGoal <= 12) {
      weightText = `At your current pace (↓${Math.abs(wt.weekly).toFixed(1)} kg/week), you could reach ${g.weight} kg in about ${weeksToGoal} week${weeksToGoal > 1 ? 's' : ''}. Stay consistent — don't rush it.`;
    } else if (wt.weekly >= 0) {
      weightText = `Weight has plateaued recently. A small calorie adjustment or adding one extra workout per week usually breaks through.`;
    } else {
      weightText = `Trending toward ${g.weight} kg. Slow progress is lasting progress — you're building habits that stick.`;
    }

    const workoutRate = workouts.length / 7;
    const fitnessScore = Math.min(100, Math.round(workoutRate * 100 + (state.daily?.workoutDone ? 10 : 0)));
    let fitnessText;
    if (fitnessScore >= 80) fitnessText = 'Your workout consistency is excellent. Strength and endurance gains compound at this rate.';
    else if (fitnessScore >= 50) fitnessText = 'Decent activity level. Adding one more session per week would noticeably accelerate results.';
    else fitnessText = 'Room to grow on movement. Even 2–3 workouts weekly creates measurable change within a month.';

    const d = new Date().toISOString().split('T')[0];
    const totals = getMealTotals(state.meals?.[d] || {});
    const proPct = Math.round(totals.pro / g.protein * 100);
    const calPct = Math.round(totals.cal / g.calories * 100);
    const nutritionScore = Math.min(100, Math.round((proPct + Math.min(calPct, 100)) / 2));

    let nutritionText;
    if (nutritionScore >= 85) nutritionText = 'Nutrition is dialed in today. This kind of consistency is what drives body composition changes.';
    else if (totals.pro < g.protein * 0.6) nutritionText = 'Protein is the lever — bump it by 30–40g daily and you\'ll likely see faster recovery and fat loss.';
    else nutritionText = `You're at ${proPct}% of protein and ${calPct}% of calories. Small tweaks to meal timing could optimize energy levels.`;

    return {
      weight: { text: weightText, weeks: weeksToGoal, current: wt.latest, goal: g.weight },
      fitness: { text: fitnessText, score: fitnessScore },
      nutrition: { text: nutritionText, score: nutritionScore },
    };
  }

  /* ── Photo analysis ── */

  async function sampleImageColors(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        URL.revokeObjectURL(url);

        let r = 0, g = 0, b = 0, greenPx = 0, brownPx = 0, lightPx = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          if (data[i + 1] > data[i] + 20 && data[i + 1] > data[i + 2]) greenPx++;
          if (data[i] > 100 && data[i + 1] < 100 && data[i + 2] < 80) brownPx++;
          if (data[i] + data[i + 1] + data[i + 2] > 600) lightPx++;
        }
        const px = data.length / 4;
        resolve({
          avgR: r / px, avgG: g / px, avgB: b / px,
          greenRatio: greenPx / px,
          brownRatio: brownPx / px,
          lightRatio: lightPx / px,
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function pickMealFromColors(colors) {
    if (colors.greenRatio > 0.25) return PHOTO_MEALS[0];
    if (colors.brownRatio > 0.2 && colors.lightRatio < 0.3) return PHOTO_MEALS[6];
    if (colors.lightRatio > 0.4) return PHOTO_MEALS[4];
    if (colors.avgR > 150 && colors.avgG < 100) return PHOTO_MEALS[3];
    if (colors.avgR > 120 && colors.avgG > 100) return PHOTO_MEALS[1];
    return PHOTO_MEALS[Math.floor(Math.random() * PHOTO_MEALS.length)];
  }

  function buildPhotoInsight(meal, state) {
    const g = state.goals || {};
    const d = new Date().toISOString().split('T')[0];
    const totals = getMealTotals(state.meals?.[d] || {});
    const afterPro = totals.pro + meal.protein;

    if (afterPro > g.protein) return `This looks like a solid meal! It would put you at ${afterPro}g protein — slightly over goal, which is fine on training days.`;
    if (meal.protein >= 30) return `Great protein content here (~${meal.protein}g). This would move you to ${afterPro}g today — getting close to your ${g.protein}g target.`;
    if (meal.calories > 600) return `Hearty plate! At ~${meal.calories} cal, consider balancing with lighter meals later if you're watching intake.`;
    return `Looks like a balanced choice — roughly ${meal.calories} cal and ${meal.protein}g protein. Would fit nicely into today's plan.`;
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeWithOpenAI(file, apiKey, state) {
    const base64 = await fileToBase64(file);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this meal photo. Respond ONLY with valid JSON (no markdown): {"name":"...","calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":["..."],"emoji":"single emoji","insight":"one friendly sentence about how this fits a ${state.goals?.calories || 2200} cal / ${state.goals?.protein || 160}g protein daily goal"}`,
            },
            { type: 'image_url', image_url: { url: base64, detail: 'low' } },
          ],
        }],
        max_tokens: 400,
      }),
    });

    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    return {
      name: json.name,
      calories: +json.calories || 400,
      protein: +json.protein || 25,
      carbs: +json.carbs || 40,
      fat: +json.fat || 15,
      ingredients: json.ingredients || [],
      emoji: json.emoji || '🍽️',
      insight: json.insight || buildPhotoInsight(json, state),
      source: 'openai',
    };
  }

  async function analyzeMealPhoto(file, state) {
    await delay(800);

    const apiKey = state.ai?.apiKey?.trim();
    if (apiKey) {
      try {
        return await analyzeWithOpenAI(file, apiKey, state);
      } catch (_) { /* fall through to local */ }
    }

    const colors = await sampleImageColors(file);
    await delay(600);
    const meal = pickMealFromColors(colors);
    return {
      ...meal,
      insight: buildPhotoInsight(meal, state),
      source: 'local',
    };
  }

  return {
    getDailyCoach,
    getWeeklyReview,
    getWorkoutSuggestions,
    getMealRecommendations,
    getProgressPredictions,
    analyzeMealPhoto,
    getMissionCompleteCoach,
  };
})();
