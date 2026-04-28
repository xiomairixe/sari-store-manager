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

const CATEGORIES = [
  "All","Snacks","Beverages","Candies","Cigarettes","Diaper","Coffee","Seasonings","Sauces",
  "Noodles","Canned Goods","Personal Care","Household",
  "School & Office Supplies","General Merchandise","Other",
];
const UNITS = ["pcs","pack","sachet","can","bottle","box","kg","g","L","ml"];
const BULK_UNITS = ["pack","box"];

const computeSellingPrice = (product) => {
  const cost = parseFloat(product.cost) || 0;
  const markup = parseFloat(product.markup) || 0;
  if (BULK_UNITS.includes(product.unit) && product.pcsPerUnit && parseFloat(product.pcsPerUnit) > 0) {
    return Math.ceil((cost / parseFloat(product.pcsPerUnit)) * (1 + markup / 100));
  }
  return Math.ceil(cost * (1 + markup / 100));
};

function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", top:"20px", left:"50%", transform:"translateX(-50%)", zIndex:9999,
      display:"flex", flexDirection:"column", gap:"8px", width:"calc(100% - 40px)", maxWidth:"360px", pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          backgroundColor: t.type === "success" ? "#1a1a2e" : "#fee2e2",
          borderLeft: `4px solid ${t.type === "success" ? "#f97316" : "#ef4444"}`,
          borderRadius:"12px", padding:"12px 16px",
          display:"flex", alignItems:"center", gap:"10px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)", animation:"slideDown 0.25s ease",
        }}>
          <span style={{ fontSize:"18px" }}>{t.type === "success" ? "✅" : "❌"}</span>
          <span style={{ fontSize:"13px", fontWeight:"600", fontFamily:"'DM Sans',sans-serif",
            color: t.type === "success" ? "#fff" : "#ef4444" }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function PriceHistoryModal({ product, onClose }) {
  const history = [...(product.priceHistory || [])].reverse();
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ backgroundColor:"#fff", borderRadius:"20px", width:"100%",
        maxWidth:"480px", maxHeight:"80vh", overflowY:"auto",
        padding:"24px 20px 32px", fontFamily:"'DM Sans',sans-serif",
        boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
          <div>
            <h2 style={{ fontSize:"18px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>Price History</h2>
            <p style={{ fontSize:"12px", color:"#9ca3af", margin:"2px 0 0" }}>{product.name}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"22px", color:"#9ca3af", cursor:"pointer" }}>✕</button>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign:"center", color:"#9ca3af", padding:"30px 0", fontSize:"14px" }}>Walang price history pa.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {history.map((h, i) => {
              const isLatest = i === 0;
              const date = new Date(h.changedAt);
              const label = date.toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" });
              const time  = date.toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" });
              return (
                <div key={i} style={{ backgroundColor:isLatest?"#fff8f0":"#f9fafb", border:`1.5px solid ${isLatest?"#fed7aa":"#e5e7eb"}`, borderRadius:"14px", padding:"14px 16px", position:"relative" }}>
                  {isLatest && <span style={{ position:"absolute", top:"10px", right:"12px", backgroundColor:"#f97316", color:"#fff", fontSize:"10px", fontWeight:"700", borderRadius:"20px", padding:"2px 8px" }}>KASALUKUYAN</span>}
                  <div style={{ fontSize:"11px", color:"#9ca3af", marginBottom:"8px" }}>📅 {label} · {time}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
                    {[["Cost",`₱${parseFloat(h.cost).toFixed(2)}`],["Markup",`${h.markup}%`],["Selling Price",`₱${h.sellingPrice}`]].map(([k,v]) => (
                      <div key={k} style={{ textAlign:"center", backgroundColor:"#fff", borderRadius:"10px", padding:"8px 4px", border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:"10px", color:"#9ca3af", fontWeight:"500" }}>{k}</div>
                        <div style={{ fontSize:"15px", fontWeight:"700", color:k==="Selling Price"?"#f97316":"#1a1a2e" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {h.note && <div style={{ fontSize:"11px", color:"#6b7280", marginTop:"8px", backgroundColor:"#f3f4f6", borderRadius:"8px", padding:"6px 10px" }}>📝 {h.note}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyForm = {
  image:"", name:"", category:"Snacks", customCategory:"",
  unit:"pcs", pcsPerUnit:"", cost:"", markup:20,
  stock:"", reorder:10, expiry:"", supplier:"",
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [filterEssential, setFilterEssential] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [historyProduct, setHistoryProduct] = useState(null);
  const fileInputRef = useRef();
  const contextRef = useRef();
  const isBulkUnit = BULK_UNITS.includes(form.unit);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const fn = (e) => { if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null); };
    document.addEventListener("mousedown", fn);
    document.addEventListener("touchstart", fn);
    return () => { document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, []);

  const fetchProducts = async () => {
    try { const res = await axios.get(API_URL); setProducts(res.data); }
    catch (err) { console.error(err); }
  };

  const toggleEssential = async (e, product) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`${API_URL}/${product._id}/essential`);
      setProducts(prev => prev.map(p => p._id === product._id ? res.data : p));
      showToast(res.data.isEssential ? `⭐ "${product.name}" marked as essential` : `"${product.name}" removed from essential`);
    } catch { showToast("Failed to update.", "error"); }
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

  const handleImageUrlChange = (e) => {
    handleChange(e);
    const val = e.target.value.trim();
    if (val.startsWith("http")) { setImagePreview(val); setImageFile(null); }
    else if (!val) setImagePreview(null);
  };

  const calcSellingPrice = () => {
    const cost = parseFloat(form.cost) || 0;
    const markup = parseFloat(form.markup) || 0;
    if (isBulkUnit && form.pcsPerUnit && parseFloat(form.pcsPerUnit) > 0) {
      return Math.ceil((cost / parseFloat(form.pcsPerUnit)) * (1 + markup / 100)).toFixed(0);
    }
    return Math.ceil(cost * (1 + markup / 100)).toFixed(0);
  };

  const costPerPc = () => ((parseFloat(form.cost) || 0) / (parseFloat(form.pcsPerUnit) || 1)).toFixed(2);
  const totalRevenue = () => (parseFloat(calcSellingPrice()) * (parseFloat(form.pcsPerUnit) || 1)).toFixed(2);
  const profit = () => (parseFloat(totalRevenue()) - (parseFloat(form.cost) || 0)).toFixed(2);

  const openAdd = () => {
    setForm(emptyForm); setEditId(null); setImagePreview(null); setImageFile(null); setShowModal(true);
  };

  const openEdit = (product) => {
    const isCustom = !CATEGORIES.includes(product.category);
    const isBulkProduct = BULK_UNITS.includes(product.unit);
    const stockInForm = isBulkProduct && product.pcsPerUnit && parseFloat(product.pcsPerUnit) > 0
      ? Math.round(parseFloat(product.stock) / parseFloat(product.pcsPerUnit))
      : product.stock;
    setForm({
      image: product.image || "", name: product.name,
      category: isCustom ? "Other" : product.category,
      customCategory: isCustom ? product.category : "",
      unit: product.unit, pcsPerUnit: product.pcsPerUnit || "",
      cost: product.cost, markup: product.markup,
      stock: stockInForm, reorder: product.reorder || 10,
      expiry: product.expiry ? product.expiry.split("T")[0] : "",
      supplier: product.supplier || "",
    });
    setEditId(product._id);
    setImagePreview(getImageUrl(product.image) || null);
    setImageFile(null);
    setShowModal(true);
    setContextMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cost || !form.stock) { showToast("Please fill all required fields.", "error"); return; }
    if (form.category === "Other" && !form.customCategory?.trim()) { showToast("Please specify the category.", "error"); return; }
    if (isBulkUnit && (!form.pcsPerUnit || parseFloat(form.pcsPerUnit) < 1)) { showToast(`Enter how many pieces per ${form.unit}.`, "error"); return; }
    setSubmitting(true);
    try {
      const submitForm = { ...form };
      if (form.category === "Other" && form.customCategory?.trim()) submitForm.category = form.customCategory.trim();
      delete submitForm.customCategory;
      submitForm.sellingPrice = calcSellingPrice();
      const fd = new FormData();
      if (isBulkUnit) fd.append("stockInPacks", "true");
      Object.entries(submitForm).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (imageFile) fd.append("image", imageFile);
      const headers = { "Content-Type": "multipart/form-data" };
      if (editId) { await axios.put(`${API_URL}/${editId}`, fd, { headers }); showToast(`"${form.name}" updated!`); }
      else { await axios.post(API_URL, fd, { headers }); showToast(`"${form.name}" added to inventory!`); }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409 || err.response?.data?.error === "DUPLICATE") showToast(`"${form.name}" ay mayroon na sa inventory!`, "error");
      else showToast("Something went wrong. Try again.", "error");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await axios.delete(`${API_URL}/${deleteTarget}`); showToast("Product deleted."); fetchProducts(); }
    catch { showToast("Failed to delete.", "error"); }
    finally { setDeleteTarget(null); }
  };

  const handleLongPress = (e, product) => {
    e.preventDefault();
    const touch = e.touches?.[0] || e;
    setContextMenu({ x: touch.clientX, y: touch.clientY, product });
  };

  const filtered = products
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (activeCategory === "All" || p.category === activeCategory) &&
      (!filterEssential || p.isEssential)
    )
    .sort((a, b) => {
      if (a.isEssential !== b.isEssential) return a.isEssential ? -1 : 1;
      const aO = parseInt(a.stock) === 0;
      const bO = parseInt(b.stock) === 0;
      return aO === bO ? 0 : aO ? 1 : -1;
    });

  const outOfStockCount   = products.filter(p => parseInt(p.stock) === 0).length;
  const essentialLowCount = products.filter(p => p.isEssential && parseInt(p.stock) <= (p.reorder || 10)).length;

  const inp   = { width:"100%", border:"1.5px solid #e5e7eb", borderRadius:"10px", padding:"10px 14px", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", outline:"none", boxSizing:"border-box", backgroundColor:"#fff" };
  const inpHL = { ...inp, border:"1.5px solid #f97316", backgroundColor:"#fff8f0" };
  const lbl   = { fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"6px", display:"block" };

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }

        .products-page {
          background-color: #f5f6fa;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── Sticky header ── */
        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 10px;
          background-color: #fff;
          border-bottom: 1px solid #eeeff3;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-shrink: 0;
        }

        /* ── Search + categories bar ── */
        .products-toolbar {
          background: #fff;
          padding: 10px 20px 0;
          position: sticky;
          top: 65px;
          z-index: 9;
          flex-shrink: 0;
        }

        /* ── Product list ── */
        .products-list {
          padding: 14px 20px 100px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        /* ── FAB ── */
        .products-fab {
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

        /* ── Modal overlay ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        /* ── Modal sheet: bottom sheet on mobile, centered dialog on desktop ── */
        .modal-sheet {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 24px 20px 100px;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: transform 0.15s ease;
        }
        .star-btn:active { transform: scale(1.3); }

        /* ── Desktop overrides ── */
        @media (min-width: 768px) {
          .products-header {
            padding: 20px 32px 14px;
            top: 0;
          }
          .products-toolbar {
            padding: 10px 32px 0;
            top: 69px;
          }
          .products-list {
            padding: 16px 32px 40px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            align-items: start;
          }
          .products-fab {
            bottom: 32px;
            right: 32px;
          }
          /* Centered dialog on desktop */
          .modal-overlay {
            align-items: center;
            padding: 24px;
          }
          .modal-sheet {
            border-radius: 20px;
            max-width: 580px;
            max-height: 88vh;
            padding: 28px 28px 40px;
          }
        }

        @media (min-width: 1100px) {
          .products-list {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Toast toasts={toasts} />

      {historyProduct && <PriceHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />}

      <div className="products-page">

        {/* ── Header ── */}
        <div className="products-header">
          <div>
            <h1 style={{ fontSize:"22px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>Inventory</h1>
            <div style={{ display:"flex", gap:"10px", marginTop:"2px", flexWrap:"wrap" }}>
              {outOfStockCount > 0 && <div style={{ fontSize:"12px", color:"#ef4444", fontWeight:"600" }}>⚠ {outOfStockCount} out of stock</div>}
              {essentialLowCount > 0 && <div style={{ fontSize:"12px", color:"#d97706", fontWeight:"600" }}>⭐ {essentialLowCount} essential low</div>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <button onClick={() => setFilterEssential(f => !f)}
              style={{ display:"flex", alignItems:"center", gap:"5px", backgroundColor:filterEssential?"#fef9c3":"#fff", border:`1.5px solid ${filterEssential?"#eab308":"#e5e7eb"}`, borderRadius:"20px", padding:"7px 14px", fontSize:"13px", fontWeight:"600", color:filterEssential?"#a16207":"#374151", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              ⭐ {filterEssential ? "Essential" : "All"}
            </button>
            <button onClick={() => navigate("/suppliers")}
              style={{ display:"flex", alignItems:"center", gap:"6px", backgroundColor:"#fff", border:"1.5px solid #e5e7eb", borderRadius:"20px", padding:"7px 14px", fontSize:"13px", fontWeight:"600", color:"#374151", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              🏪 Suppliers
            </button>
          </div>
        </div>

        {/* ── Search + Categories ── */}
        <div className="products-toolbar">
          <div style={{ display:"flex", alignItems:"center", gap:"10px", backgroundColor:"#eef0f5", borderRadius:"14px", padding:"10px 16px", marginBottom:"10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ border:"none", background:"transparent", outline:"none", fontSize:"14px", color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"10px", scrollbarWidth:"none" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ flexShrink:0, padding:"6px 16px", borderRadius:"20px", border:"1.5px solid", borderColor:activeCategory===cat?"#f97316":"#ddd", backgroundColor:activeCategory===cat?"#f97316":"#fff", color:activeCategory===cat?"#fff":"#666", fontSize:"13px", fontWeight:activeCategory===cat?"600":"400", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Product List ── */}
        <div className="products-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", color:"#9ca3af", padding:"40px 0", fontSize:"14px", gridColumn:"1/-1" }}>
              {filterEssential ? "Walang essential products pa. I-star ang mga important." : "No products found."}
            </div>
          ) : filtered.map(product => {
            const isBulk     = BULK_UNITS.includes(product.unit);
            const missingPcs = isBulk && (!product.pcsPerUnit || parseFloat(product.pcsPerUnit) <= 0);
            const sp         = computeSellingPrice(product);
            const stockPcs   = parseInt(product.stock);
            const outOfStock = stockPcs === 0;
            const isLow      = !outOfStock && stockPcs <= (product.reorder || 10);
            const historyCount = product.priceHistory?.length || 0;
            const essential  = product.isEssential;

            const stockLabel = isBulk && product.pcsPerUnit && parseFloat(product.pcsPerUnit) > 0
              ? `${stockPcs} pcs (${Math.floor(stockPcs / parseFloat(product.pcsPerUnit))} ${product.unit}s)`
              : `${stockPcs} pcs`;

            return (
              <div key={product._id}
                style={{
                  backgroundColor: outOfStock ? "#f9fafb" : "#fff",
                  borderRadius:"16px", padding:"14px",
                  display:"flex", gap:"14px", alignItems:"center",
                  boxShadow: outOfStock ? "none" : essential ? "0 0 0 2px #eab308, 0 1px 4px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.06)",
                  position:"relative", cursor:"pointer",
                  border: outOfStock ? "1.5px solid #e5e7eb" : "1.5px solid transparent",
                  opacity: outOfStock ? 0.75 : 1,
                }}
                onContextMenu={e => { e.preventDefault(); handleLongPress(e, product); }}
                onTouchStart={e => { const t = setTimeout(() => handleLongPress(e, product), 500); e.currentTarget._t = t; }}
                onTouchEnd={e => clearTimeout(e.currentTarget._t)}
              >
                {/* Image */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  {getImageUrl(product.image)
                    ? <img src={getImageUrl(product.image)} alt={product.name}
                        style={{ width:"72px", height:"72px", borderRadius:"12px", objectFit:"cover", filter:outOfStock?"grayscale(60%)":"none" }}
                        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                      />
                    : null}
                  <div style={{ width:"72px", height:"72px", borderRadius:"12px", backgroundColor:outOfStock?"#e5e7eb":"#f0f0f0", display:getImageUrl(product.image)?"none":"flex", alignItems:"center", justifyContent:"center", fontSize:"24px" }}>📦</div>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                    <p style={{ fontSize:"15px", fontWeight:"600", color:outOfStock?"#9ca3af":"#1a1a2e", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>{product.name}</p>
                    <button className="star-btn" onClick={e => toggleEssential(e, product)} title={essential?"Remove from essential":"Mark as essential"}>
                      {essential ? <span style={{ fontSize:"18px" }}>⭐</span> : <span style={{ fontSize:"18px", opacity:0.3 }}>☆</span>}
                    </button>
                  </div>

                  <span style={{ display:"inline-block", backgroundColor:outOfStock?"#f3f4f6":"#f0fdf4", color:outOfStock?"#9ca3af":"#16a34a", fontSize:"11px", fontWeight:"500", padding:"2px 8px", borderRadius:"20px", marginBottom:"6px" }}>{product.category}</span>
                  <p style={{ fontSize:"12px", color:"#9ca3af", margin:0 }}>Cost: ₱{parseFloat(product.cost).toFixed(2)}{isBulk && product.pcsPerUnit ? ` / ${product.unit} (${product.pcsPerUnit} pcs)` : ""}</p>
                  {missingPcs && <p style={{ fontSize:"11px", color:"#ef4444", fontWeight:"600", margin:"3px 0 0" }}>⚠ Edit &amp; re-save to fix price</p>}
                  {historyCount > 0 && (
                    <button onClick={e => { e.stopPropagation(); setHistoryProduct(product); }}
                      style={{ marginTop:"6px", display:"inline-flex", alignItems:"center", gap:"4px", backgroundColor:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:"600", color:"#2563eb", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      📈 {historyCount} price change{historyCount !== 1 ? "s" : ""}
                    </button>
                  )}
                </div>

                {/* Stock badge */}
                <div style={{ position:"absolute", top:"14px", right:"14px", backgroundColor:stockPcs===0?"#fee2e2":isLow?"#fef3c7":"#ecfdf5", color:stockPcs===0?"#ef4444":isLow?"#d97706":"#059669", fontSize:"11px", fontWeight:"700", padding:"3px 8px", borderRadius:"20px", textAlign:"right", maxWidth:"130px" }}>
                  {outOfStock ? "No Stock" : stockLabel}
                </div>

                {!outOfStock && (
                  <div style={{ fontSize:"16px", fontWeight:"700", color:"#f97316", position:"absolute", bottom:"14px", right:"14px", textAlign:"right" }}>
                    ₱{sp}<span style={{ fontSize:"10px", display:"block", color:"#fb923c" }}>/pc</span>
                  </div>
                )}

                {outOfStock && essential && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fef08a", borderRadius:"0 0 14px 14px", padding:"4px 0", textAlign:"center", fontSize:"11px", fontWeight:"700", color:"#a16207" }}>
                    ⭐ ESSENTIAL · RESTOCK AGAD!
                  </div>
                )}
                {outOfStock && !essential && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fee2e2", borderRadius:"0 0 14px 14px", padding:"4px 0", textAlign:"center", fontSize:"11px", fontWeight:"700", color:"#ef4444" }}>
                    OUT OF STOCK · Restock needed
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── FAB ── */}
        <button className="products-fab" onClick={openAdd}>+</button>

        {/* ── Context Menu ── */}
        {contextMenu && (
          <div ref={contextRef} style={{ position:"fixed", backgroundColor:"#fff", borderRadius:"14px", boxShadow:"0 8px 30px rgba(0,0,0,0.15)", padding:"8px", zIndex:300, minWidth:"170px", left:Math.min(contextMenu.x, window.innerWidth-190), top:Math.min(contextMenu.y, window.innerHeight-160) }}>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#1a1a2e", borderRadius:"8px", cursor:"pointer" }} onClick={() => openEdit(contextMenu.product)}>✏️ Edit</button>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#a16207", borderRadius:"8px", cursor:"pointer" }}
              onClick={e => { toggleEssential(e, contextMenu.product); setContextMenu(null); }}>
              {contextMenu.product.isEssential ? "☆ Remove Essential" : "⭐ Mark as Essential"}
            </button>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#2563eb", borderRadius:"8px", cursor:"pointer" }} onClick={() => { setHistoryProduct(contextMenu.product); setContextMenu(null); }}>📈 Price History</button>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#ef4444", borderRadius:"8px", cursor:"pointer" }} onClick={() => { setDeleteTarget(contextMenu.product._id); setContextMenu(null); }}>🗑️ Delete</button>
          </div>
        )}

        {/* ── Delete Confirm ── */}
        {deleteTarget && (
          <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
            <div style={{ backgroundColor:"#fff", borderRadius:"20px", padding:"28px 20px", width:"100%", maxWidth:"320px", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize:"44px", marginBottom:"12px" }}>🗑️</div>
              <div style={{ fontSize:"18px", fontWeight:"700", color:"#1a1a2e", marginBottom:"8px" }}>Delete Product?</div>
              <div style={{ fontSize:"13px", color:"#9ca3af", marginBottom:"24px" }}>This action cannot be undone.</div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setDeleteTarget(null)} style={{ flex:1, padding:"13px", borderRadius:"12px", border:"1.5px solid #e5e7eb", backgroundColor:"#fff", fontSize:"14px", fontWeight:"600", color:"#374151", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
                <button onClick={handleDelete} style={{ flex:1, padding:"13px", borderRadius:"12px", border:"none", backgroundColor:"#ef4444", fontSize:"14px", fontWeight:"700", color:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add/Edit Modal ── */}
        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-sheet">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <h2 style={{ fontSize:"20px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>{editId ? "Edit Product" : "Add New Product"}</h2>
                <button style={{ background:"none", border:"none", fontSize:"22px", color:"#9ca3af", cursor:"pointer" }} onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form id="pform" onSubmit={handleSubmit}>
                {/* Image */}
                <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"18px" }}>
                  <div onClick={() => fileInputRef.current.click()} style={{ width:"70px", height:"70px", borderRadius:"12px", border:"2px dashed #ddd", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", cursor:"pointer", backgroundColor:"#fafafa", flexShrink:0 }}>
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
                      : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    }
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:"600", color:"#374151", marginBottom:"4px" }}>Image</div>
                    <input type="text" name="image" placeholder="I-paste ang image URL dito (https://...)"
                      style={{ ...inp, fontSize:"12px", color:"#374151", marginBottom:"6px" }}
                      value={form.image} onChange={handleImageUrlChange} />
                    <div style={{ fontSize:"11px", color:"#9ca3af" }}>o i-tap ang kahon para mag-upload ng file</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImageChange} />
                </div>

                <div style={{ marginBottom:"14px" }}>
                  <label style={lbl}>Product Name</label>
                  <input style={inp} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Lucky Me Pancit Canton" />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                  <div><label style={lbl}>Category</label>
                    <select style={inp} name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Unit Bought</label>
                    <select style={inp} name="unit" value={form.unit} onChange={handleChange}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {form.category === "Other" && (
                  <div style={{ marginBottom:"14px" }}>
                    <label style={lbl}>Specify Category <span style={{ color:"#ef4444" }}>*</span></label>
                    <input style={inpHL} name="customCategory" value={form.customCategory || ""} onChange={handleChange} placeholder="e.g. Frozen Goods..." autoFocus />
                  </div>
                )}

                {isBulkUnit && (
                  <div style={{ backgroundColor:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:"10px", padding:"10px 14px", fontSize:"12px", color:"#1e40af", marginBottom:"14px", lineHeight:"1.5" }}>
                    💡 You selected <strong>{form.unit}</strong> — selling price computed <strong>per piece</strong>, rounded up to the nearest peso.
                  </div>
                )}

                {isBulkUnit ? (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
                    <div><label style={lbl}>Cost / {form.unit}</label><input style={inp} type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="0.00" step="0.01" /></div>
                    <div><label style={lbl}>Pcs per {form.unit}</label><input style={inpHL} type="number" name="pcsPerUnit" value={form.pcsPerUnit} onChange={handleChange} placeholder="e.g. 10" min="1" /></div>
                    <div><label style={lbl}>Markup %</label><input style={inp} type="number" name="markup" value={form.markup} onChange={handleChange} placeholder="20" /></div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                    <div><label style={lbl}>Cost Price</label><input style={inp} type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="0.00" step="0.01" /></div>
                    <div><label style={lbl}>Markup %</label><input style={inp} type="number" name="markup" value={form.markup} onChange={handleChange} placeholder="20" /></div>
                  </div>
                )}

                {isBulkUnit ? (
                  <div style={{ backgroundColor:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:"12px", padding:"14px", marginBottom:"14px" }}>
                    <div style={{ fontSize:"12px", fontWeight:"700", color:"#16a34a", marginBottom:"10px" }}>🧮 Per-Piece Breakdown</div>
                    {[
                      ["Cost per "+form.unit, "₱"+(parseFloat(form.cost||0).toFixed(2))],
                      ["Pcs per "+form.unit, form.pcsPerUnit||"—"],
                      ["Cost per piece","₱"+(form.pcsPerUnit?costPerPc():"—")],
                      ["Markup", form.markup+"%"],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"#374151", marginBottom:"6px" }}><span>{k}</span><span>{v}</span></div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", fontWeight:"700", color:"#16a34a", borderTop:"1px solid #bbf7d0", paddingTop:"8px", marginTop:"4px" }}>
                      <span>Selling price / pc</span><span>₱{form.pcsPerUnit ? calcSellingPrice() : "—"}</span>
                    </div>
                    {form.pcsPerUnit && <div style={{ marginTop:"8px", fontSize:"12px", color:"#16a34a", textAlign:"right" }}>Revenue: ₱{totalRevenue()} | Profit: ₱{profit()}</div>}
                  </div>
                ) : (
                  <div style={{ backgroundColor:"#fff8f0", border:"1.5px solid #fed7aa", borderRadius:"10px", padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                    <div>
                      <div style={{ fontSize:"12px", color:"#f97316", fontWeight:"600" }}>Selling Price (rounded up)</div>
                      <div style={{ fontSize:"11px", color:"#fb923c", marginTop:"2px" }}>₱{parseFloat(form.cost||0).toFixed(2)} + {form.markup}% markup</div>
                    </div>
                    <div style={{ fontSize:"20px", fontWeight:"700", color:"#f97316" }}>₱{calcSellingPrice()}</div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                  <div>
                    <label style={lbl}>
                      Stock ({isBulkUnit ? `${form.unit}s` : "pcs"})
                      {isBulkUnit && form.pcsPerUnit && (
                        <span style={{ fontSize:"11px", color:"#9ca3af", fontWeight:"400", marginLeft:"4px" }}>
                          = {(parseFloat(form.stock)||0) * (parseFloat(form.pcsPerUnit)||1)} pcs total
                        </span>
                      )}
                    </label>
                    <input style={inp} type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
                  </div>
                  <div><label style={lbl}>Reorder Level</label><input style={inp} type="number" name="reorder" value={form.reorder} onChange={handleChange} /></div>
                </div>

                <div style={{ marginBottom:"14px" }}><label style={lbl}>Expiry Date</label><input style={inp} type="date" name="expiry" value={form.expiry} onChange={handleChange} /></div>
                <div style={{ marginBottom:"20px" }}><label style={lbl}>Supplier</label><input style={inp} name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier name" /></div>

                <button type="submit" disabled={submitting}
                  style={{ width:"100%", backgroundColor:submitting?"#fb923c":"#f97316", color:"#fff", border:"none", borderRadius:"14px", padding:"16px", fontSize:"16px", fontWeight:"700", cursor:submitting?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:submitting?0.8:1 }}>
                  {submitting ? "Saving..." : editId ? "✅ Update Product" : "✅ Add Product"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}