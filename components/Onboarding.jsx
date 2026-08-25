"use client";

import { useState } from "react";
import { GOALS, DEFAULT_SPLIT } from "@/lib/nutrition";

export default function Onboarding({ onDone }) {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lb");
  const [goal, setGoal] = useState("maintain");
  const [multiplier, setMultiplier] = useState("12");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const w = Number(weight), m = Number(multiplier);
    if (!(w > 0)) { setError("Enter your current weight."); return; }
    if (!(m > 0)) { setError("Enter a starting calories-per-pound estimate."); return; }
    onDone({ weight: w, unit, goal, multiplier: m, split: DEFAULT_SPLIT });
  }

  return (
    <div className="card">
      <h2>Set up your ledger</h2>
      <form onSubmit={submit}>
        <div className="row2">
          <div className="field">
            <label>Current weight</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="180" />
          </div>
          <div className="field">
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Goal</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Starting calories per {unit} (rough guess — refine it later with Calibrate)</label>
          <input type="number" step="0.5" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} placeholder="12" />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn primary" type="submit" style={{ marginTop: 8 }}>Start tracking</button>
      </form>
    </div>
  );
}
