"use client";

import { workoutSummary } from "@/lib/training";

export default function Train({ state, onStartWorkout, onResumeWorkout }) {
  const recent = [...state.workoutSessions].filter((session) => session.completedAt).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 5);

  return (
    <div className="screen-stack train-screen">
      <header className="section-head editorial-head">
        <div><div className="eyebrow">PROGRAM LEDGER</div><h2>{state.program.name}</h2><p>Your sequence is already decided. Run the next session or review the full structure.</p></div>
        <span className="program-count">{state.program.workoutDays.length}<small>training days</small></span>
      </header>

      {state.activeWorkout && (
        <section className="resume-strip">
          <div><span>LIVE SESSION</span><strong>{state.activeWorkout.draft.workoutName}</strong><small>Completed sets are safely stored.</small></div>
          <button className="btn primary compact" onClick={onResumeWorkout}>Resume <span aria-hidden="true">→</span></button>
        </section>
      )}

      <ol className="program-ledger">
        {state.program.workoutDays.map((day, index) => {
          const isActive = state.activeWorkout?.workoutDayId === day.id;
          return (
            <li className={isActive ? "active" : ""} key={day.id}>
              <span className="day-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="day-content">
                <div className="day-heading"><div><strong>{day.name}</strong><small>{day.exercises.length} exercises</small></div>
                  <button className="btn compact primary" disabled={Boolean(state.activeWorkout)} onClick={() => onStartWorkout(day)}>
                    {isActive ? "In progress" : state.activeWorkout ? "Session active" : "Start"}
                  </button>
                </div>
                <div className="exercise-lines">
                  {day.exercises.map((exercise) => <span key={exercise.id}>{exercise.name}<small>{exercise.sets} sets</small></span>)}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="history-ledger">
        <div className="ledger-heading"><div><span className="eyebrow">RECENT WORK</span><h3>Session history</h3></div><small>Last {Math.min(recent.length, 5)}</small></div>
        {recent.length === 0 ? <p className="empty-copy">Finish your first workout and its history will appear here.</p> : recent.map((session) => {
          const summary = workoutSummary(session);
          return <div className="history-row" key={session.id}><div><strong>{session.workoutName || session.workoutDayId}</strong><small>{new Date(session.completedAt).toLocaleDateString()}</small></div><span>{summary.sets} sets · {Math.round(summary.volume).toLocaleString()} lb</span></div>;
        })}
      </section>
    </div>
  );
}
