# Adaptive Training MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reconstructed calorie-led interface with a mobile-first adaptive training MVP where users can see today's plan, log a workout, preserve food/weight tracking, and receive deterministic progression recommendations.

**Architecture:** Extend the existing JSON state compatibly with `program` and `workoutSessions`, keeping current nutrition data untouched. Put all progression decisions in pure `lib/training.js` functions, test them independently, then make React components consume those functions. Keep local-first + `/api/state` JSONB persistence unchanged.

**Tech Stack:** Next.js 15, React 19, Node.js custom test scripts, Auth.js v5, Neon JSONB state, existing USDA/OpenAI API routes.

**Spec:** `docs/superpowers/specs/2026-08-27-adaptive-training-design.md`

## Global Constraints
- Training is the primary action; nutrition supports the training/body-composition goal.
- Navigation labels are exactly: Today, Train, Food, Progress, Coach.
- Deterministic engines are the source of truth for progression and calorie-target changes.
- Existing `profile`, `logs`, and `weights` data must remain readable and preserved.
- No social feed, marketplace, wearable platform, recipe platform, or excessive gamification.
- Mobile controls must remain usable at 390px viewport width and honor safe-area insets.

---

### Task 1: Training decision engine

**Files:**
- Create: `lib/training.test.mjs`
- Create: `lib/training.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `recommendProgression(prescription, recentSessions)` returning `{ action, nextLoad, targetRepMin, targetRepMax, reason }`.
- Produces: `workoutSummary(session)` returning `{ sets, reps, volume }`.

- [ ] **Step 1: Write failing progression tests**

```js
import * as T from './training.js';
import assert from 'node:assert/strict';

const bench = { id:'bench', name:'Bench Press', sets:3, repMin:6, repMax:8, incrementLb:5 };
const session = (reps, load=185, rir=2) => ({ exercises:[{ exerciseId:'bench', sets:reps.map(r => ({ load, reps:r, rir })) }] });

assert.equal(T.recommendProgression(bench, [session([8,8,8])]).action, 'increase');
assert.equal(T.recommendProgression(bench, [session([8,7,6])]).action, 'reps');
assert.equal(T.recommendProgression(bench, [session([5,5,5])]).action, 'hold');
assert.equal(T.recommendProgression(bench, [session([5,5,5]), session([5,5,5])]).action, 'reduce');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node lib/training.test.mjs`
Expected: failure because `lib/training.js` does not exist.

- [ ] **Step 3: Implement the minimal pure engine**

```js
export function recommendProgression(prescription, recentSessions = []) {
  const latest = recentSessions[0]?.exercises?.find(e => e.exerciseId === prescription.id);
  if (!latest?.sets?.length) return { action:'start', nextLoad:null, targetRepMin:prescription.repMin, targetRepMax:prescription.repMax, reason:'No previous working sets yet.' };
  const sets = latest.sets;
  const load = Number(sets[0].load) || 0;
  const allTop = sets.every(s => Number(s.reps) >= prescription.repMax && (s.rir == null || Number(s.rir) >= 1));
  if (allTop) return { action:'increase', nextLoad:load + prescription.incrementLb, targetRepMin:prescription.repMin, targetRepMax:prescription.repMax, reason:`You cleared ${prescription.repMax} reps across all working sets.` };
  const allMin = sets.every(s => Number(s.reps) >= prescription.repMin);
  if (allMin) return { action:'reps', nextLoad:load, targetRepMin:prescription.repMin, targetRepMax:prescription.repMax, reason:'Keep the load and add reps before increasing weight.' };
  const previous = recentSessions[1]?.exercises?.find(e => e.exerciseId === prescription.id);
  const previousMiss = previous?.sets?.length && previous.sets.some(s => Number(s.reps) < prescription.repMin);
  if (previousMiss) return { action:'reduce', nextLoad:Math.max(0, load - prescription.incrementLb), targetRepMin:prescription.repMin, targetRepMax:prescription.repMax, reason:'You missed the rep floor in two comparable sessions, so reduce one increment and rebuild.' };
  return { action:'hold', nextLoad:load, targetRepMin:prescription.repMin, targetRepMax:prescription.repMax, reason:'Repeat this load once before changing it.' };
}
```

- [ ] **Step 4: Verify GREEN and existing nutrition tests**

Run: `node lib/training.test.mjs && node lib/nutrition.test.mjs`
Expected: both exit 0.

- [ ] **Step 5: Make `npm test` execute both suites and run before build**

Set scripts to:
```json
{
  "test": "node lib/nutrition.test.mjs && node lib/training.test.mjs",
  "build": "npm test && next build"
}
```

- [ ] **Step 6: Commit**

`git commit -m "feat: add deterministic training progression engine"`

---

### Task 2: Compatible training state

**Files:**
- Create: `lib/program.js`
- Create: `lib/program.test.mjs`
- Modify: `components/LedgerApp.jsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `defaultProgram()`.
- Produces: `normalizeTrainingState(state)` preserving existing keys and adding missing `program` and `workoutSessions`.

- [ ] **Step 1: Write failing migration test**

```js
import assert from 'node:assert/strict';
import { normalizeTrainingState } from './program.js';
const old = { profile:{ weight:180 }, logs:{ a:[1] }, weights:[{lb:180}] };
const next = normalizeTrainingState(old);
assert.deepEqual(next.logs, old.logs);
assert.deepEqual(next.weights, old.weights);
assert.ok(next.program.workoutDays.length >= 3);
assert.deepEqual(next.workoutSessions, []);
```

- [ ] **Step 2: Verify RED**
Run: `node lib/program.test.mjs`
Expected: module-not-found failure.

- [ ] **Step 3: Implement default three-day full-body starter plan and migration**
Use Upper/Lower/Full Body days with common compound + accessory prescriptions and conservative increments (5 lb upper-body, 10 lb lower-body where appropriate).

- [ ] **Step 4: Verify GREEN**
Run: `node lib/program.test.mjs && npm test`
Expected: exit 0.

- [ ] **Step 5: Normalize resolved state inside `LedgerApp` before rendering and persistence**
The existing `profile`, `logs`, `weights`, `updatedAt` values must not be renamed or dropped.

- [ ] **Step 6: Commit**
`git commit -m "feat: add compatible workout program state"`

---

### Task 3: Mobile app shell and Today/Train flow

**Files:**
- Create: `components/AppNav.jsx`
- Create: `components/TodayDashboard.jsx`
- Create: `components/Train.jsx`
- Create: `components/ActiveWorkout.jsx`
- Modify: `components/LedgerApp.jsx`

**Interfaces:**
- `AppNav({ tab, onChange })` supports exactly `today|train|food|progress|coach`.
- `ActiveWorkout({ workoutDay, previousSessions, onComplete, onCancel })` emits a completed session object matching the spec.

- [ ] **Step 1: Add component-level pure helpers for set initialization and completion to `lib/training.js`, with failing tests before implementation.**
- [ ] **Step 2: Implement Today dashboard with scheduled workout first, then compact fuel, progress, and recommendation cards.**
- [ ] **Step 3: Implement Train screen listing plan days and recent sessions.**
- [ ] **Step 4: Implement Active Workout with one-thumb load/reps controls, RIR selector, Complete Set, progress indicator, and rest countdown.**
- [ ] **Step 5: Persist completed session into `state.workoutSessions` through existing `persist()` path.**
- [ ] **Step 6: Run `npm test && npm run build`.**
Expected: exit 0.
- [ ] **Step 7: Commit**
`git commit -m "feat: add today and workout execution experience"`

---

### Task 4: Food, Progress, and Coach integration

**Files:**
- Create: `components/Food.jsx`
- Create: `components/Progress.jsx`
- Create: `components/Coach.jsx`
- Modify: `components/LedgerApp.jsx`
- Modify: `app/api/ai/route.js`

**Interfaces:**
- Food reuses existing `AddSheet` and nutrition math.
- Progress reuses `calibrate()` and adds workout summaries/recommendations.
- Coach calls existing `callAi('coach', fields)` with structured current-state context.

- [ ] **Step 1: Add failing tests for a pure `coachContext(state)` helper.**
- [ ] **Step 2: Implement Food screen preserving search, AI estimate, manual logging, macros, and delete entry.**
- [ ] **Step 3: Implement Progress with weight trend, weekly nutrition, workout adherence, recent exercise recommendation, and calibration.**
- [ ] **Step 4: Implement Coach question UI and send compact structured state context to the existing AI route.**
- [ ] **Step 5: Update coach system instruction to explain deterministic recommendations without overriding them.**
- [ ] **Step 6: Run full tests and build.**
- [ ] **Step 7: Commit**
`git commit -m "feat: connect food progress and contextual coach"`

---

### Task 5: Product identity and mobile visual system

**Files:**
- Modify: `app/globals.css`
- Modify: `components/Gate.jsx`
- Modify: `components/Onboarding.jsx`
- Modify: `components/LedgerApp.jsx`
- Modify: `app/layout.js`

- [ ] **Step 1: Remove all visible `Margin`/`ledger` product copy from the UI; use neutral `Adaptive Training` working identity until final naming.**
- [ ] **Step 2: Apply graphite surfaces, high-contrast typography, restrained performance accent, 44px minimum primary controls, fixed bottom nav, and safe-area padding.**
- [ ] **Step 3: Redesign onboarding around goal, body weight/unit, training days/experience, and a clearly labeled starting nutrition estimate.**
- [ ] **Step 4: Verify at 390px width that no primary control overflows and the active workout can be operated without horizontal scrolling.**
- [ ] **Step 5: Run `npm test && npm run build`.**
- [ ] **Step 6: Commit**
`git commit -m "feat: apply mobile-first adaptive training design"`

---

### Task 6: Deployment verification

**Files:** No source changes unless verification exposes a bug.

- [ ] **Step 1: Confirm Vercel preview deployment is READY and build log includes all test suites passing before Next.js build.**
- [ ] **Step 2: Fetch `/`, `/api/auth/providers`, and signed-out `/api/state` behavior from the preview deployment.**
- [ ] **Step 3: Check runtime errors for the preview deployment.**
- [ ] **Step 4: Inspect mobile HTML/CSS for viewport and safe-area support.**
- [ ] **Step 5: Only after preview verification, merge/promote through the normal repository path; never claim Google OAuth completion without an actual user sign-in.**

## Self-review
- Spec coverage: training, nutrition preservation, deterministic adaptation, five-tab navigation, weekly/progress context, coach boundaries, mobile UX, and deployment verification are each mapped to tasks.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: `program`, `workoutSessions`, prescription fields, and recommendation return shape are consistent across tasks.
