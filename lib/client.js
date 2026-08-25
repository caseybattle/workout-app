/* Browser-side helpers: talk to our own API routes, never external ones directly. */

const LOCAL_KEY = "ledger_state_v1";

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocal(state) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch {}
}

/* ── sync ──────────────────────────────────────────────── */
export async function fetchRemoteState() {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) throw new Error("Couldn't load your data.");
  const json = await res.json();
  return json.data;
}

export async function pushRemoteState(state) {
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error("Couldn't save.");
  return res.json();
}

/* Last write wins, by timestamp. Local storage keeps the app usable offline;
   this decides which copy — local or server — is newer when both exist. */
export function resolveConflict(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  const l = local.updatedAt || "";
  const r = remote.updatedAt || "";
  return r > l ? remote : local;
}

export function stamp(state) {
  return { ...state, updatedAt: new Date().toISOString() };
}

/* ── food search ───────────────────────────────────────── */
export async function searchFoods(q) {
  const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const map = {
      rate: "The food database is rate limited right now. Try again shortly, or enter the numbers by hand.",
      key: "The food database key was rejected. Whoever set this up needs to check USDA_API_KEY.",
      unreachable: "Couldn't reach the food database. Check your connection.",
    };
    throw new Error(map[j.error] || "The food database didn't respond. Try again, or enter the numbers by hand.");
  }
  const json = await res.json();
  return json.foods || [];
}

/* ── AI ────────────────────────────────────────────────── */
export async function callAi(task, fields) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, ...fields }),
  });
  if (res.status === 503) throw new Error("NOT_CONFIGURED");
  if (res.status === 429) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || "You've used today's AI lookups.");
  }
  if (!res.ok) throw new Error("The estimator didn't respond. Try the food search instead.");
  const json = await res.json();
  return json.text || "";
}

export function parseJsonish(text) {
  let t = String(text).replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  const c = t.indexOf("{"), d = t.lastIndexOf("}");
  if (a !== -1 && b > a) t = t.slice(a, b + 1);
  else if (c !== -1 && d > c) t = t.slice(c, d + 1);
  return JSON.parse(t);
}
