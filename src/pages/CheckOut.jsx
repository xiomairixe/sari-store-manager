import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";

const BASE_URL = "http://192.168.1.4:5000";
const BULK_UNITS = ["pack", "box"];

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${BASE_URL}/uploads/${image}`;
};

const CATEGORIES = ["All", "Snacks", "Beverages", "Canned Goods", "Personal Care", "Household", "School & Office Supplies", "General Merchandise", "Other"];

const getSellingPrice = (p) => {
  if (p.sellingPrice) return parseFloat(p.sellingPrice);
  const cost = parseFloat(p.cost);
  const markup = parseFloat(p.markup) || 0;
  if (BULK_UNITS.includes(p.unit) && p.pcsPerUnit) {
    const costPerPc = cost / parseFloat(p.pcsPerUnit);
    return costPerPc * (1 + markup / 100);
  }
  return cost * (1 + markup / 100);
};

const S = {
  page: {
    backgroundColor: "#f5f6fa",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: "180px",
  },
  header: {
    padding: "20px 20px 12px",
    backgroundColor: "#f5f6fa",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" },
  backBtn: {
    width: "36px", height: "36px", borderRadius: "50%",
    backgroundColor: "#fff", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)", flexShrink: 0,
  },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  subtitle: { fontSize: "13px", color: "#9ca3af", marginLeft: "48px", marginTop: "2px" },

  searchWrapper: { padding: "4px 20px 8px" },
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
    padding: "4px 20px 10px", scrollbarWidth: "none",
  },
  categoryChip: (active) => ({
    flexShrink: 0, padding: "6px 16px", borderRadius: "20px",
    border: "1.5px solid", borderColor: active ? "#f97316" : "#ddd",
    backgroundColor: active ? "#f97316" : "#fff",
    color: active ? "#fff" : "#666", fontSize: "13px",
    fontWeight: active ? "600" : "400", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  }),

  // Grid layout matching screenshot
  productGrid: {
    padding: "0 16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  productCard: (inCart) => ({
    backgroundColor: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: inCart ? "0 0 0 2px #f97316" : "0 1px 4px rgba(0,0,0,0.07)",
    position: "relative",
    transition: "box-shadow 0.15s ease",
  }),
  productImg: {
    width: "100%", height: "130px", objectFit: "cover", display: "block",
  },
  productImgPlaceholder: {
    width: "100%", height: "130px", backgroundColor: "#f0f0f0",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "32px",
  },
  productBody: { padding: "10px 12px 12px" },
  productName: {
    fontSize: "13px", fontWeight: "600", color: "#1a1a2e",
    margin: "0 0 6px", lineHeight: "1.3",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  price: { fontSize: "16px", fontWeight: "700", color: "#f97316" },
  stockLabel: { fontSize: "11px", color: "#9ca3af" },

  addBtn: (inCart) => ({
    width: "100%", padding: "8px 0",
    backgroundColor: inCart ? "#fff8f0" : "#f97316",
    border: inCart ? "1.5px solid #f97316" : "none",
    borderRadius: "10px",
    color: inCart ? "#f97316" : "#fff",
    fontSize: "13px", fontWeight: "700",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    transition: "all 0.15s ease",
  }),

  cartBadge: {
    position: "absolute", top: "8px", right: "8px",
    backgroundColor: "#f97316", color: "#fff",
    borderRadius: "99px", fontSize: "11px", fontWeight: "700",
    padding: "2px 7px", minWidth: "20px", textAlign: "center",
  },
  outOfStock: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "16px",
  },
  outOfStockText: {
    backgroundColor: "#fee2e2", color: "#ef4444",
    fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "99px",
  },

  // Cart bottom bar
  cartBar: {
    position: "fixed", bottom: "70px", left: 0, right: 0,
    backgroundColor: "#1a1a2e",
    borderRadius: "20px 20px 0 0",
    padding: "16px 20px",
    zIndex: 50,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
  },
  cartBarRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  cartBarLabel: { fontSize: "13px", color: "rgba(255,255,255,0.6)" },
  cartBarTotal: { fontSize: "22px", fontWeight: "700", color: "#fff" },
  cartBarItems: { fontSize: "13px", color: "rgba(255,255,255,0.6)" },
  viewCartBtn: {
    width: "100%", padding: "14px",
    backgroundColor: "#f97316", border: "none",
    borderRadius: "14px", color: "#fff",
    fontSize: "15px", fontWeight: "700",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },

  // Cart Modal
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  modal: {
    backgroundColor: "#fff", borderRadius: "24px 24px 0 0",
    width: "100%", maxHeight: "90vh", overflowY: "auto",
    padding: "24px 20px 40px",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px",
  },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer" },

  // Cart Items
  cartItem: {
    display: "flex", gap: "12px", alignItems: "center",
    padding: "12px 0", borderBottom: "1px solid #f3f4f6",
  },
  cartItemImg: { width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, backgroundColor: "#f0f0f0" },
  cartItemInfo: { flex: 1, minWidth: 0 },
  cartItemName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartItemPrice: { fontSize: "13px", color: "#9ca3af" },
  qtyControl: { display: "flex", alignItems: "center", gap: "10px" },
  qtyBtn: {
    width: "28px", height: "28px", borderRadius: "50%",
    border: "1.5px solid #e5e7eb", backgroundColor: "#fff",
    cursor: "pointer", fontSize: "16px", fontWeight: "700",
    color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
  },
  qtyNum: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", minWidth: "20px", textAlign: "center" },
  cartItemTotal: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", textAlign: "right", minWidth: "60px" },

  // Summary
  summaryBox: {
    backgroundColor: "#f9fafb", borderRadius: "14px",
    padding: "14px 16px", margin: "16px 0",
  },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" },
  summaryTotal: { display: "flex", justifyContent: "space-between", fontSize: "17px", fontWeight: "700", color: "#1a1a2e", borderTop: "1px solid #e5e7eb", paddingTop: "10px", marginTop: "4px" },

  // Payment
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "10px" },
  paymentOptions: { display: "flex", gap: "8px", marginBottom: "16px" },
  paymentBtn: (active) => ({
    flex: 1, padding: "10px 0",
    border: `1.5px solid ${active ? "#f97316" : "#e5e7eb"}`,
    borderRadius: "10px",
    backgroundColor: active ? "#fff8f0" : "#fff",
    color: active ? "#f97316" : "#6b7280",
    fontSize: "13px", fontWeight: "600",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  }),
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" },
  input: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
    padding: "10px 14px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e", outline: "none", boxSizing: "border-box",
    backgroundColor: "#fff", marginBottom: "14px",
  },
  changeBox: {
    backgroundColor: "#f0fdf4", border: "1.5px solid #86efac",
    borderRadius: "10px", padding: "12px 14px",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "14px",
  },
  changeLabel: { fontSize: "13px", color: "#16a34a", fontWeight: "600" },
  changeAmt: { fontSize: "20px", fontWeight: "700", color: "#16a34a" },
  confirmBtn: (disabled) => ({
    width: "100%", padding: "15px",
    backgroundColor: disabled ? "#d1d5db" : "#f97316",
    border: "none", borderRadius: "14px",
    color: "#fff", fontSize: "16px", fontWeight: "700",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif", marginTop: "4px",
  }),

  // Success screen
  successOverlay: {
    position: "fixed", inset: 0, backgroundColor: "#fff",
    zIndex: 300, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "40px 24px",
    fontFamily: "'DM Sans', sans-serif",
  },
  successIcon: {
    width: "80px", height: "80px", borderRadius: "50%",
    backgroundColor: "#f0fdf4", display: "flex",
    alignItems: "center", justifyContent: "center", marginBottom: "20px",
  },
  successTitle: { fontSize: "26px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px", textAlign: "center" },
  successSub: { fontSize: "15px", color: "#9ca3af", marginBottom: "32px", textAlign: "center" },
  successChange: { fontSize: "16px", fontWeight: "600", color: "#16a34a", marginBottom: "32px" },
  newSaleBtn: {
    width: "100%", maxWidth: "320px", padding: "15px",
    backgroundColor: "#f97316", border: "none", borderRadius: "14px",
    color: "#fff", fontSize: "16px", fontWeight: "700",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },

  emptyCart: { textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "14px" },

  // Utang customer select
  utangSection: { marginBottom: "16px" },
  customerOption: (active) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 14px", borderRadius: "12px",
    border: `1.5px solid ${active ? "#f97316" : "#e5e7eb"}`,
    backgroundColor: active ? "#fff8f0" : "#fff",
    marginBottom: "8px", cursor: "pointer",
  }),
  customerOptionName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e" },
  customerOptionBalance: { fontSize: "12px", color: "#9ca3af" },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState({}); // { productId: { product, qty } }
  const [modal, setModal] = useState(null); // "cart" | "success"
  const [paymentMode, setPaymentMode] = useState("cash"); // "cash" | "utang"
  const [cashInput, setCashInput] = useState("");
  const [utangCustomers, setUtangCustomers] = useState([]);
  const [selectedUtangCustomer, setSelectedUtangCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => { fetchProducts(); fetchUtangCustomers(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUtangCustomers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/utang/customers`);
      setUtangCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  // ── Cart helpers ────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.qty : 0;
      if (currentQty >= product.stock) return prev; // can't exceed stock
      return {
        ...prev,
        [product.id]: { product, qty: currentQty + 1 },
      };
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => {
      const item = prev[productId];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      }
      if (newQty > item.product.stock) return prev;
      return { ...prev, [productId]: { ...item, qty: newQty } };
    });
  };

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + getSellingPrice(i.product) * i.qty, 0);
  const cashPaid = parseFloat(cashInput) || 0;
  const change = cashPaid - subtotal;

  // ── Checkout ────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (cartItems.length === 0) return;
    if (paymentMode === "cash" && cashPaid < subtotal) return;
    if (paymentMode === "utang" && !selectedUtangCustomer) return;

    setLoading(true);
    try {
      // Post each cart item as a sale
      for (const { product, qty } of cartItems) {
        await axios.post(`${BASE_URL}/sales`, {
          productId: product.id,
          productName: product.name,
          qty,
          unitPrice: getSellingPrice(product),
          saleDate: new Date().toISOString(),
        });
      }

      // If utang, add to customer's debt
      if (paymentMode === "utang" && selectedUtangCustomer) {
        await axios.post(`${BASE_URL}/utang/customers/${selectedUtangCustomer.id}/add`, {
          amount: subtotal,
          notes: `Checkout: ${cartItems.map(i => `${i.product.name} x${i.qty}`).join(", ")}`,
        });
      }

      setSuccessData({
        total: subtotal,
        change: paymentMode === "cash" ? change : 0,
        paymentMode,
        customerName: selectedUtangCustomer?.customerName || null,
        itemCount: cartCount,
      });
      setModal("success");
      setCart({});
      setCashInput("");
      setSelectedUtangCustomer(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to complete checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetCheckout = () => {
    setModal(null);
    setSuccessData(null);
    setPaymentMode("cash");
  };

  // ── Filtered products ───────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <h1 style={S.title}>Checkout</h1>
          </div>
          <div style={S.subtitle}>Tap products to add to cart</div>
        </div>

        {/* Search */}
        <div style={S.searchWrapper}>
          <div style={S.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={S.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div style={S.categoryScroll}>
          {CATEGORIES.map(cat => (
            <button key={cat} style={S.categoryChip(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div style={S.productGrid}>
          {filtered.map(product => {
            const sp = getSellingPrice(product);
            const cartItem = cart[product.id];
            const inCart = !!cartItem;
            const outOfStock = product.stock <= 0;
            const isBulk = BULK_UNITS.includes(product.unit);

            return (
              <div key={product.id} style={S.productCard(inCart)}>
                {/* Image */}
                {getImageUrl(product.image) ? (
                  <img src={getImageUrl(product.image)} alt={product.name} style={S.productImg} />
                ) : (
                  <div style={S.productImgPlaceholder}>📦</div>
                )}

                {/* Cart badge */}
                {inCart && <div style={S.cartBadge}>{cartItem.qty}</div>}

                <div style={S.productBody}>
                  <p style={S.productName}>{product.name}</p>
                  <div style={S.priceRow}>
                    <span style={S.price}>₱{sp.toFixed(2)}{isBulk ? <span style={{ fontSize: "10px", color: "#fb923c" }}>/pc</span> : ""}</span>
                    <span style={S.stockLabel}>{product.stock} left</span>
                  </div>
                  <button
                    style={S.addBtn(inCart)}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                  >
                    {inCart ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Add More
                      </>
                    ) : (
                      <>+ Add</>
                    )}
                  </button>
                </div>

                {outOfStock && (
                  <div style={S.outOfStock}>
                    <span style={S.outOfStockText}>Out of Stock</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cart Bottom Bar */}
        {cartCount > 0 && modal !== "cart" && (
          <div style={S.cartBar}>
            <div style={S.cartBarRow}>
              <div>
                <div style={S.cartBarLabel}>Total Amount</div>
                <div style={S.cartBarTotal}>₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ ...S.cartBarItems, textAlign: "right" }}>
                <span style={{ backgroundColor: "#f97316", color: "#fff", borderRadius: "99px", padding: "2px 10px", fontSize: "13px", fontWeight: "700" }}>
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button style={S.viewCartBtn} onClick={() => setModal("cart")}>
              <span>Review & Pay</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Cart & Payment Modal ── */}
        {modal === "cart" && (
          <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={S.modal}>
              <div style={S.modalHeader}>
                <h2 style={S.modalTitle}>Your Cart</h2>
                <button style={S.closeBtn} onClick={() => setModal(null)}>✕</button>
              </div>

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div style={S.emptyCart}>Cart is empty</div>
              ) : (
                <>
                  {cartItems.map(({ product, qty }) => {
                    const sp = getSellingPrice(product);
                    return (
                      <div key={product.id} style={S.cartItem}>
                        {getImageUrl(product.image) ? (
                          <img src={getImageUrl(product.image)} alt={product.name} style={S.cartItemImg} />
                        ) : (
                          <div style={{ ...S.cartItemImg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>📦</div>
                        )}
                        <div style={S.cartItemInfo}>
                          <p style={S.cartItemName}>{product.name}</p>
                          <p style={S.cartItemPrice}>₱{sp.toFixed(2)} each</p>
                        </div>
                        <div style={S.qtyControl}>
                          <button style={S.qtyBtn} onClick={() => updateQty(product.id, -1)}>−</button>
                          <span style={S.qtyNum}>{qty}</span>
                          <button style={S.qtyBtn} onClick={() => updateQty(product.id, 1)}>+</button>
                        </div>
                        <div style={S.cartItemTotal}>
                          ₱{(sp * qty).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div style={S.summaryBox}>
                    <div style={S.summaryRow}>
                      <span>Items ({cartCount})</span>
                      <span>₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={S.summaryTotal}>
                      <span>Total</span>
                      <span>₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div style={S.sectionTitle}>Payment Method</div>
                  <div style={S.paymentOptions}>
                    <button style={S.paymentBtn(paymentMode === "cash")} onClick={() => setPaymentMode("cash")}>
                      💵 Cash
                    </button>
                    <button style={S.paymentBtn(paymentMode === "utang")} onClick={() => setPaymentMode("utang")}>
                      📒 Utang
                    </button>
                    <button style={S.paymentBtn(paymentMode === "gcash")} onClick={() => setPaymentMode("gcash")}>
                      📱 GCash
                    </button>
                  </div>

                  {/* Cash input */}
                  {paymentMode === "cash" && (
                    <>
                      <label style={S.label}>Cash Received (₱)</label>
                      <input
                        style={S.input}
                        type="number"
                        placeholder="0.00"
                        value={cashInput}
                        onChange={e => setCashInput(e.target.value)}
                        autoFocus
                      />
                      {cashPaid >= subtotal && (
                        <div style={S.changeBox}>
                          <span style={S.changeLabel}>Change</span>
                          <span style={S.changeAmt}>₱{change.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* GCash — no extra input needed */}
                  {paymentMode === "gcash" && (
                    <div style={{ backgroundColor: "#eff6ff", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#1e40af" }}>
                      📱 GCash payment of <strong>₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong> — confirm once received.
                    </div>
                  )}

                  {/* Utang — pick customer */}
                  {paymentMode === "utang" && (
                    <div style={S.utangSection}>
                      <div style={S.sectionTitle}>Select Customer</div>
                      {utangCustomers.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "#9ca3af" }}>No customers found. Add one in the Utang tab.</div>
                      ) : (
                        utangCustomers.map(c => {
                          const balance = parseFloat(c.balance || 0);
                          const limit = parseFloat(c.creditLimit || 1000);
                          const wouldExceed = balance + subtotal > limit;
                          return (
                            <div
                              key={c.id}
                              style={S.customerOption(selectedUtangCustomer?.id === c.id)}
                              onClick={() => setSelectedUtangCustomer(c)}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={S.customerOptionName}>{c.customerName}</div>
                                <div style={S.customerOptionBalance}>
                                  Balance: ₱{balance.toFixed(2)} / Limit: ₱{limit.toFixed(2)}
                                  {wouldExceed && <span style={{ color: "#ef4444", marginLeft: "6px" }}>⚠ Exceeds limit</span>}
                                </div>
                              </div>
                              {selectedUtangCustomer?.id === c.id && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Confirm */}
                  <button
                    style={S.confirmBtn(
                      loading ||
                      (paymentMode === "cash" && cashPaid < subtotal) ||
                      (paymentMode === "utang" && !selectedUtangCustomer)
                    )}
                    onClick={handleConfirm}
                    disabled={
                      loading ||
                      (paymentMode === "cash" && cashPaid < subtotal) ||
                      (paymentMode === "utang" && !selectedUtangCustomer)
                    }
                  >
                    {loading ? "Processing..." : `Confirm ${paymentMode === "cash" ? "Cash" : paymentMode === "gcash" ? "GCash" : "Utang"} Payment`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Success Screen ── */}
        {modal === "success" && successData && (
          <div style={S.successOverlay}>
            <div style={S.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={S.successTitle}>Sale Complete! 🎉</div>
            <div style={S.successSub}>
              {successData.itemCount} item{successData.itemCount !== 1 ? "s" : ""} sold · ₱{successData.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
            {successData.paymentMode === "cash" && successData.change >= 0 && (
              <div style={S.successChange}>
                💵 Change: ₱{successData.change.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </div>
            )}
            {successData.paymentMode === "utang" && (
              <div style={S.successChange}>
                📒 Added to {successData.customerName}'s utang
              </div>
            )}
            {successData.paymentMode === "gcash" && (
              <div style={S.successChange}>📱 GCash payment received</div>
            )}
            <button style={S.newSaleBtn} onClick={resetCheckout}>
              New Sale
            </button>
          </div>
        )}
      </div>
    </>
  );
}