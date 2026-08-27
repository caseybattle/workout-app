"use client";

import { workoutSummary } from "@/lib/training";

export default function Train({ state, onStartWorkout }) {
  const recent = [...state.workoutSessions]
    .filter((session) => session.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
    .slice(0, 5);

  return (
    <div className="screen-stack">
      <header className="section-head">
        <div>
          <div className="eyebrow">TRAIN</div>
          <h2>{state.program.name}</h2>
          <p>Choose the next session or repeat a specific day.</p>
        </div>
      </header>

      <section className="workout-list">
        {state.program.workoutDays.map((day) => (
          <article className="workout-card" key={day.id}>
            <div className="workout-card-head">
              <div>
                <strong>{day.name}</strong>
                <small>{day.exercises.length} exercises</small>
              </div>
              <button className="btn compact primary" onClick={() => onStartWorkout(day)}>Start</button>
            </div>
            <div className="exercise-preview">
              {day.exercises.slice(0, 4).map((exercise) => (
                <span key={exercise.id}>{exercise.name}</span>
              ))}
              {day.exercises.length > 4 && <span>+{day.exercises.length - 4} more</span>}
            </div>
          </article>
        ))}
      </section>

      <section className="card-flat">
        <div className="eyebrow">RECENT SESSIONS</div>
        {recent.length === 0 ? (
          <p className="empty-copy">Finish your first workout and its history will appear here.</p>
        ) : (
          recent.map((session) => {
            const summary = workoutSummary(session);
            return (
              <div className="history-row" key={session.id}>
                <div>
                  <strong>{session.workoutName || session.workoutDayId}</strong>
                  <small>{new Date(session.completedAt).toLocaleDateString()}</small>
                </div>
                <span>{summary.sets} sets · {Math.round(summary.volume).toLocaleString()} lb</span>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
