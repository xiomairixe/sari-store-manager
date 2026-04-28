import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { key: "all",       label: "All"       },
  { key: "equipment", label: "Equipment" },
  { key: "vehicle",   label: "Vehicle"   },
  { key: "property",  label: "Property"  },
  { key: "inventory", label: "Inventory" },
  { key: "other",     label: "Other"     },
];

const CAT_COLORS = {
  equipment: { bg: "#fff7ed", text: "#ea580c", dot: "#f97316" },
  vehicle:   { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  property:  { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  inventory: { bg: "#fdf4ff", text: "#9333ea", dot: "#a855f7" },
  other:     { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" },
};

const STATUS_CFG = {
  active:      { label: "Active",      bg: "#f0fdf4", text: "#16a34a" },
  maintenance: { label: "Maintenance", bg: "#fef9c3", text: "#a16207" },
  disposed:    { label: "Disposed",    bg: "#fee2e2", text: "#b91c1c" },
};

const EMPTY_FORM = {
  name: "", category: "equipment", value: "", purchaseDate: "",
  status: "active", description: "", quantity: "",
};

const fmt     = (v) => "₱" + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function Assets() {
  const [assets, setAssets]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [qtyChange, setQtyChange] = useState("");
  const [lostQty, setLostQty]     = useState("");

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/assets`);
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch { showToast("Failed to fetch assets", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setQtyChange(""); setLostQty(""); setShowModal(true);
  };

  const openEdit = (asset) => {
    setEditing(asset);
    setForm({
      name:         asset.name         || "",
      category:     asset.category     || "equipment",
      value:        asset.value        || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      status:       asset.status       || "active",
      description:  asset.description  || "",
      quantity:     asset.quantity != null ? asset.quantity : "",
    });
    setQtyChange(""); setLostQty(""); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setQtyChange(""); setLostQty("");
  };

  const applyQty = (delta) => {
    const change = Number(qtyChange);
    if (!change || change <= 0) { showToast("Enter a valid quantity", "error"); return; }
    const next = Math.max(0, (Number(form.quantity) || 0) + delta * change);
    setForm(f => ({ ...f, quantity: next }));
    setQtyChange("");
  };

  const applyLost = () => {
    const lost = Number(lostQty);
    if (!lost || lost <= 0) { showToast("Enter a valid lost quantity", "error"); return; }
    const current = Number(form.quantity) || 0;
    if (lost > current) { showToast("Lost qty cannot exceed current stock", "error"); return; }
    setForm(f => ({ ...f, quantity: current - lost }));
    setLostQty("");
    showToast(`Deducted ${lost} from quantity`);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.value) { showToast("Name and value are required.", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, quantity: form.quantity !== "" ? Number(form.quantity) : null };
      if (editing) {
        const res = await axios.put(`${BASE_URL}/api/assets/${editing._id}`, payload);
        setAssets(prev => prev.map(a => a._id === editing._id ? res.data : a));
        showToast("Asset updated!");
      } else {
        const res = await axios.post(`${BASE_URL}/api/assets`, payload);
        setAssets(prev => [res.data, ...prev]);
        showToast("Asset added!");
      }
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.error || "Something went wrong", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await axios.delete(`${BASE_URL}/api/assets/${editing._id}`);
      setAssets(prev => prev.filter(a => a._id !== editing._id));
      showToast("Asset deleted.");
      closeModal();
    } catch { showToast("Failed to delete asset", "error"); }
  };

  const totalValue    = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const activeCount   = assets.filter(a => a.status === "active").length;
  const maintCount    = assets.filter(a => a.status === "maintenance").length;
  const disposedCount = assets.filter(a => a.status === "disposed").length;

  const filtered = assets.filter(a => {
    const matchCat    = activeCat === "all" || a.category === activeCat;
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = activeCat !== "all"
    ? { [activeCat]: filtered }
    : CATEGORIES.filter(c => c.key !== "all").reduce((acc, c) => {
        const items = filtered.filter(a => a.category === c.key);
        if (items.length) acc[c.key] = items;
        return acc;
      }, {});

  const inp = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" };
  const lbl = { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .assets-page {
          background-color: #f5f6fa;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }
        .assets-header {
          padding: 20px 20px 14px;
          background: #fff;
          border-bottom: 1px solid #eeeff3;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-shrink: 0;
        }
        .assets-toolbar {
          background: #fff;
          padding: 10px 20px 0;
          position: sticky;
          top: 61px;
          z-index: 9;
          flex-shrink: 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .assets-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .assets-fab {
          position: fixed;
          bottom: 85px;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: #f97316;
          border: none;
          color: #fff;
          font-size: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(249,115,22,0.4);
          z-index: 100;
        }
        /* Modal */
        .assets-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .assets-modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .assets-modal-scroll {
          padding: 24px 20px 8px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }
        .assets-modal-footer {
          padding: 12px 20px 90px;
          background: #fff;
          border-top: 1px solid #f3f4f6;
          flex-shrink: 0;
        }
        /* Asset list grid */
        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        /* Toast */
        .assets-toast {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 22px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 700;
          z-index: 300;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .assets-header {
            padding: 20px 32px 14px;
          }
          .assets-toolbar {
            padding: 10px 32px 0;
            top: 65px;
          }
          .assets-body {
            padding: 24px 32px 40px;
          }
          .assets-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: start;
          }
          .assets-fab {
            bottom: 32px;
            right: 32px;
          }
          /* Centered dialog */
          .assets-modal-overlay {
            align-items: center;
            padding: 24px;
          }
          .assets-modal {
            border-radius: 20px;
            max-width: 540px;
            max-height: 88vh;
          }
          .assets-modal-scroll {
            padding: 28px 28px 8px;
          }
          .assets-modal-footer {
            padding: 16px 28px 24px;
          }
        }
      `}</style>

      <div className="assets-page">

        {/* Header */}
        <div className="assets-header">
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Assets</h1>
        </div>

        {/* Toolbar: search + tabs */}
        <div className="assets-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f5f6fa", borderRadius: "12px", padding: "10px 14px", marginBottom: "10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", backgroundColor: "transparent" }}
              placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "18px", lineHeight: 1 }}>✕</button>}
          </div>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "10px" }}>
            {CATEGORIES.map(c => {
              const active = activeCat === c.key;
              return (
                <button key={c.key} onClick={() => setActiveCat(c.key)}
                  style={{ padding: "7px 14px", borderRadius: "20px", border: active ? "none" : "1.5px solid #e5e7eb", backgroundColor: active ? "#f97316" : "#fff", color: active ? "#fff" : "#6b7280", fontSize: "12px", fontWeight: active ? "700" : "500", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: active ? "0 2px 8px rgba(249,115,22,0.3)" : "none", flexShrink: 0 }}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="assets-body">

          {/* Hero Card */}
          <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", borderRadius: "18px", padding: "20px 24px", color: "#fff" }}>
            <div style={{ fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "6px" }}>Total Asset Value</div>
            <div style={{ fontSize: "34px", fontWeight: "700", margin: "0 0 12px", letterSpacing: "-0.5px" }}>{fmt(totalValue)}</div>
            <div style={{ display: "flex", gap: "12px" }}>
              {[
                { num: activeCount,   lbl: "Active"      },
                { num: maintCount,    lbl: "Maintenance" },
                { num: disposedCount, lbl: "Disposed"    },
                { num: assets.length, lbl: "Total"       },
              ].map(({ num, lbl: l }) => (
                <div key={l} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: "12px", padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>{num}</div>
                  <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Groups */}
          <div className="assets-list">
            {loading ? (
              <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gridColumn: "1/-1" }}>
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "13px" }}>Loading assets...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gridColumn: "1/-1" }}>
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "13px" }}>
                  {search ? "No assets match your search." : "No assets yet. Tap + to add one."}
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([catKey, items]) => {
                const catLabel = CATEGORIES.find(c => c.key === catKey)?.label || catKey;
                const catColor = CAT_COLORS[catKey] || CAT_COLORS.other;
                const catTotal = items.reduce((s, a) => s + Number(a.value || 0), 0);
                return (
                  <div key={catKey} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: catColor.dot }} />
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>{catLabel}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#9ca3af" }}>{fmt(catTotal)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>{items.length} item{items.length !== 1 ? "s" : ""}</div>

                    {items.map(asset => {
                      const statusCfg = STATUS_CFG[asset.status] || STATUS_CFG.active;
                      return (
                        <div key={asset._id} onClick={() => openEdit(asset)}
                          style={{ display: "flex", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f3f4f6", gap: "12px", cursor: "pointer" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: catColor.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.name}</div>
                            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                              {fmtDate(asset.purchaseDate)}
                              {asset.quantity != null ? ` · Qty: ${asset.quantity}` : ""}
                              {asset.description ? ` · ${asset.description.slice(0, 25)}${asset.description.length > 25 ? "…" : ""}` : ""}
                            </div>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: "700", backgroundColor: statusCfg.bg, color: statusCfg.text, marginTop: "3px" }}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>{fmt(asset.value)}</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "6px" }}>
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* FAB */}
        <button className="assets-fab" onClick={openAdd}>+</button>

        {/* Modal */}
        {showModal && (
          <div className="assets-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="assets-modal">
              <div className="assets-modal-scroll">

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>{editing ? "Edit Asset" : "Add Asset"}</h2>
                  <button style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" }} onClick={closeModal}>✕</button>
                </div>
                <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>{editing ? `Editing · ${editing.name}` : "Enter asset details below"}</p>

                <label style={lbl}>Asset Name *</label>
                <input style={inp} placeholder="e.g. Delivery Truck" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>

                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Value (₱) *</label>
                    <input style={inp} type="number" placeholder="0.00" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Purchase Date</label>
                    <input style={inp} type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                  </div>
                </div>

                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight: "72px", resize: "vertical" }} placeholder="Optional notes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

                {/* ADD MODE — simple qty */}
                {!editing && (
                  <>
                    <label style={lbl}>Quantity <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                    <input style={inp} type="number" min="0" placeholder="e.g. 5" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  </>
                )}

                {/* EDIT MODE — qty adjuster + lost */}
                {editing && (
                  <>
                    <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "4px 0 16px" }} />

                    {/* Adjust Quantity */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "14px", marginBottom: "14px", border: "1.5px solid #e5e7eb" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "10px" }}>📦 Adjust Quantity</div>
                      <div style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", textAlign: "center", margin: "4px 0 12px" }}>
                        {form.quantity !== "" && form.quantity != null ? form.quantity : "—"}
                      </div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button onClick={() => applyQty(-1)}
                          style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "20px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>−</button>
                        <input type="number" min="1" placeholder="Qty" value={qtyChange} onChange={e => setQtyChange(e.target.value)}
                          style={{ flex: 2, border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "16px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", textAlign: "center", boxSizing: "border-box", backgroundColor: "#fff" }} />
                        <button onClick={() => applyQty(+1)}
                          style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "#22c55e", color: "#fff", fontSize: "20px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+</button>
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>Enter amount · tap − to deduct or + to add</div>
                    </div>

                    {/* Lost / Damaged */}
                    <div style={{ backgroundColor: "#fff5f5", borderRadius: "14px", padding: "14px", marginBottom: "14px", border: "1.5px solid #fecaca" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#b91c1c", marginBottom: "6px" }}>⚠️ Lost / Damaged</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>Log items that were lost, stolen, or damaged. This will deduct from current quantity.</div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="number" min="1" placeholder="Qty lost" value={lostQty} onChange={e => setLostQty(e.target.value)} onKeyDown={e => e.key === "Enter" && applyLost()}
                          style={{ flex: 1, border: "1.5px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "16px", fontFamily: "'DM Sans', sans-serif", color: "#b91c1c", outline: "none", textAlign: "center", boxSizing: "border-box", backgroundColor: "#fff" }} />
                        <button onClick={applyLost}
                          style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Apply Loss</button>
                      </div>
                    </div>
                  </>
                )}

              </div>

              <div className="assets-modal-footer">
                <button onClick={handleSave} disabled={saving}
                  style={{ width: "100%", backgroundColor: "#f97316", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {saving ? "Saving..." : editing ? "💾 Save Changes" : "💾 Add Asset"}
                </button>
                {editing && (
                  <button onClick={handleDelete}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "10px" }}>
                    🗑 Delete Asset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="assets-toast" style={{ backgroundColor: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
            {toast.msg}
          </div>
        )}

      </div>
    </>
  );
}