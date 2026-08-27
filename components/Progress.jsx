"use client";

import { useState } from "react";
import { calibrate, rollingWeights, targetKcal, today } from "@/lib/nutrition";
import { weeklyReview } from "@/lib/insights";
import { workoutSummary } from "@/lib/training";

export default function Progress({ state, onLogWeight, onUpdateProfile }) {
  const [weight, setWeight] = useState("");
  const [calibration, setCalibration] = useState(null);
  const review = weeklyReview(state);
  const rolled = rollingWeights(state.weights || []);
  const latest = rolled.at(-1);
  const currentDailyTarget = targetKcal(state.profile);
  const suggestedDailyTarget = calibration?.ok
    ? targetKcal({ ...state.profile, multiplier: calibration.suggested })
    : null;
  const recentSession = [...state.workoutSessions]
    .filter((session) => session.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0];
  const recentSummary = recentSession ? workoutSummary(recentSession) : null;

  function submitWeight(event) {
    event.preventDefault();
    const value = Number(weight);
    if (!(value > 0)) return;
    onLogWeight({ date: today(), lb: value });
    setWeight("");
  }

  function runCalibration() {
    setCalibration(calibrate({ logs: state.logs, weights: state.weights, profile: state.profile }));
  }

  function applyCalibration() {
    if (!calibration?.ok) return;
    onUpdateProfile({ ...state.profile, multiplier: calibration.suggested });
    setCalibration(null);
  }

  return (
    <div className="screen-stack">
      <header className="section-head">
        <div>
          <div className="eyebrow">PROGRESS</div>
          <h2>Is the plan working?</h2>
          <p>Training, body weight, and logging consistency in one place.</p>
        </div>
      </header>

      <section className="metric-grid three">
        <div className="metric-card"><span>Workouts</span><strong>{review.workouts}</strong><small>last 7 days</small></div>
        <div className="metric-card"><span>Food logs</span><strong>{review.loggedDays}/7</strong><small>days logged</small></div>
        <div className="metric-card"><span>Weight</span><strong>{latest ? latest.avg.toFixed(1) : "—"}</strong><small>{state.profile.unit} trend</small></div>
      </section>

      <section className="insight-card">
        <div className="eyebrow">WEEKLY READ</div>
        <strong>{review.weightTrend < -0.2 ? "Weight trending down" : review.weightTrend > 0.2 ? "Weight trending up" : "Weight relatively stable"}</strong>
        <p>{review.summary}</p>
      </section>

      {recentSession && (
        <section className="card-flat">
          <div className="eyebrow">LATEST WORKOUT</div>
          <div className="history-row emphasis">
            <div>
              <strong>{recentSession.workoutName || recentSession.workoutDayId}</strong>
              <small>{new Date(recentSession.completedAt).toLocaleDateString()}</small>
            </div>
            <span>{recentSummary.sets} sets · {Math.round(recentSummary.volume).toLocaleString()} lb</span>
          </div>
        </section>
      )}

      <section className="card-flat">
        <div className="eyebrow">BODY WEIGHT</div>
        <form className="inline-form" onSubmit={submitWeight}>
          <input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={`Weight (${state.profile.unit})`} />
          <button className="btn primary compact" type="submit">Log</button>
        </form>
        <small className="support-copy">Use consistent weigh-ins. The app smooths day-to-day noise before drawing conclusions.</small>
      </section>

      <section className="card-flat">
        <div className="eyebrow">ADAPT NUTRITION</div>
        <p className="body-copy">Compare your logged intake with what actually happened to your weight. The app refuses to adjust when the data is too sparse.</p>
        <button className="btn secondary block" onClick={runCalibration}>Check current target</button>
        {calibration && !calibration.ok && <p className="notice">{calibration.reason}</p>}
        {calibration?.ok && (
          <div className="calibration-callout">
            <strong>Suggested daily target: {suggestedDailyTarget.toLocaleString()} kcal</strong>
            <p>
              Current target: {currentDailyTarget.toLocaleString()} kcal. Based on {calibration.loggedDays} logged days across {calibration.span} days of weight and intake data.
            </p>
            <button className="btn primary compact" onClick={applyCalibration}>Use {suggestedDailyTarget.toLocaleString()} kcal</button>
          </div>
        )}
      </section>
    </div>
  );
}
