"use client";

import { useState } from "react";
import { calibrate, rollingWeights, targetKcal, today } from "@/lib/nutrition";
import { weeklyReview } from "@/lib/insights";
import { workoutSummary } from "@/lib/training";

function chartFor(values) {
  const slice = values.slice(-12);
  if (slice.length < 2) return null;
  const nums = slice.map((item) => item.avg);
  const low = Math.min(...nums);
  const high = Math.max(...nums);
  const range = Math.max(high - low, 1);
  const points = slice.map((item, index) => ({ x: 24 + (index / (slice.length - 1)) * 592, y: 22 + ((high - item.avg) / range) * 150, value: item.avg, date: item.date }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0].x} 190 L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1).x} 190 Z`;
  return { points, line, area, low, high };
}

export default function Progress({ state, onLogWeight, onUpdateProfile }) {
  const [weight, setWeight] = useState("");
  const [calibration, setCalibration] = useState(null);
  const review = weeklyReview(state);
  const rolled = rollingWeights(state.weights || []);
  const latest = rolled.at(-1);
  const chart = chartFor(rolled);
  const currentDailyTarget = targetKcal(state.profile);
  const suggestedDailyTarget = calibration?.ok ? targetKcal({ ...state.profile, multiplier: calibration.suggested }) : null;
  const recentSession = [...state.workoutSessions].filter((session) => session.completedAt).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0];
  const recentSummary = recentSession ? workoutSummary(recentSession) : null;

  function submitWeight(event) { event.preventDefault(); const value = Number(weight); if (!(value > 0)) return; onLogWeight({ date: today(), lb: value }); setWeight(""); }
  function runCalibration() { setCalibration(calibrate({ logs: state.logs, weights: state.weights, profile: state.profile })); }
  function applyCalibration() { if (!calibration?.ok) return; onUpdateProfile({ ...state.profile, multiplier: calibration.suggested }); setCalibration(null); }

  return (
    <div className="screen-stack progress-screen">
      <header className="section-head editorial-head"><div><div className="eyebrow">SIGNAL, NOT NOISE</div><h2>See what is changing.</h2><p>Training consistency, weight trend, and fuel data tell one story here.</p></div></header>

      <section className="progress-hero">
        <div className="chart-heading"><div><span>BODY WEIGHT TREND</span><strong>{latest ? `${latest.avg.toFixed(1)} ${state.profile.unit}` : "No trend yet"}</strong></div>{chart && <small>{chart.low.toFixed(1)}–{chart.high.toFixed(1)} {state.profile.unit}</small>}</div>
        {chart ? (
          <svg className="trend-chart" viewBox="0 0 640 210" role="img" aria-labelledby="trend-title trend-desc">
            <title id="trend-title">Body weight trend</title><desc id="trend-desc">{chart.points.length} smoothed readings from {chart.points[0].value.toFixed(1)} to {chart.points.at(-1).value.toFixed(1)} {state.profile.unit}.</desc>
            <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C8FF4D" stopOpacity=".25"/><stop offset="1" stopColor="#C8FF4D" stopOpacity="0"/></linearGradient></defs>
            <path className="chart-grid" d="M24 22H616M24 97H616M24 172H616"/><path className="chart-area" d={chart.area}/><polyline className="chart-line" points={chart.line}/>
            {chart.points.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r={index === chart.points.length - 1 ? 5 : 2.5}/>) }
          </svg>
        ) : <div className="chart-empty"><span>↗</span><div><strong>Two readings reveal a trend.</strong><p>Log body weight consistently and the noise will smooth out here.</p></div></div>}
      </section>

      <section className="signal-strip" aria-label="Weekly progress summary">
        <div><span>WORKOUTS</span><strong>{review.workouts}<small> / 7 days</small></strong></div><div><span>FOOD LOGS</span><strong>{review.loggedDays}<small> / 7 days</small></strong></div><div><span>DIRECTION</span><strong>{review.weightTrend < -0.2 ? "Down" : review.weightTrend > 0.2 ? "Up" : "Stable"}</strong></div>
      </section>

      <div className="progress-tools">
        <section className="insight-card progress-insight"><div className="eyebrow">WEEKLY READ</div><strong>{review.weightTrend < -0.2 ? "Weight trending down" : review.weightTrend > 0.2 ? "Weight trending up" : "Weight relatively stable"}</strong><p>{review.summary}</p>{recentSession && <div className="latest-session"><span>Latest</span><strong>{recentSession.workoutName || recentSession.workoutDayId}</strong><small>{recentSummary.sets} sets · {Math.round(recentSummary.volume).toLocaleString()} lb</small></div>}</section>
        <div className="progress-actions">
          <section className="card-flat"><div className="eyebrow">LOG BODY WEIGHT</div><form className="inline-form" onSubmit={submitWeight}><input type="number" step="0.1" min="1" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={`Weight (${state.profile.unit})`} aria-label={`Weight in ${state.profile.unit}`}/><button className="btn primary compact" type="submit">Log</button></form><small className="support-copy">Use the same conditions each time. The trend handles daily noise.</small></section>
          <section className="card-flat"><div className="eyebrow">ADAPT NUTRITION</div><p className="body-copy">Check whether recorded intake matches the observed trend.</p><button className="btn secondary block" onClick={runCalibration}>Check current target</button>{calibration && !calibration.ok && <p className="notice">{calibration.reason}</p>}{calibration?.ok && <div className="calibration-callout"><strong>{suggestedDailyTarget.toLocaleString()} kcal suggested</strong><p>Current: {currentDailyTarget.toLocaleString()} kcal. Based on {calibration.loggedDays} logged days.</p><button className="btn primary compact" onClick={applyCalibration}>Use target</button></div>}</section>
        </div>
      </div>
    </div>
  );
}
