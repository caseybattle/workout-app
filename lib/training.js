function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findExercise(session, exerciseId) {
  return session?.exercises?.find((exercise) => exercise.exerciseId === exerciseId) || null;
}

function missedRepFloor(exercise, repMin) {
  return Boolean(exercise?.sets?.length) && exercise.sets.some((set) => num(set.reps) < repMin);
}

export function recommendProgression(prescription, recentSessions = []) {
  const repMin = num(prescription?.repMin);
  const repMax = num(prescription?.repMax);
  const increment = Math.max(0, num(prescription?.incrementLb));
  const relevant = recentSessions.filter((session) => findExercise(session, prescription?.id));
  const latest = findExercise(relevant[0], prescription?.id);

  if (!latest?.sets?.length) {
    return {
      action: "start",
      nextLoad: null,
      targetRepMin: repMin,
      targetRepMax: repMax,
      reason: "No previous working sets yet.",
    };
  }

  const load = num(latest.sets[0]?.load);
  const allAtTopWithReserve = latest.sets.every((set) => {
    const atTop = num(set.reps) >= repMax;
    const hasReserve = set.rir == null || num(set.rir) >= 1;
    return atTop && hasReserve;
  });

  if (allAtTopWithReserve) {
    return {
      action: "increase",
      nextLoad: load + increment,
      targetRepMin: repMin,
      targetRepMax: repMax,
      reason: `You cleared ${repMax} reps across all working sets with enough reserve to progress.`,
    };
  }

  const allAtMinimum = latest.sets.every((set) => num(set.reps) >= repMin);
  if (allAtMinimum) {
    return {
      action: "reps",
      nextLoad: load,
      targetRepMin: repMin,
      targetRepMax: repMax,
      reason: "Keep the load and add reps before increasing weight.",
    };
  }

  const previous = findExercise(relevant[1], prescription?.id);
  if (missedRepFloor(previous, repMin)) {
    return {
      action: "reduce",
      nextLoad: Math.max(0, load - increment),
      targetRepMin: repMin,
      targetRepMax: repMax,
      reason: "You missed the rep floor in two comparable sessions, so reduce one increment and rebuild.",
    };
  }

  return {
    action: "hold",
    nextLoad: load,
    targetRepMin: repMin,
    targetRepMax: repMax,
    reason: "Repeat this load once before changing it.",
  };
}

export function createWorkoutDraft(workoutDay, recentSessions = [], startedAt = new Date().toISOString()) {
  return {
    id: `workout-${startedAt}`,
    workoutDayId: workoutDay.id,
    workoutName: workoutDay.name,
    startedAt,
    completedAt: null,
    exercises: (workoutDay.exercises || []).map((prescription) => {
      const recommendation = recommendProgression(prescription, recentSessions);
      const suggestedLoad = recommendation.nextLoad == null ? 0 : recommendation.nextLoad;
      return {
        exerciseId: prescription.id,
        name: prescription.name,
        target: {
          sets: prescription.sets,
          repMin: prescription.repMin,
          repMax: prescription.repMax,
          incrementLb: prescription.incrementLb,
        },
        recommendation,
        sets: Array.from({ length: prescription.sets }, () => ({
          load: suggestedLoad,
          reps: prescription.repMin,
          rir: 2,
          completedAt: null,
        })),
      };
    }),
  };
}

export function createActiveWorkoutState(workoutDay, recentSessions = [], startedAt = new Date().toISOString()) {
  return {
    workoutDayId: workoutDay.id,
    draft: createWorkoutDraft(workoutDay, recentSessions, startedAt),
    exerciseIndex: 0,
    setIndex: 0,
    restEndsAt: null,
    restPausedSeconds: 0,
    isOpen: true,
  };
}

export function activeRestSeconds(activeWorkout, now = new Date().toISOString()) {
  const paused = Math.max(0, Number(activeWorkout?.restPausedSeconds) || 0);
  if (paused > 0) return Math.ceil(paused);
  if (!activeWorkout?.restEndsAt) return 0;
  const remainingMs = new Date(activeWorkout.restEndsAt).getTime() - new Date(now).getTime();
  return Number.isFinite(remainingMs) ? Math.max(0, Math.ceil(remainingMs / 1000)) : 0;
}

export function completeActiveWorkoutSet(activeWorkout, completedAt = new Date().toISOString(), restSeconds = 90) {
  const exerciseIndex = Math.max(0, Number(activeWorkout.exerciseIndex) || 0);
  const setIndex = Math.max(0, Number(activeWorkout.setIndex) || 0);
  const exercise = activeWorkout.draft.exercises[exerciseIndex];
  if (!exercise?.sets?.[setIndex]) return activeWorkout;

  const draft = updateWorkoutSet(activeWorkout.draft, exerciseIndex, setIndex, { completedAt });
  const isLastSet = setIndex === exercise.sets.length - 1;
  const isLastExercise = exerciseIndex === draft.exercises.length - 1;
  const hasNext = !isLastSet || !isLastExercise;
  const nextExerciseIndex = isLastSet && !isLastExercise ? exerciseIndex + 1 : exerciseIndex;
  const nextSetIndex = isLastSet ? 0 : setIndex + 1;
  const restMs = Math.max(0, Number(restSeconds) || 0) * 1000;

  return {
    ...activeWorkout,
    draft,
    exerciseIndex: hasNext ? nextExerciseIndex : exerciseIndex,
    setIndex: hasNext ? nextSetIndex : setIndex,
    restEndsAt: hasNext && restMs > 0 ? new Date(new Date(completedAt).getTime() + restMs).toISOString() : null,
    restPausedSeconds: 0,
  };
}

export function pauseActiveWorkoutRest(activeWorkout, now = new Date().toISOString()) {
  const remaining = activeRestSeconds(activeWorkout, now);
  return { ...activeWorkout, restEndsAt: null, restPausedSeconds: remaining };
}

export function resumeActiveWorkoutRest(activeWorkout, now = new Date().toISOString()) {
  const remaining = activeRestSeconds(activeWorkout, now);
  if (remaining <= 0) return skipActiveWorkoutRest(activeWorkout);
  return {
    ...activeWorkout,
    restEndsAt: new Date(new Date(now).getTime() + remaining * 1000).toISOString(),
    restPausedSeconds: 0,
  };
}

export function skipActiveWorkoutRest(activeWorkout) {
  return { ...activeWorkout, restEndsAt: null, restPausedSeconds: 0 };
}

export function updateWorkoutSet(draft, exerciseIndex, setIndex, patch) {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, ei) =>
      ei !== exerciseIndex
        ? exercise
        : {
            ...exercise,
            sets: exercise.sets.map((set, si) => (si === setIndex ? { ...set, ...patch } : set)),
          }
    ),
  };
}

export function completeWorkoutDraft(draft, completedAt = new Date().toISOString()) {
  return {
    ...draft,
    completedAt,
    exercises: draft.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        completedAt: set.completedAt || completedAt,
      })),
    })),
  };
}

export function workoutSummary(session) {
  const sets = (session?.exercises || []).flatMap((exercise) => exercise.sets || []);
  return sets.reduce(
    (summary, set) => {
      const reps = num(set.reps);
      const load = num(set.load);
      return {
        sets: summary.sets + 1,
        reps: summary.reps + reps,
        volume: summary.volume + load * reps,
      };
    },
    { sets: 0, reps: 0, volume: 0 }
  );
}
