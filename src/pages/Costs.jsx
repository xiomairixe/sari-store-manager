import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import DateRangeFilter, { getDefaultDateRange, filterByDateRange } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORY_COLORS = {
  Rent: "#f97316", Utilities: "#ef4444", Supplies: "#3b82f6",
  Transportation: "#22c55e", Miscellaneous: "#a855f7", Other: "#9ca3af",
};
const CATEGORIES = ["Rent", "Utilities", "Supplies", "Transportation", "Miscellaneous", "Other"];

const formatDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const fmtShort = (dateStr) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>
          {payload[0].name}: ₱{parseFloat(payload[0].value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const emptyForm = {
  description: "",
  amount: "",
  category: "Rent",
  costDate: new Date().toISOString().split("T")[0],
};

export default function Costs() {
  const [costs, setCosts] = useState([]);
  const [sales, setSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const receiptInputRef = useRef();

  useEffect(() => { fetchCosts(); fetchSales(); }, []);

  const fetchCosts = async () => {
    try { const res = await axios.get(`${BASE_URL}/costs`); setCosts(res.data); } catch (err) { console.error(err); }
  };
  const fetchSales = async () => {
    try { const res = await axios.get(`${BASE_URL}/sales`); setSales(res.data); } catch (err) { console.error(err); }
  };

  const openModal = () => {
    setForm(emptyForm);
    setReceiptFile(null);
    setReceiptPreview(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (receiptFile) fd.append("receipt", receiptFile);
      await axios.post(`${BASE_URL}/costs`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowModal(false);
      setForm(emptyForm);
      setReceiptFile(null);
      setReceiptPreview(null);
      fetchCosts();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await axios.delete(`${BASE_URL}/costs/${deleteTarget}`); fetchCosts(); }
    catch (err) { console.error(err); } finally { setDeleteTarget(null); }
  };

  const thisRangeSales = filterByDateRange(sales, "saleDate", dateRange);
  const thisRangeCosts = filterByDateRange(costs, "costDate", dateRange);

  const revenue   = thisRangeSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const expenses  = thisRangeCosts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const netProfit = revenue - expenses;

  const pieData = CATEGORIES.map(cat => ({
    name: cat,
    value: thisRangeCosts.filter(c => c.category === cat).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
  })).filter(d => d.value > 0);

  const recent = [...thisRangeCosts].sort((a, b) => new Date(b.costDate) - new Date(a.costDate));

  const rangeLabel = dateRange.from === dateRange.to
    ? fmtShort(dateRange.from)
    : `${fmtShort(dateRange.from)} – ${fmtShort(dateRange.to)}`;

  const inp = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" };
  const lbl = { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .costs-page {
          background-color: #f5f6fa;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }
        .costs-header {
          padding: 20px 20px 14px;
          background: #fff;
          border-bottom: 1px solid #eeeff3;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-shrink: 0;
        }
        .costs-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .costs-fab {
          position: fixed;
          bottom: 85px;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: #ef4444;
          border: none;
          color: #fff;
          font-size: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(239,68,68,0.4);
          z-index: 100;
        }
        .costs-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .costs-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .costs-modal-scroll {
          padding: 24px 20px 8px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }
        .costs-modal-footer {
          padding: 12px 20px 90px;
          background: #fff;
          border-top: 1px solid #f3f4f6;
          flex-shrink: 0;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .costs-header {
            padding: 20px 32px 14px;
          }
          .costs-body {
            padding: 24px 32px 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: start;
          }
          .costs-summary-card  { grid-column: 1 / -1; }
          .costs-chart-card    { grid-column: 1; }
          .costs-list-section  { grid-column: 2; }
          .costs-fab {
            bottom: 32px;
            right: 32px;
          }
          /* Centered dialog on desktop */
          .costs-modal-overlay {
            align-items: center;
            padding: 24px;
          }
          .costs-modal {
            border-radius: 20px;
            max-width: 520px;
            max-height: 88vh;
          }
          .costs-modal-scroll {
            padding: 28px 28px 8px;
          }
          .costs-modal-footer {
            padding: 16px 28px 24px;
          }
        }
      `}</style>

      <div className="costs-page">

        {/* Header */}
        <div className="costs-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Expenses & Profit</h1>
            <DateRangeFilter range={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Body */}
        <div className="costs-body">

          {/* Financial Summary */}
          <div className="costs-summary-card" style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px" }}>Financial Summary · {rangeLabel}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: "14px", color: "#374151" }}>Revenue</span>
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#1a1a2e" }}>₱{revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: "14px", color: "#374151" }}>Expenses</span>
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#ef4444" }}>-₱{expenses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0" }}>
              <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>Net Profit</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: netProfit >= 0 ? "#16a34a" : "#ef4444" }}>
                ₱{netProfit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="costs-chart-card" style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 14px" }}>Expense Breakdown · {rangeLabel}</div>
            {pieData.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No expenses for this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#9ca3af"} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 16px", marginTop: "4px" }}>
                  {pieData.map(entry => (
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
          <div className="costs-list-section" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>Expenses · {rangeLabel}</div>
            <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {recent.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No expenses for this period. Tap + to add.</div>
              ) : recent.map((cost, i) => {
                const color = CATEGORY_COLORS[cost.category] || "#9ca3af";
                const isLast = i === recent.length - 1;
                return (
                  <div key={cost._id || cost.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: 0 }}>{cost.category}</p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{cost.description}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e" }}>
                        ₱{parseFloat(cost.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{formatDate(cost.costDate)}</div>
                    </div>
                    {cost.receipt && (
                      <img src={cost.receipt} alt="receipt"
                        onClick={() => setViewReceipt(cost.receipt)}
                        style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", cursor: "pointer", flexShrink: 0, border: "1.5px solid #e5e7eb" }} />
                    )}
                    <button onClick={() => setDeleteTarget(cost._id || cost.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", padding: "4px", flexShrink: 0 }}>🗑</button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* FAB */}
        <button className="costs-fab" onClick={openModal}>+</button>

        {/* Receipt Full-Screen Viewer */}
        {viewReceipt && (
          <div onClick={() => setViewReceipt(null)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.88)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <button onClick={() => setViewReceipt(null)}
              style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "22px", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <img src={viewReceipt} alt="receipt full" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain" }} />
          </div>
        )}

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
          <div className="costs-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="costs-modal">
              <div className="costs-modal-scroll">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Add Expense</h2>
                  <button style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }} onClick={() => setShowModal(false)}>✕</button>
                </div>

                <form id="expense-form" onSubmit={handleSubmit}>
                  <label style={lbl}>Description</label>
                  <input style={inp} placeholder="e.g. Meralco Bill" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={lbl}>Amount</label>
                      <input style={inp} type="number" step="0.01" placeholder="0.00" value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div>
                      <label style={lbl}>Category</label>
                      <select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <label style={lbl}>Date</label>
                  <input style={inp} type="date" value={form.costDate}
                    onChange={e => setForm({ ...form, costDate: e.target.value })} />

                  {/* Receipt Upload */}
                  <label style={lbl}>
                    Receipt <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "12px" }}>(optional)</span>
                  </label>
                  <div onClick={() => receiptInputRef.current.click()}
                    style={{ border: "2px dashed #e5e7eb", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", backgroundColor: receiptPreview ? "#f0fdf4" : "#fafafa", marginBottom: "14px" }}>
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="receipt preview" style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: "56px", height: "56px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🧾</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{receiptFile ? receiptFile.name : "Tap to upload receipt"}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>JPG, PNG, WEBP · max 5MB</div>
                    </div>
                    {receiptPreview && (
                      <button type="button"
                        onClick={e => { e.stopPropagation(); setReceiptFile(null); setReceiptPreview(null); }}
                        style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer", flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                  <input ref={receiptInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setReceiptFile(file);
                      setReceiptPreview(URL.createObjectURL(file));
                    }} />
                </form>
              </div>

              <div className="costs-modal-footer">
                <button type="submit" form="expense-form" disabled={submitting}
                  style={{ width: "100%", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
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