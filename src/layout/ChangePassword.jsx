import React, { useState } from "react";
import { getStoredPassword, setStoredPassword } from "./PasswordGate";

// ── Can be used as a full page or a modal ───────────────────────────────────
// Usage as modal:  <ChangePassword onClose={() => setOpen(false)} />
// Usage as page:   <ChangePassword />

export default function ChangePassword({ onClose }) {
  const [current, setCurrent]     = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const stored = getStoredPassword();
    if (current !== stored)           return setError("Current password is incorrect.");
    if (newPass.length < 6)           return setError("New password must be at least 6 characters.");
    if (newPass !== confirm)          return setError("New passwords do not match.");
    if (newPass === current)          return setError("New password must be different from the current one.");

    setStoredPassword(newPass);
    setSuccess(true);
    setCurrent(""); setNewPass(""); setConfirm("");
  };

  const isModal = !!onClose;

  const inp = {
    width: "100%", border: "2px solid #e5e7eb", borderRadius: "12px",
    padding: "12px 46px 12px 16px", fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e",
    outline: "none", boxSizing: "border-box", backgroundColor: "#f9fafb",
    transition: "border-color 0.15s, background 0.15s",
  };

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} tabIndex={-1}
      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex", alignItems: "center" }}>
      {show ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  const content = (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Change Password</h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "3px 0 0" }}>Update your app access password</p>
        </div>
        {isModal && (
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer", padding: 0 }}>✕</button>
        )}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "16px 0 20px" }} />

      {success ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#1a1a2e", marginBottom: "6px" }}>Password Changed!</div>
          <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>Your new password is active. You'll use it on the next login.</div>
          <button onClick={() => { setSuccess(false); if (isModal) onClose(); }}
            style={{ padding: "12px 28px", backgroundColor: "#f97316", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Current password */}
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Current Password</label>
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <input type={showCurrent ? "text" : "password"} style={inp} placeholder="Your current password"
              value={current} onChange={e => { setCurrent(e.target.value); setError(""); }} />
            <EyeBtn show={showCurrent} onToggle={() => setShowCurrent(s => !s)} />
          </div>

          {/* New password */}
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>New Password</label>
          <div style={{ position: "relative", marginBottom: "6px" }}>
            <input type={showNew ? "text" : "password"} style={inp} placeholder="At least 6 characters"
              value={newPass} onChange={e => { setNewPass(e.target.value); setError(""); }} />
            <EyeBtn show={showNew} onToggle={() => setShowNew(s => !s)} />
          </div>

          {/* Strength indicator */}
          {newPass.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1,2,3,4].map(i => {
                  const strength = newPass.length >= 12 ? 4 : newPass.length >= 8 ? 3 : newPass.length >= 6 ? 2 : 1;
                  const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e" };
                  return <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: i <= strength ? colors[strength] : "#e5e7eb", transition: "background 0.2s" }} />;
                })}
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                {newPass.length < 6 ? "Too short" : newPass.length < 8 ? "Weak" : newPass.length < 12 ? "Good" : "Strong"}
              </div>
            </div>
          )}

          {/* Confirm password */}
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Confirm New Password</label>
          <div style={{ position: "relative", marginBottom: confirm && newPass && confirm !== newPass ? "6px" : "20px" }}>
            <input type={showConfirm ? "text" : "password"} style={{ ...inp, borderColor: confirm && newPass && confirm !== newPass ? "#ef4444" : "#e5e7eb" }}
              placeholder="Re-enter new password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} />
            <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />
          </div>
          {confirm && newPass && confirm !== newPass && (
            <div style={{ fontSize: "12px", color: "#ef4444", marginBottom: "14px" }}>Passwords don't match</div>
          )}

          {error && (
            <div style={{ fontSize: "13px", color: "#ef4444", fontWeight: "600", marginBottom: "16px", padding: "10px 12px", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <button type="submit"
            style={{ width: "100%", backgroundColor: "#f97316", color: "#fff", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
            🔐 Update Password
          </button>
        </form>
      )}
    </div>
  );

  // If used as modal, wrap in overlay
  if (isModal) {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1200, display: "flex", alignItems: isModal ? "center" : "flex-end", justifyContent: "center", padding: "20px" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          {content}
        </div>
      </div>
    );
  }

  // Standalone page
  return (
    <div style={{ backgroundColor: "#f5f6fa", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "32px 28px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {content}
      </div>
    </div>
  );
}