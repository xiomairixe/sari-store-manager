import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
};

const progressBar = (pct, exceeded) => ({
  height: "100%",
  width: `${Math.min(pct, 100)}%`,
  backgroundColor: exceeded ? "#ef4444" : pct > 75 ? "#eab308" : "#22c55e",
  borderRadius: "99px",
  transition: "width 0.4s ease",
});

function CustomerDetailModal({ customer, onClose, onAddUtang, onPayment }) {
  const transactions = [...(customer.transactions || [])].reverse();
  const balance  = parseFloat(customer.balance || 0);
  const limit    = parseFloat(customer.creditLimit || 1000);
  const exceeded = balance > limit;
  const pct      = limit > 0 ? (balance / limit) * 100 : 0;
  const totalUtang   = transactions.filter(t => t.type === "utang"  ).reduce((s, t) => s + t.amount, 0);
  const totalPayment = transactions.filter(t => t.type === "payment").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="utang-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="utang-modal utang-detail-modal">

        {/* Fixed header */}
        <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{customer.customerName}</h2>
              {customer.phone && <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: "12px" }}>📞 {customer.phone}</p>}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ margin: "12px 0 0" }}>
            <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: "700", backgroundColor: customer.status === "paid" ? "#dcfce7" : customer.status === "partial" ? "#fef9c3" : "#fee2e2", color: customer.status === "paid" ? "#16a34a" : customer.status === "partial" ? "#ca8a04" : "#ef4444" }}>
              {customer.status?.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", margin: "14px 0 0" }}>
            {[
              { label: "Total Utang", value: customer.amount,     color: "#ef4444", bg: "#fff5f5" },
              { label: "Total Bayad", value: customer.amountPaid, color: "#16a34a", bg: "#f0fdf4" },
              { label: "Balance",     value: customer.balance,    color: exceeded ? "#ef4444" : "#1a1a2e", bg: exceeded ? "#fff5f5" : "#f9fafb" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ backgroundColor: bg, borderRadius: "12px", padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color }}>₱{parseFloat(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 })}</div>
              </div>
            ))}
          </div>

          <div style={{ margin: "12px 0 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginBottom: "5px" }}>
              <span>Credit Used</span>
              <span>{Math.min(Math.round(pct), 100)}% of ₱{limit.toLocaleString("en-PH", { minimumFractionDigits: 0 })}</span>
            </div>
            <div style={{ height: "6px", backgroundColor: "#f3f4f6", borderRadius: "99px" }}>
              <div style={progressBar(pct, exceeded)} />
            </div>
            {exceeded && <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600", marginTop: "4px" }}>⚠ Lagpas na sa credit limit</div>}
          </div>

          <div style={{ display: "flex", gap: "8px", margin: "14px 0 16px" }}>
            <button onClick={onAddUtang} style={{ flex: 1, padding: "9px 0", border: "1.5px solid #fca5a5", borderRadius: "10px", backgroundColor: "#fff5f5", color: "#ef4444", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add Utang</button>
            <button onClick={onPayment}  style={{ flex: 1, padding: "9px 0", border: "1.5px solid #bbf7d0", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>💵 Record Payment</button>
          </div>

          <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "1.5px solid #f3f4f6", paddingBottom: "10px" }}>
            Transaction History
            <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: "600", backgroundColor: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "20px" }}>
              {transactions.length}
            </span>
          </div>
        </div>

        {/* Scrollable transactions */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 40px", WebkitOverflowScrolling: "touch" }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>Wala pang transactions.</div>
          ) : (
            <>
              {transactions.map((t, i) => {
                const isUtang  = t.type === "utang";
                const isLatest = i === 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 0", borderBottom: i < transactions.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0, backgroundColor: isUtang ? "#fff5f5" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                      {isUtang ? "📋" : "💵"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: isUtang ? "#ef4444" : "#16a34a" }}>{isUtang ? "Utang" : "Bayad"}</span>
                            {isLatest && (
                              <span style={{ fontSize: "10px", backgroundColor: isUtang ? "#fee2e2" : "#dcfce7", color: isUtang ? "#ef4444" : "#16a34a", padding: "1px 6px", borderRadius: "20px", fontWeight: "700" }}>PINAKABAGO</span>
                            )}
                          </div>
                          {t.notes ? (
                            <div style={{ backgroundColor: isUtang ? "#fff5f5" : "#f0fdf4", border: `1px solid ${isUtang ? "#fecaca" : "#bbf7d0"}`, borderRadius: "8px", padding: "7px 10px", marginBottom: "5px" }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "#1a1a2e", lineHeight: "1.45" }}>{t.notes}</p>
                            </div>
                          ) : (
                            <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#d1d5db", fontStyle: "italic" }}>Walang notes</p>
                          )}
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>📅 {fmtDate(t.createdAt)}</p>
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "700", flexShrink: 0, color: isUtang ? "#ef4444" : "#16a34a" }}>
                          {isUtang ? "+" : "−"}₱{parseFloat(t.amount).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ backgroundColor: "#f9fafb", borderRadius: "14px", padding: "14px 16px", margin: "16px 0 0" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "10px" }}>Summary</div>
                {[
                  { label: `Total Utang (${transactions.filter(t => t.type === "utang").length}x)`,   value: totalUtang,   color: "#ef4444" },
                  { label: `Total Bayad (${transactions.filter(t => t.type === "payment").length}x)`, value: totalPayment, color: "#16a34a" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: "700", color }}>₱{value.toLocaleString("en-PH", { minimumFractionDigits: 0 })}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", borderTop: "1px solid #e5e7eb", paddingTop: "10px", marginTop: "4px" }}>
                  <span>Balance</span>
                  <span style={{ color: balance > 0 ? "#ef4444" : "#16a34a" }}>₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Utang() {
  const [customers, setCustomers]               = useState([]);
  const [modal, setModal]                       = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm]                         = useState({});
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { const res = await axios.get(`${BASE_URL}/utang/customers`); setCustomers(res.data); }
    catch (err) { console.error("Failed to fetch customers:", err); }
  };

  const openDetail = async (customer) => {
    try {
      const res = await axios.get(`${BASE_URL}/utang/customers`);
      const fresh = res.data.find(c => c._id === customer._id) || customer;
      setCustomers(res.data);
      setSelectedCustomer(fresh);
      setModal("detail");
    } catch {
      setSelectedCustomer(customer);
      setModal("detail");
    }
  };

  const openModal = (type, customer = null) => {
    setSelectedCustomer(customer);
    setModal(type);
    setError("");
    if (type === "newCustomer") setForm({ customerName: "", phone: "", creditLimit: "1000" });
    if (type === "addUtang")    setForm({ amount: "", notes: "" });
    if (type === "payment")     setForm({ amount: "", notes: "" });
  };

  const openAddUtangFromDetail = () => { setForm({ amount: "", notes: "" }); setError(""); setModal("addUtang"); };
  const openPaymentFromDetail  = () => { setForm({ amount: "", notes: "" }); setError(""); setModal("payment"); };
  const closeModal = () => { setModal(null); setSelectedCustomer(null); setForm({}); setError(""); setLoading(false); };

  const handleNewCustomer = async (e) => {
    e.preventDefault(); setError("");
    if (!form.customerName?.trim()) return setError("Please enter a customer name.");
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/utang/customers`, { customerName: form.customerName.trim(), phone: form.phone?.trim() || "", creditLimit: parseFloat(form.creditLimit) || 1000 });
      closeModal(); fetchCustomers();
    } catch (err) { setError(err.response?.data?.error || "Failed to add customer. Please try again."); }
    finally { setLoading(false); }
  };

  const handleAddUtang = async (e) => {
    e.preventDefault(); setError("");
    if (!form.amount || parseFloat(form.amount) <= 0) return setError("Please enter a valid amount.");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/utang/customers/${selectedCustomer._id}/add`, { amount: parseFloat(form.amount), notes: form.notes || "" });
      setSelectedCustomer(res.data); closeModal(); fetchCustomers();
    } catch (err) { setError(err.response?.data?.error || "Failed to add utang. Please try again."); }
    finally { setLoading(false); }
  };

  const handlePayment = async (e) => {
    e.preventDefault(); setError("");
    if (!form.amount || parseFloat(form.amount) <= 0) return setError("Please enter a valid amount.");
    setLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/utang/customers/${selectedCustomer._id}/pay`, { amountPaid: parseFloat(form.amount), notes: form.notes || "" });
      setSelectedCustomer(res.data); closeModal(); fetchCustomers();
    } catch (err) { setError(err.response?.data?.error || "Failed to record payment. Please try again."); }
    finally { setLoading(false); }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Delete ${customer.customerName}? This cannot be undone.`)) return;
    try { await axios.delete(`${BASE_URL}/utang/customers/${customer._id}`); fetchCustomers(); }
    catch { alert("Failed to delete customer."); }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);
  const debtors          = customers.filter(c => parseFloat(c.balance || 0) > 0);

  const inp = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" };
  const lbl = { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .utang-page {
          background-color: #f5f6fa;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }
        .utang-header {
          padding: 20px 20px 14px;
          background: #fff;
          border-bottom: 1px solid #eeeff3;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-shrink: 0;
        }
        .utang-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .utang-customers-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .utang-fab {
          position: fixed;
          bottom: 85px;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: #1a1a2e;
          border: none;
          color: #fff;
          font-size: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          z-index: 100;
        }
        /* Modal overlay */
        .utang-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        /* Base modal — bottom sheet on mobile */
        .utang-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          padding: 24px 20px 100px;
          max-height: 90vh;
          overflow-y: auto;
        }
        /* Detail modal is taller and flex */
        .utang-detail-modal {
          padding: 0;
          max-height: 92vh;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .utang-header {
            padding: 20px 32px 14px;
          }
          .utang-body {
            padding: 24px 32px 40px;
          }
          .utang-customers-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            align-items: start;
          }
          .utang-fab {
            bottom: 32px;
            right: 32px;
          }
          /* Centered dialog */
          .utang-modal-overlay {
            align-items: center;
            padding: 24px;
          }
          .utang-modal {
            border-radius: 20px;
            max-width: 480px;
            max-height: 88vh;
            padding: 28px 28px 32px;
          }
          /* Detail modal is wider and centered */
          .utang-detail-modal {
            max-width: 580px;
            max-height: 88vh;
            padding: 0;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="utang-page">

        {/* Header */}
        <div className="utang-header">
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Customer Credit (Utang)</h1>
        </div>

        {/* Body */}
        <div className="utang-body">

          {/* Summary card */}
          <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", borderRadius: "18px", padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "6px" }}>Total Outstanding</div>
              <div style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 8px", letterSpacing: "-0.5px" }}>₱{totalOutstanding.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: "13px", opacity: 0.8 }}>{debtors.length} customer{debtors.length !== 1 ? "s" : ""} with debt</div>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          {/* Customer list */}
          {customers.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "14px" }}>No customers yet. Tap + to add one.</div>
          ) : (
            <div className="utang-customers-grid">
              {customers.map(c => {
                const balance  = parseFloat(c.balance || 0);
                const limit    = parseFloat(c.creditLimit || 1000);
                const pct      = limit > 0 ? (balance / limit) * 100 : 0;
                const exceeded = balance > limit;
                const txCount  = c.transactions?.length || 0;

                return (
                  <div key={c._id} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "14px 16px", boxShadow: exceeded ? "0 0 0 1.5px #fca5a5" : "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
                      <div>
                        <p style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{c.customerName}</p>
                        {c.phone && (
                          <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" /></svg>
                            {c.phone}
                          </div>
                        )}
                        {txCount > 0 && <div style={{ marginTop: "4px", fontSize: "11px", color: "#6b7280" }}>📋 {txCount} transaction{txCount !== 1 ? "s" : ""}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: "17px", fontWeight: "700", color: exceeded ? "#ef4444" : "#1a1a2e", textAlign: "right" }}>₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "right", marginTop: "2px" }}>Limit: ₱{limit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                        <div style={{ textAlign: "right", marginTop: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", backgroundColor: c.status === "paid" ? "#dcfce7" : c.status === "partial" ? "#fef9c3" : "#fee2e2", color: c.status === "paid" ? "#16a34a" : c.status === "partial" ? "#ca8a04" : "#ef4444" }}>
                            {c.status?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: "6px", backgroundColor: "#f3f4f6", borderRadius: "99px", margin: "10px 0" }}>
                      <div style={progressBar(pct, exceeded)} />
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                      <button onClick={() => openModal("addUtang", c)} style={{ flex: 1, padding: "9px 0", border: "1.5px solid #fca5a5", borderRadius: "10px", backgroundColor: "#fff5f5", color: "#ef4444", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Utang</button>
                      <button onClick={() => openModal("payment", c)} style={{ flex: 1, padding: "9px 0", border: "1.5px solid #bbf7d0", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>💵 Bayad</button>
                      <button onClick={() => openDetail(c)} style={{ padding: "9px 12px", border: "1.5px solid #e0e7ff", borderRadius: "10px", backgroundColor: "#eef2ff", color: "#4f46e5", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📋 View</button>
                      <button onClick={() => handleDeleteCustomer(c)} style={{ padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: "10px", backgroundColor: "#fff", color: "#9ca3af", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAB */}
        <button className="utang-fab" onClick={() => openModal("newCustomer")}>+</button>

        {/* Detail Modal */}
        {modal === "detail" && selectedCustomer && (
          <CustomerDetailModal customer={selectedCustomer} onClose={closeModal} onAddUtang={openAddUtangFromDetail} onPayment={openPaymentFromDetail} />
        )}

        {/* New Customer Modal */}
        {modal === "newCustomer" && (
          <div className="utang-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="utang-modal">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>New Customer</h2>
                <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
              </div>
              {error && <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px solid #fca5a5" }}>{error}</div>}
              <form onSubmit={handleNewCustomer}>
                <label style={lbl}>Full Name *</label>
                <input style={inp} placeholder="e.g. Ate Lorna Cruz" value={form.customerName || ""} onChange={e => setForm({ ...form, customerName: e.target.value })} autoFocus />
                <label style={lbl}>Phone Number</label>
                <input style={inp} placeholder="09..." value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <label style={lbl}>Credit Limit (₱)</label>
                <input style={inp} type="number" min="0" step="0.01" placeholder="1000" value={form.creditLimit || ""} onChange={e => setForm({ ...form, creditLimit: e.target.value })} />
                <button type="submit" disabled={loading}
                  style={{ width: "100%", backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "4px" }}>
                  {loading ? "Adding..." : "Add Customer"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Utang Modal */}
        {modal === "addUtang" && selectedCustomer && (
          <div className="utang-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="utang-modal">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Add Utang</h2>
                <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ margin: "0 0 16px", color: "#9ca3af", fontSize: "13px" }}>Customer: <strong style={{ color: "#1a1a2e" }}>{selectedCustomer.customerName}</strong></p>
              {error && <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px solid #fca5a5" }}>{error}</div>}
              <form onSubmit={handleAddUtang}>
                <label style={lbl}>Amount (₱)</label>
                <input style={inp} type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount || ""} onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus />
                <label style={lbl}>Notes (kung ano ang inutang)</label>
                <input style={inp} placeholder="e.g. 2 cans na corned beef, 1 softdrinks" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <button type="submit" disabled={loading}
                  style={{ width: "100%", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "4px" }}>
                  {loading ? "Adding..." : "Add Utang"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {modal === "payment" && selectedCustomer && (
          <div className="utang-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="utang-modal">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Record Payment</h2>
                <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ margin: "0 0 4px", color: "#9ca3af", fontSize: "13px" }}>Customer: <strong style={{ color: "#1a1a2e" }}>{selectedCustomer.customerName}</strong></p>
              <p style={{ margin: "0 0 16px", color: "#9ca3af", fontSize: "13px" }}>Balance: <strong style={{ color: "#ef4444" }}>₱{parseFloat(selectedCustomer.balance || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></p>
              {error && <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px solid #fca5a5" }}>{error}</div>}
              <form onSubmit={handlePayment}>
                <label style={lbl}>Amount Paid (₱)</label>
                <input style={inp} type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount || ""} onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus />
                <label style={lbl}>Notes (optional)</label>
                <input style={inp} placeholder="e.g. Bayad sa utang nung Lunes" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <button type="submit" disabled={loading}
                  style={{ width: "100%", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "4px" }}>
                  {loading ? "Recording..." : "Record Payment"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}