import { requireUser } from "@/lib/guard";
import { bumpAiUsage } from "@/lib/db";

export const dynamic = "force-dynamic";

const MODEL = "gpt-4o-mini";
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 40;

function str(v, max) {
  return String(v ?? "").trim().slice(0, max);
}

const TASKS = {
  estimate: {
    maxOutput: 400,
    build(fields) {
      return {
        system:
          "You estimate nutrition for a food-logging feature inside a fitness app. Given a short food description, " +
          'respond with ONLY a JSON object: {"name":string,"kcal":number,"protein":number,"carbs":number,"fat":number}. ' +
          "protein/carbs/fat are grams, kcal is for one serving as described. No prose, no markdown fences.",
        user: `Food: ${fields.known}\nPortion/details: ${fields.context}`,
      };
    },
  },
  lookup: {
    maxOutput: 500,
    build(fields) {
      return {
        system:
          "You help find likely nutrition facts for branded or restaurant foods a USDA database " +
          "search might miss. Respond with ONLY a JSON array of up to 5 candidates: " +
          '[{"name":string,"kcal":number,"protein":number,"carbs":number,"fat":number,"servingText":string}]. ' +
          "No prose, no markdown fences.",
        user: `Query: ${fields.known}\nAdditional context: ${fields.context}`,
      };
    },
  },
  coach: {
    maxOutput: 420,
    build(fields) {
      return {
        system:
          "You are the concise coaching layer inside an adaptive strength-training app. Use only the recorded context supplied to you. " +
          "The app's deterministic progression and nutrition-calibration rules are the source of truth: explain those decisions, do not replace them with invented targets. " +
          "Never invent a weight, rep count, body-weight trend, or calorie result that is not in the context. If the data is insufficient, say exactly what is missing. " +
          "Keep answers practical, specific, and brief. Do not provide medical diagnosis or treatment advice.",
        user: `Recorded context: ${fields.known}\n\nUser question: ${fields.question}\n\nGuardrails/context: ${fields.context}`,
      };
    },
  },
};

export async function POST(req) {
  const gate = await requireUser();
  if (!gate.ok) return Response.json(gate.body, { status: gate.status });

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad body" }, { status: 400 }); }

  const task = TASKS[body?.task];
  if (!task) return Response.json({ error: "unknown task" }, { status: 400 });

  const fields = {
    known: str(body.known, 1500),
    question: str(body.question, 300),
    context: str(body.context, 800),
  };

  let usage;
  try { usage = await bumpAiUsage(gate.user.id, DAILY_LIMIT); }
  catch { usage = { allowed: true, calls: 0, limit: DAILY_LIMIT }; }
  if (!usage.allowed) {
    return Response.json(
      { error: "limit", message: `You've used all ${usage.limit} AI requests for today. They reset tomorrow; workout logging, food search, and deterministic recommendations still work normally.` },
      { status: 429 }
    );
  }

  const { system, user } = task.build(fields);

  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: task.maxOutput,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: "upstream", status: res.status, detail: detail.slice(0, 200) },
      { status: 502 }
    );
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return Response.json({ text, callsToday: usage.calls, limit: usage.limit });
}
