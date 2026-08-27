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
  const latest = findExercise(recentSessions[0], prescription?.id);

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

  const previous = findExercise(recentSessions[1], prescription?.id);
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
