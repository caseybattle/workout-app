"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/* Fix: sign-in must go through the signIn() helper, which does a POST with a
   CSRF token. A plain <a href="/api/auth/signin/google"> sends a GET, which
   Auth.js v5 rejects with UnknownAction. */
export default function Gate() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="shell gate">
      <div className="gate-card">
        <h1>Margin</h1>
        <p>How much room do you have left today?</p>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            signIn("google", { callbackUrl: "/" });
          }}
        >
          {busy ? "Redirecting…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
