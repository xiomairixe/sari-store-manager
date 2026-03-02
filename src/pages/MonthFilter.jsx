// MonthFilter.jsx — shared component, import in Sales, Costs, Dashboard
import React, { useState } from "react";

export function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
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

// Default date range: first day of current month → today
export function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
}

// Filter items by a { from, to } date range (inclusive)
export function filterByDateRange(items, dateField, range) {
  const from = new Date(range.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(range.to);
  to.setHours(23, 59, 59, 999);
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    return d >= from && d <= to;
  });
}

// Legacy helper — keep for backward compat if needed elsewhere
export function filterByMonth(items, dateField, selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

// Format YYYY-MM-DD → "Jan 1, 2025"
function fmtShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Main component ─────────────────────────────────────────────────────────
// Props:
//   range: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
//   onChange: (newRange) => void
export default function DateRangeFilter({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);

  const handleOpen = () => {
    setDraft(range);
    setOpen(true);
  };

  const handleApply = () => {
    if (!draft.from || !draft.to) return;
    if (new Date(draft.from) > new Date(draft.to)) {
      // swap if from > to
      onChange({ from: draft.to, to: draft.from });
    } else {
      onChange(draft);
    }
    setOpen(false);
  };

  // Quick preset helpers
  const preset = (label) => {
    const now = new Date();
    let from, to;
    to = now.toISOString().split("T")[0];
    if (label === "Today") {
      from = to;
    } else if (label === "This Week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      from = start.toISOString().split("T")[0];
    } else if (label === "This Month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    } else if (label === "Last Month") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      from = lm.toISOString().split("T")[0];
      to = lme.toISOString().split("T")[0];
    } else if (label === "Last 30 Days") {
      const d = new Date(now);
      d.setDate(now.getDate() - 29);
      from = d.toISOString().split("T")[0];
    } else if (label === "This Year") {
      from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    }
    setDraft({ from, to });
  };

  const PRESETS = ["Today", "This Week", "This Month", "Last Month", "Last 30 Days", "This Year"];

  const isSameDay = range.from === range.to;
  const label = isSameDay
    ? fmtShort(range.from)
    : `${fmtShort(range.from)} – ${fmtShort(range.to)}`;

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={handleOpen}
        style={{
          display: "flex", alignItems: "center", gap: "7px",
          backgroundColor: "#fff", borderRadius: "12px",
          padding: "7px 12px 7px 12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          border: "1.5px solid #f3f4f6",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Bottom sheet modal */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "flex-end" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div style={{
            backgroundColor: "#fff", borderRadius: "24px 24px 0 0",
            width: "100%", padding: "24px 20px 48px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "17px", fontWeight: "700", color: "#1a1a2e" }}>Select Date Range</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
            </div>

            {/* From – To inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>From</label>
                <input
                  type="date"
                  value={draft.from}
                  onChange={(e) => setDraft(d => ({ ...d, from: e.target.value }))}
                  style={{
                    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                    padding: "10px 12px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                    color: "#1a1a2e", outline: "none", boxSizing: "border-box",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>To</label>
                <input
                  type="date"
                  value={draft.to}
                  onChange={(e) => setDraft(d => ({ ...d, to: e.target.value }))}
                  style={{
                    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                    padding: "10px 12px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                    color: "#1a1a2e", outline: "none", boxSizing: "border-box",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quick Select</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {PRESETS.map((p) => {
                const isActive = (() => {
                  const now = new Date();
                  const todayStr = now.toISOString().split("T")[0];
                  if (p === "Today") return draft.from === todayStr && draft.to === todayStr;
                  if (p === "This Month") return draft.from === new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0] && draft.to === todayStr;
                  return false;
                })();
                return (
                  <button
                    key={p}
                    onClick={() => preset(p)}
                    style={{
                      padding: "7px 14px", borderRadius: "20px", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: "600",
                      border: isActive ? "none" : "1.5px solid #e5e7eb",
                      backgroundColor: isActive ? "#f97316" : "#fff",
                      color: isActive ? "#fff" : "#374151",
                    }}
                  >{p}</button>
                );
              })}
            </div>

            {/* Apply button */}
            <button
              onClick={handleApply}
              disabled={!draft.from || !draft.to}
              style={{
                width: "100%", backgroundColor: draft.from && draft.to ? "#f97316" : "#e5e7eb",
                color: "#fff", border: "none", borderRadius: "12px", padding: "14px",
                fontSize: "15px", fontWeight: "700", cursor: draft.from && draft.to ? "pointer" : "default",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </>
  );
}