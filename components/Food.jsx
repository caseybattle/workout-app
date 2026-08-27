"use client";

import { targetKcal, totalsFor } from "@/lib/nutrition";

export default function Food({ profile, entries, onAdd, onRemove }) {
  const totals = totalsFor(entries);
  const target = targetKcal(profile);
  const remaining = Math.round(target - totals.kcal);
  const split = profile?.split || { protein: 30, carbs: 40, fat: 30 };
  const proteinTarget = Math.round((target * split.protein / 100) / 4);

  return (
    <div className="screen-stack">
      <header className="section-head">
        <div>
          <div className="eyebrow">FOOD</div>
          <h2>Fuel the plan</h2>
          <p>Track enough to make the training and body-weight feedback useful.</p>
        </div>
      </header>

      <section className="fuel-hero">
        <div>
          <span>{remaining < 0 ? "OVER TARGET" : "AVAILABLE TODAY"}</span>
          <strong className={remaining < 0 ? "danger" : ""}>{Math.abs(remaining)}</strong>
          <small>calories</small>
        </div>
        <button className="btn primary compact" onClick={onAdd}>Add Food</button>
      </section>

      <section className="metric-grid three">
        <div className="metric-card"><span>Protein</span><strong>{Math.round(totals.protein)}g</strong><small>of {proteinTarget}g</small></div>
        <div className="metric-card"><span>Carbs</span><strong>{Math.round(totals.carbs)}g</strong><small>today</small></div>
        <div className="metric-card"><span>Fat</span><strong>{Math.round(totals.fat)}g</strong><small>today</small></div>
      </section>

      <section className="card-flat">
        <div className="card-title-row">
          <div className="eyebrow">TODAY'S FOOD</div>
          <span>{Math.round(totals.kcal)} / {target} kcal</span>
        </div>
        {entries.length === 0 ? (
          <p className="empty-copy">Nothing logged yet. Add a meal when you eat.</p>
        ) : (
          entries.map((entry) => (
            <div className="food-row" key={entry.id}>
              <div>
                <strong>{entry.name}</strong>
                <small>{entry.meal}{entry.servingText ? ` · ${entry.servingText}` : ""}</small>
              </div>
              <div>
                <span>{Math.round(entry.protein * 4 + entry.carbs * 4 + entry.fat * 9)} kcal</span>
                <button onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.name}`}>×</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
