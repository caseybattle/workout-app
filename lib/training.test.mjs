import assert from "node:assert/strict";
import * as T from "./training.js";

const bench = {
  id: "bench",
  name: "Bench Press",
  sets: 3,
  repMin: 6,
  repMax: 8,
  incrementLb: 5,
};

const session = (reps, load = 185, rir = 2) => ({
  id: `session-${reps.join("-")}-${load}`,
  exercises: [
    {
      exerciseId: "bench",
      sets: reps.map((rep) => ({ load, reps: rep, rir })),
    },
  ],
});

console.log("=== TRAINING PROGRESSION ===");

const increase = T.recommendProgression(bench, [session([8, 8, 8])]);
assert.equal(increase.action, "increase");
assert.equal(increase.nextLoad, 190);
assert.match(increase.reason, /cleared/i);

const reps = T.recommendProgression(bench, [session([8, 7, 6])]);
assert.equal(reps.action, "reps");
assert.equal(reps.nextLoad, 185);

const hold = T.recommendProgression(bench, [session([5, 5, 5])]);
assert.equal(hold.action, "hold");
assert.equal(hold.nextLoad, 185);

const reduce = T.recommendProgression(bench, [session([5, 5, 5]), session([5, 5, 5])]);
assert.equal(reduce.action, "reduce");
assert.equal(reduce.nextLoad, 180);

const hardTop = T.recommendProgression(bench, [session([8, 8, 8], 185, 0)]);
assert.notEqual(hardTop.action, "increase", "Do not increase when all top sets were true failure-effort sets");

const start = T.recommendProgression(bench, []);
assert.equal(start.action, "start");
assert.equal(start.nextLoad, null);

console.log("=== WORKOUT SUMMARY ===");
const summary = T.workoutSummary({
  exercises: [
    { sets: [{ load: 100, reps: 10 }, { load: 100, reps: 8 }] },
    { sets: [{ load: 50, reps: 12 }] },
  ],
});
assert.deepEqual(summary, { sets: 3, reps: 30, volume: 2400 });

console.log("training tests passed");
