"use client";

import { useEffect, useMemo, useState } from "react";
import { completeWorkoutDraft, createWorkoutDraft, updateWorkoutSet } from "@/lib/training";

export default function ActiveWorkout({ workoutDay, workoutSessions, onComplete, onCancel }) {
  const initialDraft = useMemo(
    () => createWorkoutDraft(workoutDay, workoutSessions, new Date().toISOString()),
    [workoutDay, workoutSessions]
  );
  const [draft, setDraft] = useState(initialDraft);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [rest, setRest] = useState(0);

  useEffect(() => {
    if (rest <= 0) return undefined;
    const timer = setInterval(() => setRest((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [rest]);

  const exercise = draft.exercises[exerciseIndex];
  const set = exercise?.sets?.[setIndex];
  const totalSets = draft.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const completedSets = draft.exercises.reduce(
    (sum, item) => sum + item.sets.filter((workingSet) => workingSet.completedAt).length,
    0
  );
  const allComplete = completedSets === totalSets;

  function patchSet(patch) {
    setDraft((current) => updateWorkoutSet(current, exerciseIndex, setIndex, patch));
  }

  function changeNumber(field, delta) {
    patchSet({ [field]: Math.max(0, Number(set[field] || 0) + delta) });
  }

  function setNumericValue(field, value) {
    if (value === "") {
      patchSet({ [field]: 0 });
      return;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) patchSet({ [field]: Math.max(0, numeric) });
  }

  function completeSet() {
    const marked = updateWorkoutSet(draft, exerciseIndex, setIndex, { completedAt: new Date().toISOString() });
    setDraft(marked);

    const isLastSet = setIndex === exercise.sets.length - 1;
    const isLastExercise = exerciseIndex === draft.exercises.length - 1;

    if (!isLastSet) {
      setSetIndex(setIndex + 1);
      setRest(90);
      return;
    }

    if (!isLastExercise) {
      setExerciseIndex(exerciseIndex + 1);
      setSetIndex(0);
      setRest(90);
    }
  }

  function finishWorkout() {
    onComplete(completeWorkoutDraft(draft, new Date().toISOString()));
  }

  const minutes = Math.floor(rest / 60);
  const seconds = String(rest % 60).padStart(2, "0");

  return (
    <div className="active-workout">
      <header className="active-head">
        <button className="text-button" onClick={onCancel}>Exit</button>
        <div>
          <span>{workoutDay.name}</span>
          <strong>{completedSets}/{totalSets} sets</strong>
        </div>
        <button className="text-button" disabled={!allComplete} onClick={finishWorkout}>Finish</button>
      </header>

      <div className="workout-progress"><span style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} /></div>

      {rest > 0 && (
        <button className="rest-bar" onClick={() => setRest(0)}>
          <span>Rest</span>
          <strong>{minutes}:{seconds}</strong>
          <small>tap to skip</small>
        </button>
      )}

      <main className="active-body">
        <div className="exercise-position">Exercise {exerciseIndex + 1} of {draft.exercises.length}</div>
        <h1>{exercise.name}</h1>
        <p className="target-copy">
          Target {exercise.target.repMin}–{exercise.target.repMax} reps · {exercise.target.sets} working sets
        </p>

        <section className="recommendation-box">
          <span>TODAY'S TARGET</span>
          <strong>
            {exercise.recommendation.nextLoad == null ? "Choose your working weight" : `${exercise.recommendation.nextLoad} lb`}
          </strong>
          <p>{exercise.recommendation.reason}</p>
        </section>

        <div className="set-tabs" aria-label="Working sets">
          {exercise.sets.map((workingSet, index) => (
            <button
              key={index}
              className={`${index === setIndex ? "active" : ""} ${workingSet.completedAt ? "done" : ""}`}
              onClick={() => setSetIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <section className="set-editor">
          <div className="editor-block">
            <span>WEIGHT</span>
            <div className="stepper">
              <button onClick={() => changeNumber("load", -5)} aria-label="Decrease weight by 5">−</button>
              <label className="numeric-value">
                <input
                  type="number"
                  min="0"
                  step="2.5"
                  inputMode="decimal"
                  value={set.load}
                  onChange={(event) => setNumericValue("load", event.target.value)}
                  aria-label="Working weight"
                />
                <small>lb</small>
              </label>
              <button onClick={() => changeNumber("load", 5)} aria-label="Increase weight by 5">+</button>
            </div>
          </div>

          <div className="editor-block">
            <span>REPS</span>
            <div className="stepper">
              <button onClick={() => changeNumber("reps", -1)} aria-label="Decrease reps">−</button>
              <label className="numeric-value reps-value">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(event) => setNumericValue("reps", event.target.value)}
                  aria-label="Completed reps"
                />
              </label>
              <button onClick={() => changeNumber("reps", 1)} aria-label="Increase reps">+</button>
            </div>
          </div>
        </section>

        <section className="effort-box">
          <span>REPS LEFT IN THE TANK</span>
          <div className="rir-row">
            {[0, 1, 2, 3, 4].map((value) => (
              <button key={value} className={Number(set.rir) === value ? "active" : ""} onClick={() => patchSet({ rir: value })}>
                {value}{value === 4 ? "+" : ""}
              </button>
            ))}
          </div>
        </section>

        <button className="btn primary complete-set" disabled={Boolean(set.completedAt)} onClick={completeSet}>
          {set.completedAt ? "Set Complete" : "Complete Set"}
        </button>

        {allComplete && (
          <button className="btn finish-workout" onClick={finishWorkout}>Finish Workout</button>
        )}
      </main>
    </div>
  );
}
