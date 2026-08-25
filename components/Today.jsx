"use client";

import { totalsFor, targetKcal, blocks } from "@/lib/nutrition";

export default function Today({ profile, entries, onAdd, onRemove }) {
  const totals = totalsFor(entries);
  const target = targetKcal(profile);
  const remaining = target - totals.kcal;
  const b = blocks(totals.kcal, target);

  return (
    <>
      <div className="card">
        <div className="meter-headline">
          <div className={"num" + (remaining < 0 ? " over" : "")}>
            {Math.round(Math.abs(remaining))}
          </div>
          <div className="label">{remaining < 0 ? "calories over" : "calories left today"}</div>
        </div>
        <div className="blockgrid">
          {Array.from({ length: b.total }).map((_, i) => (
            <div key={i} className={"b" + (i < b.used - b.over ? " used" : i < b.used ? " over" : "")} />
          ))}
        </div>
        <div className="macrorow">
          <div className="m"><div className="v">{Math.round(totals.protein)}g</div><div className="l">Protein</div></div>
          <div className="m"><div className="v">{Math.round(totals.carbs)}g</div><div className="l">Carbs</div></div>
          <div className="m"><div className="v">{Math.round(totals.fat)}g</div><div className="l">Fat</div></div>
        </div>
      </div>

      <div className="card">
        <h2>Today's entries</h2>
        {entries.length === 0 ? (
          <p className="empty">Nothing logged yet.</p>
        ) : (
          entries.map((e) => (
            <div className="entry" key={e.id}>
              <div>
                <div className="name">{e.name}</div>
                <div className="meta">{e.meal}{e.servingText ? ` · ${e.servingText}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="kcal">{Math.round(e.protein * 4 + e.carbs * 4 + e.fat * 9)} kcal</span>
                <button className="del" onClick={() => onRemove(e.id)} aria-label="Remove">×</button>
              </div>
            </div>
          ))
        )}
        <button className="btn block" style={{ marginTop: 12 }} onClick={onAdd}>+ Add food</button>
      </div>
    </>
  );
}
