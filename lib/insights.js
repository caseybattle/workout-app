import { GOALS, rollingWeights, targetKcal, totalsFor } from "./nutrition.js";
import { nextWorkoutDay } from "./program.js";
import { workoutSummary } from "./training.js";

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function goalLabel(goalId) {
  return GOALS.find((goal) => goal.id === goalId)?.label || "Maintain";
}

export function buildCoachContext(state, day = dateKey(new Date())) {
  const profile = state?.profile || {};
  const entries = state?.logs?.[day] || [];
  const totals = totalsFor(entries);
  const target = targetKcal(profile);
  const next = nextWorkoutDay(state?.program, state?.workoutSessions || []);
  const recent = [...(state?.workoutSessions || [])]
    .filter((session) => session?.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0];
  const rolled = rollingWeights(state?.weights || []);
  const latestWeight = rolled.at(-1);
  const recentExercise = recent?.exercises?.[0];
  const recentSet = recentExercise?.sets?.[0];

  const parts = [
    `Goal: ${goalLabel(profile.goal)}.`,
    `Current weight: ${profile.weight || "unknown"} ${profile.unit || "lb"}.`,
    `Current daily energy target: ${target || "unknown"} kcal.`,
    `Today logged: ${Math.round(totals.kcal)} kcal and ${Math.round(totals.protein)} g protein.`,
    `Next workout: ${next?.name || "not scheduled"}.`,
  ];

  if (recent) {
    const summary = workoutSummary(recent);
    parts.push(`Most recent workout: ${recent.workoutName || recent.workoutDayId}, ${summary.sets} working sets.`);
  }

  if (recentExercise) {
    const exerciseName = recentExercise.name ||
      state?.program?.workoutDays?.flatMap((workoutDay) => workoutDay.exercises || []).find((exercise) => exercise.id === recentExercise.exerciseId)?.name ||
      recentExercise.exerciseId;
    parts.push(`Recent performance: ${exerciseName}${recentSet ? ` ${recentSet.load} lb x ${recentSet.reps}` : ""}.`);
  }

  if (latestWeight) parts.push(`Latest rolling weight trend: ${latestWeight.avg.toFixed(1)} ${profile.unit || "lb"}.`);

  return parts.join(" ").slice(0, 1499);
}

export function weeklyReview(state, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const startKey = dateKey(start);
  const endKey = dateKey(end);

  const workouts = (state?.workoutSessions || []).filter((session) => {
    if (!session?.completedAt) return false;
    const completed = new Date(session.completedAt);
    return completed >= start && completed <= end;
  }).length;

  const loggedDays = Object.keys(state?.logs || {}).filter(
    (key) => key >= startKey && key <= endKey && (state.logs[key] || []).length > 0
  ).length;

  const rolled = rollingWeights(state?.weights || []);
  let weightTrend = 0;
  if (rolled.length >= 2) weightTrend = rolled.at(-1).avg - rolled[0].avg;

  const summary = workouts === 0
    ? "Get the next planned workout on the board before changing the program."
    : workouts < 3
      ? "Training is underway. Build consistency before making aggressive adjustments."
      : "You have enough weekly training activity to judge progress alongside weight and nutrition trends.";

  return { workouts, loggedDays, weightTrend, summary };
}
