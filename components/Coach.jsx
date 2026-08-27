"use client";

import { useState } from "react";
import { callAi } from "@/lib/client";
import { buildCoachContext } from "@/lib/insights";
import { today } from "@/lib/nutrition";

const STARTERS = [
  "Should I progress my next workout?",
  "Is my weight trend matching my goal?",
  "What should I focus on today?",
];

export default function Coach({ state }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(text = question) {
    const q = String(text || "").trim();
    if (!q || busy) return;
    setQuestion(q);
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const context = buildCoachContext(state, today());
      const result = await callAi("coach", {
        known: context,
        question: q,
        context: "Use the app's recorded data. Explain recommendations, but do not override deterministic progression or calorie-calibration rules.",
      });
      setAnswer(result);
    } catch (err) {
      setError(err.message === "NOT_CONFIGURED" ? "Coach isn't configured yet." : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-stack">
      <header className="section-head">
        <div>
          <div className="eyebrow">COACH</div>
          <h2>Ask about your actual plan</h2>
          <p>The coach sees your current goal, logged fuel, weight trend, next workout, and recent training.</p>
        </div>
      </header>

      <section className="coach-card">
        <div className="coach-orb" aria-hidden="true">A</div>
        <div>
          <strong>Context-aware coaching</strong>
          <p>Use it to understand the plan—not to replace the progression rules that keep decisions consistent.</p>
        </div>
      </section>

      <div className="starter-row">
        {STARTERS.map((starter) => (
          <button key={starter} onClick={() => ask(starter)}>{starter}</button>
        ))}
      </div>

      <form className="coach-form" onSubmit={(event) => { event.preventDefault(); ask(); }}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about today's workout, progression, nutrition, or your trend..."
          rows={4}
        />
        <button className="btn primary" type="submit" disabled={busy || !question.trim()}>
          {busy ? "Checking your data…" : "Ask Coach"}
        </button>
      </form>

      {error && <p className="notice danger-copy">{error}</p>}
      {answer && (
        <section className="coach-answer">
          <div className="eyebrow">COACH RESPONSE</div>
          <p>{answer}</p>
        </section>
      )}
    </div>
  );
}
