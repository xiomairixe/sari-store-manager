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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef();
  const contextRef = useRef();
  const isBulkUnit = BULK_UNITS.includes(form.unit);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
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

  const openAdd = () => { setForm(emptyForm); setEditId(null); setImagePreview(null); setImageFile(null); setShowModal(true); };
  const openEdit = (product) => {
    const isCustom = !CATEGORIES.includes(product.category);
    setForm({
      image: product.image || "", name: product.name,
      category: isCustom ? "Other" : product.category,
      customCategory: isCustom ? product.category : "",
      unit: product.unit, pcsPerUnit: product.pcsPerUnit || "",
      cost: product.cost, markup: product.markup, stock: product.stock,
      reorder: product.reorder || 10,
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
      Object.entries(submitForm).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (imageFile) fd.append("image", imageFile);
      const headers = { "Content-Type": "multipart/form-data" };
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, fd, { headers });
        showToast(`"${form.name}" updated!`);
      } else {
        await axios.post(API_URL, fd, { headers });
        showToast(`"${form.name}" added to inventory!`);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Try again.", "error");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/${deleteTarget}`);
      showToast("Product deleted.");
      fetchProducts();
    } catch { showToast("Failed to delete.", "error"); }
    finally { setDeleteTarget(null); }
  };

  const handleLongPress = (e, product) => {
    e.preventDefault();
    const touch = e.touches?.[0] || e;
    setContextMenu({ x: touch.clientX, y: touch.clientY, product });
  };

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (activeCategory === "All" || p.category === activeCategory))
    .sort((a, b) => { const aO = parseInt(a.stock) === 0; const bO = parseInt(b.stock) === 0; return aO === bO ? 0 : aO ? 1 : -1; });

  const outOfStockCount = products.filter(p => parseInt(p.stock) === 0).length;

  const inp = { width:"100%", border:"1.5px solid #e5e7eb", borderRadius:"10px", padding:"10px 14px", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", outline:"none", boxSizing:"border-box", backgroundColor:"#fff" };
  const inpHL = { ...inp, border:"1.5px solid #f97316", backgroundColor:"#fff8f0" };
  const lbl = { fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"6px", display:"block" };

  // ── Navbar height on most mobile browsers is ~64px ──
  const NAVBAR_H = 64;

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        .modal-sheet {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-height: calc(100vh - ${NAVBAR_H}px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 24px 20px 100px;
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Toast toasts={toasts} />

      <div style={{ backgroundColor:"#f5f6fa", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", paddingBottom:"90px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 20px 10px", backgroundColor:"#f5f6fa", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <h1 style={{ fontSize:"26px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>Inventory</h1>
            {outOfStockCount > 0 && <div style={{ fontSize:"12px", color:"#ef4444", fontWeight:"600", marginTop:"2px" }}>⚠ {outOfStockCount} item{outOfStockCount!==1?"s":""} out of stock</div>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <button onClick={() => navigate("/suppliers")} style={{ display:"flex", alignItems:"center", gap:"6px", backgroundColor:"#fff", border:"1.5px solid #e5e7eb", borderRadius:"20px", padding:"7px 14px", fontSize:"13px", fontWeight:"600", color:"#374151", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>🏪 Suppliers</button>
            <button style={{ width:"42px", height:"42px", borderRadius:"50%", backgroundColor:"#fff8f0", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#f97316", boxShadow:"0 2px 8px rgba(249,115,22,0.15)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding:"8px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", backgroundColor:"#eef0f5", borderRadius:"14px", padding:"10px 16px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ border:"none", background:"transparent", outline:"none", fontSize:"14px", color:"#333", width:"100%", fontFamily:"'DM Sans',sans-serif" }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Categories */}
        <div style={{ display:"flex", gap:"8px", overflowX:"auto", padding:"8px 20px", scrollbarWidth:"none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ flexShrink:0, padding:"6px 16px", borderRadius:"20px", border:"1.5px solid", borderColor:activeCategory===cat?"#f97316":"#ddd", backgroundColor:activeCategory===cat?"#f97316":"#fff", color:activeCategory===cat?"#fff":"#666", fontSize:"13px", fontWeight:activeCategory===cat?"600":"400", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{cat}</button>
          ))}
        </div>

        {/* Product List */}
        <div style={{ padding:"8px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", color:"#9ca3af", padding:"40px 0", fontSize:"14px" }}>No products found.</div>
          ) : filtered.map(product => {
            const isBulk = BULK_UNITS.includes(product.unit);
            const missingPcs = isBulk && (!product.pcsPerUnit || parseFloat(product.pcsPerUnit) <= 0);
            const sp = computeSellingPrice(product);
            const stock = parseInt(product.stock);
            const outOfStock = stock === 0;
            return (
              <div key={product._id}
                style={{ backgroundColor:outOfStock?"#f9fafb":"#fff", borderRadius:"16px", padding:"14px", display:"flex", gap:"14px", alignItems:"center", boxShadow:outOfStock?"none":"0 1px 4px rgba(0,0,0,0.06)", position:"relative", cursor:"pointer", border:outOfStock?"1.5px solid #e5e7eb":"1.5px solid transparent", opacity:outOfStock?0.75:1 }}
                onContextMenu={e => { e.preventDefault(); handleLongPress(e, product); }}
                onTouchStart={e => { const t = setTimeout(() => handleLongPress(e, product), 500); e.currentTarget._t = t; }}
                onTouchEnd={e => clearTimeout(e.currentTarget._t)}
              >
                {getImageUrl(product.image)
                  ? <img src={getImageUrl(product.image)} alt={product.name} style={{ width:"72px", height:"72px", borderRadius:"12px", objectFit:"cover", flexShrink:0, filter:outOfStock?"grayscale(60%)":"none" }} />
                  : <div style={{ width:"72px", height:"72px", borderRadius:"12px", backgroundColor:outOfStock?"#e5e7eb":"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"24px" }}>📦</div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:"15px", fontWeight:"600", color:outOfStock?"#9ca3af":"#1a1a2e", margin:"0 0 4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{product.name}</p>
                  <span style={{ display:"inline-block", backgroundColor:outOfStock?"#f3f4f6":"#f0fdf4", color:outOfStock?"#9ca3af":"#16a34a", fontSize:"11px", fontWeight:"500", padding:"2px 8px", borderRadius:"20px", marginBottom:"6px" }}>{product.category}</span>
                  <p style={{ fontSize:"12px", color:"#9ca3af", margin:0 }}>Cost: ₱{parseFloat(product.cost).toFixed(2)}{isBulk && product.pcsPerUnit ? ` / ${product.unit} (${product.pcsPerUnit} pcs)` : ""}</p>
                  {missingPcs && <p style={{ fontSize:"11px", color:"#ef4444", fontWeight:"600", margin:"3px 0 0" }}>⚠ Edit &amp; re-save to fix price</p>}
                </div>
                <div style={{ position:"absolute", top:"14px", right:"14px", backgroundColor:stock===0?"#fee2e2":stock<=10?"#fef3c7":"#ecfdf5", color:stock===0?"#ef4444":stock<=10?"#d97706":"#059669", fontSize:"11px", fontWeight:"700", padding:"3px 8px", borderRadius:"20px" }}>
                  {outOfStock ? "No Stock" : `${stock} pcs`}
                </div>
                {!outOfStock && (
                  <div style={{ fontSize:"16px", fontWeight:"700", color:"#f97316", position:"absolute", bottom:"14px", right:"14px", textAlign:"right" }}>
                    ₱{sp}<span style={{ fontSize:"10px", display:"block", color:"#fb923c" }}>/pc</span>
                  </div>
                )}
                {outOfStock && <div style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fee2e2", borderRadius:"0 0 14px 14px", padding:"4px 0", textAlign:"center", fontSize:"11px", fontWeight:"700", color:"#ef4444" }}>OUT OF STOCK · Restock needed</div>}
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <button onClick={openAdd} style={{ position:"fixed", bottom:"85px", right:"20px", width:"52px", height:"52px", borderRadius:"50%", backgroundColor:"#f97316", border:"none", color:"#fff", fontSize:"26px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(249,115,22,0.4)", zIndex:100 }}>+</button>

        {/* Context Menu */}
        {contextMenu && (
          <div ref={contextRef} style={{ position:"fixed", backgroundColor:"#fff", borderRadius:"14px", boxShadow:"0 8px 30px rgba(0,0,0,0.15)", padding:"8px", zIndex:300, minWidth:"160px", left:Math.min(contextMenu.x, window.innerWidth-180), top:Math.min(contextMenu.y, window.innerHeight-120) }}>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#1a1a2e", borderRadius:"8px", cursor:"pointer" }} onClick={() => openEdit(contextMenu.product)}>✏️ Edit</button>
            <button style={{ display:"block", width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:"500", color:"#ef4444", borderRadius:"8px", cursor:"pointer" }} onClick={() => { setDeleteTarget(contextMenu.product._id); setContextMenu(null); }}>🗑️ Delete</button>
          </div>
        )}

        {/* Delete Confirm */}
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

        {/* Add/Edit Modal */}
        {showModal && (
          <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"flex-end" }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-sheet">

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                  <h2 style={{ fontSize:"20px", fontWeight:"700", color:"#1a1a2e", margin:0 }}>{editId ? "Edit Product" : "Add New Product"}</h2>
                  <button style={{ background:"none", border:"none", fontSize:"22px", color:"#9ca3af", cursor:"pointer" }} onClick={() => setShowModal(false)}>✕</button>
                </div>

                <form id="pform" onSubmit={handleSubmit}>
                  {/* Image */}
                  <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"18px" }}>
                    <div onClick={() => fileInputRef.current.click()} style={{ width:"70px", height:"70px", borderRadius:"12px", border:"2px dashed #ddd", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", cursor:"pointer", backgroundColor:"#fafafa", flexShrink:0 }}>
                      {imagePreview ? <img src={imagePreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:"600", color:"#374151", marginBottom:"4px" }}>Image URL</div>
                      <input type="text" name="image" placeholder="https://..." style={{ ...inp, fontSize:"12px", color:"#9ca3af" }} value={form.image} onChange={handleChange} />
                      <div style={{ fontSize:"11px", color:"#9ca3af", marginTop:"4px" }}>or tap box to upload</div>
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
                    <div><label style={lbl}>Stock ({isBulkUnit?form.unit+"s":"pcs"})</label><input style={inp} type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" /></div>
                    <div><label style={lbl}>Reorder Level</label><input style={inp} type="number" name="reorder" value={form.reorder} onChange={handleChange} /></div>
                  </div>

                  <div style={{ marginBottom:"14px" }}><label style={lbl}>Expiry Date</label><input style={inp} type="date" name="expiry" value={form.expiry} onChange={handleChange} /></div>
                  <div style={{ marginBottom:"8px" }}><label style={lbl}>Supplier</label><input style={inp} name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier name" /></div>

                  {/* ── SUBMIT BUTTON inside form — scrolls into view, never hidden ── */}
                  <button type="submit" disabled={submitting}
                    style={{ width:"100%", backgroundColor:submitting?"#fb923c":"#f97316", color:"#fff", border:"none", borderRadius:"14px", padding:"16px", fontSize:"16px", fontWeight:"700", cursor:submitting?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:submitting?0.8:1, marginTop:"8px", marginBottom:"32px" }}>
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