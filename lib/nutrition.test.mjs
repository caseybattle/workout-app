import * as N from "./nutrition.js";

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ok  - ${label}`); }
  else { fail++; console.log(`FAIL  - ${label}` + (detail !== undefined ? ` (got: ${JSON.stringify(detail)})` : "")); }
}
function near(a, b, eps = 0.01) { return Math.abs(a - b) <= eps; }

console.log("=== TOTALS ===");
const t = N.totalsFor([{ protein: 30, carbs: 40, fat: 10 }, { protein: 10, carbs: 0, fat: 5 }]);
ok("sums macros", t.protein === 40 && t.carbs === 40 && t.fat === 15, t);
ok("kcal = 4p + 4c + 9f", near(t.kcal, 40 * 4 + 40 * 4 + 15 * 9), t.kcal);

console.log("\n=== MEAL BY TIME ===");
ok("08:00 -> Breakfast", N.mealNow(new Date(2026, 0, 1, 8)) === "Breakfast");
ok("13:00 -> Lunch", N.mealNow(new Date(2026, 0, 1, 13)) === "Lunch");
ok("19:00 -> Dinner", N.mealNow(new Date(2026, 0, 1, 19)) === "Dinner");
ok("23:00 -> Snack", N.mealNow(new Date(2026, 0, 1, 23)) === "Snack");

console.log("\n=== ROLLING WEIGHTS ===");
const w = [
  { date: "2026-01-01", lb: 200 },
  { date: "2026-01-02", lb: 200 },
  { date: "2026-01-03", lb: 200 },
  { date: "2026-01-04", lb: 203 },
];
const rw = N.rollingWeights(w);
ok("first point averages to itself", rw[0].avg === 200, rw[0].avg);
ok("average smooths a 3 lb spike", near(rw[3].avg, 200.75), rw[3].avg);
ok("raw readings preserved alongside", rw[3].lb === 203, rw[3].lb);

console.log("\n=== BLOCKS ===");
const b = N.blocks(950, 2000);
ok("total blocks from target", b.total === 20, b.total);
ok("used blocks from eaten", b.used === 10, b.used);
ok("not over budget", b.over === 0, b.over);
const bOver = N.blocks(2150, 2000);
ok("flags being over", bOver.over === 2, bOver.over);

console.log("\n=== CALIBRATION ===");
const p200 = { weight: 200, unit: "lb", goal: "faster", multiplier: 11, split: N.DEFAULT_SPLIT };
const mk = (days, kcalPerDay, weightFn) => {
  const logs = {}, weights = [];
  for (let i = days; i >= 0; i--) {
    const d = N.shiftDay(N.today(), -i);
    logs[d] = [{ name: "day", protein: 0, carbs: kcalPerDay / 4, fat: 0 }];
    if (i % 2 === 0) weights.push({ date: d, lb: weightFn(days - i) });
  }
  return { logs, weights, profile: { weight: 200, unit: "lb", goal: "faster", multiplier: 11, split: N.DEFAULT_SPLIT } };
};

const flat = N.calibrate(mk(20, 2500, () => 200));
ok("flat weight -> maintenance ~= intake", flat.ok && near(flat.maintenance, 2500, 5), flat);
ok("suggests x10 for the faster goal", flat.ok && flat.suggested === 10, flat.suggested);

const losing = N.calibrate(mk(20, 2200, (i) => 200 - i * 0.1));
ok("losing weight raises the maintenance estimate", losing.ok && losing.maintenance > 2200, losing.maintenance);
ok("weekly change reported as negative", losing.ok && losing.weeklyChange < 0, losing.weeklyChange);

console.log("\n=== CALIBRATION REFUSES BAD DATA ===");
ok("refuses with one weigh-in",
   N.calibrate({ logs: {}, weights: [{ date: N.today(), lb: 200 }], profile: p200 }).ok === false);
const short = mk(6, 2500, () => 200);
ok("refuses under 14 days", N.calibrate(short).ok === false && N.calibrate(short).need === "time", N.calibrate(short).need);
const sparse = mk(20, 2500, () => 200);
Object.keys(sparse.logs).slice(0, 12).forEach((k) => delete sparse.logs[k]);
const sp = N.calibrate(sparse);
ok("refuses under 80% logging coverage", sp.ok === false && sp.need === "logging", sp.need);
ok("tells you how much you logged", sp.ok === false && /\d+ of those \d+ days/.test(sp.reason), sp.reason);

console.log("\n=== WEEKLY ===");
const wk = N.weeklyAverages(mk(20, 2000, () => 200).logs);
ok("produces up to 4 weeks", wk.length >= 3 && wk.length <= 4, wk.length);
ok("weekly average matches intake", near(wk[0].kcal, 2000, 1), wk[0].kcal);
ok("labels the current week", wk[0].label === "This week", wk[0].label);

console.log("\n=== TARGETS ===");
ok("target kcal = lb weight x multiplier", N.targetKcal({ weight: 180, unit: "lb", multiplier: 12 }) === 2160);
ok("kg target converts to lb-equivalent before multiplier", near(N.targetKcal({ weight: 82, unit: "kg", multiplier: 12 }), 2169, 1), N.targetKcal({ weight: 82, unit: "kg", multiplier: 12 }));
const mt = N.macroTargets(2000);
ok("macro split sums close to target kcal", near(mt.protein * 4 + mt.carbs * 4 + mt.fat * 9, 2000, 20), mt);

console.log("\n================================");
console.log(`${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);
