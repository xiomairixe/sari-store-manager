import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BULK_UNITS = ["pack","box"];

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${BASE_URL}/uploads/${image}`;
};

const CATEGORIES = [
  "All","Snacks","Beverages","Candies","Cigarettes","Seasonings",
  "Noodles","Canned Goods","Personal Care","Household",
  "School & Office Supplies","General Merchandise","Other",
];

const getSellingPrice = (p) => {
  const cost = parseFloat(p.cost) || 0;
  const markup = parseFloat(p.markup) || 0;
  if (BULK_UNITS.includes(p.unit) && p.pcsPerUnit && parseFloat(p.pcsPerUnit) > 0)
    return Math.ceil((cost / parseFloat(p.pcsPerUnit)) * (1 + markup / 100));
  return Math.ceil(cost * (1 + markup / 100));
};

function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", top:"20px", left:"50%", transform:"translateX(-50%)", zIndex:9999,
      display:"flex", flexDirection:"column", gap:"8px", width:"calc(100% - 40px)", maxWidth:"360px", pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          backgroundColor: t.type==="success"?"#1a1a2e":"#fee2e2",
          borderLeft:`4px solid ${t.type==="success"?"#f97316":"#ef4444"}`,
          borderRadius:"12px", padding:"12px 16px",
          display:"flex", alignItems:"center", gap:"10px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)", animation:"slideDown 0.25s ease",
        }}>
          <span style={{ fontSize:"18px" }}>{t.type==="success"?"✅":"❌"}</span>
          <span style={{ fontSize:"13px", fontWeight:"600", fontFamily:"'DM Sans',sans-serif", color:t.type==="success"?"#fff":"#ef4444" }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [modal, setModal] = useState(null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [cashInput, setCashInput] = useState("");
  const [utangCustomers, setUtangCustomers] = useState([]);
  const [selectedUtangCustomer, setSelectedUtangCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [pickerQty, setPickerQty] = useState(1);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => { fetchProducts(); fetchUtangCustomers(); }, []);
  const fetchProducts = async () => { try { const r = await axios.get(`${BASE_URL}/products`); setProducts(r.data); } catch(e){console.error(e);} };
  const fetchUtangCustomers = async () => { try { const r = await axios.get(`${BASE_URL}/utang/customers`); setUtangCustomers(r.data); } catch(e){console.error(e);} };

  const handleProductTap = (product) => {
    const isBulk = BULK_UNITS.includes(product.unit) && product.pcsPerUnit;
    if (isBulk) {
      setPickerProduct(product);
      setPickerQty(cart[product._id]?.qty ?? 1);
      setModal("qtyPicker");
    } else {
      setCart(prev => {
        const q = (prev[product._id]?.qty ?? 0) + 1;
        if (q > parseInt(product.stock)) return prev;
        return { ...prev, [product._id]: { product, qty: q } };
      });
      showToast(`${product.name} added!`);
    }
  };

  const confirmPicker = () => {
    if (!pickerProduct || pickerQty < 1) return;
    setCart(prev => ({ ...prev, [pickerProduct._id]: { product: pickerProduct, qty: pickerQty } }));
    showToast(`${pickerQty} pc${pickerQty!==1?"s":""} added!`);
    setModal(null); setPickerProduct(null);
  };

  const addWholePack = (packs) => {
    const n = packs * (parseInt(pickerProduct?.pcsPerUnit) || 1);
    if (n <= parseInt(pickerProduct?.stock)) setPickerQty(n);
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const item = prev[id]; if (!item) return prev;
      const q = item.qty + delta;
      if (q <= 0) { const u={...prev}; delete u[id]; return u; }
      if (q > parseInt(item.product.stock)) return prev;
      return { ...prev, [id]: { ...item, qty: q } };
    });
  };

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s,i) => s+i.qty, 0);
  const subtotal  = cartItems.reduce((s,i) => s+getSellingPrice(i.product)*i.qty, 0);
  const cashPaid  = parseFloat(cashInput) || 0;
  const change    = cashPaid - subtotal;
  const confirmDisabled = loading || (paymentMode==="cash" && cashPaid<subtotal) || (paymentMode==="utang" && !selectedUtangCustomer);

  const handleConfirm = async () => {
    if (!cartItems.length) return;
    if (paymentMode==="cash" && cashPaid<subtotal) { showToast("Cash received is not enough.", "error"); return; }
    if (paymentMode==="utang" && !selectedUtangCustomer) { showToast("Please select a customer.", "error"); return; }
    setLoading(true);
    try {
      for (const { product, qty } of cartItems) {
        await axios.post(`${BASE_URL}/sales`, { productId:product._id, productName:product.name, qty, unitPrice:getSellingPrice(product), saleDate:new Date().toISOString() });
      }
      if (paymentMode==="utang" && selectedUtangCustomer) {
        await axios.post(`${BASE_URL}/utang/customers/${selectedUtangCustomer._id}/add`, { amount:subtotal, notes:`Checkout: ${cartItems.map(i=>`${i.product.name} x${i.qty}pcs`).join(", ")}` });
      }
      setSuccessData({ total:subtotal, change:paymentMode==="cash"?change:0, paymentMode, customerName:selectedUtangCustomer?.customerName||null, itemCount:cartCount });
      setModal("success"); setCart({}); setCashInput(""); setSelectedUtangCustomer(null);
      fetchProducts();
    } catch(err) {
      console.error(err); showToast("Checkout failed. Try again.", "error");
    } finally { setLoading(false); }
  };

  const resetCheckout = () => { setModal(null); setSuccessData(null); setPaymentMode("cash"); };
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (activeCategory==="All" || p.category===activeCategory));

  const chip = (active) => ({ flexShrink:0, padding:"6px 16px", borderRadius:"20px", border:"1.5px solid", borderColor:active?"#f97316":"#ddd", backgroundColor:active?"#f97316":"#fff", color:active?"#fff":"#666", fontSize:"13px", fontWeight:active?"600":"400", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" });
  const payBtn = (active) => ({ flex:1, padding:"10px 0", border:`1.5px solid ${active?"#f97316":"#e5e7eb"}`, borderRadius:"10px", backgroundColor:active?"#fff8f0":"#fff", color:active?"#f97316":"#6b7280", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" });

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .modal-sheet { display:flex; flex-direction:column; background:#fff; border-radius:24px 24px 0 0; width:100%; height:88vh; overflow:hidden; }
        .modal-body  { flex:1; overflow-y:auto; padding:24px 20px 8px; -webkit-overflow-scrolling:touch; }
        .modal-footer{ flex-shrink:0; padding:12px 20px; padding-bottom:max(88px,calc(70px + env(safe-area-inset-bottom))); background:#fff; border-top:1px solid #f0f0f0; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Toast toasts={toasts} />

      <div style={{ backgroundColor:"#f5f6fa", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", paddingBottom:"180px" }}>

        {/* Header */}
        <div style={{ padding:"20px 20px 12px", backgroundColor:"#f5f6fa", position:"sticky", top:0, zIndex:10 }}>
          <h1 style={{ fontSize:"24px", fontWeight:"700", color:"#1a1a2e", margin:"0 0 2px" }}>Checkout</h1>
          <div style={{ fontSize:"13px", color:"#9ca3af" }}>Tap products to add to cart</div>
        </div>

        {/* Search */}
        <div style={{ padding:"4px 20px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", backgroundColor:"#eef0f5", borderRadius:"14px", padding:"10px 16px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ border:"none", background:"transparent", outline:"none", fontSize:"14px", color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Categories */}
        <div style={{ display:"flex", gap:"8px", overflowX:"auto", padding:"4px 20px 10px", scrollbarWidth:"none" }}>
          {CATEGORIES.map(cat => <button key={cat} style={chip(activeCategory===cat)} onClick={() => setActiveCategory(cat)}>{cat}</button>)}
        </div>

        {/* Product Grid */}
        <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {filtered.map(product => {
            const sp = getSellingPrice(product);
            const cartItem = cart[product._id];
            const inCart = !!cartItem;
            const outOfStock = parseInt(product.stock) <= 0;
            const isBulk = BULK_UNITS.includes(product.unit) && product.pcsPerUnit;
            return (
              <div key={product._id} style={{ backgroundColor:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:inCart?"0 0 0 2px #f97316":"0 1px 4px rgba(0,0,0,0.07)", position:"relative" }}>
                {getImageUrl(product.image) ? <img src={getImageUrl(product.image)} alt={product.name} style={{ width:"100%", height:"130px", objectFit:"cover", display:"block" }} /> : <div style={{ width:"100%", height:"130px", backgroundColor:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px" }}>📦</div>}
                {inCart && <div style={{ position:"absolute", top:"8px", right:"8px", backgroundColor:"#f97316", color:"#fff", borderRadius:"99px", fontSize:"11px", fontWeight:"700", padding:"2px 7px" }}>{cartItem.qty} pcs</div>}
                <div style={{ padding:"10px 12px 12px" }}>
                  <p style={{ fontSize:"13px", fontWeight:"600", color:"#1a1a2e", margin:"0 0 4px", lineHeight:"1.3", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{product.name}</p>
                  {isBulk && <div style={{ display:"inline-block", backgroundColor:"#eff6ff", color:"#3b82f6", fontSize:"10px", fontWeight:"700", padding:"2px 6px", borderRadius:"6px", marginBottom:"5px" }}>📦 {product.pcsPerUnit} pcs/{product.unit}</div>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                    <span style={{ fontSize:"15px", fontWeight:"700", color:"#f97316" }}>₱{sp}<span style={{ fontSize:"10px", color:"#fb923c" }}>/pc</span></span>
                    <span style={{ fontSize:"11px", color:"#9ca3af" }}>{product.stock} pcs</span>
                  </div>
                  <button style={{ width:"100%", padding:"8px 0", backgroundColor:inCart?"#fff8f0":"#f97316", border:inCart?"1.5px solid #f97316":"none", borderRadius:"10px", color:inCart?"#f97316":"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }} onClick={() => handleProductTap(product)} disabled={outOfStock}>
                    {inCart ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{isBulk?"Change Qty":"Add More"}</> : <>+ Add</>}
                  </button>
                </div>
                {outOfStock && <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"16px" }}><span style={{ backgroundColor:"#fee2e2", color:"#ef4444", fontSize:"12px", fontWeight:"700", padding:"4px 10px", borderRadius:"99px" }}>Out of Stock</span></div>}
              </div>
            );
          })}
        </div>

        {/* Cart Bar */}
        {cartCount > 0 && modal !== "cart" && (
          <div style={{ position:"fixed", bottom:"70px", left:0, right:0, backgroundColor:"#1a1a2e", borderRadius:"20px 20px 0 0", padding:"16px 20px", zIndex:50, boxShadow:"0 -4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)" }}>Total Amount</div>
                <div style={{ fontSize:"22px", fontWeight:"700", color:"#fff" }}>₱{subtotal.toLocaleString("en-PH",{minimumFractionDigits:0})}</div>
              </div>
              <span style={{ backgroundColor:"#f97316", color:"#fff", borderRadius:"99px", padding:"2px 10px", fontSize:"13px", fontWeight:"700" }}>{cartCount} pc{cartCount!==1?"s":""}</span>
            </div>
            <button style={{ width:"100%", padding:"14px", backgroundColor:"#f97316", border:"none", borderRadius:"14px", color:"#fff", fontSize:"15px", fontWeight:"700", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"space-between" }} onClick={() => setModal("cart")}>
              <span>Review &amp; Pay</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        {/* Qty Picker */}
        {modal === "qtyPicker" && pickerProduct && (() => {
          const pcsPerUnit = parseInt(pickerProduct.pcsPerUnit) || 1;
          const maxStock = parseInt(pickerProduct.stock);
          const maxPacks = Math.floor(maxStock / pcsPerUnit);
          const pricePerPc = getSellingPrice(pickerProduct);
          return (
            <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end" }} onClick={e => e.target===e.currentTarget && setModal(null)}>
              <div style={{ backgroundColor:"#fff", borderRadius:"24px 24px 0 0", width:"100%", padding:"24px 20px 40px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                  <div>
                    <h2 style={{ fontSize:"20px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>{pickerProduct.name}</h2>
                    <p style={{ margin:"2px 0 0", fontSize:"12px", color:"#9ca3af" }}>{maxStock} pcs available · ₱{pricePerPc}/pc</p>
                  </div>
                  <button style={{ background:"none", border:"none", fontSize:"22px", color:"#9ca3af", cursor:"pointer" }} onClick={() => setModal(null)}>✕</button>
                </div>
                {maxPacks >= 1 && (
                  <div style={{ marginBottom:"16px" }}>
                    <div style={{ fontSize:"12px", color:"#9ca3af", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase" }}>Quick Add</div>
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      {[1,2,3].filter(n => n<=maxPacks).map(n => (
                        <button key={n} style={{ padding:"10px 16px", borderRadius:"12px", border:"1.5px solid #bfdbfe", backgroundColor:"#eff6ff", color:"#3b82f6", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flex:1, textAlign:"center" }} onClick={() => addWholePack(n)}>
                          📦 {n} {pickerProduct.unit}{n>1?"s":""} = {n*pcsPerUnit} pcs · ₱{(pricePerPc*pcsPerUnit*n).toLocaleString("en-PH",{minimumFractionDigits:0})}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
                  <div style={{ flex:1, height:"1px", backgroundColor:"#e5e7eb" }}/><span style={{ fontSize:"12px", color:"#9ca3af" }}>or choose pieces</span><div style={{ flex:1, height:"1px", backgroundColor:"#e5e7eb" }}/>
                </div>
                <div style={{ textAlign:"center", fontSize:"13px", color:"#9ca3af", marginBottom:"4px" }}>Quantity (pcs)</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"24px", margin:"20px 0 12px" }}>
                  <button style={{ width:"52px", height:"52px", borderRadius:"50%", border:"2px solid #f97316", backgroundColor:"#fff", color:"#f97316", fontSize:"26px", fontWeight:"700", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }} onClick={() => setPickerQty(v => Math.max(1,v-1))}>−</button>
                  <div style={{ fontSize:"56px", fontWeight:"700", color:"#1a1a2e", minWidth:"90px", textAlign:"center" }}>{pickerQty}</div>
                  <button style={{ width:"52px", height:"52px", borderRadius:"50%", border:"2px solid #f97316", backgroundColor:"#fff", color:"#f97316", fontSize:"26px", fontWeight:"700", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }} onClick={() => setPickerQty(v => Math.min(maxStock,v+1))}>+</button>
                </div>
                <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginBottom:"20px" }}>
                  {[1,2,3,5,10].filter(n => n<=maxStock).map(n => (
                    <button key={n} style={{ padding:"6px 14px", borderRadius:"20px", border:`1.5px solid ${pickerQty===n?"#f97316":"#e5e7eb"}`, backgroundColor:pickerQty===n?"#fff8f0":"#fff", color:pickerQty===n?"#f97316":"#6b7280", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={() => setPickerQty(n)}>{n} pc{n!==1?"s":""}</button>
                  ))}
                </div>
                <div style={{ textAlign:"center", fontSize:"20px", fontWeight:"700", color:"#f97316", marginBottom:"16px" }}>₱{(pricePerPc*pickerQty).toLocaleString("en-PH",{minimumFractionDigits:0})} total</div>
                <button style={{ width:"100%", padding:"15px", backgroundColor:"#f97316", border:"none", borderRadius:"14px", color:"#fff", fontSize:"16px", fontWeight:"700", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={confirmPicker}>
                  Add {pickerQty} pc{pickerQty!==1?"s":""} to Cart
                </button>
              </div>
            </div>
          );
        })()}

        {/* Cart Modal — flex column with sticky confirm */}
        {modal === "cart" && (
          <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end" }} onClick={e => e.target===e.currentTarget && setModal(null)}>
            <div className="modal-sheet">

              <div className="modal-body">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                  <h2 style={{ fontSize:"20px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>Your Cart</h2>
                  <button style={{ background:"none", border:"none", fontSize:"22px", color:"#9ca3af", cursor:"pointer" }} onClick={() => setModal(null)}>✕</button>
                </div>

                {cartItems.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:"14px" }}>Cart is empty</div>
                ) : <>
                  {cartItems.map(({ product, qty }) => {
                    const sp = getSellingPrice(product);
                    const isBulk = BULK_UNITS.includes(product.unit) && product.pcsPerUnit;
                    return (
                      <div key={product._id} style={{ display:"flex", gap:"12px", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #f3f4f6" }}>
                        {getImageUrl(product.image) ? <img src={getImageUrl(product.image)} alt={product.name} style={{ width:"52px", height:"52px", borderRadius:"10px", objectFit:"cover", flexShrink:0 }} /> : <div style={{ width:"52px", height:"52px", borderRadius:"10px", backgroundColor:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>📦</div>}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:"14px", fontWeight:"600", color:"#1a1a2e", margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{product.name}</p>
                          <p style={{ fontSize:"11px", color:"#9ca3af", margin:0 }}>₱{sp}/pc{isBulk?` · from ${product.unit}`:""}</p>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <button style={{ width:"28px", height:"28px", borderRadius:"50%", border:"1.5px solid #e5e7eb", backgroundColor:"#fff", cursor:"pointer", fontSize:"16px", fontWeight:"700", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }} onClick={() => updateQty(product._id,-1)}>−</button>
                          <span style={{ fontSize:"15px", fontWeight:"700", color:"#1a1a2e", minWidth:"24px", textAlign:"center" }}>{qty}<span style={{ fontSize:"9px", color:"#9ca3af" }}>pc</span></span>
                          <button style={{ width:"28px", height:"28px", borderRadius:"50%", border:"1.5px solid #e5e7eb", backgroundColor:"#fff", cursor:"pointer", fontSize:"16px", fontWeight:"700", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }} onClick={() => updateQty(product._id,1)}>+</button>
                        </div>
                        <div style={{ fontSize:"15px", fontWeight:"700", color:"#1a1a2e", textAlign:"right", minWidth:"60px" }}>₱{(sp*qty).toLocaleString("en-PH",{minimumFractionDigits:0})}</div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div style={{ backgroundColor:"#f9fafb", borderRadius:"14px", padding:"14px 16px", margin:"16px 0" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"#6b7280", marginBottom:"8px" }}><span>{cartCount} pc{cartCount!==1?"s":""}</span><span>₱{subtotal.toLocaleString("en-PH",{minimumFractionDigits:0})}</span></div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"17px", fontWeight:"700", color:"#1a1a2e", borderTop:"1px solid #e5e7eb", paddingTop:"10px", marginTop:"4px" }}><span>Total</span><span>₱{subtotal.toLocaleString("en-PH",{minimumFractionDigits:0})}</span></div>
                  </div>

                  {/* Payment */}
                  <div style={{ fontSize:"14px", fontWeight:"700", color:"#374151", marginBottom:"10px" }}>Payment Method</div>
                  <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
                    <button style={payBtn(paymentMode==="cash")} onClick={() => setPaymentMode("cash")}>💵 Cash</button>
                    <button style={payBtn(paymentMode==="utang")} onClick={() => setPaymentMode("utang")}>📒 Utang</button>
                    <button style={payBtn(paymentMode==="gcash")} onClick={() => setPaymentMode("gcash")}>📱 GCash</button>
                  </div>

                  {paymentMode === "cash" && <>
                    <label style={{ fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"6px", display:"block" }}>Cash Received (₱)</label>
                    <input style={{ width:"100%", border:"1.5px solid #e5e7eb", borderRadius:"10px", padding:"10px 14px", fontSize:"15px", fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", outline:"none", boxSizing:"border-box", backgroundColor:"#fff", marginBottom:"14px" }} type="number" placeholder="0" value={cashInput} onChange={e => setCashInput(e.target.value)} autoFocus />
                    {cashPaid >= subtotal && (
                      <div style={{ backgroundColor:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:"10px", padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                        <span style={{ fontSize:"13px", color:"#16a34a", fontWeight:"600" }}>Change</span>
                        <span style={{ fontSize:"20px", fontWeight:"700", color:"#16a34a" }}>₱{change.toLocaleString("en-PH",{minimumFractionDigits:0})}</span>
                      </div>
                    )}
                  </>}

                  {paymentMode === "gcash" && <div style={{ backgroundColor:"#eff6ff", borderRadius:"10px", padding:"12px 14px", marginBottom:"14px", fontSize:"13px", color:"#1e40af" }}>📱 GCash payment of <strong>₱{subtotal.toLocaleString("en-PH",{minimumFractionDigits:0})}</strong> — confirm once received.</div>}

                  {paymentMode === "utang" && (
                    <div style={{ marginBottom:"8px" }}>
                      <div style={{ fontSize:"14px", fontWeight:"700", color:"#374151", marginBottom:"10px" }}>Select Customer</div>
                      {utangCustomers.length === 0
                        ? <div style={{ fontSize:"13px", color:"#9ca3af" }}>No customers yet. Add one in the Utang tab.</div>
                        : utangCustomers.map(c => {
                            const balance = parseFloat(c.balance||0), limit = parseFloat(c.creditLimit||1000);
                            const exceed = balance+subtotal>limit;
                            return (
                              <div key={c._id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${selectedUtangCustomer?._id===c._id?"#f97316":"#e5e7eb"}`, backgroundColor:selectedUtangCustomer?._id===c._id?"#fff8f0":"#fff", marginBottom:"8px", cursor:"pointer" }} onClick={() => setSelectedUtangCustomer(c)}>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:"14px", fontWeight:"600", color:"#1a1a2e" }}>{c.customerName}</div>
                                  <div style={{ fontSize:"12px", color:"#9ca3af" }}>Balance: ₱{balance.toFixed(0)} / Limit: ₱{limit.toFixed(0)}{exceed&&<span style={{ color:"#ef4444", marginLeft:"6px" }}>⚠ Exceeds limit</span>}</div>
                                </div>
                                {selectedUtangCustomer?._id===c._id && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>
                            );
                          })
                      }
                    </div>
                  )}
                </>}
              </div>

              {/* ── STICKY CONFIRM BUTTON — always visible ── */}
              {cartItems.length > 0 && (
                <div className="modal-footer">
                  <button style={{ width:"100%", padding:"16px", backgroundColor:confirmDisabled?"#d1d5db":"#f97316", border:"none", borderRadius:"14px", color:"#fff", fontSize:"16px", fontWeight:"700", cursor:confirmDisabled?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={handleConfirm} disabled={confirmDisabled}>
                    {loading ? "Processing..." : `Confirm ${paymentMode==="cash"?"💵 Cash":paymentMode==="gcash"?"📱 GCash":"📒 Utang"} Payment`}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Success */}
        {modal === "success" && successData && (
          <div style={{ position:"fixed", inset:0, backgroundColor:"#fff", zIndex:300, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"50%", backgroundColor:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize:"26px", fontWeight:"700", color:"#1a1a2e", marginBottom:"8px", textAlign:"center" }}>Sale Complete! 🎉</div>
            <div style={{ fontSize:"15px", color:"#9ca3af", marginBottom:"32px", textAlign:"center" }}>{successData.itemCount} pc{successData.itemCount!==1?"s":""} sold · ₱{successData.total.toLocaleString("en-PH",{minimumFractionDigits:0})}</div>
            {successData.paymentMode==="cash" && successData.change>=0 && <div style={{ fontSize:"16px", fontWeight:"600", color:"#16a34a", marginBottom:"32px" }}>💵 Change: ₱{successData.change.toLocaleString("en-PH",{minimumFractionDigits:0})}</div>}
            {successData.paymentMode==="utang" && <div style={{ fontSize:"16px", fontWeight:"600", color:"#16a34a", marginBottom:"32px" }}>📒 Added to {successData.customerName}'s utang</div>}
            {successData.paymentMode==="gcash" && <div style={{ fontSize:"16px", fontWeight:"600", color:"#16a34a", marginBottom:"32px" }}>📱 GCash payment received</div>}
            <button style={{ width:"100%", maxWidth:"320px", padding:"15px", backgroundColor:"#f97316", border:"none", borderRadius:"14px", color:"#fff", fontSize:"16px", fontWeight:"700", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={resetCheckout}>New Sale</button>
          </div>
        )}
      </div>
    </>
  );
}