# Margin

How much room do you have left today?

A small calorie/macro ledger for a private group. Sign in with Google, log
what you eat, log your weight, and let it calibrate your target over time
instead of guessing at a number forever.

## Production

- App: `https://workout-app-rho-dusky.vercel.app`

## Stack

- Next.js 16 (App Router), React 19, plain JavaScript
- NextAuth.js v4, Google provider, JWT sessions
- Neon Postgres (`@neondatabase/serverless`) for per-user storage
- OpenAI, server-side only, for optional food estimation/lookup/coaching

## Environment variables

See `.env.example`. In short:

- `OPENAI_API_KEY` — powers `/api/ai` (estimate / lookup / coach)
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth client
- `AUTH_SECRET` — random string, signs session tokens
- `NEXTAUTH_URL` — canonical production URL used for OAuth callbacks
- `AUTH_RESTRICTED` — set to `true` to enforce the Google email allowlist
- `ALLOWED_EMAILS` — comma-separated allowlist used only in restricted mode
- `DATABASE_URL` — Neon connection string
- `USDA_API_KEY` — optional, food search falls back to a shared demo key
- `AI_DAILY_LIMIT` — optional, defaults to 40 calls/user/day

Without `AUTH_GOOGLE_ID`/`AUTH_SECRET` set, the app runs single-user,
local-storage-only, no sign-in wall — useful for trying it before wiring up
Google.

## Develop

```bash
npm install
npm run dev
```

## Deploy

```bash
npm install
npx vercel          # first run links the project
npx vercel --prod
```

Add every variable from `.env.example` in **Vercel → Project → Settings →
Environment Variables**, then redeploy so they take effect.

## How the AI endpoint is protected

The browser never sends a raw prompt — it sends a task name (`estimate`,
`lookup`, `coach`) plus a few short fields, and the server assembles the
actual prompt. On top of that:

- Sign-in required on every call. Set `AUTH_RESTRICTED=true` to restrict access to `ALLOWED_EMAILS`.
- Per-user daily cap, `AI_DAILY_LIMIT`, default 40 calls.
- Every input field length-capped before it reaches the model.
- `max_completion_tokens` capped per task.

## Running the tests

The calorie/weight math — targets, calibration, rolling weight smoothing,
weekly rollups — lives in `lib/nutrition.js` with no React and no network
calls, so it's checked directly:

```bash
npm test
```

## Storage

One row per user, one JSON document per row, in `ledger_state`. The app
also keeps a local copy in the browser, so it opens instantly and keeps
working if the network drops, syncing (last write wins, by timestamp) when
it returns.
