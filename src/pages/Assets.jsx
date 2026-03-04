import React, { useState, useEffect } from "react";

// --- Mock API service (replace with your actual service) ---
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const assetService = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/assets`);
    if (!res.ok) throw new Error("Failed to fetch assets");
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create asset");
    return res.json();
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update asset");
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/assets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete asset");
    return res.json();
  },
};

// --- Category config ---
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "equipment", label: "Equipment" },
  { key: "vehicle", label: "Vehicle" },
  { key: "property", label: "Property" },
  { key: "inventory", label: "Inventory" },
  { key: "other", label: "Other" },
];

const CATEGORY_COLORS = {
  equipment: { bg: "#fff7ed", text: "#ea580c", dot: "#f97316" },
  vehicle:   { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  property:  { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  inventory: { bg: "#fdf4ff", text: "#9333ea", dot: "#a855f7" },
  other:     { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" },
};

const STATUS_CONFIG = {
  active:      { label: "Active",      bg: "#dcfce7", text: "#15803d" },
  maintenance: { label: "Maintenance", bg: "#fef9c3", text: "#a16207" },
  disposed:    { label: "Disposed",    bg: "#fee2e2", text: "#b91c1c" },
};

const EMPTY_FORM = {
  name: "",
  category: "equipment",
  value: "",
  purchaseDate: "",
  status: "active",
  description: "",
};

// --- Icons ---
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BoxIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

// --- Format helpers ---
const formatCurrency = (val) =>
  "₱" + Number(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// =====================
//   MAIN COMPONENT
// =====================
export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // --- Load ---
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getAll();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Toast ---
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Modal ---
  const openAdd = () => {
    setEditingAsset(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (asset) => {
    setEditingAsset(asset);
    setForm({
      name: asset.name || "",
      category: asset.category || "equipment",
      value: asset.value || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      status: asset.status || "active",
      description: asset.description || "",
    });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
    setForm(EMPTY_FORM);
  };

  // --- Save ---
  const handleSave = async () => {
    if (!form.name.trim() || !form.value) {
      showToast("Name and value are required.", "error");
      return;
    }
    try {
      setSaving(true);
      if (editingAsset) {
        const updated = await assetService.update(editingAsset._id, form);
        setAssets((prev) => prev.map((a) => (a._id === editingAsset._id ? updated : a)));
        showToast("Asset updated!");
      } else {
        const created = await assetService.create(form);
        setAssets((prev) => [...prev, created]);
        showToast("Asset added!");
      }
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async (id) => {
    try {
      await assetService.delete(id);
      setAssets((prev) => prev.filter((a) => a._id !== id));
      setDeleteConfirm(null);
      showToast("Asset deleted.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // --- Filter ---
  const filtered = assets.filter((a) => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // --- Summary ---
  const totalValue = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
  const activeCount = assets.filter((a) => a.status === "active").length;
  const maintCount  = assets.filter((a) => a.status === "maintenance").length;

  // ===================
  //   RENDER
  // ===================
  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Assets</h1>
          <p style={S.subtitle}>{assets.length} total assets</p>
        </div>
        <button style={S.addBtn} onClick={openAdd}>
          <PlusIcon />
          <span>Add Asset</span>
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <span style={S.summaryLabel}>Total Value</span>
          <span style={S.summaryValue}>{formatCurrency(totalValue)}</span>
        </div>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #22c55e" }}>
          <span style={S.summaryLabel}>Active</span>
          <span style={{ ...S.summaryValue, color: "#16a34a" }}>{activeCount}</span>
        </div>
        <div style={{ ...S.summaryCard, borderLeft: "3px solid #facc15" }}>
          <span style={S.summaryLabel}>Maintenance</span>
          <span style={{ ...S.summaryValue, color: "#a16207" }}>{maintCount}</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={S.searchWrap}>
        <SearchIcon />
        <input
          style={S.searchInput}
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={S.clearBtn} onClick={() => setSearch("")}>
            <CloseIcon />
          </button>
        )}
      </div>

      {/* ── Category tabs ── */}
      <div style={S.tabs}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            style={{
              ...S.tab,
              ...(activeCategory === c.key ? S.tabActive : {}),
            }}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.emptyText}>Loading assets...</p>
        </div>
      ) : error ? (
        <div style={S.center}>
          <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
          <button style={S.retryBtn} onClick={loadAssets}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.center}>
          <BoxIcon />
          <p style={S.emptyText}>No assets found</p>
          {!search && activeCategory === "all" && (
            <button style={S.addBtn} onClick={openAdd}>
              <PlusIcon /><span>Add your first asset</span>
            </button>
          )}
        </div>
      ) : (
        <div style={S.list}>
          {filtered.map((asset) => {
            const catColor = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.other;
            const statusCfg = STATUS_CONFIG[asset.status] || STATUS_CONFIG.active;
            return (
              <div key={asset._id} style={S.card}>
                {/* Left accent */}
                <div style={{ ...S.cardAccent, backgroundColor: catColor.dot }} />

                <div style={S.cardBody}>
                  {/* Top row */}
                  <div style={S.cardTop}>
                    <div style={S.cardNameRow}>
                      <span style={S.cardName}>{asset.name}</span>
                      <span style={{ ...S.badge, backgroundColor: catColor.bg, color: catColor.text }}>
                        {asset.category}
                      </span>
                    </div>
                    <div style={S.cardActions}>
                      <button style={S.iconBtn} onClick={() => openEdit(asset)} title="Edit">
                        <EditIcon />
                      </button>
                      <button
                        style={{ ...S.iconBtn, color: "#ef4444" }}
                        onClick={() => setDeleteConfirm(asset)}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {asset.description && (
                    <p style={S.cardDesc}>{asset.description}</p>
                  )}

                  {/* Bottom row */}
                  <div style={S.cardBottom}>
                    <span style={S.cardValue}>{formatCurrency(asset.value)}</span>
                    <div style={S.cardMeta}>
                      <span style={{ ...S.statusBadge, backgroundColor: statusCfg.bg, color: statusCfg.text }}>
                        {statusCfg.label}
                      </span>
                      {asset.purchaseDate && (
                        <span style={S.cardDate}>{formatDate(asset.purchaseDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>{editingAsset ? "Edit Asset" : "Add Asset"}</h2>
              <button style={S.closeBtn} onClick={closeModal}><CloseIcon /></button>
            </div>

            <div style={S.modalBody}>
              {/* Name */}
              <div style={S.field}>
                <label style={S.label}>Asset Name *</label>
                <input
                  style={S.input}
                  placeholder="e.g. Delivery Truck"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Category + Status */}
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>Category</label>
                  <select
                    style={S.input}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div style={S.field}>
                  <label style={S.label}>Status</label>
                  <select
                    style={S.input}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Value + Date */}
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>Value (₱) *</label>
                  <input
                    style={S.input}
                    type="number"
                    placeholder="0.00"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Purchase Date</label>
                  <input
                    style={S.input}
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={S.field}>
                <label style={S.label}>Description</label>
                <textarea
                  style={{ ...S.input, height: "72px", resize: "vertical" }}
                  placeholder="Optional notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={closeModal} disabled={saving}>Cancel</button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingAsset ? "Save Changes" : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div style={S.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...S.modal, maxWidth: "320px" }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h2 style={{ ...S.modalTitle, color: "#ef4444" }}>Delete Asset</h2>
              <button style={S.closeBtn} onClick={() => setDeleteConfirm(null)}><CloseIcon /></button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: "14px", color: "#374151" }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                style={{ ...S.saveBtn, backgroundColor: "#ef4444" }}
                onClick={() => handleDelete(deleteConfirm._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          ...S.toast,
          backgroundColor: toast.type === "error" ? "#ef4444" : "#22c55e",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// =====================
//   STYLES
// =====================
const S = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    paddingBottom: "90px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 16px 12px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #f3f4f6",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "2px 0 0",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
  },
  summaryRow: {
    display: "flex",
    gap: "10px",
    padding: "14px 16px 0",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    borderLeft: "3px solid #f97316",
  },
  summaryLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "14px 16px 0",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 14px",
    color: "#9ca3af",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "transparent",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    display: "flex",
    padding: 0,
  },
  tabs: {
    display: "flex",
    gap: "6px",
    padding: "12px 16px 0",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  tab: {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#fff",
    fontSize: "12px",
    fontWeight: "500",
    color: "#6b7280",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabActive: {
    backgroundColor: "#fff7ed",
    color: "#f97316",
    borderColor: "#fed7aa",
    fontWeight: "600",
  },
  list: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    display: "flex",
    overflow: "hidden",
  },
  cardAccent: {
    width: "4px",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    padding: "14px 14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  cardNameRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  cardName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827",
  },
  badge: {
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 8px",
    borderRadius: "20px",
    textTransform: "capitalize",
  },
  cardActions: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: "4px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  cardDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
    lineHeight: "1.4",
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  cardValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#f97316",
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  cardDate: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "60px 16px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: 0,
  },
  retryBtn: {
    padding: "8px 20px",
    backgroundColor: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #fed7aa",
    borderTopColor: "#f97316",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 2000,
    animation: "fadeIn 0.15s ease",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "slideUp 0.25s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 20px 14px",
    borderBottom: "1px solid #f3f4f6",
    position: "sticky",
    top: 0,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    padding: "2px",
  },
  modalBody: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  row2: {
    display: "flex",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    backgroundColor: "#fafafa",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
    padding: "14px 20px 24px",
    borderTop: "1px solid #f3f4f6",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    padding: "12px",
    backgroundColor: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
  },
  toast: {
    position: "fixed",
    bottom: "90px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "24px",
    fontSize: "13px",
    fontWeight: "600",
    zIndex: 3000,
    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
    animation: "fadeIn 0.2s ease",
    whiteSpace: "nowrap",
  },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("assets-style")) {
  const style = document.createElement("style");
  style.id = "assets-style";
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `;
  document.head.appendChild(style);
}