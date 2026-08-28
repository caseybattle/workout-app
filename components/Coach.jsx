"use client";

import { useState } from "react";
import { callAi } from "@/lib/client";
import { buildCoachContext, weeklyReview } from "@/lib/insights";
import { targetKcal, today } from "@/lib/nutrition";

const STARTERS = ["What should I focus on today?", "Should I progress my next workout?", "Is my weight trend matching my goal?"];

export default function Coach({ state }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const review = weeklyReview(state);

  async function ask(text = question) {
    const q = String(text || "").trim();
    if (!q || busy) return;
    setQuestion(q); setAsked(q); setBusy(true); setError(""); setAnswer("");
    try {
      const context = buildCoachContext(state, today());
      const result = await callAi("coach", { known: context, question: q, context: "Use the app's recorded data. Explain recommendations, but do not override deterministic progression or calorie-calibration rules." });
      setAnswer(result);
    } catch (err) { setError(err.message === "NOT_CONFIGURED" ? "Coach isn't configured yet." : err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="screen-stack coach-screen">
      <header className="section-head editorial-head"><div><div className="eyebrow">COACH / YOUR DATA</div><h2>Ask a better question.</h2><p>Get a practical read on the information already inside your training journal.</p></div><span className="coach-status"><i/>Context ready</span></header>

      <div className="coach-workspace">
        <aside className="coach-context" aria-label="Coach context">
          <div className="context-head"><span>READING</span><strong>Today’s signals</strong></div>
          <dl><div><dt>Training</dt><dd>{review.workouts} sessions / 7d</dd></div><div><dt>Nutrition</dt><dd>{review.loggedDays} logged days</dd></div><div><dt>Target</dt><dd>{targetKcal(state.profile).toLocaleString()} kcal</dd></div><div><dt>Weight</dt><dd>{review.weightTrend < -0.2 ? "Trending down" : review.weightTrend > 0.2 ? "Trending up" : "Stable / limited"}</dd></div></dl>
          <p>Coach explains your records. Program progression and calorie calibration stay rules-based.</p>
        </aside>

        <section className="coach-thread" aria-label="Coach conversation">
          <div className="thread-window" aria-live="polite">
            {!asked && <div className="coach-welcome"><span className="coach-monogram">M</span><div><strong>I’m reading the plan, not guessing.</strong><p>Ask about today’s session, progression, nutrition, or your recent trend.</p></div></div>}
            {asked && <div className="message user-message"><span>You</span><p>{asked}</p></div>}
            {busy && <div className="message coach-message thinking"><span>Coach</span><p>Reviewing your current signals…</p></div>}
            {answer && <div className="message coach-message"><span>Coach</span><p>{answer}</p></div>}
            {error && <div className="message error-message"><span>Couldn’t respond</span><p>{error}</p></div>}
          </div>
          <div className="starter-row" aria-label="Suggested questions">{STARTERS.map((starter) => <button key={starter} onClick={() => ask(starter)} disabled={busy}>{starter}</button>)}</div>
          <form className="coach-composer" onSubmit={(event) => { event.preventDefault(); ask(); }}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your next move…" rows={2} aria-label="Question for Coach"/><button className="btn primary" type="submit" disabled={busy || !question.trim()} aria-label="Send question">{busy ? "Reading" : "Send"}<span aria-hidden="true">↗</span></button></form>
        </section>
      </div>
    </div>
  );
}
