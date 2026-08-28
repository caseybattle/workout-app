"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function Gate() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="shell gate">
      <div className="gate-card new-gate-card">
        <div className="product-mark">MARGIN</div>
        <h1>Your plan should learn from your results.</h1>
        <p>Train, track enough fuel and body-weight data, and use what actually happens to improve what you do next.</p>

        <div className="gate-steps" aria-label="How it works">
          <div><span>1</span><strong>Train</strong><small>Know exactly what to do today.</small></div>
          <div><span>2</span><strong>Track</strong><small>Log performance, food, and weight.</small></div>
          <div><span>3</span><strong>Adapt</strong><small>Progress from your real results.</small></div>
        </div>

        <button
          className="btn primary gate-action"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            signIn("google", { callbackUrl: "/" });
          }}
        >
          {busy ? "Opening secure sign-in…" : "Continue with Google"}
        </button>
        <small className="gate-footnote">Your training and nutrition history syncs to your account.</small>
      </div>
    </div>
  );
}
