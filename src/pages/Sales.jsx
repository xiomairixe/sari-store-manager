import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DateRangeFilter, { getDefaultDateRange, filterByDateRange } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const S = {
  page: { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "90px" },
  header: { padding: "20px 20px 10px", backgroundColor: "#f5f6fa", position: "sticky", top: 0, zIndex: 10 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" },
  tabBar: { backgroundColor: "#fff", borderRadius: "14px", display: "flex", padding: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  tab: (active) => ({ flex: 1, padding: "9px 0", border: "none", borderRadius: "10px", backgroundColor: active ? "#fff" : "transparent", color: active ? "#1a1a2e" : "#9ca3af", fontWeight: active ? "700" : "400", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s ease" }),
  totalCard: { background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", borderRadius: "18px", padding: "20px", color: "#fff" },
  totalLabel: { fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "6px" },
  totalAmount: { fontSize: "34px", fontWeight: "700", margin: "0 0 10px", letterSpacing: "-0.5px" },
  totalChange: { fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: 0.9 },
  card: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 14px" },
  slowItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
  slowName: { fontSize: "14px", color: "#374151" },
  slowStock: { fontSize: "12px", color: "#9ca3af" },
  fab: { position: "fixed", bottom: "85px", right: "20px", width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#f97316", border: "none", color: "#fff", fontSize: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(249,115,22,0.4)", zIndex: 100 },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal: { backgroundColor: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalScrollArea: { padding: "24px 20px 8px", overflowY: "auto", flex: 1, minHeight: 0 },
  submitBtnWrap: { padding: "12px 20px 90px", backgroundColor: "#fff", borderTop: "1px solid #f3f4f6", flexShrink: 0 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  modalSub: { fontSize: "13px", color: "#9ca3af", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" },
  input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" },
  textarea: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", minHeight: "80px", resize: "vertical", marginBottom: "14px" },
  submitBtn: { width: "100%", backgroundColor: "#f97316", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  emptyText: { textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" },
  reviewSummaryBox: { background: "linear-gradient(135deg, #fff8f0 0%, #fff 100%)", border: "1.5px solid #fed7aa", borderRadius: "14px", padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  reviewSummaryLabel: { fontSize: "12px", color: "#f97316", fontWeight: "600", marginBottom: "4px" },
  reviewSummaryTotal: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e" },
  reviewSummaryCount: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  txnItem: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  txnLeft: { flex: 1, minWidth: 0 },
  txnName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  txnMeta: { fontSize: "12px", color: "#9ca3af" },
  txnRight: { textAlign: "right", flexShrink: 0, marginLeft: "12px" },
  txnTotal: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  typeBadge: (type) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: "700", backgroundColor: type === "checkout" ? "#f0fdf4" : "#fff8f0", color: type === "checkout" ? "#16a34a" : "#f97316", marginTop: "3px" }),
};

const TABS = ["Daily", "Weekly", "Range"];
const formatDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (d) => new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });

// ── Safe total getter — always uses qty × unitPrice as fallback ──
const getSaleTotal = (s) => {
  const total = parseFloat(s.total);
  if (!isNaN(total) && total > 0) return total;
  // Fallback: recompute from qty × unitPrice
  return (parseFloat(s.qty) || 1) * (parseFloat(s.unitPrice) || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #fed7aa", borderRadius: "8px", padding: "8px 12px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#f97316" }}>₱{parseFloat(payload[0].value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

function RecordRow({ r, confirmed, onConfirm, onReview }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(confirmed != null ? String(confirmed) : "");
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const hasConfirmed = confirmed != null;
  const diff = hasConfirmed ? confirmed - r.systemTotal : null;
  const matched = diff === 0;
  const over = diff > 0;
  const commit = () => { const val = parseFloat(inputVal); onConfirm(r.date, isNaN(val) ? null : val); setEditing(false); };

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ cursor: "pointer" }} onClick={onReview}>
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1a1a2e" }}>{formatDate(r.date)}</div>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{r.count} transaction{r.count !== 1 ? "s" : ""} · tap to review</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onReview}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>System</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e" }}>₱{r.systemTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>from checkout</div>
        </div>
        <div style={{ backgroundColor: hasConfirmed ? (matched ? "#f0fdf4" : over ? "#eff6ff" : "#fff1f2") : "#fff", border: hasConfirmed ? `1.5px solid ${matched ? "#86efac" : over ? "#bfdbfe" : "#fecaca"}` : "1.5px dashed #e5e7eb", borderRadius: "12px", padding: "10px 12px", cursor: "pointer" }} onClick={() => { setInputVal(confirmed != null ? String(confirmed) : ""); setEditing(true); }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Actual {hasConfirmed && <span style={{ color: matched ? "#16a34a" : over ? "#3b82f6" : "#ef4444" }}>✓</span>}</div>
          {hasConfirmed ? (
            <><div style={{ fontSize: "16px", fontWeight: "700", color: matched ? "#16a34a" : over ? "#3b82f6" : "#ef4444" }}>₱{confirmed.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div><div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>tap to edit</div></>
          ) : (
            <><div style={{ fontSize: "13px", fontWeight: "600", color: "#9ca3af" }}>— tap to enter</div><div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px" }}>your cash count</div></>
          )}
        </div>
      </div>
      {hasConfirmed && !matched && (
        <div style={{ fontSize: "12px", fontWeight: "600", padding: "5px 12px", borderRadius: "8px", textAlign: "center", backgroundColor: over ? "#eff6ff" : "#fff1f2", color: over ? "#3b82f6" : "#ef4444" }}>
          {over ? `+₱${diff.toLocaleString("en-PH", { minimumFractionDigits: 2 })} over system — check for unrecorded sales` : `-₱${Math.abs(diff).toLocaleString("en-PH", { minimumFractionDigits: 2 })} under system — possible missing cash`}
        </div>
      )}
      {hasConfirmed && matched && (
        <div style={{ fontSize: "12px", fontWeight: "600", padding: "5px 12px", borderRadius: "8px", textAlign: "center", backgroundColor: "#f0fdf4", color: "#16a34a" }}>✓ Cash matches system — all good!</div>
      )}
      {editing && (
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>₱</span>
          <input ref={inputRef} type="number" step="0.01" value={inputVal} onChange={e => setInputVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()} placeholder="Enter your actual cash total" style={{ flex: 1, border: "1.5px solid #f97316", borderRadius: "10px", padding: "9px 12px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1a2e" }} />
          <button onClick={commit} style={{ padding: "9px 16px", backgroundColor: "#f97316", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Save</button>
        </div>
      )}
    </div>
  );
}

export default function Sales() {
  const [activeTab, setActiveTab] = useState("Range");
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reviewDate, setReviewDate] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", notes: "" });
  const [confirmed, setConfirmedState] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchSales(); fetchProducts(); fetchConfirmed(); }, []);

  const fetchSales = async () => {
    try { const res = await axios.get(`${BASE_URL}/sales`); setSales(res.data); } catch (err) { console.error(err); }
  };
  const fetchProducts = async () => {
    try { const res = await axios.get(`${BASE_URL}/products`); setProducts(res.data); } catch (err) { console.error(err); }
  };
  const fetchConfirmed = async () => {
    try { const res = await axios.get(`${BASE_URL}/sales/confirmed`); setConfirmedState(res.data); } catch (err) { console.error(err); }
  };

  const handleConfirm = async (date, val) => {
    setConfirmedState(prev => ({ ...prev, [date]: val }));
    try {
      await axios.put(`${BASE_URL}/sales/confirmed/${date}`, { confirmedAmount: val });
    } catch (err) {
      console.error(err);
      fetchConfirmed();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}/sales`, {
        productId: null,
        productName: form.notes || "Daily sales summary",
        qty: 1,
        unitPrice: parseFloat(form.amount),
        saleDate: form.date,
        notes: form.notes,
        isDailySummary: true,
      });
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], amount: "", notes: "" });
      fetchSales();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const getFilteredSales = () => {
    if (activeTab === "Daily") {
      return sales.filter(s => new Date(s.saleDate).toDateString() === now.toDateString());
    }
    if (activeTab === "Weekly") {
      const w = new Date(now); w.setDate(now.getDate() - 6);
      return sales.filter(s => new Date(s.saleDate) >= w);
    }
    return filterByDateRange(sales, "saleDate", dateRange);
  };

  const filtered = getFilteredSales();

  // ── Use getSaleTotal everywhere for consistent computation ──
  const total = filtered.reduce((sum, s) => sum + getSaleTotal(s), 0);

  const rangeDays = (() => {
    const diff = new Date(dateRange.to) - new Date(dateRange.from);
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  })();
  const prevRangeEnd = new Date(dateRange.from);
  prevRangeEnd.setDate(prevRangeEnd.getDate() - 1);
  const prevRangeStart = new Date(prevRangeEnd);
  prevRangeStart.setDate(prevRangeStart.getDate() - (rangeDays - 1));
  const prevRangeSales = filterByDateRange(sales, "saleDate", {
    from: prevRangeStart.toISOString().split("T")[0],
    to: prevRangeEnd.toISOString().split("T")[0],
  });
  const prevTotal = prevRangeSales.reduce((sum, s) => sum + getSaleTotal(s), 0);
  const changePct = prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(0) : null;

  const chartData = (() => {
    const map = {};
    const start = new Date(activeTab === "Daily" ? todayStr : activeTab === "Weekly" ? (() => { const d = new Date(now); d.setDate(now.getDate() - 6); return d.toISOString().split("T")[0]; })() : dateRange.from);
    const end = new Date(activeTab === "Daily" || activeTab === "Weekly" ? todayStr : dateRange.to);
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split("T")[0];
      const [, mm, dd] = key.split("-");
      map[key] = { date: `${parseInt(mm)}/${parseInt(dd)}`, total: 0 };
      cur.setDate(cur.getDate() + 1);
    }
    filtered.forEach((s) => {
      const key = new Date(s.saleDate).toISOString().split("T")[0];
      if (map[key]) map[key].total += getSaleTotal(s);
    });
    return Object.values(map);
  })();

  const slowMoving = [...products].sort((a, b) => b.stock - a.stock).slice(0, 3);

  const recentByDate = Object.values(
    filtered.reduce((acc, s) => {
      const key = new Date(s.saleDate).toISOString().split("T")[0];
      if (!acc[key]) acc[key] = { date: key, systemTotal: 0, count: 0 };
      acc[key].systemTotal += getSaleTotal(s);
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const reviewSales = reviewDate
    ? sales.filter(s => new Date(s.saleDate).toISOString().split("T")[0] === reviewDate).sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
    : [];
  const reviewTotal = reviewSales.reduce((sum, s) => sum + getSaleTotal(s), 0);
  const getTxnType = (s) => (s.productId && s.productId !== "null" ? "checkout" : "manual");

  const confirmedCount = recentByDate.filter(r => confirmed[r.date] != null).length;
  const matchedCount = recentByDate.filter(r => confirmed[r.date] != null && confirmed[r.date] === r.systemTotal).length;

  const rangeLabel = activeTab === "Daily" ? "Today" : activeTab === "Weekly" ? "Last 7 Days" : `${dateRange.from === dateRange.to ? formatDate(dateRange.from) : `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}`;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerRow}>
            <h1 style={S.title}>Sales Overview</h1>
            <DateRangeFilter range={dateRange} onChange={(r) => { setDateRange(r); setActiveTab("Range"); }} />
          </div>
        </div>

        <div style={S.body}>
          <div style={S.tabBar}>
            {TABS.map((t) => <button key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>{t}</button>)}
          </div>

          <div style={S.totalCard}>
            <div style={S.totalLabel}>Total Sales · {rangeLabel}</div>
            <div style={S.totalAmount}>₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
            <div style={S.totalChange}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              {changePct !== null ? `${changePct > 0 ? "+" : ""}${changePct}% vs previous period` : "No previous period data"}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Sales Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 6) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>Slow Moving Items</span>
            </div>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 10px" }}>Consider running a promotion for these items.</p>
            {slowMoving.length === 0 ? <div style={S.emptyText}>No products found.</div> : (
              slowMoving.map((p) => (
                <div key={p.id} style={S.slowItem}>
                  <span style={S.slowName}>{p.name}</span>
                  <span style={S.slowStock}>{p.stock} in stock</span>
                </div>
              ))
            )}
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>Records · {rangeLabel}</div>
              {confirmedCount > 0 && (
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px", backgroundColor: matchedCount === confirmedCount ? "#f0fdf4" : "#fff8f0", color: matchedCount === confirmedCount ? "#16a34a" : "#f97316" }}>
                  {matchedCount}/{confirmedCount} matched
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
              At end of day, tap <strong style={{ color: "#374151" }}>Actual</strong> box to compare vs system
            </div>
            {recentByDate.length === 0 ? (
              <div style={S.emptyText}>No sales recorded for this period.</div>
            ) : (
              recentByDate.map((r) => (
                <RecordRow key={r.date} r={r} confirmed={confirmed[r.date] ?? null} onConfirm={handleConfirm} onReview={() => setReviewDate(r.date)} />
              ))
            )}
          </div>
        </div>

        <button style={S.fab} onClick={() => setShowModal(true)}>+</button>

        {showModal && (
          <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div style={S.modal}>
              <div style={S.modalScrollArea}>
                <div style={S.modalHeader}>
                  <h2 style={S.modalTitle}>Record Daily Sales</h2>
                  <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                </div>
                <form id="sales-form" onSubmit={handleSubmit}>
                  <label style={S.label}>Date</label>
                  <input style={S.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <label style={S.label}>Total Amount</label>
                  <input style={S.input} type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  <label style={S.label}>Notes</label>
                  <textarea style={{ ...S.textarea, marginBottom: "4px" }} placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </form>
              </div>
              <div style={S.submitBtnWrap}>
                <button type="submit" form="sales-form" style={S.submitBtn} disabled={submitting}>{submitting ? "Saving..." : "💾 Save Record"}</button>
              </div>
            </div>
          </div>
        )}

        {reviewDate && (
          <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setReviewDate(null)}>
            <div style={S.modal}>
              <div style={S.modalScrollArea}>
                <div style={S.modalHeader}>
                  <h2 style={S.modalTitle}>Sales Review</h2>
                  <button style={S.closeBtn} onClick={() => setReviewDate(null)}>✕</button>
                </div>
                <div style={S.modalSub}>{formatDate(reviewDate)}</div>
                {confirmed[reviewDate] != null && (() => {
                  const c = confirmed[reviewDate];
                  const diff = c - reviewTotal;
                  const matched2 = diff === 0;
                  return (
                    <div style={{ backgroundColor: matched2 ? "#f0fdf4" : diff > 0 ? "#eff6ff" : "#fff1f2", border: `1.5px solid ${matched2 ? "#86efac" : diff > 0 ? "#bfdbfe" : "#fecaca"}`, borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        <div><div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "3px" }}>System</div><div style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a2e" }}>₱{reviewTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "3px" }}>Actual Cash</div><div style={{ fontSize: "20px", fontWeight: "700", color: matched2 ? "#16a34a" : diff > 0 ? "#3b82f6" : "#ef4444" }}>₱{c.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div></div>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "700", textAlign: "center", color: matched2 ? "#16a34a" : diff > 0 ? "#3b82f6" : "#ef4444" }}>
                        {matched2 ? "✓ Cash matches system — all good!" : diff > 0 ? `+₱${diff.toLocaleString("en-PH", { minimumFractionDigits: 2 })} over — check for unrecorded sales` : `-₱${Math.abs(diff).toLocaleString("en-PH", { minimumFractionDigits: 2 })} short — possible missing cash`}
                      </div>
                    </div>
                  );
                })()}
                <div style={S.reviewSummaryBox}>
                  <div>
                    <div style={S.reviewSummaryLabel}>SYSTEM TOTAL</div>
                    <div style={S.reviewSummaryTotal}>₱{reviewTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                    <div style={S.reviewSummaryCount}>{reviewSales.length} transaction{reviewSales.length !== 1 ? "s" : ""}</div>
                  </div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                </div>
                {reviewSales.length === 0 ? <div style={S.emptyText}>No transactions found.</div> : (
                  reviewSales.map((s) => {
                    const type = getTxnType(s);
                    const qty = parseInt(s.qty) || 1;
                    const unitPrice = parseFloat(s.unitPrice) || 0;
                    const txnTotal = getSaleTotal(s);
                    return (
                      <div key={s._id || s.id} style={S.txnItem}>
                        <div style={S.txnLeft}>
                          <div style={S.txnName}>{s.productName || "Manual Entry"}</div>
                          <div style={S.txnMeta}>{formatTime(s.saleDate)}{qty > 1 && ` · qty ${qty}`}{unitPrice > 0 && ` · ₱${unitPrice.toFixed(2)}/ea`}</div>
                          <div style={S.typeBadge(type)}>{type === "checkout" ? "✓ Checkout" : "Manual"}</div>
                        </div>
                        <div style={S.txnRight}><div style={S.txnTotal}>₱{txnTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div></div>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={S.submitBtnWrap}>
                <button style={{ ...S.submitBtn, backgroundColor: "#1a1a2e" }} onClick={() => setReviewDate(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}