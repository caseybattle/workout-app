import { neon } from "@neondatabase/serverless";

let client;
function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}
export const hasDb = () => Boolean(process.env.DATABASE_URL);

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS ledger_state (
      user_id    TEXT PRIMARY KEY,
      email      TEXT,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS ledger_ai_usage (
      user_id TEXT NOT NULL,
      day     DATE NOT NULL,
      calls   INT  NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    )`;
  schemaReady = true;
}

export async function loadState(userId) {
  await ensureSchema();
  const rows = await db()`SELECT data FROM ledger_state WHERE user_id = ${userId}`;
  return rows.length ? rows[0].data : null;
}

export async function saveState(userId, email, data) {
  await ensureSchema();
  await db()`
    INSERT INTO ledger_state (user_id, email, data, updated_at)
    VALUES (${userId}, ${email}, ${JSON.stringify(data)}, now())
    ON CONFLICT (user_id)
    DO UPDATE SET data = EXCLUDED.data, email = EXCLUDED.email, updated_at = now()`;
}

/* Per-user daily counter so a shared OpenAI key can't be drained. */
export async function bumpAiUsage(userId, limit) {
  await ensureSchema();
  const rows = await db()`
    INSERT INTO ledger_ai_usage (user_id, day, calls)
    VALUES (${userId}, CURRENT_DATE, 1)
    ON CONFLICT (user_id, day) DO UPDATE SET calls = ledger_ai_usage.calls + 1
    RETURNING calls`;
  const calls = rows[0].calls;
  return { calls, allowed: calls <= limit, limit };
}
