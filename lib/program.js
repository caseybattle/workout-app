const exercise = (id, name, sets, repMin, repMax, incrementLb = 5) => ({
  id,
  name,
  sets,
  repMin,
  repMax,
  incrementLb,
});

export function defaultProgram() {
  return {
    id: "starter-strength-3",
    name: "3-Day Strength Foundation",
    active: true,
    workoutDays: [
      {
        id: "upper",
        name: "Upper Body",
        order: 0,
        exercises: [
          exercise("bench", "Bench Press", 3, 6, 8, 5),
          exercise("row", "Chest-Supported Row", 3, 8, 10, 5),
          exercise("ohp", "Shoulder Press", 3, 6, 8, 5),
          exercise("pulldown", "Lat Pulldown", 3, 8, 12, 5),
          exercise("curl", "Dumbbell Curl", 2, 10, 15, 5),
          exercise("triceps", "Triceps Pressdown", 2, 10, 15, 5),
        ],
      },
      {
        id: "lower",
        name: "Lower Body",
        order: 1,
        exercises: [
          exercise("squat", "Squat", 3, 5, 8, 10),
          exercise("rdl", "Romanian Deadlift", 3, 6, 10, 10),
          exercise("legpress", "Leg Press", 3, 8, 12, 10),
          exercise("legcurl", "Leg Curl", 3, 10, 15, 5),
          exercise("calf", "Calf Raise", 3, 10, 15, 5),
        ],
      },
      {
        id: "full",
        name: "Full Body",
        order: 2,
        exercises: [
          exercise("incline", "Incline Dumbbell Press", 3, 8, 12, 5),
          exercise("deadlift", "Deadlift", 2, 4, 6, 10),
          exercise("cable-row", "Cable Row", 3, 8, 12, 5),
          exercise("split-squat", "Split Squat", 3, 8, 12, 5),
          exercise("lateral", "Lateral Raise", 2, 12, 20, 5),
          exercise("core", "Cable Crunch", 2, 10, 15, 5),
        ],
      },
    ],
  };
}

export function normalizeTrainingState(state) {
  const base = state || {};
  return {
    ...base,
    program: base.program?.workoutDays?.length ? base.program : defaultProgram(),
    workoutSessions: Array.isArray(base.workoutSessions) ? base.workoutSessions : [],
  };
}

export function nextWorkoutDay(program, workoutSessions = []) {
  const days = [...(program?.workoutDays || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!days.length) return null;
  if (!workoutSessions.length) return days[0];

  const latest = [...workoutSessions]
    .filter((session) => session?.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0];

  if (!latest) return days[0];
  const index = days.findIndex((day) => day.id === latest.workoutDayId);
  if (index === -1) return days[0];
  return days[(index + 1) % days.length];
}

export function sessionsForExercise(workoutSessions = [], exerciseId) {
  return [...workoutSessions]
    .filter((session) => session?.exercises?.some((exercise) => exercise.exerciseId === exerciseId))
    .sort((a, b) => String(b.completedAt || b.startedAt || "").localeCompare(String(a.completedAt || a.startedAt || "")));
}
