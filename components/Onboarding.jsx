"use client";

import { useState } from "react";
import { DEFAULT_SPLIT } from "@/lib/nutrition";

const GOALS = [
  { id: "steady", label: "Lose fat", copy: "Reduce body weight while protecting training performance." },
  { id: "build", label: "Build muscle", copy: "Support progressive strength and muscle gain." },
  { id: "maintain", label: "Get stronger", copy: "Keep body weight broadly stable while improving training." },
];

const STARTING_FACTOR = {
  steady: 12,
  build: 15,
  maintain: 14,
};

export default function Onboarding({ onDone }) {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lb");
  const [goal, setGoal] = useState("steady");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const currentWeight = Number(weight);
    if (!(currentWeight > 0)) {
      setError("Enter your current weight so the starting targets have a baseline.");
      return;
    }
    onDone({
      weight: currentWeight,
      unit,
      goal,
      multiplier: STARTING_FACTOR[goal],
      split: DEFAULT_SPLIT,
    });
  }

  return (
    <div className="onboarding-card">
      <div className="eyebrow">SET YOUR STARTING POINT</div>
      <h1>What are you training for?</h1>
      <p className="onboarding-lead">Pick the outcome. The app handles the starting math and improves it as you log real results.</p>

      <form onSubmit={submit}>
        <div className="goal-grid">
          {GOALS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`goal-option ${goal === option.id ? "active" : ""}`}
              onClick={() => setGoal(option.id)}
            >
              <strong>{option.label}</strong>
              <small>{option.copy}</small>
            </button>
          ))}
        </div>

        <div className="row2 onboarding-weight">
          <div className="field">
            <label>Current weight</label>
            <input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder={unit === "kg" ? "82" : "180"} />
          </div>
          <div className="field">
            <label>Unit</label>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        {error && <p className="notice danger-copy">{error}</p>}

        <div className="setup-note">
          <strong>Your first plan</strong>
          <p>You'll start with a simple 3-day strength foundation. Training performance, food, and weight trends will make future recommendations more personal.</p>
        </div>

        <button className="btn primary onboarding-action" type="submit">Build My Starting Plan</button>
      </form>
    </div>
  );
}
