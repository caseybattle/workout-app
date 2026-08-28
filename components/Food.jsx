"use client";

import { targetKcal, totalsFor } from "@/lib/nutrition";

const clamp = (value) => Math.min(100, Math.max(0, value));

export default function Food({ profile, entries, onAdd, onRemove }) {
  const totals = totalsFor(entries);
  const target = targetKcal(profile);
  const remaining = Math.round(target - totals.kcal);
  const split = profile?.split || { protein: 30, carbs: 40, fat: 30 };
  const targets = {
    protein: Math.round((target * split.protein / 100) / 4),
    carbs: Math.round((target * split.carbs / 100) / 4),
    fat: Math.round((target * split.fat / 100) / 9),
  };
  const energyPercent = clamp((totals.kcal / target) * 100);

  return (
    <div className="screen-stack food-screen">
      <header className="section-head editorial-head"><div><div className="eyebrow">DAILY FUEL</div><h2>Eat for the work.</h2><p>Log the essentials. The plan uses consistency, not perfection, to make better decisions.</p></div><button className="btn primary compact" onClick={onAdd}>Add food <span aria-hidden="true">+</span></button></header>

      <section className="fuel-dashboard">
        <div className="energy-dial" style={{ "--energy": `${energyPercent * 3.6}deg` }} role="img" aria-label={`${Math.round(totals.kcal)} of ${target} calories logged`}>
          <div><span>{remaining < 0 ? "OVER" : "LEFT"}</span><strong className={remaining < 0 ? "danger" : ""}>{Math.abs(remaining)}</strong><small>kcal</small></div>
        </div>
        <div className="macro-ledger">
          {[['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']].map(([key, label]) => (
            <div className="macro-row" key={key}><div><span>{label}</span><strong>{Math.round(totals[key])}<small> / {targets[key]}g</small></strong></div><i><b style={{ width: `${clamp((totals[key] / targets[key]) * 100)}%` }} /></i></div>
          ))}
        </div>
      </section>

      <section className="food-ledger">
        <div className="ledger-heading"><div><span className="eyebrow">TODAY'S LOG</span><h3>{entries.length ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}` : "Nothing logged yet"}</h3></div><span className="data-copy">{Math.round(totals.kcal)} / {target} kcal</span></div>
        {entries.length === 0 ? <div className="food-empty"><span aria-hidden="true">01</span><div><strong>Start with your next meal.</strong><p>A quick search or estimate is enough to keep today useful.</p><button className="text-link" onClick={onAdd}>Add first food <span aria-hidden="true">→</span></button></div></div> : entries.map((entry, index) => (
          <div className="food-row" key={entry.id}><span className="food-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{entry.name}</strong><small>{entry.meal}{entry.servingText ? ` · ${entry.servingText}` : ""}</small></div><div><span>{Math.round(entry.protein * 4 + entry.carbs * 4 + entry.fat * 9)} kcal</span><button onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.name}`} title="Remove entry">×</button></div></div>
        ))}
      </section>
    </div>
  );
}
