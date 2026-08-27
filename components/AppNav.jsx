"use client";

const ITEMS = [
  ["today", "Today"],
  ["train", "Train"],
  ["food", "Food"],
  ["progress", "Progress"],
  ["coach", "Coach"],
];

export default function AppNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {ITEMS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={tab === id ? "active" : ""}
          onClick={() => onChange(id)}
          aria-current={tab === id ? "page" : undefined}
        >
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
