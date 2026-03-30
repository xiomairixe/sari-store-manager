import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Costs from "./pages/Costs";
import Utang from "./pages/Utang";
import Checkout from "./pages/CheckOut";
import Suppliers from "./pages/Suppliers";
import Navbar from "./layout/Navbar";
import Assets from "./pages/Assets";
import Notes from "./pages/Notes";
import React, { useState } from "react";

function App() {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/utang" element={<Utang />} />
        <Route path="/Assets" element={<Assets />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/suppliers" element={<Suppliers />} />
      </Routes>

      {/* ── Floating Notes Button (above navbar, left side) ── */}
      <button
        onClick={() => setNotesOpen(true)}
        style={{
          position: "fixed",
          bottom: "88px",
          left: "20px",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          backgroundColor: "#1a1a2e",
          border: "none",
          color: "#fff",
          fontSize: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          zIndex: 999,
          transition: "transform 0.15s ease",
        }}
        title="Shopping Notes"
      >
        🛒
      </button>

      {/* ── Notes Slide-up Panel ── */}
      {notesOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1100,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={(e) => e.target === e.currentTarget && setNotesOpen(false)}
        >
          <div
            style={{
              width: "100%",
              height: "92vh",
              borderRadius: "24px 24px 0 0",
              overflow: "hidden",
              backgroundColor: "#f5f6fa",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle + close */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px 20px 0",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "99px",
                }}
              />
              <button
                onClick={() => setNotesOpen(false)}
                style={{
                  position: "absolute",
                  right: "20px",
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  color: "#9ca3af",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Notes page rendered inside panel — scrollable */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <Notes />
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;