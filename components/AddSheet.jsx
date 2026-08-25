"use client";

import { useState } from "react";
import { searchFoods, callAi, parseJsonish } from "@/lib/client";
import { mealNow } from "@/lib/nutrition";

const MODES = [
  { id: "search", label: "Search" },
  { id: "ai", label: "AI estimate" },
  { id: "manual", label: "Manual" },
];

export default function AddSheet({ onClose, onAdd }) {
  const [mode, setMode] = useState("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState({ name: "", protein: "", carbs: "", fat: "" });

  function commit(name, protein, carbs, fat, servingText) {
    onAdd({
      id: Date.now(),
      name,
      meal: mealNow(),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      servingText: servingText || "",
    });
  }

  function switchMode(id) {
    setMode(id);
    setError("");
    setResults([]);
  }

  async function doSearch(e) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBusy(true); setError(""); setResults([]);
    try {
      const foods = await searchFoods(q.trim());
      setResults(foods);
      if (!foods.length) setError("No matches. Try AI estimate or enter it manually.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doAiEstimate(e) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBusy(true); setError(""); setResults([]);
    try {
      const text = await callAi("estimate", { known: q.trim(), context: "" });
      const parsed = parseJsonish(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      setResults(
        list.map((f, i) => ({
          id: `ai-${i}-${f.name}`,
          name: f.name || q.trim(),
          per100: null,
          _direct: { protein: Number(f.protein) || 0, carbs: Number(f.carbs) || 0, fat: Number(f.fat) || 0, kcal: Number(f.kcal) || 0 },
        }))
      );
    } catch (err) {
      setError(err.message === "NOT_CONFIGURED" ? "AI isn't set up yet. Use Search or Manual for now." : err.message);
    } finally {
      setBusy(false);
    }
  }

  function pickResult(f) {
    if (f._direct) {
      commit(f.name, f._direct.protein, f._direct.carbs, f._direct.fat, "AI estimate");
      return;
    }
    const grams = f.servingG || 100;
    const scale = grams / 100;
    commit(f.name, f.per100.protein * scale, f.per100.carbs * scale, f.per100.fat * scale, f.servingText || `${grams}g`);
  }

  function submitManual(e) {
    e.preventDefault();
    if (!manual.name.trim()) { setError("Give it a name."); return; }
    commit(manual.name.trim(), manual.protein, manual.carbs, manual.fat, "manual entry");
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Add food</h2>
          <button className="btn ghost small" onClick={onClose}>Close</button>
        </div>

        <div className="chiprow">
          {MODES.map((m) => (
            <button key={m.id} className={"chip" + (mode === m.id ? " active" : "")} onClick={() => switchMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {mode !== "manual" && (
          <form onSubmit={mode === "search" ? doSearch : doAiEstimate}>
            <div className="field">
              <label>{mode === "search" ? "Food name" : "Describe what you ate"}</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={mode === "search" ? "e.g. grilled chicken breast" : "e.g. two eggs and a slice of toast with butter"}
              />
            </div>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Working…" : mode === "search" ? "Search" : "Estimate with AI"}
            </button>
          </form>
        )}

        {error && <p className="error-text">{error}</p>}

        {results.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {results.map((f) => (
              <div className="result-row" key={f.id} onClick={() => pickResult(f)}>
                <div>
                  <div className="rn">{f.name}</div>
                  <div className="rm">
                    {f._direct
                      ? `${Math.round(f._direct.kcal)} kcal · P${Math.round(f._direct.protein)} C${Math.round(f._direct.carbs)} F${Math.round(f._direct.fat)}`
                      : `per ${f.servingG || 100}g · P${Math.round(f.per100.protein)} C${Math.round(f.per100.carbs)} F${Math.round(f.per100.fat)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "manual" && (
          <form onSubmit={submitManual}>
            <div className="field">
              <label>Name</label>
              <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="e.g. Homemade chili" />
            </div>
            <div className="row3">
              <div className="field">
                <label>Protein (g)</label>
                <input type="number" value={manual.protein} onChange={(e) => setManual({ ...manual, protein: e.target.value })} placeholder="0" />
              </div>
              <div className="field">
                <label>Carbs (g)</label>
                <input type="number" value={manual.carbs} onChange={(e) => setManual({ ...manual, carbs: e.target.value })} placeholder="0" />
              </div>
              <div className="field">
                <label>Fat (g)</label>
                <input type="number" value={manual.fat} onChange={(e) => setManual({ ...manual, fat: e.target.value })} placeholder="0" />
              </div>
            </div>
            <button className="btn primary" type="submit">Add entry</button>
          </form>
        )}
      </div>
    </div>
  );
}
