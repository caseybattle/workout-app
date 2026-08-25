import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

const NUT = { protein: 1003, fat: 1004, carbs: 1005 };

/* Server-side proxy so the USDA key never reaches the browser. */
export async function GET(req) {
  const gate = await requireUser({ allowAnonymous: true });
  if (!gate.ok) return Response.json(gate.body, { status: gate.status });

  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (!q) return Response.json({ foods: [] });

  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}`
    + `&query=${encodeURIComponent(q)}&pageSize=20`
    + `&dataType=${encodeURIComponent("Foundation,SR Legacy,Branded")}`;

  let res;
  try { res = await fetch(url, { cache: "no-store" }); }
  catch { return Response.json({ error: "unreachable" }, { status: 503 }); }

  if (res.status === 429) return Response.json({ error: "rate" }, { status: 429 });
  if (res.status === 403) return Response.json({ error: "key" }, { status: 502 });
  if (!res.ok) return Response.json({ error: "upstream" }, { status: 502 });

  const data = await res.json();
  const foods = (data.foods || []).map((f) => {
    const val = (id) => {
      const n = (f.foodNutrients || []).find((x) => x.nutrientId === id);
      return n ? Math.max(0, Number(n.value) || 0) : 0;   // USDA returns small negatives
    };
    return {
      id: String(f.fdcId),
      name: f.description || "Unnamed",
      brand: f.brandOwner || f.brandName || "",
      type: f.dataType || "",
      per100: { protein: val(NUT.protein), carbs: val(NUT.carbs), fat: val(NUT.fat) },
      servingG: f.servingSizeUnit === "g" ? Number(f.servingSize) || 0 : 0,
      servingText: f.householdServingFullText || "",
    };
  }).filter((f) => f.per100.protein + f.per100.carbs + f.per100.fat > 0);

  return Response.json({ foods });
}
