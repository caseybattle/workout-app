import assert from "node:assert/strict";
import { defaultProgram, normalizeTrainingState, nextWorkoutDay } from "./program.js";

console.log("=== PROGRAM MIGRATION ===");
const old = {
  profile: { weight: 180, unit: "lb", goal: "steady", multiplier: 12 },
  logs: { "2026-08-20": [{ id: 1, name: "Chicken" }] },
  weights: [{ date: "2026-08-20", lb: 180 }],
  updatedAt: "2026-08-20T12:00:00.000Z",
};
const migrated = normalizeTrainingState(old);
assert.deepEqual(migrated.profile, old.profile);
assert.deepEqual(migrated.logs, old.logs);
assert.deepEqual(migrated.weights, old.weights);
assert.equal(migrated.updatedAt, old.updatedAt);
assert.ok(Array.isArray(migrated.workoutSessions));
assert.equal(migrated.workoutSessions.length, 0);
assert.ok(migrated.program?.workoutDays?.length >= 3);

console.log("=== DEFAULT PROGRAM ===");
const program = defaultProgram();
assert.equal(program.active, true);
assert.equal(program.workoutDays.length, 3);
for (const day of program.workoutDays) {
  assert.ok(day.exercises.length >= 4);
  for (const exercise of day.exercises) {
    assert.ok(exercise.id);
    assert.ok(exercise.name);
    assert.ok(exercise.sets > 0);
    assert.ok(exercise.repMin > 0 && exercise.repMax >= exercise.repMin);
    assert.ok(exercise.incrementLb > 0);
  }
}

console.log("=== NEXT WORKOUT ===");
const first = nextWorkoutDay(program, []);
assert.equal(first.id, program.workoutDays[0].id);
const afterOne = nextWorkoutDay(program, [{ workoutDayId: program.workoutDays[0].id, completedAt: "2026-08-20T10:00:00.000Z" }]);
assert.equal(afterOne.id, program.workoutDays[1].id);
const afterCycle = nextWorkoutDay(program, [
  { workoutDayId: program.workoutDays[0].id, completedAt: "2026-08-18T10:00:00.000Z" },
  { workoutDayId: program.workoutDays[1].id, completedAt: "2026-08-20T10:00:00.000Z" },
  { workoutDayId: program.workoutDays[2].id, completedAt: "2026-08-22T10:00:00.000Z" },
]);
assert.equal(afterCycle.id, program.workoutDays[0].id);

console.log("program tests passed");
