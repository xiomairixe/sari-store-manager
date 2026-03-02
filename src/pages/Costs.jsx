import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import DateRangeFilter, { getDefaultDateRange, filterByDateRange } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORY_COLORS = {
  Rent: "#f97316", Utilities: "#ef4444", Supplies: "#3b82f6",
  Transportation: "#22c55e", Miscellaneous: "#a855f7", Other: "#9ca3af",
};
const CATEGORIES = ["Rent", "Utilities", "Supplies", "Transportation", "Miscellaneous", "Other"];

const S = {
  page: { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "90px" },
  header: { padding: "20px 20px 10px", backgroundColor: "#f5f6fa", position: "sticky", top: 0, zIndex: 10 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" },
  card: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 14px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
  summaryKey: { fontSize: "14px", color: "#374151" },
  summaryRevenue: { fontSize: "15px", fontWeight: "600", color: "#1a1a2e" },
  summaryExpense: { fontSize: "15px", fontWeight: "600", color: "#ef4444" },
  profitRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0" },
  profitKey: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  expenseItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  iconBox: (color) => ({ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
  expenseInfo: { flex: 1, minWidth: 0 },
  expenseName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: 0 },
  expenseDesc: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  expenseRight: { textAlign: "right" },
  expenseAmount: { fontSize: "14px", fontWeight: "700", color: "#1a1a2e" },
  expenseDate: { fontSize: "11px", color: "#9ca3af", marginTop: "2px" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 10px" },
  fab: { position: "fixed", bottom: "85px", right: "20px", width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#ef4444", border: "none", color: "#fff", fontSize: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(239,68,68,0.4)", zIndex: 100 },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal: { backgroundColor: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalScrollArea: { padding: "24px 20px 8px", overflowY: "auto", flex: 1, minHeight: 0 },
  submitBtnWrap: { padding: "12px 20px 90px", backgroundColor: "#fff", borderTop: "1px solid #f3f4f6", flexShrink: 0 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" },
  input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "0" },
  submitBtn: { width: "100%", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  emptyText: { textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", padding: "4px", flexShrink: 0 },
};

const formatDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const fmtShort = (dateStr) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>
          {payload[0].name} : ₱{parseFloat(payload[0].value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const emptyForm = { description: "", amount: "", category: "Rent", costDate: new Date().toISOString().split("T")[0] };

export default function Costs() {
  const [costs, setCosts] = useState([]);
  const [sales, setSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  useEffect(() => { fetchCosts(); fetchSales(); }, []);

  const fetchCosts = async () => {
    try { const res = await axios.get(`${BASE_URL}/costs`); setCosts(res.data); } catch (err) { console.error(err); }
  };
  const fetchSales = async () => {
    try { const res = await axios.get(`${BASE_URL}/sales`); setSales(res.data); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}/costs`, form);
      setShowModal(false);
      setForm(emptyForm);
      fetchCosts();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await axios.delete(`${BASE_URL}/costs/${deleteTarget}`); fetchCosts(); }
    catch (err) { console.error(err); } finally { setDeleteTarget(null); }
  };

  // ── Filter by selected date range ────────────────────────────────────────
  const thisRangeSales = filterByDateRange(sales, "saleDate", dateRange);
  const thisRangeCosts = filterByDateRange(costs, "costDate", dateRange);

  const revenue = thisRangeSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const expenses = thisRangeCosts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const netProfit = revenue - expenses;

  const pieData = CATEGORIES.map(cat => ({
    name: cat,
    value: thisRangeCosts.filter(c => c.category === cat).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
  })).filter(d => d.value > 0);

  const recent = [...thisRangeCosts].sort((a, b) => new Date(b.costDate) - new Date(a.costDate));

  const rangeLabel = dateRange.from === dateRange.to
    ? fmtShort(dateRange.from)
    : `${fmtShort(dateRange.from)} – ${fmtShort(dateRange.to)}`;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerRow}>
            <h1 style={S.title}>Expenses & Profit</h1>
            <DateRangeFilter range={dateRange} onChange={setDateRange} />
          </div>
        </div>

        <div style={S.body}>
          {/* Financial Summary */}
          <div style={S.card}>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
              Financial Summary · {rangeLabel}
            </div>
            <div style={S.summaryRow}>
              <span style={S.summaryKey}>Revenue</span>
              <span style={S.summaryRevenue}>₱{revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={S.summaryRow}>
              <span style={S.summaryKey}>Expenses</span>
              <span style={S.summaryExpense}>-₱{expenses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={S.profitRow}>
              <span style={S.profitKey}>Net Profit</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: netProfit >= 0 ? "#16a34a" : "#ef4444" }}>
                ₱{netProfit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Pie Chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Expense Breakdown · {rangeLabel}</div>
            {pieData.length === 0 ? (
              <div style={S.emptyText}>No expenses for this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#9ca3af"} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 16px", marginTop: "4px" }}>
                  {pieData.map((entry) => (
                    <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#374151" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: CATEGORY_COLORS[entry.name] || "#9ca3af" }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Expenses List */}
          <div style={S.sectionTitle}>Expenses · {rangeLabel}</div>
          <div style={{ ...S.card, padding: "4px 16px" }}>
            {recent.length === 0 ? (
              <div style={S.emptyText}>No expenses for this period. Tap + to add.</div>
            ) : (
              recent.map((cost) => {
                const color = CATEGORY_COLORS[cost.category] || "#9ca3af";
                return (
                  <div key={cost._id || cost.id} style={S.expenseItem}>
                    <div style={S.iconBox(color)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div style={S.expenseInfo}>
                      <p style={S.expenseName}>{cost.category}</p>
                      <p style={S.expenseDesc}>{cost.description}</p>
                    </div>
                    <div style={S.expenseRight}>
                      <div style={S.expenseAmount}>
                        ₱{parseFloat(cost.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                      <div style={S.expenseDate}>{formatDate(cost.costDate)}</div>
                    </div>
                    <button style={S.deleteBtn} onClick={() => setDeleteTarget(cost._id || cost.id)}>🗑</button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button style={S.fab} onClick={() => setShowModal(true)}>+</button>

        {/* Delete Confirm */}
        {deleteTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "28px 20px", width: "100%", maxWidth: "320px", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: "44px", marginBottom: "12px" }}>🗑️</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px" }}>Delete Expense?</div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>This action cannot be undone.</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid #e5e7eb", backgroundColor: "#fff", fontSize: "14px", fontWeight: "600", color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", fontSize: "14px", fontWeight: "700", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showModal && (
          <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div style={S.modal}>
              <div style={S.modalScrollArea}>
                <div style={S.modalHeader}>
                  <h2 style={S.modalTitle}>Add Expense</h2>
                  <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                </div>
                <form id="expense-form" onSubmit={handleSubmit}>
                  <label style={S.label}>Description</label>
                  <input style={S.input} placeholder="e.g. Meralco Bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div style={S.row2}>
                    <div>
                      <label style={S.label}>Amount</label>
                      <input style={S.input} type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Category</label>
                      <select style={S.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <label style={S.label}>Date</label>
                  <input style={{ ...S.input, marginBottom: "4px" }} type="date" value={form.costDate} onChange={(e) => setForm({ ...form, costDate: e.target.value })} />
                </form>
              </div>
              <div style={S.submitBtnWrap}>
                <button type="submit" form="expense-form" style={S.submitBtn} disabled={submitting}>
                  {submitting ? "Saving..." : "💾 Save Expense"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}