import { requireUser } from "@/lib/guard";
import { loadState, saveState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return Response.json(gate.body, { status: gate.status });
  try {
    const data = await loadState(gate.user.id);
    return Response.json({ data });
  } catch (e) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }
}

export async function PUT(req) {
  const gate = await requireUser();
  if (!gate.ok) return Response.json(gate.body, { status: gate.status });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad body" }, { status: 400 }); }
  if (!body || typeof body !== "object" || !body.profile) {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  // 20 MB is far more than this app can legitimately produce; refuse anything near it.
  if (JSON.stringify(body).length > 4_000_000) {
    return Response.json({ error: "too large" }, { status: 413 });
  }
  try {
    await saveState(gate.user.id, gate.user.email, body);
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }
}
