"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { loadLocal, saveLocal, fetchRemoteState, pushRemoteState, resolveConflict, stamp } from "@/lib/client";
import { today } from "@/lib/nutrition";
import { normalizeTrainingState } from "@/lib/program";
import { createActiveWorkoutState } from "@/lib/training";
import Onboarding from "./Onboarding";
import AddSheet from "./AddSheet";
import AppNav from "./AppNav";
import TodayDashboard from "./TodayDashboard";
import Train from "./Train";
import ActiveWorkout from "./ActiveWorkout";
import Food from "./Food";
import Progress from "./Progress";
import Coach from "./Coach";

const emptyState = () => normalizeTrainingState(stamp({ profile: null, logs: {}, weights: [] }));

const TAB_LABELS = {
  today: "Today",
  train: "Train",
  food: "Food",
  progress: "Progress",
  coach: "Coach",
};

export default function LedgerApp({ user }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");
  const [adding, setAdding] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadLocal();
      let remote = null;
      try { remote = await fetchRemoteState(); } catch { /* local-first fallback */ }
      const resolved = resolveConflict(local, remote) || emptyState();
      const normalized = normalizeTrainingState(resolved);
      if (!cancelled) {
        setState(normalized);
        saveLocal(normalized);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((next) => {
    const stamped = stamp(normalizeTrainingState(next));
    setState(stamped);
    saveLocal(stamped);
    setSaveNote("");
    pushRemoteState(stamped).catch(() => setSaveNote("Saved on this device. Server sync will retry the next time data changes."));
  }, []);

  if (loading || !state) {
    return (
      <div className="shell loading-shell">
        <div className="busy"><span className="spin" />Opening your plan</div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="shell onboarding-shell">
        <div className="product-mark">MARGIN</div>
        <Onboarding onDone={(profile) => persist({ ...state, profile })} />
      </div>
    );
  }

  const day = today();
  const todayEntries = state.logs[day] || [];

  function addEntry(entry) {
    const logs = { ...state.logs, [day]: [...(state.logs[day] || []), entry] };
    persist({ ...state, logs });
    setAdding(false);
  }

  function removeEntry(id) {
    const logs = { ...state.logs, [day]: (state.logs[day] || []).filter((entry) => entry.id !== id) };
    persist({ ...state, logs });
  }

  function addWeight(weight) {
    const weights = [...state.weights.filter((entry) => entry.date !== weight.date), weight];
    persist({ ...state, weights });
  }

  function updateProfile(profile) {
    persist({ ...state, profile });
  }

  function startWorkout(workoutDay) {
    persist({
      ...state,
      activeWorkout: createActiveWorkoutState(workoutDay, state.workoutSessions, new Date().toISOString()),
    });
  }

  function updateActiveWorkout(activeWorkout) {
    persist({ ...state, activeWorkout });
  }

  function saveAndExitWorkout(activeWorkout) {
    persist({ ...state, activeWorkout: { ...activeWorkout, isOpen: false } });
    setTab("today");
  }

  function resumeWorkout() {
    if (!state.activeWorkout) return;
    persist({ ...state, activeWorkout: { ...state.activeWorkout, isOpen: true } });
  }

  function discardWorkout() {
    persist({ ...state, activeWorkout: null });
    setTab("today");
  }

  function completeWorkout(session) {
    persist({ ...state, activeWorkout: null, workoutSessions: [...state.workoutSessions, session] });
    setTab("today");
  }

  const activeWorkoutDay = state.activeWorkout
    ? state.program.workoutDays.find((workoutDay) => workoutDay.id === state.activeWorkout.workoutDayId)
    : null;

  if (state.activeWorkout?.isOpen && activeWorkoutDay) {
    return (
      <ActiveWorkout
        key={state.activeWorkout.draft.id}
        workoutDay={activeWorkoutDay}
        workoutSessions={state.workoutSessions}
        initialWorkout={state.activeWorkout}
        onUpdate={updateActiveWorkout}
        onComplete={completeWorkout}
        onSaveAndExit={saveAndExitWorkout}
        onDiscard={discardWorkout}
      />
    );
  }

  return (
    <div className="shell app-shell">
      <header className="appbar new-appbar">
        <div>
          <div className="product-mark"><span>MARGIN</span><small>ADAPTIVE TRAINING</small></div>
          <h1>{TAB_LABELS[tab]}</h1>
        </div>
        {user?.email ? (
          <button className="profile-button" onClick={() => signOut({ callbackUrl: "/" })} title={`${user.email} · Sign out`}>
            {(user.email[0] || "U").toUpperCase()}
          </button>
        ) : (
          <span className="local-badge">Local</span>
        )}
      </header>

      {saveNote && <p className="sync-note">{saveNote}</p>}

      <main className="screen-content">
        {tab === "today" && (
          <TodayDashboard
            state={state}
            entries={todayEntries}
            onStartWorkout={startWorkout}
            onResumeWorkout={resumeWorkout}
            onAddFood={() => setAdding(true)}
            onOpenProgress={() => setTab("progress")}
          />
        )}
        {tab === "train" && <Train state={state} onStartWorkout={startWorkout} onResumeWorkout={resumeWorkout} />}
        {tab === "food" && <Food profile={state.profile} entries={todayEntries} onAdd={() => setAdding(true)} onRemove={removeEntry} />}
        {tab === "progress" && <Progress state={state} onLogWeight={addWeight} onUpdateProfile={updateProfile} />}
        {tab === "coach" && <Coach state={state} />}
      </main>

      <AppNav tab={tab} onChange={setTab} />
      {adding && <AddSheet onClose={() => setAdding(false)} onAdd={addEntry} />}
    </div>
  );
}
