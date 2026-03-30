import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Palette for note card colors ──
const COLORS = [
  { bg: "#fff8f0", accent: "#f97316", label: "Orange" },
  { bg: "#f0fdf4", accent: "#16a34a", label: "Green" },
  { bg: "#eff6ff", accent: "#3b82f6", label: "Blue" },
  { bg: "#fdf4ff", accent: "#a855f7", label: "Purple" },
  { bg: "#fff1f2", accent: "#ef4444", label: "Red" },
  { bg: "#fefce8", accent: "#ca8a04", label: "Yellow" },
  { bg: "#f0fdfa", accent: "#0d9488", label: "Teal" },
  { bg: "#f8fafc", accent: "#64748b", label: "Gray" },
];

const getAccent = (bg) => COLORS.find((c) => c.bg === bg)?.accent || "#f97316";

const S = {
  page: {
    backgroundColor: "#f5f6fa",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: "100px",
  },
  header: {
    padding: "20px 20px 10px",
    backgroundColor: "#f5f6fa",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  subtitle: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" },
  fab: {
    position: "fixed",
    bottom: "85px",
    right: "20px",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#f97316",
    border: "none",
    color: "#fff",
    fontSize: "26px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
    zIndex: 100,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "24px 24px 0 0",
    width: "100%",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalScroll: {
    padding: "24px 20px 8px",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },
  modalFooter: {
    padding: "12px 20px 90px",
    backgroundColor: "#fff",
    borderTop: "1px solid #f3f4f6",
    flexShrink: 0,
    display: "flex",
    gap: "10px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "22px",
    color: "#9ca3af",
    cursor: "pointer",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    marginBottom: "14px",
  },
  primaryBtn: (accent) => ({
    flex: 1,
    backgroundColor: accent || "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  }),
  ghostBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  dangerBtn: {
    flex: 1,
    backgroundColor: "#fff1f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    padding: "40px 0",
    fontSize: "13px",
  },
};

// ── Exportable card (rendered off-screen for html2canvas) ──
function ExportCard({ note }) {
  const accent = getAccent(note.color);
  const unchecked = note.items.filter((i) => !i.checked);
  const checked = note.items.filter((i) => i.checked);

  return (
    <div
      style={{
        width: "360px",
        backgroundColor: note.color,
        borderRadius: "18px",
        padding: "22px 20px 20px",
        fontFamily: "'DM Sans', sans-serif",
        border: `2px solid ${accent}22`,
      }}
    >
      <div
        style={{
          fontSize: "17px",
          fontWeight: "700",
          color: "#1a1a2e",
          marginBottom: "4px",
        }}
      >
        {note.title}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          marginBottom: "16px",
        }}
      >
        {new Date(note.updatedAt).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      {unchecked.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "7px 0",
            borderBottom: "1px solid #0000000a",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              border: `2px solid ${accent}`,
              flexShrink: 0,
              marginTop: "1px",
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "14px", color: "#1a1a2e", fontWeight: "500" }}>
              {item.text}
            </span>
            {item.qty && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: accent,
                  fontWeight: "700",
                }}
              >
                × {item.qty}
              </span>
            )}
          </div>
        </div>
      ))}

      {checked.length > 0 && (
        <>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "12px 0 6px",
            }}
          >
            Done
          </div>
          {checked.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "7px 0",
                borderBottom: "1px solid #0000000a",
                opacity: 0.45,
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "5px",
                  backgroundColor: accent,
                  border: `2px solid ${accent}`,
                  flexShrink: 0,
                  marginTop: "1px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "11px",
                }}
              >
                ✓
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  textDecoration: "line-through",
                }}
              >
                {item.text}
                {item.qty && ` × ${item.qty}`}
              </span>
            </div>
          ))}
        </>
      )}

      <div
        style={{
          marginTop: "14px",
          fontSize: "11px",
          color: "#9ca3af",
          textAlign: "right",
        }}
      >
        {unchecked.length} item{unchecked.length !== 1 ? "s" : ""} to buy
      </div>
    </div>
  );
}

// ── Single note card ──
function NoteCard({ note, onOpen }) {
  const accent = getAccent(note.color);
  const unchecked = note.items.filter((i) => !i.checked);
  const checked = note.items.filter((i) => i.checked);
  const preview = unchecked.slice(0, 4);

  return (
    <div
      onClick={onOpen}
      style={{
        backgroundColor: note.color,
        borderRadius: "16px",
        padding: "16px",
        border: `1.5px solid ${accent}22`,
        cursor: "pointer",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        active: { transform: "scale(0.98)" },
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10px",
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>
          {note.title}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 10px",
            borderRadius: "99px",
            backgroundColor: `${accent}18`,
            color: accent,
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          {unchecked.length} left
        </div>
      </div>

      {preview.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "4px",
              border: `2px solid ${accent}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "#374151", flex: 1 }}>
            {item.text}
          </span>
          {item.qty && (
            <span style={{ fontSize: "11px", color: accent, fontWeight: "700" }}>
              × {item.qty}
            </span>
          )}
        </div>
      ))}

      {unchecked.length > 4 && (
        <div
          style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", paddingLeft: "22px" }}
        >
          +{unchecked.length - 4} more items…
        </div>
      )}

      {checked.length > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: `1px solid ${accent}18`,
          }}
        >
          ✓ {checked.length} done
        </div>
      )}

      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          marginTop: "8px",
        }}
      >
        {new Date(note.updatedAt).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        })}
      </div>
    </div>
  );
}

// ── Item row inside editor ──
function ItemRow({ item, accent, onChange, onDelete, onKeyDown, inputRef }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => onChange({ ...item, checked: !item.checked })}
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          border: item.checked ? "none" : `2px solid ${accent}`,
          backgroundColor: item.checked ? accent : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: "13px",
          transition: "all 0.15s",
        }}
      >
        {item.checked && "✓"}
      </div>

      {/* Item text */}
      <input
        ref={inputRef}
        value={item.text}
        onChange={(e) => onChange({ ...item, text: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="Item name…"
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: "14px",
          fontFamily: "'DM Sans', sans-serif",
          color: item.checked ? "#9ca3af" : "#1a1a2e",
          textDecoration: item.checked ? "line-through" : "none",
          backgroundColor: "transparent",
        }}
      />

      {/* Qty */}
      <input
        value={item.qty}
        onChange={(e) => onChange({ ...item, qty: e.target.value })}
        placeholder="qty"
        style={{
          width: "48px",
          border: "1.5px solid #e5e7eb",
          borderRadius: "8px",
          padding: "4px 6px",
          fontSize: "12px",
          fontFamily: "'DM Sans', sans-serif",
          color: accent,
          fontWeight: "700",
          outline: "none",
          textAlign: "center",
          backgroundColor: `${accent}10`,
        }}
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          background: "none",
          border: "none",
          color: "#d1d5db",
          fontSize: "18px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0 2px",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Export helpers ──
const exportAsText = (note) => {
  const lines = [`📋 ${note.title}`, `Date: ${new Date(note.updatedAt).toLocaleDateString("en-PH")}`, ""];
  const unchecked = note.items.filter((i) => !i.checked);
  const checked = note.items.filter((i) => i.checked);

  if (unchecked.length > 0) {
    lines.push("TO BUY:");
    unchecked.forEach((i) => {
      lines.push(`☐ ${i.text}${i.qty ? `  × ${i.qty}` : ""}`);
    });
  }
  if (checked.length > 0) {
    lines.push("", "DONE:");
    checked.forEach((i) => {
      lines.push(`✓ ${i.text}${i.qty ? `  × ${i.qty}` : ""}`);
    });
  }
  lines.push("", `${unchecked.length} item${unchecked.length !== 1 ? "s" : ""} to buy`);
  return lines.join("\n");
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older mobile browsers
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
};

// ── Main component ──
export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNote, setOpenNote] = useState(null); // note being edited
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [exportingImg, setExportingImg] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const exportRef = useRef(null);
  const newItemRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (note) => {
    setOpenNote(JSON.parse(JSON.stringify(note))); // deep copy
    setIsNew(false);
    setConfirmDelete(false);
  };

  const handleNew = () => {
    setOpenNote({
      title: "Shopping List",
      items: [],
      color: "#fff8f0",
    });
    setIsNew(true);
    setConfirmDelete(false);
  };

  const handleClose = () => {
    setOpenNote(null);
    setConfirmDelete(false);
  };

  const handleSave = async () => {
    if (!openNote) return;
    setSaving(true);
    try {
      if (isNew) {
        const res = await axios.post(`${BASE_URL}/notes`, openNote);
        setNotes((prev) => [res.data, ...prev]);
        setOpenNote(res.data);
        setIsNew(false);
        showToast("✅ Note saved!");
      } else {
        const res = await axios.put(`${BASE_URL}/notes/${openNote._id}`, openNote);
        setNotes((prev) => prev.map((n) => (n._id === res.data._id ? res.data : n)));
        setOpenNote(res.data);
        showToast("✅ Saved!");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!openNote || isNew) return;
    try {
      await axios.delete(`${BASE_URL}/notes/${openNote._id}`);
      setNotes((prev) => prev.filter((n) => n._id !== openNote._id));
      handleClose();
      showToast("🗑️ Deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    setOpenNote((prev) => ({
      ...prev,
      items: [...prev.items, { text: "", checked: false, qty: "" }],
    }));
    // Focus new input after render
    setTimeout(() => newItemRef.current?.focus(), 50);
  };

  const updateItem = (index, updated) => {
    setOpenNote((prev) => {
      const items = [...prev.items];
      items[index] = updated;
      return { ...prev, items };
    });
  };

  const deleteItem = (index) => {
    setOpenNote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Export as text (copy to clipboard)
  const handleCopyText = async () => {
    if (!openNote) return;
    const text = exportAsText(openNote);
    const ok = await copyToClipboard(text);
    showToast(ok ? "📋 Copied to clipboard!" : "❌ Copy failed");
  };

  // Export as image using html2canvas
  const handleExportImage = async () => {
    if (!openNote || exportingImg) return;
    setExportingImg(true);
    try {
      // Dynamically load html2canvas from CDN if not present
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const el = exportRef.current;
      if (!el) return;

      const canvas = await window.html2canvas(el, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      // On mobile, open image in new tab (user can long-press save)
      // On desktop, download directly
      const dataUrl = canvas.toDataURL("image/png");
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const win = window.open();
        if (win) {
          win.document.write(
            `<html><body style="margin:0;background:#f5f6fa;display:flex;justify-content:center;padding:20px">` +
            `<img src="${dataUrl}" style="max-width:100%;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15)" />` +
            `<p style="position:fixed;bottom:20px;left:0;right:0;text-align:center;font-family:sans-serif;color:#666;font-size:14px">Long press image → Save to Photos</p>` +
            `</body></html>`
          );
        } else {
          // If popup blocked, fallback to download
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${openNote.title || "list"}.png`;
          a.click();
        }
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${openNote.title || "list"}.png`;
        a.click();
      }

      showToast("🖼️ Image exported!");
    } catch (err) {
      console.error(err);
      showToast("❌ Export failed");
    } finally {
      setExportingImg(false);
    }
  };

  const accent = openNote ? getAccent(openNote.color) : "#f97316";
  const uncheckedCount = openNote ? openNote.items.filter((i) => !i.checked).length : 0;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Hidden export card */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
        <div ref={exportRef}>
          {openNote && <ExportCard note={openNote} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1a1a2e",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "99px",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "'DM Sans', sans-serif",
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerRow}>
            <div>
              <h1 style={S.title}>Shopping Notes</h1>
              <div style={S.subtitle}>{notes.length} list{notes.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>

        <div style={S.body}>
          {loading ? (
            <div style={S.emptyText}>Loading…</div>
          ) : notes.length === 0 ? (
            <div style={{ ...S.emptyText, paddingTop: "60px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛒</div>
              <div style={{ fontSize: "15px", color: "#6b7280", fontWeight: "600" }}>
                No lists yet
              </div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
                Tap + to create your first shopping list
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard key={note._id} note={note} onOpen={() => handleOpen(note)} />
            ))
          )}
        </div>

        <button style={S.fab} onClick={handleNew}>+</button>

        {/* ── Note Editor Modal ── */}
        {openNote && (
          <div
            style={S.overlay}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <div style={{ ...S.modal, backgroundColor: openNote.color }}>
              <div style={S.modalScroll}>
                {/* Header */}
                <div style={S.modalHeader}>
                  <input
                    value={openNote.title}
                    onChange={(e) =>
                      setOpenNote((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="List title…"
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1a1a2e",
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      fontFamily: "'DM Sans', sans-serif",
                      flex: 1,
                    }}
                  />
                  <button style={S.closeBtn} onClick={handleClose}>✕</button>
                </div>

                {/* Color picker */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  {COLORS.map((c) => (
                    <div
                      key={c.bg}
                      onClick={() => setOpenNote((p) => ({ ...p, color: c.bg }))}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: c.bg,
                        border: `2.5px solid ${openNote.color === c.bg ? c.accent : "#e5e7eb"}`,
                        cursor: "pointer",
                        boxShadow: openNote.color === c.bg ? `0 0 0 2px ${c.accent}44` : "none",
                        transition: "all 0.1s",
                      }}
                    />
                  ))}
                </div>

                {/* Stats bar */}
                {openNote.items.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: `${accent}15`,
                        borderRadius: "10px",
                        padding: "8px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: accent,
                        }}
                      >
                        {uncheckedCount}
                      </div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600" }}>
                        TO BUY
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: "#f0fdf4",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#16a34a",
                        }}
                      >
                        {openNote.items.length - uncheckedCount}
                      </div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600" }}>
                        DONE
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                {openNote.items.map((item, i) => (
                  <ItemRow
                    key={i}
                    item={item}
                    accent={accent}
                    onChange={(updated) => updateItem(i, updated)}
                    onDelete={() => deleteItem(i)}
                    inputRef={i === openNote.items.length - 1 ? newItemRef : null}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                  />
                ))}

                {/* Add item button */}
                <button
                  onClick={addItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: `1.5px dashed ${accent}66`,
                    borderRadius: "10px",
                    padding: "10px 14px",
                    width: "100%",
                    marginTop: "12px",
                    color: accent,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Add item
                </button>

                {/* Export row */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  <button
                    onClick={handleCopyText}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      backgroundColor: "#fff",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    📋 Copy Text
                  </button>
                  <button
                    onClick={handleExportImage}
                    disabled={exportingImg}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      backgroundColor: "#fff",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: exportingImg ? 0.6 : 1,
                    }}
                  >
                    {exportingImg ? "⏳ Exporting…" : "🖼️ Save Image"}
                  </button>
                </div>

                {/* Delete confirm */}
                {!isNew && (
                  <div style={{ marginTop: "12px" }}>
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        style={{
                          width: "100%",
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          padding: "8px 0",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        🗑️ Delete this list
                      </button>
                    ) : (
                      <div
                        style={{
                          backgroundColor: "#fff1f2",
                          borderRadius: "12px",
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#ef4444",
                            marginBottom: "10px",
                          }}
                        >
                          Delete "{openNote.title}"?
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            style={{ ...S.ghostBtn, flex: 1, padding: "10px" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDelete}
                            style={{ ...S.dangerBtn, flex: 1, padding: "10px" }}
                          >
                            Yes, delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Save */}
              <div style={S.modalFooter}>
                <button style={S.ghostBtn} onClick={handleClose}>
                  Cancel
                </button>
                <button
                  style={S.primaryBtn(accent)}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : isNew ? "💾 Create List" : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}