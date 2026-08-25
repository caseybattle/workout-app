"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { loadLocal, saveLocal, fetchRemoteState, pushRemoteState, resolveConflict, stamp } from "@/lib/client";
import { today } from "@/lib/nutrition";
import Onboarding from "./Onboarding";
import Today from "./Today";
import Trends from "./Trends";
import AddSheet from "./AddSheet";

const emptyState = () => stamp({ profile: null, logs: {}, weights: [] });

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
      try { remote = await fetchRemoteState(); } catch { /* offline, or storage not configured yet */ }
      const resolved = resolveConflict(local, remote) || emptyState();
      if (!cancelled) { setState(resolved); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((next) => {
    const stamped = stamp(next);
    setState(stamped);
    saveLocal(stamped);
    setSaveNote("");
    pushRemoteState(stamped).catch(() => setSaveNote("Saved on this device — couldn't reach the server."));
  }, []);

  if (loading || !state) {
    return (
      <div className="shell">
        <div className="busy"><span className="spin" />Opening your ledger</div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="shell">
        <div className="appbar"><h1>Margin</h1></div>
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
    const logs = { ...state.logs, [day]: (state.logs[day] || []).filter((e) => e.id !== id) };
    persist({ ...state, logs });
  }

  function addWeight(w) {
    const weights = [...state.weights.filter((x) => x.date !== w.date), w];
    persist({ ...state, weights });
  }

  function updateProfile(profile) {
    persist({ ...state, profile });
  }

  return (
    <div className="shell">
      <div className="appbar">
        <h1>Margin</h1>
        {user?.email ? (
          <span className="who">
            {user.email}{" "}
            <button className="btn ghost small" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          </span>
        ) : (
          <span className="who">local device</span>
        )}
      </div>

      <div className="tabs">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>Today</button>
        <button className={tab === "trends" ? "active" : ""} onClick={() => setTab("trends")}>Trends</button>
      </div>

      {saveNote && <p className="hint-text" style={{ marginBottom: 12 }}>{saveNote}</p>}

      {tab === "today" && (
        <Today profile={state.profile} entries={todayEntries} onAdd={() => setAdding(true)} onRemove={removeEntry} />
      )}

      {tab === "trends" && (
        <Trends state={state} onLogWeight={addWeight} onUpdateProfile={updateProfile} />
      )}

      {adding && <AddSheet onClose={() => setAdding(false)} onAdd={addEntry} />}
    </div>
  );
}
