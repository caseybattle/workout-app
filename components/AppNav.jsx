"use client";

const ITEMS = [["today", "Today"], ["train", "Train"], ["food", "Food"], ["progress", "Progress"], ["coach", "Coach"]];

function NavIcon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {name === "today" && <><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9M10 19v-5h4v5"/></>}
      {name === "train" && <><path d="M3 9v6m3-8v10m12-10v10m3-8v6M6 12h12"/></>}
      {name === "food" && <><path d="M7 3v7a3 3 0 0 0 3 3V3M8.5 13v8M16 3v18M16 3c3 2 4 6 0 9"/></>}
      {name === "progress" && <><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/></>}
      {name === "coach" && <><path d="M5 5.5h14v10H9l-4 3v-13Z"/><path d="M9 9h6m-6 3h4"/></>}
    </svg>
  );
}

export default function AppNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {ITEMS.map(([id, label]) => (
        <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => onChange(id)} aria-current={tab === id ? "page" : undefined}>
          <NavIcon name={id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
