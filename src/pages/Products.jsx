import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/products`;

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${BASE_URL}/uploads/${image}`;
};

const CATEGORIES = ["All", "Snacks", "Beverages","Candies", "Cigarettes", "Seasonings","Noodles", "Canned Goods", "Personal Care", "Household", "School & Office Supplies", "General Merchandise", "Other"];
const UNITS = ["pcs", "pack", "sachet", "can", "bottle", "box", "kg", "g", "L", "ml"];
const BULK_UNITS = ["pack", "box"];

// ── SINGLE SOURCE OF TRUTH: always compute per-piece price from raw fields ──
const computeSellingPrice = (product) => {
  const cost = parseFloat(product.cost) || 0;
  const markup = parseFloat(product.markup) || 0;
  if (BULK_UNITS.includes(product.unit) && product.pcsPerUnit && parseFloat(product.pcsPerUnit) > 0) {
    const costPerPc = cost / parseFloat(product.pcsPerUnit);
    return costPerPc * (1 + markup / 100);
  }
  return cost * (1 + markup / 100);
};

const styles = {
  page: {
    backgroundColor: "#f5f6fa",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: "90px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 20px 10px",
    backgroundColor: "#f5f6fa",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  title: { fontSize: "26px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  historyBtn: {
    width: "42px", height: "42px", borderRadius: "50%",
    backgroundColor: "#fff8f0", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#f97316", fontSize: "20px", boxShadow: "0 2px 8px rgba(249,115,22,0.15)",
  },
  searchWrapper: { padding: "8px 20px" },
  searchBox: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#eef0f5", borderRadius: "14px", padding: "10px 16px",
  },
  searchInput: {
    border: "none", background: "transparent", outline: "none",
    fontSize: "14px", color: "#333", width: "100%", fontFamily: "'DM Sans', sans-serif",
  },
  categoryScroll: {
    display: "flex", gap: "8px", overflowX: "auto",
    padding: "8px 20px", scrollbarWidth: "none",
  },
  categoryChip: (active) => ({
    flexShrink: 0, padding: "6px 16px", borderRadius: "20px",
    border: "1.5px solid", borderColor: active ? "#f97316" : "#ddd",
    backgroundColor: active ? "#f97316" : "#fff",
    color: active ? "#fff" : "#666", fontSize: "13px",
    fontWeight: active ? "600" : "400", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s ease",
  }),
  productList: {
    padding: "8px 20px", display: "flex", flexDirection: "column", gap: "12px",
  },
  productCard: (outOfStock) => ({
    backgroundColor: outOfStock ? "#f9fafb" : "#fff",
    borderRadius: "16px", padding: "14px",
    display: "flex", gap: "14px", alignItems: "center",
    boxShadow: outOfStock ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
    position: "relative", cursor: "pointer",
    border: outOfStock ? "1.5px solid #e5e7eb" : "1.5px solid transparent",
    opacity: outOfStock ? 0.75 : 1,
  }),
  productImage: (outOfStock) => ({
    width: "72px", height: "72px", borderRadius: "12px",
    objectFit: "cover", flexShrink: 0, backgroundColor: "#f0f0f0",
    filter: outOfStock ? "grayscale(60%)" : "none",
  }),
  productImagePlaceholder: (outOfStock) => ({
    width: "72px", height: "72px", borderRadius: "12px",
    backgroundColor: outOfStock ? "#e5e7eb" : "#f0f0f0",
    display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
    color: outOfStock ? "#9ca3af" : "#bbb", fontSize: "24px",
  }),
  productInfo: { flex: 1, minWidth: 0 },
  productName: (outOfStock) => ({
    fontSize: "15px", fontWeight: "600",
    color: outOfStock ? "#9ca3af" : "#1a1a2e",
    margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }),
  categoryBadge: (outOfStock) => ({
    display: "inline-block",
    backgroundColor: outOfStock ? "#f3f4f6" : "#f0fdf4",
    color: outOfStock ? "#9ca3af" : "#16a34a",
    fontSize: "11px", fontWeight: "500", padding: "2px 8px",
    borderRadius: "20px", marginBottom: "6px",
  }),
  costText: { fontSize: "12px", color: "#9ca3af", margin: 0 },
  stockBadge: (qty) => ({
    position: "absolute", top: "14px", right: "14px",
    backgroundColor: qty === 0 ? "#fee2e2" : qty <= 10 ? "#fef3c7" : "#ecfdf5",
    color: qty === 0 ? "#ef4444" : qty <= 10 ? "#d97706" : "#059669",
    fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px",
  }),
  sellingPrice: (outOfStock) => ({
    fontSize: "16px", fontWeight: "700",
    color: outOfStock ? "#9ca3af" : "#f97316",
    position: "absolute", bottom: "14px", right: "14px",
    textAlign: "right",
  }),
  outOfStockStrip: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#fee2e2",
    borderRadius: "0 0 14px 14px",
    padding: "4px 0",
    textAlign: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#ef4444",
    letterSpacing: "0.05em",
  },
  fab: {
    position: "fixed", bottom: "85px", right: "20px",
    width: "52px", height: "52px", borderRadius: "50%",
    backgroundColor: "#f97316", border: "none", color: "#fff",
    fontSize: "26px", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(249,115,22,0.4)", zIndex: 100,
  },
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  modal: {
    backgroundColor: "#fff", borderRadius: "24px 24px 0 0",
    width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "24px 20px 40px",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px",
  },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  closeBtn: {
    background: "none", border: "none", fontSize: "22px",
    color: "#9ca3af", cursor: "pointer", lineHeight: 1,
  },
  imageUploadRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" },
  imagePreviewBox: {
    width: "70px", height: "70px", borderRadius: "12px",
    border: "2px dashed #ddd", display: "flex", alignItems: "center",
    justifyContent: "center", overflow: "hidden", cursor: "pointer",
    backgroundColor: "#fafafa", flexShrink: 0,
  },
  label: {
    fontSize: "13px", fontWeight: "600", color: "#374151",
    marginBottom: "6px", display: "block",
  },
  input: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
    padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff",
  },
  inputHighlight: {
    width: "100%", border: "1.5px solid #f97316", borderRadius: "10px",
    padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e", outline: "none", boxSizing: "border-box", backgroundColor: "#fff8f0",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" },
  fieldGroup: { marginBottom: "14px" },
  sellingPreview: {
    backgroundColor: "#fff8f0", border: "1.5px solid #fed7aa",
    borderRadius: "10px", padding: "12px 14px",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "14px",
  },
  sellingLabel: { fontSize: "12px", color: "#f97316", fontWeight: "600" },
  sellingSubtext: { fontSize: "11px", color: "#fb923c", marginTop: "2px" },
  sellingAmount: { fontSize: "20px", fontWeight: "700", color: "#f97316" },
  bulkPreview: {
    backgroundColor: "#f0fdf4", border: "1.5px solid #86efac",
    borderRadius: "12px", padding: "14px", marginBottom: "14px",
  },
  bulkPreviewTitle: {
    fontSize: "12px", fontWeight: "700", color: "#16a34a",
    marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px",
  },
  bulkRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: "13px", color: "#374151", marginBottom: "6px",
  },
  bulkRowBold: {
    display: "flex", justifyContent: "space-between",
    fontSize: "14px", fontWeight: "700", color: "#16a34a",
    borderTop: "1px solid #bbf7d0", paddingTop: "8px", marginTop: "4px",
  },
  infoBox: {
    backgroundColor: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: "10px", padding: "10px 14px",
    fontSize: "12px", color: "#1e40af",
    marginBottom: "14px", lineHeight: "1.5",
  },
  submitBtn: {
    width: "100%", backgroundColor: "#f97316", color: "#fff",
    border: "none", borderRadius: "12px", padding: "14px",
    fontSize: "15px", fontWeight: "700", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", marginTop: "8px",
  },
  contextMenu: {
    position: "fixed", backgroundColor: "#fff", borderRadius: "14px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: "8px",
    zIndex: 300, minWidth: "160px",
  },
  contextItem: (danger) => ({
    display: "block", width: "100%", padding: "10px 14px",
    border: "none", background: "none", textAlign: "left",
    fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500", color: danger ? "#ef4444" : "#1a1a2e",
    borderRadius: "8px", cursor: "pointer",
  }),
};

const emptyForm = {
  image: "", name: "", category: "Snacks", customCategory: "",
  unit: "pcs", pcsPerUnit: "", cost: "", markup: 25,
  stock: "", reorder: 10, expiry: "", supplier: "",
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const fileInputRef = useRef();
  const contextRef = useRef();

  const isBulkUnit = BULK_UNITS.includes(form.unit);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL);
      setProducts(res.data);
    } catch (err) { console.error("Error fetching products:", err); }
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "unit" && !BULK_UNITS.includes(e.target.value)) updated.pcsPerUnit = "";
    setForm(updated);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Form preview: per-piece selling price ──
  const calcSellingPrice = () => {
    const cost = parseFloat(form.cost) || 0;
    const markup = parseFloat(form.markup) || 0;
    if (isBulkUnit && form.pcsPerUnit && parseFloat(form.pcsPerUnit) > 0) {
      const costPerPc = cost / parseFloat(form.pcsPerUnit);
      return (costPerPc * (1 + markup / 100)).toFixed(2);
    }
    return (cost * (1 + markup / 100)).toFixed(2);
  };

  const costPerPc = () => {
    const cost = parseFloat(form.cost) || 0;
    const pcs = parseFloat(form.pcsPerUnit) || 1;
    return (cost / pcs).toFixed(2);
  };

  const totalRevenue = () => (parseFloat(calcSellingPrice()) * (parseFloat(form.pcsPerUnit) || 1)).toFixed(2);
  const profit = () => (parseFloat(totalRevenue()) - (parseFloat(form.cost) || 0)).toFixed(2);

  const openAdd = () => {
    setForm(emptyForm); setEditId(null);
    setImagePreview(null); setImageFile(null); setShowModal(true);
  };

  const openEdit = (product) => {
    const isCustomCategory = !CATEGORIES.includes(product.category);
    setForm({
      image: product.image || "", name: product.name,
      category: isCustomCategory ? "Other" : product.category,
      customCategory: isCustomCategory ? product.category : "",
      unit: product.unit, pcsPerUnit: product.pcsPerUnit || "",
      cost: product.cost, markup: product.markup, stock: product.stock,
      reorder: product.reorder || 10,
      expiry: product.expiry ? product.expiry.split("T")[0] : "",
      supplier: product.supplier || "",
    });
    setEditId(product._id);
    setImagePreview(getImageUrl(product.image) || null);
    setImageFile(null); setShowModal(true); setContextMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cost || !form.stock) { alert("Please fill all required fields."); return; }
    if (form.category === "Other" && !form.customCategory?.trim()) { alert("Please specify the category."); return; }
    if (isBulkUnit && (!form.pcsPerUnit || parseFloat(form.pcsPerUnit) < 1)) {
      alert(`Please enter how many pieces are in one ${form.unit}.`); return;
    }
    try {
      const submitForm = { ...form };
      if (form.category === "Other" && form.customCategory?.trim()) submitForm.category = form.customCategory.trim();
      delete submitForm.customCategory;
      // ── Save sellingPrice always as per-piece ──
      submitForm.sellingPrice = calcSellingPrice();
      const formData = new FormData();
      Object.entries(submitForm).forEach(([k, v]) => formData.append(k, v ?? ""));
      if (imageFile) formData.append("image", imageFile);
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await axios.post(API_URL, formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setShowModal(false); fetchProducts();
    } catch (err) { console.error("Error saving product:", err); }
  };

  const handleDelete = async (id) => {
    setContextMenu(null);
    if (window.confirm("Delete this product?")) {
      try { await axios.delete(`${API_URL}/${id}`); fetchProducts(); }
      catch (err) { console.error("Error deleting:", err); }
    }
  };

  const handleLongPress = (e, product) => {
    e.preventDefault();
    const touch = e.touches?.[0] || e;
    setContextMenu({ x: touch.clientX, y: touch.clientY, product });
  };

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const aOut = parseInt(a.stock) === 0;
      const bOut = parseInt(b.stock) === 0;
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      return 0;
    });

  const outOfStockCount = products.filter(p => parseInt(p.stock) === 0).length;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Inventory</h1>
            {outOfStockCount > 0 && (
              <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600", marginTop: "2px" }}>
                ⚠ {outOfStockCount} item{outOfStockCount !== 1 ? "s" : ""} out of stock
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => navigate("/suppliers")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                backgroundColor: "#fff", border: "1.5px solid #e5e7eb",
                borderRadius: "20px", padding: "7px 14px",
                fontSize: "13px", fontWeight: "600", color: "#374151",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              🏪 Suppliers
            </button>
            <button style={styles.historyBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchWrapper}>
          <div style={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <button key={cat} style={styles.categoryChip(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div style={styles.productList}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>
              No products found.
            </div>
          ) : (
            filtered.map((product) => {
              const isBulkUnit = BULK_UNITS.includes(product.unit);
              // ── pcsPerUnit missing = stale data, flag it ──
              const missingPcsPerUnit = isBulkUnit && (!product.pcsPerUnit || parseFloat(product.pcsPerUnit) <= 0);
              const isBulk = isBulkUnit && !missingPcsPerUnit;
              // ── Always recompute from raw fields — never trust stored sellingPrice ──
              const sp = computeSellingPrice(product);
              const stock = parseInt(product.stock);
              const outOfStock = stock === 0;

              return (
                <div
                  key={product._id}
                  style={styles.productCard(outOfStock)}
                  onContextMenu={(e) => { e.preventDefault(); handleLongPress(e, product); }}
                  onTouchStart={(e) => {
                    const timer = setTimeout(() => handleLongPress(e, product), 500);
                    e.currentTarget._timer = timer;
                  }}
                  onTouchEnd={(e) => clearTimeout(e.currentTarget._timer)}
                >
                  {getImageUrl(product.image) ? (
                    <img src={getImageUrl(product.image)} alt={product.name} style={styles.productImage(outOfStock)} />
                  ) : (
                    <div style={styles.productImagePlaceholder(outOfStock)}>📦</div>
                  )}

                  <div style={styles.productInfo}>
                    <p style={styles.productName(outOfStock)}>{product.name}</p>
                    <span style={styles.categoryBadge(outOfStock)}>{product.category}</span>
                    <p style={styles.costText}>
                      Cost: ₱{parseFloat(product.cost).toFixed(2)}
                      {isBulk ? ` / ${product.unit} (${product.pcsPerUnit} pcs)` : ""}
                    </p>
                    {missingPcsPerUnit && (
                      <p style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600", margin: "3px 0 0" }}>
                        ⚠ Edit & re-save to fix price
                      </p>
                    )}
                  </div>

                  <div style={styles.stockBadge(stock)}>
                    {outOfStock ? "No Stock" : `${stock} pcs`}
                  </div>

                  {!outOfStock && (
                    <div style={styles.sellingPrice(false)}>
                      ₱{sp.toFixed(2)}
                      <span style={{ fontSize: "10px", display: "block", color: "#fb923c" }}>/pc</span>
                    </div>
                  )}

                  {outOfStock && (
                    <div style={styles.outOfStockStrip}>OUT OF STOCK · Restock needed</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FAB */}
        <button style={styles.fab} onClick={openAdd}>+</button>

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextRef}
            style={{ ...styles.contextMenu, left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 120) }}
          >
            <button style={styles.contextItem(false)} onClick={() => openEdit(contextMenu.product)}>✏️ Edit</button>
            <button style={styles.contextItem(true)} onClick={() => handleDelete(contextMenu.product._id)}>🗑️ Delete</button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{editId ? "Edit Product" : "Add New Product"}</h2>
                <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={styles.imageUploadRow}>
                  <div style={styles.imagePreviewBox} onClick={() => fileInputRef.current.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Image URL</div>
                    <input
                      type="text" name="image"
                      placeholder="https://example.com/image.jpg"
                      style={{ ...styles.input, fontSize: "12px", color: "#9ca3af" }}
                      value={form.image} onChange={handleChange}
                    />
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>or tap box to upload</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Product Name</label>
                  <input style={styles.input} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Lucky Me Pancit Canton" />
                </div>

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Category</label>
                    <select style={styles.input} name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Unit Bought</label>
                    <select style={styles.input} name="unit" value={form.unit} onChange={handleChange}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {form.category === "Other" && (
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Specify Category <span style={{ color: "#ef4444" }}>*</span></label>
                    <input style={styles.inputHighlight} name="customCategory" value={form.customCategory || ""} onChange={handleChange} placeholder="e.g. Frozen Goods, Condiments..." autoFocus />
                  </div>
                )}

                {isBulkUnit && (
                  <div style={styles.infoBox}>
                    💡 You selected <strong>{form.unit}</strong> — selling price will be computed <strong>per piece</strong>. Enter how many pieces are inside one {form.unit}.
                  </div>
                )}

                {isBulkUnit ? (
                  <div style={styles.row3}>
                    <div>
                      <label style={styles.label}>Cost / {form.unit}</label>
                      <input style={styles.input} type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="0.00" step="0.01" />
                    </div>
                    <div>
                      <label style={styles.label}>Pcs per {form.unit}</label>
                      <input style={styles.inputHighlight} type="number" name="pcsPerUnit" value={form.pcsPerUnit} onChange={handleChange} placeholder="e.g. 10" min="1" />
                    </div>
                    <div>
                      <label style={styles.label}>Markup %</label>
                      <input style={styles.input} type="number" name="markup" value={form.markup} onChange={handleChange} placeholder="25" />
                    </div>
                  </div>
                ) : (
                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Cost Price</label>
                      <input style={styles.input} type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="0.00" step="0.01" />
                    </div>
                    <div>
                      <label style={styles.label}>Markup %</label>
                      <input style={styles.input} type="number" name="markup" value={form.markup} onChange={handleChange} placeholder="25" />
                    </div>
                  </div>
                )}

                {isBulkUnit ? (
                  <div style={styles.bulkPreview}>
                    <div style={styles.bulkPreviewTitle}>🧮 Per-Piece Breakdown</div>
                    <div style={styles.bulkRow}><span>Cost per {form.unit}</span><span>₱{parseFloat(form.cost || 0).toFixed(2)}</span></div>
                    <div style={styles.bulkRow}><span>Pcs per {form.unit}</span><span>{form.pcsPerUnit || "—"}</span></div>
                    <div style={styles.bulkRow}><span>Cost per piece</span><span>₱{form.pcsPerUnit ? costPerPc() : "—"}</span></div>
                    <div style={styles.bulkRow}><span>Markup</span><span>{form.markup}%</span></div>
                    <div style={styles.bulkRowBold}><span>Selling price / pc</span><span>₱{form.pcsPerUnit ? calcSellingPrice() : "—"}</span></div>
                    {form.pcsPerUnit && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "#16a34a", textAlign: "right" }}>
                        Total revenue if all sold: ₱{totalRevenue()} &nbsp;|&nbsp; Profit: ₱{profit()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.sellingPreview}>
                    <div>
                      <div style={styles.sellingLabel}>Selling Price (auto-calculated)</div>
                      <div style={styles.sellingSubtext}>₱{parseFloat(form.cost || 0).toFixed(2)} + {form.markup}% markup</div>
                    </div>
                    <div style={styles.sellingAmount}>₱{calcSellingPrice()}</div>
                  </div>
                )}

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>
                      Current Stock{" "}
                      <span style={{ fontWeight: "400", color: "#9ca3af" }}>
                        ({isBulkUnit ? `${form.unit}s` : "pcs"})
                      </span>
                    </label>
                    <input style={styles.input} type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
                  </div>
                  <div>
                    <label style={styles.label}>Reorder Level</label>
                    <input style={styles.input} type="number" name="reorder" value={form.reorder} onChange={handleChange} />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Expiry Date</label>
                  <input style={styles.input} type="date" name="expiry" value={form.expiry} onChange={handleChange} />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Supplier</label>
                  <input style={styles.input} name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier name" />
                </div>

                <button type="submit" style={styles.submitBtn}>{editId ? "Update Product" : "Add Product"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}