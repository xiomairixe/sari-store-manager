// MonthFilter.jsx — shared component, import in Sales, Costs, Dashboard
import React from "react";

export function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return options;
}

export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function filterByMonth(items, dateField, selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export default function MonthFilter({ value, onChange }) {
  const options = getMonthOptions();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      backgroundColor: "#fff", borderRadius: "12px",
      padding: "6px 10px 6px 14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      border: "1.5px solid #f3f4f6",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "none", background: "transparent", outline: "none",
          fontSize: "13px", fontWeight: "600", color: "#1a1a2e",
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          appearance: "none", paddingRight: "18px",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "-14px", pointerEvents: "none" }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}