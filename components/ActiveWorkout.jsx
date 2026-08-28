"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activeRestSeconds,
  completeActiveWorkoutSet,
  completeWorkoutDraft,
  createActiveWorkoutState,
  pauseActiveWorkoutRest,
  resumeActiveWorkoutRest,
  skipActiveWorkoutRest,
  updateWorkoutSet,
} from "@/lib/training";

export default function ActiveWorkout({
  workoutDay,
  workoutSessions,
  initialWorkout,
  onUpdate,
  onComplete,
  onSaveAndExit,
  onDiscard,
}) {
  const initialState = useMemo(
    () => initialWorkout || createActiveWorkoutState(workoutDay, workoutSessions, new Date().toISOString()),
    [initialWorkout, workoutDay, workoutSessions],
  );
  const [active, setActive] = useState(initialState);
  const [clock, setClock] = useState(() => new Date().toISOString());
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const draft = active.draft;
  const exerciseIndex = active.exerciseIndex;
  const setIndex = active.setIndex;
  const exercise = draft.exercises[exerciseIndex];
  const set = exercise?.sets?.[setIndex];
  const rest = activeRestSeconds(active, clock);
  const restPaused = Number(active.restPausedSeconds) > 0;
  const totalSets = draft.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const completedSets = draft.exercises.reduce(
    (sum, item) => sum + item.sets.filter((workingSet) => workingSet.completedAt).length,
    0,
  );
  const allComplete = completedSets === totalSets;

  useEffect(() => {
    if (!active.restEndsAt) return undefined;
    const timer = setInterval(() => setClock(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, [active.restEndsAt]);

  function commit(next) {
    setActive(next);
    onUpdate(next);
  }

  function patchSet(patch) {
    commit({ ...active, draft: updateWorkoutSet(draft, exerciseIndex, setIndex, patch) });
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

  function selectSet(index) {
    commit({ ...active, setIndex: index, restEndsAt: null, restPausedSeconds: 0 });
  }

  function completeSet() {
    commit(completeActiveWorkoutSet(active, new Date().toISOString(), 90));
    setClock(new Date().toISOString());
  }

  function finishWorkout() {
    onComplete(completeWorkoutDraft(draft, new Date().toISOString()));
  }

  const minutes = Math.floor(rest / 60);
  const seconds = String(rest % 60).padStart(2, "0");
  const nextLabel = `Set ${setIndex + 1}`;

  return (
    <div className="active-workout">
      <header className="active-head">
        <button className="text-button" onClick={() => onSaveAndExit(active)}>Save & Exit</button>
        <div>
          <span>{workoutDay.name}</span>
          <strong>{completedSets}/{totalSets} sets</strong>
        </div>
        <button className="text-button" disabled={!allComplete} onClick={finishWorkout}>Finish</button>
      </header>

      <div className="workout-progress"><span style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} /></div>

      {rest > 0 && (
        <section className="rest-panel" aria-label="Rest timer">
          <div>
            <span>{restPaused ? "Rest paused" : `Rest before ${nextLabel}`}</span>
            <strong>{minutes}:{seconds}</strong>
          </div>
          <div className="rest-actions">
            <button className="btn small secondary" onClick={() => commit(restPaused
              ? resumeActiveWorkoutRest(active, new Date().toISOString())
              : pauseActiveWorkoutRest(active, new Date().toISOString()))}>
              {restPaused ? "Resume timer" : "Pause timer"}
            </button>
            <button className="btn small primary" onClick={() => commit(skipActiveWorkoutRest(active))}>
              Start {nextLabel}
            </button>
          </div>
        </section>
      )}

      <main className="active-body">
        <div className="exercise-position">Exercise {exerciseIndex + 1} of {draft.exercises.length}</div>
        <h1>{exercise.name}</h1>
        <p className="target-copy">
          Target {exercise.target.repMin}–{exercise.target.repMax} reps · {exercise.target.sets} working sets
        </p>

        <section className="recommendation-box">
          <span>TODAY&apos;S TARGET</span>
          <strong>
            {exercise.recommendation.nextLoad == null ? "Choose your working weight" : `${exercise.recommendation.nextLoad} lb`}
          </strong>
          <p>{exercise.recommendation.reason}</p>
        </section>

        <div className="active-set-label">
          <strong>{nextLabel} of {exercise.sets.length}</strong>
          <span>{set.completedAt ? "Complete" : rest > 0 ? "Next after rest" : "Ready"}</span>
        </div>

        <div className="set-tabs" aria-label="Working sets">
          {exercise.sets.map((workingSet, index) => (
            <button
              key={index}
              className={`${index === setIndex ? "active" : ""} ${workingSet.completedAt ? "done" : ""}`}
              onClick={() => selectSet(index)}
              aria-label={`Set ${index + 1}${workingSet.completedAt ? " complete" : ""}`}
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

        <button className="btn primary complete-set" disabled={Boolean(set.completedAt) || rest > 0} onClick={completeSet}>
          {set.completedAt ? "Set Complete" : rest > 0 ? `${nextLabel} after rest` : "Complete Set"}
        </button>

        {allComplete && (
          <button className="btn finish-workout" onClick={finishWorkout}>Finish Workout</button>
        )}

        {!confirmDiscard ? (
          <button className="btn ghost discard-workout" onClick={() => setConfirmDiscard(true)}>Discard Workout</button>
        ) : (
          <section className="discard-confirm" role="alert">
            <strong>Discard this workout and start over?</strong>
            <p>Your completed sets in this draft will be removed.</p>
            <div>
              <button className="btn small secondary" onClick={() => setConfirmDiscard(false)}>Keep Workout</button>
              <button className="btn small danger-button" onClick={onDiscard}>Discard and Start Over</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
