"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { loadLocal, saveLocal, fetchRemoteState, pushRemoteState, resolveConflict, stamp } from "@/lib/client";
import { today } from "@/lib/nutrition";
import { normalizeTrainingState } from "@/lib/program";
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
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(null);
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
        <div className="product-mark">ADAPTIVE TRAINING</div>
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

  function completeWorkout(session) {
    persist({ ...state, workoutSessions: [...state.workoutSessions, session] });
    setActiveWorkoutDay(null);
    setTab("today");
  }

  if (activeWorkoutDay) {
    return (
      <ActiveWorkout
        key={activeWorkoutDay.id}
        workoutDay={activeWorkoutDay}
        workoutSessions={state.workoutSessions}
        onComplete={completeWorkout}
        onCancel={() => setActiveWorkoutDay(null)}
      />
    );
  }

  return (
    <div className="shell app-shell">
      <header className="appbar new-appbar">
        <div>
          <div className="product-mark">YOUR TRAINING</div>
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
            onStartWorkout={setActiveWorkoutDay}
            onAddFood={() => setAdding(true)}
            onOpenProgress={() => setTab("progress")}
          />
        )}
        {tab === "train" && <Train state={state} onStartWorkout={setActiveWorkoutDay} />}
        {tab === "food" && <Food profile={state.profile} entries={todayEntries} onAdd={() => setAdding(true)} onRemove={removeEntry} />}
        {tab === "progress" && <Progress state={state} onLogWeight={addWeight} onUpdateProfile={updateProfile} />}
        {tab === "coach" && <Coach state={state} />}
      </main>

      <AppNav tab={tab} onChange={setTab} />
      {adding && <AddSheet onClose={() => setAdding(false)} onAdd={addEntry} />}
    </div>
  );
}
