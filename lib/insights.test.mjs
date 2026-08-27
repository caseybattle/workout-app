import assert from "node:assert/strict";
import { buildCoachContext, weeklyReview } from "./insights.js";
import { defaultProgram } from "./program.js";

const state = {
  profile: { weight: 180, unit: "lb", goal: "steady", multiplier: 12, split: { protein: 30, carbs: 40, fat: 30 } },
  logs: {
    "2026-08-27": [{ name: "Meal", protein: 40, carbs: 50, fat: 20 }],
    "2026-08-26": [{ name: "Meal", protein: 35, carbs: 45, fat: 20 }],
  },
  weights: [
    { date: "2026-08-20", lb: 181 },
    { date: "2026-08-27", lb: 180 },
  ],
  program: defaultProgram(),
  workoutSessions: [
    {
      id: "w1",
      workoutDayId: "upper",
      workoutName: "Upper Body",
      completedAt: "2026-08-26T18:00:00.000Z",
      exercises: [{ exerciseId: "bench", sets: [{ load: 185, reps: 8, rir: 2 }, { load: 185, reps: 8, rir: 2 }, { load: 185, reps: 8, rir: 2 }] }],
    },
  ],
};

console.log("=== COACH CONTEXT ===");
const context = buildCoachContext(state, "2026-08-27");
assert.match(context, /Lose steadily/i);
assert.match(context, /2160/);
assert.match(context, /Upper Body/);
assert.match(context, /Bench Press/i);
assert.ok(context.length < 1500);

console.log("=== WEEKLY REVIEW ===");
const review = weeklyReview(state, new Date("2026-08-27T12:00:00.000Z"));
assert.equal(review.workouts, 1);
assert.equal(review.loggedDays, 2);
assert.ok(Number.isFinite(review.weightTrend));
assert.ok(review.summary);

console.log("insights tests passed");
