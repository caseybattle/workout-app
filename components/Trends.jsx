"use client";

import { useState } from "react";
import { weeklyAverages, calibrate, today } from "@/lib/nutrition";

export default function Trends({ state, onLogWeight, onUpdateProfile }) {
  const weeks = weeklyAverages(state.logs);
  const [w, setW] = useState("");
  const [calib, setCalib] = useState(null);

  function submitWeight(e) {
    e.preventDefault();
    const val = Number(w);
    if (!(val > 0)) return;
    onLogWeight({ date: today(), lb: val });
    setW("");
  }

  function runCalibration() {
    setCalib(calibrate({ logs: state.logs, weights: state.weights, profile: state.profile }));
  }

  function applySuggested() {
    if (calib?.ok) onUpdateProfile({ ...state.profile, multiplier: calib.suggested });
  }

  return (
    <>
      <div className="card">
        <h2>Log weight</h2>
        <form onSubmit={submitWeight} className="row2">
          <div className="field">
            <label>Weight ({state.profile.unit})</label>
            <input type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} placeholder={state.profile.unit === "kg" ? "82" : "180"} />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn primary block" type="submit">Log today</button>
          </div>
        </form>
        <p className="hint-text">{state.weights.length} weigh-ins logged.</p>
      </div>

      <div className="card">
        <h2>Weekly averages</h2>
        {weeks.length === 0 ? (
          <p className="empty">Log a few days to see trends.</p>
        ) : (
          weeks.map((wk) => (
            <div className="weekrow" key={wk.label}>
              <div>
                <div className="wl">{wk.label}</div>
                <div className="wd">{wk.loggedDays} day{wk.loggedDays === 1 ? "" : "s"} logged</div>
              </div>
              <div className="wv">{Math.round(wk.kcal)} kcal/day</div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Calibrate</h2>
        <p className="hint-text">Checks your calories-per-{state.profile.unit} number against what actually happened.</p>
        <button className="btn block" onClick={runCalibration} style={{ marginTop: 12 }}>Run calibration</button>
        {calib && !calib.ok && <p className="error-text">{calib.reason}</p>}
        {calib?.ok && (
          <div className="calib-result">
            <div className="big">{calib.suggested} / {state.profile.unit}</div>
            <p className="hint-text" style={{ margin: "4px 0 12px" }}>
              Currently set to {calib.current}. Based on {calib.loggedDays} logged days over {calib.span}.
            </p>
            <button className="btn primary small" onClick={applySuggested}>Use {calib.suggested}</button>
          </div>
        )}
      </div>
    </>
  );
}
