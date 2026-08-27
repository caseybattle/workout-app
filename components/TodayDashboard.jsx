"use client";

import { nextWorkoutDay, sessionsForExercise } from "@/lib/program";
import { recommendProgression } from "@/lib/training";
import { rollingWeights, targetKcal, totalsFor } from "@/lib/nutrition";

export default function TodayDashboard({ state, entries, onStartWorkout, onAddFood, onOpenProgress }) {
  const workout = nextWorkoutDay(state.program, state.workoutSessions);
  const totals = totalsFor(entries);
  const target = targetKcal(state.profile);
  const remaining = Math.round(target - totals.kcal);
  const proteinTarget = Math.round((target * ((state.profile?.split?.protein ?? 30) / 100)) / 4);
  const rolled = rollingWeights(state.weights || []);
  const latestWeight = rolled.at(-1);
  const previousWeight = rolled.length > 1 ? rolled.at(-2) : null;
  const weightDelta = latestWeight && previousWeight ? latestWeight.avg - previousWeight.avg : null;

  const firstExercise = workout?.exercises?.[0];
  const firstRecommendation = firstExercise
    ? recommendProgression(firstExercise, sessionsForExercise(state.workoutSessions, firstExercise.id))
    : null;

  return (
    <div className="screen-stack">
      <section className="hero-card">
        <div className="eyebrow">TODAY</div>
        <div className="hero-row">
          <div>
            <h2>{workout?.name || "Recovery day"}</h2>
            <p>{workout ? `${workout.exercises.length} exercises · follow your next targets` : "No workout is scheduled."}</p>
          </div>
          {workout && <span className="status-pill">Ready</span>}
        </div>
        {workout && (
          <button className="btn primary hero-action" onClick={() => onStartWorkout(workout)}>
            Start Workout
          </button>
        )}
      </section>

      {firstRecommendation && firstRecommendation.action !== "start" && (
        <section className="insight-card">
          <div className="eyebrow">NEXT TARGET</div>
          <strong>{firstExercise.name}</strong>
          <p>
            {firstRecommendation.nextLoad ? `${firstRecommendation.nextLoad} lb · ` : ""}
            {firstRecommendation.targetRepMin}–{firstRecommendation.targetRepMax} reps
          </p>
          <small>{firstRecommendation.reason}</small>
        </section>
      )}

      <section className="metric-grid two">
        <button className="metric-card interactive" onClick={onAddFood}>
          <span>Fuel</span>
          <strong className={remaining < 0 ? "danger" : ""}>{Math.abs(remaining)}</strong>
          <small>{remaining < 0 ? "calories over" : "calories available"}</small>
        </button>
        <button className="metric-card interactive" onClick={onAddFood}>
          <span>Protein</span>
          <strong>{Math.round(totals.protein)}g</strong>
          <small>of {proteinTarget}g target</small>
        </button>
      </section>

      <button className="progress-card" onClick={onOpenProgress}>
        <div>
          <div className="eyebrow">PROGRESS</div>
          <strong>{state.workoutSessions.length} workouts recorded</strong>
          <p>
            {latestWeight
              ? `${latestWeight.avg.toFixed(1)} ${state.profile.unit} trend${weightDelta == null ? "" : ` · ${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} since last reading`}`
              : "Log body weight to connect training with body-composition progress."}
          </p>
        </div>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
