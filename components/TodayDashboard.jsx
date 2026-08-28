"use client";

import { nextWorkoutDay, sessionsForExercise } from "@/lib/program";
import { recommendProgression } from "@/lib/training";
import { rollingWeights, targetKcal, totalsFor } from "@/lib/nutrition";

const clamp = (value) => Math.min(100, Math.max(0, value));

export default function TodayDashboard({ state, entries, onStartWorkout, onResumeWorkout, onAddFood, onOpenProgress }) {
  const activeWorkoutDay = state.activeWorkout
    ? state.program.workoutDays.find((workoutDay) => workoutDay.id === state.activeWorkout.workoutDayId)
    : null;
  const workout = activeWorkoutDay || nextWorkoutDay(state.program, state.workoutSessions);
  const totals = totalsFor(entries);
  const target = targetKcal(state.profile);
  const remaining = Math.round(target - totals.kcal);
  const proteinTarget = Math.round((target * ((state.profile?.split?.protein ?? 30) / 100)) / 4);
  const rolled = rollingWeights(state.weights || []);
  const latestWeight = rolled.at(-1);
  const previousWeight = rolled.length > 1 ? rolled.at(-2) : null;
  const weightDelta = latestWeight && previousWeight ? latestWeight.avg - previousWeight.avg : null;
  const firstExercise = workout?.exercises?.[0];
  const firstRecommendation = firstExercise ? recommendProgression(firstExercise, sessionsForExercise(state.workoutSessions, firstExercise.id)) : null;
  const totalSets = workout?.exercises?.reduce((sum, exercise) => sum + (exercise.sets || 0), 0) || 0;
  const duration = workout ? Math.max(30, workout.exercises.length * 8) : 0;
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="screen-stack today-screen">
      <header className="today-intro">
        <div className="eyebrow">{dateLabel.toUpperCase()}</div>
        <h2>Your next useful move.</h2>
        <p>Follow the prescription, record the work, and let the plan adapt.</p>
      </header>

      <div className="today-layout">
        <section className="prescription-panel">
          <div className="prescription-topline">
            <span className="live-label"><i />{state.activeWorkout ? "Session in progress" : "Training prescription"}</span>
            {workout && <span className="data-copy">{totalSets} sets · ~{duration} min</span>}
          </div>
          <div className="prescription-heading">
            <span className="session-number">01</span>
            <div>
              <h3>{workout?.name || "Recovery day"}</h3>
              <p>{workout ? "Complete each set, then follow the timed recovery cue." : "No session is scheduled. Use today to recover well."}</p>
            </div>
          </div>
          {workout && (
            <div className="prescription-exercises" aria-label="Workout preview">
              {workout.exercises.slice(0, 4).map((exercise, index) => (
                <div className="prescription-row" key={exercise.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{exercise.name}</strong><small>{exercise.sets} sets</small>
                </div>
              ))}
              {workout.exercises.length > 4 && <p className="more-exercises">+{workout.exercises.length - 4} more exercises</p>}
            </div>
          )}
          {firstRecommendation && firstRecommendation.action !== "start" && (
            <div className="inline-prescription">
              <span>First target</span><strong>{firstExercise.name}</strong>
              <small>{firstRecommendation.nextLoad ? `${firstRecommendation.nextLoad} lb · ` : ""}{firstRecommendation.targetRepMin}–{firstRecommendation.targetRepMax} reps</small>
            </div>
          )}
          {workout && (
            <button className="btn primary hero-action" onClick={() => state.activeWorkout ? onResumeWorkout() : onStartWorkout(workout)}>
              {state.activeWorkout ? "Resume Session" : "Begin Session"}<span aria-hidden="true">→</span>
            </button>
          )}
        </section>

        <aside className="today-data-rail" aria-label="Today at a glance">
          <button className="rail-block" onClick={onAddFood}>
            <span className="rail-kicker">ENERGY</span><strong className={remaining < 0 ? "danger" : ""}>{Math.abs(remaining)} <small>kcal</small></strong>
            <span>{remaining < 0 ? "over target" : "available today"}</span><i className="rail-progress"><b style={{ width: `${clamp((totals.kcal / target) * 100)}%` }} /></i>
          </button>
          <button className="rail-block" onClick={onAddFood}>
            <span className="rail-kicker">PROTEIN</span><strong>{Math.round(totals.protein)}<small> / {proteinTarget}g</small></strong>
            <span>daily target</span><i className="rail-progress protein"><b style={{ width: `${clamp((totals.protein / proteinTarget) * 100)}%` }} /></i>
          </button>
          <button className="rail-block progress-rail" onClick={onOpenProgress}>
            <span className="rail-kicker">TREND</span><strong>{latestWeight ? latestWeight.avg.toFixed(1) : "—"}<small> {state.profile.unit}</small></strong>
            <span>{weightDelta == null ? `${state.workoutSessions.length} sessions recorded` : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} since last reading`}</span>
            <em>Open progress <span aria-hidden="true">↗</span></em>
          </button>
        </aside>
      </div>
    </div>
  );
}
