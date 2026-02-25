import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BULK_UNITS = ["pack", "box"];

const getSellingPrice = (p) => {
  if (p.sellingPrice) return parseFloat(p.sellingPrice);
  const cost = parseFloat(p.cost);
  const markup = parseFloat(p.markup) || 0;
  if (BULK_UNITS.includes(p.unit) && p.pcsPerUnit)
    return (cost / parseFloat(p.pcsPerUnit)) * (1 + markup / 100);
  return cost * (1 + markup / 100);
};

const S = {
  page: { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "100px" },
  header: { padding: "20px 20px 10px", backgroundColor: "#f5f6fa", position: "sticky", top: 0, zIndex: 10 },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  subtitle: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  searchWrapper: { padding: "8px 20px" },
  searchBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#eef0f5", borderRadius: "14px", padding: "10px 16px" },
  searchInput: { border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "#333", width: "100%", fontFamily: "'DM Sans', sans-serif" },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" },
  supplierCard: { backgroundColor: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  supplierHeader: { padding: "16px 16px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  supplierLeft: { flex: 1, minWidth: 0 },
  supplierName: { fontSize: "17px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 6px" },
  supplierMeta: { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaBadge: (color, bg) => ({ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600", color, backgroundColor: bg, borderRadius: "20px", padding: "3px 9px" }),
  chevron: (open) => ({ fontSize: "18px", color: "#9ca3af", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: "10px", marginTop: "2px" }),
  notesRow: { padding: "0 16px 12px", display: "flex", alignItems: "center", gap: "8px" },
  notesInput: { flex: 1, border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", outline: "none", backgroundColor: "#fafafa" },
  saveNotesBtn: { padding: "8px 14px", backgroundColor: "#f97316", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
  priceRangeBar: { margin: "0 16px 14px", backgroundColor: "#f9fafb", borderRadius: "12px", padding: "12px 14px" },
  priceRangeTitle: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" },
  priceRangeRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  priceRangeItem: { textAlign: "center" },
  priceRangeLabel: { fontSize: "11px", color: "#9ca3af" },
  priceRangeValue: (color) => ({ fontSize: "16px", fontWeight: "700", color }),
  priceRangeDivider: { width: "1px", height: "30px", backgroundColor: "#e5e7eb" },
  productList: { borderTop: "1px solid #f3f4f6" },
  productRow: (i) => ({ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f3f4f6" }),
  productRank: { fontSize: "12px", fontWeight: "700", color: "#d1d5db", minWidth: "20px", textAlign: "center" },
  productName: { flex: 1, fontSize: "14px", fontWeight: "600", color: "#1a1a2e", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  productCategory: { fontSize: "11px", color: "#9ca3af", marginTop: "1px" },
  productPrices: { textAlign: "right", flexShrink: 0 },
  costPrice: { fontSize: "12px", color: "#9ca3af" },
  sellPrice: { fontSize: "14px", fontWeight: "700", color: "#f97316" },
  stockChip: (qty) => ({ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "20px", backgroundColor: qty === 0 ? "#fee2e2" : qty <= 10 ? "#fef3c7" : "#f0fdf4", color: qty === 0 ? "#ef4444" : qty <= 10 ? "#d97706" : "#16a34a", flexShrink: 0 }),
  emptyText: { textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "14px" },
  noSuppliers: { textAlign: "center", color: "#9ca3af", padding: "60px 20px", fontSize: "14px" },
  compareBar: { backgroundColor: "#1a1a2e", borderRadius: "16px", padding: "14px 16px", margin: "0 0 12px" },
  compareTitle: { fontSize: "13px", fontWeight: "700", color: "#fff", marginBottom: "10px" },
  compareRow: { display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" },
  compareChip: (active) => ({ flexShrink: 0, padding: "6px 14px", borderRadius: "20px", border: `1.5px solid ${active ? "#f97316" : "rgba(255,255,255,0.2)"}`, backgroundColor: active ? "#f97316" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }),
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal: { backgroundColor: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "24px 20px 40px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" },
  compareProductRow: { padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  compareProductName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", marginBottom: "8px" },
  compareSupplierRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  compareSupplierName: { fontSize: "13px", color: "#6b7280" },
  comparePriceBadge: (cheapest) => ({ fontSize: "13px", fontWeight: "700", color: cheapest ? "#16a34a" : "#1a1a2e", backgroundColor: cheapest ? "#f0fdf4" : "transparent", padding: cheapest ? "2px 8px" : "0", borderRadius: "20px" }),
};

export default function Suppliers() {
  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState({});      // { supplierName: "note text" }
  const [expanded, setExpanded] = useState({}); // { supplierName: true/false }
  const [search, setSearch] = useState("");
  const [compareSuppliers, setCompareSuppliers] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    // Load saved notes from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("supplierNotes") || "{}");
      setNotes(saved);
    } catch { }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Group products by supplier ──
  const supplierMap = products.reduce((acc, p) => {
    const name = (p.supplier || "").trim();
    if (!name) return acc;
    if (!acc[name]) acc[name] = [];
    acc[name].push(p);
    return acc;
  }, {});

  const supplierNames = Object.keys(supplierMap).sort();

  const filtered = supplierNames.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Notes ──
  const saveNote = (supplier, text) => {
    const updated = { ...notes, [supplier]: text };
    setNotes(updated);
    localStorage.setItem("supplierNotes", JSON.stringify(updated));
  };

  // ── Toggle expand ──
  const toggle = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  // ── Compare toggle ──
  const toggleCompare = (name) => {
    setCompareSuppliers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // ── Build compare data: products that appear in multiple selected suppliers ──
  const compareData = (() => {
    if (compareSuppliers.length < 2) return [];
    // Find products with same name across suppliers
    const byName = {};
    compareSuppliers.forEach(sup => {
      (supplierMap[sup] || []).forEach(p => {
        const key = p.name.toLowerCase().trim();
        if (!byName[key]) byName[key] = { name: p.name, entries: [] };
        byName[key].entries.push({ supplier: sup, cost: parseFloat(p.cost), product: p });
      });
    });
    return Object.values(byName).filter(d => d.entries.length >= 2);
  })();

  const fmt = (n) => `₱${parseFloat(n || 0).toFixed(2)}`;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.page}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>Suppliers</h1>
          <p style={S.subtitle}>
            {supplierNames.length} supplier{supplierNames.length !== 1 ? "s" : ""} · auto-generated from inventory
          </p>
        </div>

        {/* Search */}
        <div style={S.searchWrapper}>
          <div style={S.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input style={S.searchInput} placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={S.body}>

          {/* Compare Bar */}
          {supplierNames.length >= 2 && (
            <div style={S.compareBar}>
              <div style={S.compareTitle}>📊 Compare Suppliers — tap to select</div>
              <div style={S.compareRow}>
                {supplierNames.map(name => (
                  <button
                    key={name}
                    style={S.compareChip(compareSuppliers.includes(name))}
                    onClick={() => toggleCompare(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {compareSuppliers.length >= 2 && (
                <button
                  onClick={() => setShowCompare(true)}
                  style={{ marginTop: "10px", padding: "8px 16px", backgroundColor: "#f97316", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Compare {compareSuppliers.length} Suppliers →
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div style={S.emptyText}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={S.noSuppliers}>
              {supplierNames.length === 0
                ? "No suppliers found.\nAdd a supplier name when creating products in Inventory."
                : "No suppliers match your search."
              }
            </div>
          ) : (
            filtered.map(name => {
              const prods = supplierMap[name];
              const isOpen = !!expanded[name];
              const costs = prods.map(p => parseFloat(p.cost));
              const cheapest = Math.min(...costs);
              const mostExpensive = Math.max(...costs);
              const cheapestProduct = prods.find(p => parseFloat(p.cost) === cheapest);
              const expensiveProduct = prods.find(p => parseFloat(p.cost) === mostExpensive);
              const sorted = [...prods].sort((a, b) => parseFloat(a.cost) - parseFloat(b.cost));

              return (
                <div key={name} style={S.supplierCard}>

                  {/* Supplier Header */}
                  <div style={S.supplierHeader} onClick={() => toggle(name)}>
                    <div style={S.supplierLeft}>
                      <p style={S.supplierName}>{name}</p>
                      <div style={S.supplierMeta}>
                        <span style={S.metaBadge("#f97316", "#fff7ed")}>
                          📦 {prods.length} product{prods.length !== 1 ? "s" : ""}
                        </span>
                        <span style={S.metaBadge("#16a34a", "#f0fdf4")}>
                          ₱{cheapest.toFixed(2)} – ₱{mostExpensive.toFixed(2)}
                        </span>
                        {notes[name] && (
                          <span style={S.metaBadge("#6b7280", "#f3f4f6")}>📝 has notes</span>
                        )}
                      </div>
                    </div>
                    <div style={S.chevron(isOpen)}>⌄</div>
                  </div>

                  {/* Expanded Content */}
                  {isOpen && (
                    <>
                      {/* Notes */}
                      <div style={S.notesRow}>
                        <input
                          style={S.notesInput}
                          placeholder="Add notes (phone, schedule, etc.)..."
                          value={notes[name] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [name]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          style={S.saveNotesBtn}
                          onClick={e => { e.stopPropagation(); saveNote(name, notes[name] || ""); }}
                        >
                          Save
                        </button>
                      </div>

                      {/* Price Range Summary */}
                      <div style={S.priceRangeBar}>
                        <div style={S.priceRangeTitle}>Price Range</div>
                        <div style={S.priceRangeRow}>
                          <div style={S.priceRangeItem}>
                            <div style={S.priceRangeLabel}>Cheapest</div>
                            <div style={S.priceRangeValue("#16a34a")}>{fmt(cheapest)}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{cheapestProduct?.name}</div>
                          </div>
                          <div style={S.priceRangeDivider} />
                          <div style={S.priceRangeItem}>
                            <div style={S.priceRangeLabel}>Average Cost</div>
                            <div style={S.priceRangeValue("#f97316")}>
                              {fmt(costs.reduce((a, b) => a + b, 0) / costs.length)}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{prods.length} items</div>
                          </div>
                          <div style={S.priceRangeDivider} />
                          <div style={S.priceRangeItem}>
                            <div style={S.priceRangeLabel}>Most Expensive</div>
                            <div style={S.priceRangeValue("#ef4444")}>{fmt(mostExpensive)}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{expensiveProduct?.name}</div>
                          </div>
                        </div>
                      </div>

                      {/* Product List */}
                      <div style={S.productList}>
                        {sorted.map((p, i) => {
                          const sp = getSellingPrice(p);
                          const stock = parseInt(p.stock) || 0;
                          return (
                            <div key={p._id} style={S.productRow(i)}>
                              <div style={S.productRank}>#{i + 1}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={S.productName}>{p.name}</div>
                                <div style={S.productCategory}>{p.category}</div>
                              </div>
                              <div style={S.productPrices}>
                                <div style={S.costPrice}>Cost: {fmt(p.cost)}</div>
                                <div style={S.sellPrice}>Sell: {fmt(sp)}/pc</div>
                              </div>
                              <div style={S.stockChip(stock)}>
                                {stock === 0 ? "No stock" : `${stock} pcs`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Compare Modal ── */}
        {showCompare && (
          <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowCompare(false)}>
            <div style={S.modal}>
              <div style={S.modalHeader}>
                <h2 style={S.modalTitle}>Price Comparison</h2>
                <button style={S.closeBtn} onClick={() => setShowCompare(false)}>✕</button>
              </div>

              <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 16px" }}>
                Comparing: {compareSuppliers.join(" vs ")}
              </p>

              {compareData.length === 0 ? (
                <div style={S.emptyText}>
                  No matching products found between these suppliers.
                  <br />Products need to have the same name to be compared.
                </div>
              ) : (
                compareData.map(({ name, entries }) => {
                  const minCost = Math.min(...entries.map(e => e.cost));
                  return (
                    <div key={name} style={S.compareProductRow}>
                      <div style={S.compareProductName}>{name}</div>
                      {entries
                        .sort((a, b) => a.cost - b.cost)
                        .map(({ supplier, cost }) => (
                          <div key={supplier} style={S.compareSupplierRow}>
                            <span style={S.compareSupplierName}>{supplier}</span>
                            <span style={S.comparePriceBadge(cost === minCost)}>
                              {cost === minCost ? "✓ " : ""}₱{cost.toFixed(2)}
                              {cost === minCost ? " cheapest" : ""}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}