/* Pure calorie/weight math — no React, no network. Covered by nutrition.test.mjs. */

export const KCAL_PER_LB = 3500;

export const DEFAULT_SPLIT = { protein: 30, carbs: 40, fat: 30 };

export const GOALS = [
  { id: "maintain", label: "Maintain" },
  { id: "steady", label: "Lose steadily" },
  { id: "faster", label: "Lose faster" },
  { id: "build", label: "Build / gain" },
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ── dates ─────────────────────────────────────────────── */
export function dstr(d) {
  return new Date(d).toISOString().split("T")[0];
}
export function today() {
  return dstr(new Date());
}
export function shiftDay(dateStr, delta) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return dstr(d);
}
function daysBetween(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}

/* ── meal classification by time of day ───────────────── */
export function mealNow(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  if (h < 21) return "Dinner";
  return "Snack";
}

/* ── totals for a day's logged entries ────────────────── */
export function totalsFor(entries) {
  return (entries || []).reduce(
    (acc, e) => {
      const protein = num(e.protein);
      const carbs = num(e.carbs);
      const fat = num(e.fat);
      return {
        protein: acc.protein + protein,
        carbs: acc.carbs + carbs,
        fat: acc.fat + fat,
        kcal: acc.kcal + protein * 4 + carbs * 4 + fat * 9,
      };
    },
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  );
}

/* ── targets from a profile's weight x multiplier ─────── */
export function targetKcal(profile) {
  return Math.round(num(profile?.weight) * num(profile?.multiplier));
}
export function macroTargets(kcal, split = DEFAULT_SPLIT) {
  return {
    protein: Math.round(((kcal * split.protein) / 100) / 4),
    carbs: Math.round(((kcal * split.carbs) / 100) / 4),
    fat: Math.round(((kcal * split.fat) / 100) / 9),
  };
}

/* ── rolling weight average, trailing window ──────────── */
/* Smooths day-to-day water-weight noise. Each point's .avg is the mean of
   itself and any prior readings within `windowDays`; .lb is the raw reading. */
export function rollingWeights(weights, windowDays = 7) {
  const sorted = [...(weights || [])].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((w, i) => {
    const cutoff = shiftDay(w.date, -(windowDays - 1));
    const window = sorted.slice(0, i + 1).filter((x) => x.date >= cutoff);
    const avg = window.reduce((a, x) => a + num(x.lb), 0) / window.length;
    return { date: w.date, lb: num(w.lb), avg };
  });
}

/* ── the block meter ───────────────────────────────────── */
/* The day's budget as countable 100-calorie blocks. A number people
   can see the size of, rather than one they have to trust. */
export function blocks(eatenKcal, targetKcal, per = 100) {
  const total = Math.max(1, Math.round(targetKcal / per));
  const used = Math.max(0, Math.round(eatenKcal / per));
  return { total, used: Math.min(used, total), over: Math.max(0, used - total), per };
}

/* ── calibration ───────────────────────────────────────── */
/* Cross-checks the profile's assumed multiplier against what actually
   happened: average intake vs. measured weight change over the window.
   Refuses to guess when the data can't support a real answer. */
export function calibrate({ logs, weights, profile }) {
  if (!weights || weights.length < 2) {
    return { ok: false, need: "data", reason: "Log at least two weigh-ins to calibrate." };
  }

  const sortedW = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const span = daysBetween(sortedW[0].date, sortedW[sortedW.length - 1].date);
  if (span < 14) {
    return {
      ok: false,
      need: "time",
      reason: `Only ${span} days between your first and last weigh-in — calibration needs at least 14.`,
    };
  }

  const keys = [];
  for (let d = sortedW[0].date; d <= sortedW[sortedW.length - 1].date; d = shiftDay(d, 1)) keys.push(d);
  const logged = keys.filter((k) => (logs?.[k] || []).length > 0);
  const coverage = logged.length / keys.length;
  if (coverage < 0.8) {
    return {
      ok: false,
      need: "logging",
      reason: `You logged ${logged.length} of those ${keys.length} days — need at least 80% to trust the numbers.`,
    };
  }

  const rw = rollingWeights(sortedW);
  const first = rw[0];
  const last = rw[rw.length - 1];

  const avgIntake = logged.reduce((a, k) => a + totalsFor(logs[k]).kcal, 0) / logged.length;
  const changeLb = last.avg - first.avg;
  const maintenance = avgIntake - (changeLb / span) * KCAL_PER_LB;
  const curLb = profile.unit === "kg" ? last.avg * 2.20462 : last.avg;
  if (!(curLb > 0) || !Number.isFinite(maintenance)) {
    return { ok: false, need: "data", reason: "Not enough clean data yet." };
  }

  const perLb = maintenance / curLb;
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[0];
  const factor = goal.id === "faster" ? 0.78 : goal.id === "steady" ? 0.87 : goal.id === "build" ? 1.08 : 1;
  const suggested = Math.round(perLb * factor * 2) / 2;

  return {
    ok: true, span, days: keys.length, loggedDays: logged.length, coverage,
    avgIntake, changeLb, weeklyChange: (changeLb / span) * 7,
    maintenance, perLb, suggested, current: num(profile.multiplier),
    drift: Math.abs(suggested - num(profile.multiplier)),
  };
}

/* ── weekly rollup ─────────────────────────────────────── */
export function weeklyAverages(logs, weeks = 4, now = new Date()) {
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const end = new Date(now); end.setDate(end.getDate() - w * 7);
    const keys = [];
    for (let i = 0; i < 7; i++) { const d = new Date(end); d.setDate(d.getDate() - i); keys.push(dstr(d)); }
    const logged = keys.filter((k) => (logs[k] || []).length > 0);
    if (!logged.length) continue;
    const tot = logged.map((k) => totalsFor(logs[k]));
    out.push({
      label: w === 0 ? "This week" : w === 1 ? "Last week" : `${w} weeks ago`,
      loggedDays: logged.length,
      kcal: tot.reduce((a, t) => a + t.kcal, 0) / logged.length,
      protein: tot.reduce((a, t) => a + t.protein, 0) / logged.length,
    });
  }
  return out;
}
