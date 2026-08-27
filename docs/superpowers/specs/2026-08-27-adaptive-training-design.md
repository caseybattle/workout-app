# Adaptive Training Product Design

## Product goal
Build a mobile-first adaptive fitness app for strength-training users who want one system to tell them what to do today, record what happened, connect training with nutrition and body-weight trends, and improve the next recommendation.

## Core promise
Know what to do today. Record what happened. Let your results improve what happens next.

## Primary loop
Today -> Train -> Fuel -> Progress -> Coach -> Weekly adjustment -> Next plan.

## Product principles
- Training is the primary action; nutrition supports the training/body-composition goal.
- The user should understand the next action within five seconds.
- Logging a set should require minimal typing and be usable one-handed.
- Training progression and nutrition calibration are deterministic and explainable.
- AI explains, summarizes, estimates food, and answers contextual questions; it does not invent opaque progression decisions.
- Recommendations are conservative and user-overridable.
- Mobile-first navigation is Today, Train, Food, Progress, Coach.
- No social feed, trainer marketplace, recipe marketplace, wearable platform, or excessive gamification in the first release.

## Target user
A person strength training several times per week who wants to lose fat, build muscle, recomp, or gain strength and does not want to manage workouts, nutrition, and progress in separate systems.

## Today
Today is the command center and answers: what do I do today, how is fuel tracking, am I progressing, and does anything need attention?

It shows the scheduled workout and a Start Workout action first, then compact fuel, weight/progress, and coach cards. It must not become a dense analytics dashboard.

## Train
Programs contain workout days. Workout days contain exercises. Exercises contain target sets and rep ranges. Completed sessions persist actual load, reps, optional effort (RIR), and timestamps.

The active workout screen shows previous performance, today's recommendation, current set, large load/reps controls, Complete Set, progress through the workout, and a rest timer.

## Progression engine
The progression engine is deterministic. For each exercise it evaluates recent completed sets against target rep ranges and optional RIR.

Initial MVP rules:
1. If all working sets meet or exceed the top of the rep range with at least 1 RIR when RIR is present, recommend increasing load by the exercise increment and reset the target toward the bottom of the rep range.
2. If all sets meet the lower bound but do not all reach the top, hold load and recommend rep progression.
3. If one session misses the lower bound, hold load and repeat.
4. If two consecutive comparable sessions miss the lower bound, recommend a conservative load reduction of one increment.
5. Every recommendation returns a short reason string that can be shown directly in the UI.

## Food
Preserve existing USDA search, AI meal estimation, manual entry, macro totals, and local/remote persistence. Reframe the experience as fuel supporting the user's goal rather than the center of the app.

## Nutrition adaptation
Preserve the existing real-world calibration approach using logged intake and rolling weight trend. Recommendations require sufficient time and logging coverage and must remain user-approved before changing targets.

## Progress
Show only decision-useful metrics: strength trend, body-weight trend, workout adherence, nutrition adherence, and the current recommendation. Avoid vanity charts.

## Coach
Coach receives structured context from profile, recent workout performance, current recommendations, nutrition totals, weight trend, and adherence. Coach explains decisions and answers questions. Deterministic engines remain the source of truth for progression and calorie target changes.

## Weekly review
Generate a compact review of workouts completed, strength direction, weight trend, nutrition/logging adherence, and one recommended action: keep plan, progress training, hold, reduce training load, or consider a nutrition adjustment.

## Data model additions
- `program`: id, name, active, workoutDays[]
- `workoutDays[]`: id, name, weekday/order, exercises[]
- `exercise prescription`: id, name, sets, repMin, repMax, incrementLb
- `workoutSessions[]`: id, workoutDayId, startedAt, completedAt, exercises[]
- `session exercise`: exerciseId, name, target, sets[]
- `completed set`: load, reps, rir, completedAt
- `recommendations`: exerciseId, action, nextLoad, targetRepMin, targetRepMax, reason

Existing profile, logs, weights, and nutrition settings remain compatible.

## Architecture
- `lib/training.js`: pure progression/session math with no React or network.
- `lib/training.test.mjs`: behavior tests for progression rules and workout summaries.
- Existing `lib/nutrition.js` remains pure and independently tested.
- App state extends compatibly so existing nutrition/weight data is not discarded.
- React components are split by product responsibility: shell/navigation, Today, Train, active workout, Food, Progress, Coach.
- Persistence remains local-first with remote sync through the existing state API.

## UX and visual system
Use a dark graphite performance UI with restrained high-contrast accent, large typography for the current action, clear cards, persistent bottom navigation, and safe-area support. The interface must prioritize action over decoration.

## Success criteria
A user can sign in, understand today's plan immediately, complete a workout on a phone, log food and weight, see meaningful progress, understand why a recommendation changed, and return the next day knowing what to do.
