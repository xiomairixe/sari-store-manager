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
import PasswordGate from "./layout/PasswordGate";
import ChangePassword from "./layout/ChangePassword";
import React, { useState } from "react";

function App() {
  const [notesOpen, setNotesOpen]           = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  return (
    <PasswordGate>
      <Router>
        <style>{`
          .app-shell {
            display: flex;
            min-height: 100vh;
          }
          .app-content {
            flex: 1;
            min-width: 0;
          }
          .notes-fab {
            position: fixed;
            bottom: 88px;
            left: 20px;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background-color: #1a1a2e;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            z-index: 999;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .notes-fab:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 18px rgba(0,0,0,0.3);
          }
          @media (min-width: 768px) {
            .notes-fab {
              bottom: 32px;
              left: 236px;
            }
          }
        `}</style>

        <div className="app-shell">
          <Navbar onChangePassword={() => setChangePassOpen(true)} />
          <div className="app-content">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/products"  element={<Products />} />
              <Route path="/sales"     element={<Sales />} />
              <Route path="/costs"     element={<Costs />} />
              <Route path="/utang"     element={<Utang />} />
              <Route path="/Assets"    element={<Assets />} />
              <Route path="/checkout"  element={<Checkout />} />
              <Route path="/suppliers" element={<Suppliers />} />
            </Routes>
          </div>
        </div>

        {/* Notes FAB */}
        <button className="notes-fab" onClick={() => setNotesOpen(true)} title="Shopping Notes">🛒</button>

        {/* Notes Panel */}
        {notesOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "flex-end" }}
            onClick={e => e.target === e.currentTarget && setNotesOpen(false)}>
            <div style={{ width: "100%", maxWidth: "640px", margin: "0 auto", height: "92vh", borderRadius: "24px 24px 0 0", overflow: "hidden", backgroundColor: "#f5f6fa", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 20px 0", flexShrink: 0, position: "relative" }}>
                <div style={{ width: "40px", height: "4px", backgroundColor: "#e5e7eb", borderRadius: "99px" }} />
                <button onClick={() => setNotesOpen(false)} style={{ position: "absolute", right: "20px", background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}><Notes /></div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {changePassOpen && <ChangePassword onClose={() => setChangePassOpen(false)} />}

      </Router>
    </PasswordGate>
  );
}

export default App;