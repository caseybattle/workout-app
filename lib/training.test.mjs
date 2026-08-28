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

console.log("=== WORKOUT DRAFT ===");
const workoutDay = { id: "upper", name: "Upper Body", exercises: [bench] };
const draft = T.createWorkoutDraft(workoutDay, [session([8, 8, 8])], "2026-08-27T17:00:00.000Z");
assert.equal(draft.workoutDayId, "upper");
assert.equal(draft.exercises.length, 1);
assert.equal(draft.exercises[0].sets.length, 3);
assert.equal(draft.exercises[0].sets[0].load, 190);
assert.equal(draft.exercises[0].sets[0].reps, 6);
assert.equal(draft.exercises[0].sets[0].rir, 2);

const edited = T.updateWorkoutSet(draft, 0, 0, { reps: 7, rir: 1 });
assert.equal(edited.exercises[0].sets[0].reps, 7);
assert.equal(edited.exercises[0].sets[0].rir, 1);
assert.equal(draft.exercises[0].sets[0].reps, 6, "set updates must be immutable");

const completed = T.completeWorkoutDraft(edited, "2026-08-27T17:50:00.000Z");
assert.equal(completed.completedAt, "2026-08-27T17:50:00.000Z");
assert.ok(completed.exercises[0].sets[0].completedAt);

console.log("=== RESUMABLE WORKOUT ===");
const active = T.createActiveWorkoutState(workoutDay, [session([8, 8, 8])], "2026-08-27T17:00:00.000Z");
assert.equal(active.workoutDayId, "upper");
assert.equal(active.exerciseIndex, 0);
assert.equal(active.setIndex, 0);
assert.equal(active.restEndsAt, null);

const resting = T.completeActiveWorkoutSet(active, "2026-08-27T17:01:00.000Z", 90);
assert.ok(resting.draft.exercises[0].sets[0].completedAt);
assert.equal(resting.setIndex, 1, "completing a set advances to the next actionable set");
assert.equal(resting.restEndsAt, "2026-08-27T17:02:30.000Z");
assert.equal(T.activeRestSeconds(resting, "2026-08-27T17:01:40.000Z"), 50);

const paused = T.pauseActiveWorkoutRest(resting, "2026-08-27T17:01:40.000Z");
assert.equal(paused.restEndsAt, null);
assert.equal(paused.restPausedSeconds, 50);
assert.equal(T.activeRestSeconds(paused, "2026-08-27T18:00:00.000Z"), 50, "paused rest does not keep counting down");

const resumed = T.resumeActiveWorkoutRest(paused, "2026-08-27T18:00:00.000Z");
assert.equal(resumed.restEndsAt, "2026-08-27T18:00:50.000Z");
assert.equal(resumed.restPausedSeconds, 0);

const skipped = T.skipActiveWorkoutRest(resumed);
assert.equal(skipped.restEndsAt, null);
assert.equal(skipped.restPausedSeconds, 0);
assert.equal(skipped.setIndex, 1, "skipping rest keeps the next set selected");

console.log("=== WORKOUT SUMMARY ===");
const summary = T.workoutSummary({
  exercises: [
    { sets: [{ load: 100, reps: 10 }, { load: 100, reps: 8 }] },
    { sets: [{ load: 50, reps: 12 }] },
  ],
});
assert.deepEqual(summary, { sets: 3, reps: 30, volume: 2400 });

console.log("training tests passed");
