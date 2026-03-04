import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Categories & Status config ──────────────────────────────────────────────
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

const EMPTY_FORM = { name: "", category: "equipment", value: "", purchaseDate: "", status: "active", description: "" };

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (v) => "₱" + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

// ── Styles (mirroring Sales.jsx pattern) ────────────────────────────────────
const S = {
  page:        { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "90px" },
  header:      { padding: "20px 20px 10px", backgroundColor: "#f5f6fa", position: "sticky", top: 0, zIndex: 10 },
  headerRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title:       { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  body:        { padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" },

  // Hero card
  totalCard:   { background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", borderRadius: "18px", padding: "20px", color: "#fff" },
  totalLabel:  { fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "6px" },
  totalAmount: { fontSize: "34px", fontWeight: "700", margin: "0 0 12px", letterSpacing: "-0.5px" },
  statsRow:    { display: "flex", gap: "12px" },
  statChip:    { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: "12px", padding: "10px 12px", textAlign: "center" },
  statNum:     { fontSize: "20px", fontWeight: "700" },
  statLbl:     { fontSize: "11px", opacity: 0.85, marginTop: "2px" },

  // White cards
  card:        { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: 0 },

  // Search
  searchWrap:  { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff", borderRadius: "12px", padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", backgroundColor: "transparent" },

  // Category tabs
  tabs:  { display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "2px" },
  tab:   (a) => ({ padding: "7px 14px", borderRadius: "20px", border: a ? "none" : "1.5px solid #e5e7eb", backgroundColor: a ? "#f97316" : "#fff", color: a ? "#fff" : "#6b7280", fontSize: "12px", fontWeight: a ? "700" : "500", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: a ? "0 2px 8px rgba(249,115,22,0.3)" : "none" }),

  // Asset row
  assetRow:   { display: "flex", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f3f4f6", gap: "12px", cursor: "pointer" },
  assetLeft:  { flex: 1, minWidth: 0 },
  assetName:  { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  assetMeta:  { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  assetRight: { textAlign: "right", flexShrink: 0 },
  assetValue: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  badge: (bg, text) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: "700", backgroundColor: bg, color: text, marginTop: "3px" }),

  // FAB
  fab: { position: "fixed", bottom: "85px", right: "20px", width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#f97316", border: "none", color: "#fff", fontSize: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(249,115,22,0.4)", zIndex: 100 },

  // Modal (bottom sheet — same as Sales)
  overlay:         { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal:           { backgroundColor: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalScrollArea: { padding: "24px 20px 8px", overflowY: "auto", flex: 1, minHeight: 0 },
  submitBtnWrap:   { padding: "12px 20px 90px", backgroundColor: "#fff", borderTop: "1px solid #f3f4f6", flexShrink: 0 },
  modalHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  modalTitle:      { fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  modalSub:        { fontSize: "13px", color: "#9ca3af", marginBottom: "20px" },
  closeBtn:        { background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" },
  label:           { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" },
  input:           { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", marginBottom: "14px" },
  row2:            { display: "flex", gap: "12px" },
  textarea:        { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", minHeight: "72px", resize: "vertical", marginBottom: "14px" },
  submitBtn:       { width: "100%", backgroundColor: "#f97316", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  deleteBtn:       { width: "100%", backgroundColor: "#fff", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "10px" },

  emptyText: { textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "13px" },
  toast: (type) => ({ position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)", backgroundColor: type === "error" ? "#ef4444" : "#22c55e", color: "#fff", padding: "10px 22px", borderRadius: "24px", fontSize: "13px", fontWeight: "700", zIndex: 300, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }),
};

// ── Main Component ───────────────────────────────────────────────────────────
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

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/assets`);
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast("Failed to fetch assets", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (asset) => {
    setEditing(asset);
    setForm({
      name:         asset.name        || "",
      category:     asset.category    || "equipment",
      value:        asset.value       || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      status:       asset.status      || "active",
      description:  asset.description || "",
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.value) { showToast("Name and value are required.", "error"); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await axios.put(`${BASE_URL}/assets/${editing._id}`, form);
        setAssets(prev => prev.map(a => a._id === editing._id ? res.data : a));
        showToast("Asset updated!");
      } else {
        const res = await axios.post(`${BASE_URL}/assets`, form);
        setAssets(prev => [res.data, ...prev]);
        showToast("Asset added!");
      }
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.error || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await axios.delete(`${BASE_URL}/assets/${editing._id}`);
      setAssets(prev => prev.filter(a => a._id !== editing._id));
      showToast("Asset deleted.");
      closeModal();
    } catch (err) {
      showToast("Failed to delete asset", "error");
    }
  };

  // ── Derived ──
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

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.page}>

        {/* ── Header ── */}
        <div style={S.header}>
          <div style={S.headerRow}>
            <h1 style={S.title}>Assets</h1>
          </div>
        </div>

        <div style={S.body}>

          {/* ── Hero card ── */}
          <div style={S.totalCard}>
            <div style={S.totalLabel}>Total Asset Value</div>
            <div style={S.totalAmount}>{fmt(totalValue)}</div>
            <div style={S.statsRow}>
              <div style={S.statChip}>
                <div style={S.statNum}>{activeCount}</div>
                <div style={S.statLbl}>Active</div>
              </div>
              <div style={S.statChip}>
                <div style={S.statNum}>{maintCount}</div>
                <div style={S.statLbl}>Maintenance</div>
              </div>
              <div style={S.statChip}>
                <div style={S.statNum}>{disposedCount}</div>
                <div style={S.statLbl}>Disposed</div>
              </div>
              <div style={S.statChip}>
                <div style={S.statNum}>{assets.length}</div>
                <div style={S.statLbl}>Total</div>
              </div>
            </div>
          </div>

          {/* ── Search ── */}
          <div style={S.searchWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input style={S.searchInput} placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "18px", lineHeight: 1 }}>✕</button>
            )}
          </div>

          {/* ── Category tabs ── */}
          <div style={S.tabs}>
            {CATEGORIES.map(c => (
              <button key={c.key} style={S.tab(activeCat === c.key)} onClick={() => setActiveCat(c.key)}>{c.label}</button>
            ))}
          </div>

          {/* ── List ── */}
          {loading ? (
            <div style={S.card}><div style={S.emptyText}>Loading assets...</div></div>
          ) : filtered.length === 0 ? (
            <div style={S.card}><div style={S.emptyText}>{search ? "No assets match your search." : "No assets yet. Tap + to add one."}</div></div>
          ) : (
            Object.entries(grouped).map(([catKey, items]) => {
              const catLabel = CATEGORIES.find(c => c.key === catKey)?.label || catKey;
              const catColor = CAT_COLORS[catKey] || CAT_COLORS.other;
              const catTotal = items.reduce((s, a) => s + Number(a.value || 0), 0);
              return (
                <div key={catKey} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: catColor.dot }} />
                      <span style={S.cardTitle}>{catLabel}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#9ca3af" }}>{fmt(catTotal)}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </div>

                  {items.map(asset => {
                    const statusCfg = STATUS_CFG[asset.status] || STATUS_CFG.active;
                    return (
                      <div key={asset._id} style={S.assetRow} onClick={() => openEdit(asset)}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: catColor.dot, flexShrink: 0 }} />
                        <div style={S.assetLeft}>
                          <div style={S.assetName}>{asset.name}</div>
                          <div style={S.assetMeta}>
                            {fmtDate(asset.purchaseDate)}
                            {asset.description ? ` · ${asset.description.slice(0, 30)}${asset.description.length > 30 ? "…" : ""}` : ""}
                          </div>
                          <span style={S.badge(statusCfg.bg, statusCfg.text)}>{statusCfg.label}</span>
                        </div>
                        <div style={S.assetRight}>
                          <div style={S.assetValue}>{fmt(asset.value)}</div>
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

        {/* ── FAB ── */}
        <button style={S.fab} onClick={openAdd}>+</button>

        {/* ── Add / Edit Modal ── */}
        {showModal && (
          <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
            <div style={S.modal}>
              <div style={S.modalScrollArea}>
                <div style={S.modalHeader}>
                  <h2 style={S.modalTitle}>{editing ? "Edit Asset" : "Add Asset"}</h2>
                  <button style={S.closeBtn} onClick={closeModal}>✕</button>
                </div>
                <p style={S.modalSub}>{editing ? `Editing · ${editing.name}` : "Enter asset details below"}</p>

                <label style={S.label}>Asset Name *</label>
                <input style={S.input} placeholder="e.g. Delivery Truck" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

                <div style={S.row2}>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Category</label>
                    <select style={S.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.filter(c => c.key !== "all").map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Status</label>
                    <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={S.row2}>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Value (₱) *</label>
                    <input style={S.input} type="number" placeholder="0.00" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Purchase Date</label>
                    <input style={S.input} type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                  </div>
                </div>

                <label style={S.label}>Description</label>
                <textarea style={S.textarea} placeholder="Optional notes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={S.submitBtnWrap}>
                <button style={S.submitBtn} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editing ? "💾 Save Changes" : "💾 Add Asset"}
                </button>
                {editing && (
                  <button style={S.deleteBtn} onClick={handleDelete}>🗑 Delete Asset</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
      </div>
    </>
  );
}