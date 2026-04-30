import React, { useState, useEffect, useRef } from "react";

const STORAGE_KEY    = "tindahan_auth";
const PASSWORD_KEY   = "tindahan_password";
const RECOVERY_KEY   = "tindahan_recovery";
const LOCKOUT_KEY    = "tindahan_lockout";
const DEFAULT_PASS   = "tindahan2024";   // ← change this to your preferred default
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 5 * 60 * 1000;   // 5 minutes

export function getStoredPassword()      { return localStorage.getItem(PASSWORD_KEY)  || DEFAULT_PASS; }
export function setStoredPassword(p)     { localStorage.setItem(PASSWORD_KEY, p); }
export function getRecoveryCode()        { return localStorage.getItem(RECOVERY_KEY)  || null; }
export function setRecoveryCode(c)       { localStorage.setItem(RECOVERY_KEY, c); }
export function lockApp()                { sessionStorage.removeItem(STORAGE_KEY); }

// ── Main gate ────────────────────────────────────────────────────────────────
export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked]       = useState(false);
  const [mode, setMode]               = useState("login"); // "login" | "forgot"
  const [input, setInput]             = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError]             = useState("");
  const [successMsg, setSuccessMsg]   = useState("");
  const [attempts, setAttempts]       = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [remaining, setRemaining]     = useState(0);
  const [shake, setShake]             = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1=enter code, 2=set new pass
  const inputRef = useRef();

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") { setUnlocked(true); return; }
    const lockData = localStorage.getItem(LOCKOUT_KEY);
    if (lockData) {
      const until = parseInt(lockData, 10);
      if (Date.now() < until) setLockedUntil(until);
      else localStorage.removeItem(LOCKOUT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) { setLockedUntil(null); setAttempts(0); localStorage.removeItem(LOCKOUT_KEY); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    if (!unlocked && !lockedUntil && mode === "login") inputRef.current?.focus();
  }, [unlocked, lockedUntil, mode]);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleLogin = (e) => {
    e.preventDefault();
    if (lockedUntil) return;
    if (input === getStoredPassword()) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true); setError(""); setAttempts(0);
    } else {
      const next = attempts + 1;
      setAttempts(next); setInput(""); triggerShake();
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until); localStorage.setItem(LOCKOUT_KEY, String(until)); setError("");
      } else {
        setError(`Incorrect password. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next !== 1 ? "s" : ""} remaining.`);
      }
    }
  };

  // ── Forgot: Step 1 — verify recovery code ───────────────────────────────
  const handleVerifyRecovery = (e) => {
    e.preventDefault();
    setError("");
    const stored = getRecoveryCode();
    if (!stored) {
      setError("No recovery code set up. Please use the browser console method instead.");
      return;
    }
    if (recoveryInput.trim() !== stored.trim()) {
      triggerShake();
      setError("Incorrect recovery code. Please try again.");
      return;
    }
    setRecoveryStep(2);
    setRecoveryInput("");
    setError("");
  };

  // ── Forgot: Step 2 — set new password ───────────────────────────────────
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 6)      return setError("Password must be at least 6 characters.");
    if (newPass !== confirmPass)  return setError("Passwords do not match.");
    setStoredPassword(newPass);
    localStorage.removeItem(LOCKOUT_KEY);
    setLockedUntil(null); setAttempts(0);
    setSuccessMsg("Password reset! You can now log in.");
    setMode("login"); setRecoveryStep(1);
    setNewPass(""); setConfirmPass(""); setError("");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  if (unlocked) return children;

  const isLocked = !!lockedUntil;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const hasRecovery = !!getRecoveryCode();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        .pg-root {
          min-height:100vh;
          background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);
          display:flex; align-items:center; justify-content:center;
          font-family:'DM Sans',sans-serif; padding:20px;
        }
        .pg-card {
          background:#fff; border-radius:24px; padding:40px 32px 36px;
          width:100%; max-width:380px;
          box-shadow:0 24px 60px rgba(0,0,0,0.35); animation:fadeIn 0.4s ease;
        }
        .pg-logo {
          width:56px; height:56px; background:#f97316; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          font-size:26px; font-weight:700; color:#fff;
          margin:0 auto 20px; box-shadow:0 8px 20px rgba(249,115,22,0.35);
        }
        .pg-title { font-size:22px; font-weight:700; color:#1a1a2e; text-align:center; margin:0 0 4px; }
        .pg-sub   { font-size:13px; color:#9ca3af; text-align:center; margin:0 0 24px; }
        .pg-input-wrap { position:relative; margin-bottom:14px; }
        .pg-input-wrap.shake { animation:shake 0.5s ease; }
        .pg-input {
          width:100%; border:2px solid #e5e7eb; border-radius:12px;
          padding:13px 46px 13px 16px; font-size:15px;
          font-family:'DM Sans',sans-serif; color:#1a1a2e; outline:none;
          box-sizing:border-box; transition:border-color 0.15s; background:#f9fafb;
        }
        .pg-input:focus { border-color:#f97316; background:#fff; }
        .pg-input.error { border-color:#ef4444; background:#fff5f5; }
        .pg-eye {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#9ca3af;
          font-size:18px; padding:0; display:flex; align-items:center;
        }
        .pg-error {
          font-size:12px; color:#ef4444; font-weight:600; margin-bottom:14px;
          padding:8px 12px; background:#fff5f5; border-radius:8px;
          border:1px solid #fecaca; text-align:center;
        }
        .pg-success {
          font-size:12px; color:#16a34a; font-weight:600; margin-bottom:14px;
          padding:8px 12px; background:#f0fdf4; border-radius:8px;
          border:1px solid #86efac; text-align:center;
        }
        .pg-btn {
          width:100%; background:#f97316; color:#fff; border:none;
          border-radius:12px; padding:14px; font-size:15px; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:background 0.15s,transform 0.1s;
          box-shadow:0 4px 14px rgba(249,115,22,0.35);
        }
        .pg-btn:hover { background:#ea6c00; }
        .pg-btn:active { transform:scale(0.98); }
        .pg-btn:disabled { background:#d1d5db; box-shadow:none; cursor:not-allowed; }
        .pg-btn-ghost {
          width:100%; background:none; color:#6b7280; border:1.5px solid #e5e7eb;
          border-radius:12px; padding:12px; font-size:14px; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif; margin-top:10px;
          transition:border-color 0.15s,color 0.15s;
        }
        .pg-btn-ghost:hover { border-color:#f97316; color:#f97316; }
        .pg-link {
          background:none; border:none; color:#f97316; font-size:13px;
          font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif;
          text-decoration:underline; padding:0;
        }
        .pg-link:hover { color:#ea6c00; }
        .pg-attempts { display:flex; justify-content:center; gap:6px; margin-top:18px; }
        .pg-dot { width:8px; height:8px; border-radius:50%; transition:background 0.2s; }
        .pg-footer { font-size:11px; color:#d1d5db; text-align:center; margin-top:20px; }
        .pg-lockout { text-align:center; padding:20px 0 8px; }
        .pg-lockout-icon { font-size:40px; margin-bottom:12px; animation:pulse 1.5s ease infinite; }
        .pg-lockout-title { font-size:17px; font-weight:700; color:#ef4444; margin-bottom:6px; }
        .pg-lockout-desc  { font-size:13px; color:#9ca3af; margin-bottom:16px; }
        .pg-timer { font-size:32px; font-weight:700; color:#1a1a2e; font-variant-numeric:tabular-nums; }
        .pg-step-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:#fff7ed; color:#f97316; border:1px solid #fed7aa;
          border-radius:20px; padding:4px 12px; font-size:12px; font-weight:700;
          margin-bottom:16px;
        }
        .pg-no-recovery {
          background:#fff8f0; border:1px solid #fed7aa; border-radius:10px;
          padding:12px 14px; font-size:12px; color:#92400e; line-height:1.5;
          margin-bottom:16px;
        }
      `}</style>

      <div className="pg-root">
        <div className="pg-card">
          <div className="pg-logo">T</div>

          {/* ── LOGIN MODE ── */}
          {mode === "login" && (
            <>
              <h1 className="pg-title">Tindahan ni Aling</h1>
              <p className="pg-sub">Enter your password to continue</p>

              {successMsg && <div className="pg-success">{successMsg}</div>}

              {isLocked ? (
                <div className="pg-lockout">
                  <div className="pg-lockout-icon">🔒</div>
                  <div className="pg-lockout-title">Too many failed attempts</div>
                  <div className="pg-lockout-desc">App is locked. Please wait before trying again.</div>
                  <div className="pg-timer">{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div>
                  <button className="pg-btn-ghost" style={{ marginTop:"20px" }} onClick={() => { setMode("forgot"); setRecoveryStep(1); setError(""); }}>
                    🔑 Use Recovery Code Instead
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin}>
                  <div className={`pg-input-wrap ${shake ? "shake" : ""}`}>
                    <input ref={inputRef} type={showPass ? "text" : "password"}
                      className={`pg-input ${error ? "error" : ""}`}
                      placeholder="Enter password" value={input}
                      onChange={e => { setInput(e.target.value); setError(""); }}
                      autoComplete="current-password" />
                    <button type="button" className="pg-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  {error && <div className="pg-error">{error}</div>}
                  <button type="submit" className="pg-btn" disabled={!input.trim()}>Unlock App</button>
                  {attempts > 0 && (
                    <div className="pg-attempts">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <div key={i} className="pg-dot" style={{ backgroundColor: i < attempts ? "#ef4444" : "#e5e7eb" }} />
                      ))}
                    </div>
                  )}
                  <div style={{ textAlign:"center", marginTop:"18px" }}>
                    <button type="button" className="pg-link" onClick={() => { setMode("forgot"); setRecoveryStep(1); setError(""); setInput(""); }}>
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}
              <div className="pg-footer">🔐 {MAX_ATTEMPTS} attempts max · {LOCKOUT_MS/60000}min lockout</div>
            </>
          )}

          {/* ── FORGOT MODE ── */}
          {mode === "forgot" && (
            <>
              <h1 className="pg-title">Forgot Password</h1>

              {/* Step 1 — enter recovery code */}
              {recoveryStep === 1 && (
                <>
                  <p className="pg-sub">Enter your recovery code to reset your password</p>
                  <div className="pg-step-badge">🔑 Step 1 of 2 · Verify Recovery Code</div>

                  {!hasRecovery && (
                    <div className="pg-no-recovery">
                      ⚠️ No recovery code has been set up yet. Go to <strong>Sidebar → Security → Change Password</strong> to set one up, or use the browser console to reset manually.
                    </div>
                  )}

                  <form onSubmit={handleVerifyRecovery}>
                    <div className={`pg-input-wrap ${shake ? "shake" : ""}`}>
                      <input type="text" className={`pg-input ${error ? "error" : ""}`}
                        placeholder="Enter your recovery code"
                        value={recoveryInput} onChange={e => { setRecoveryInput(e.target.value); setError(""); }}
                        autoComplete="off" autoFocus />
                    </div>
                    {error && <div className="pg-error">{error}</div>}
                    <button type="submit" className="pg-btn" disabled={!recoveryInput.trim()}>Verify Code</button>
                  </form>

                  <button className="pg-btn-ghost" onClick={() => { setMode("login"); setError(""); setRecoveryInput(""); setRecoveryStep(1); }}>
                    ← Back to Login
                  </button>
                </>
              )}

              {/* Step 2 — set new password */}
              {recoveryStep === 2 && (
                <>
                  <p className="pg-sub">Recovery verified! Set your new password</p>
                  <div className="pg-step-badge">✅ Step 2 of 2 · Set New Password</div>

                  <form onSubmit={handleResetPassword}>
                    <label style={{ fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"6px", display:"block" }}>New Password</label>
                    <div className="pg-input-wrap">
                      <input type={showNew ? "text" : "password"} className="pg-input"
                        placeholder="At least 6 characters"
                        value={newPass} onChange={e => { setNewPass(e.target.value); setError(""); }} autoFocus />
                      <button type="button" className="pg-eye" onClick={() => setShowNew(s => !s)} tabIndex={-1}><EyeIcon show={showNew} /></button>
                    </div>

                    {/* Strength bar */}
                    {newPass.length > 0 && (
                      <div style={{ marginBottom:"14px" }}>
                        <div style={{ display:"flex", gap:"4px", marginBottom:"4px" }}>
                          {[1,2,3,4].map(i => {
                            const str = newPass.length >= 12 ? 4 : newPass.length >= 8 ? 3 : newPass.length >= 6 ? 2 : 1;
                            const clr = { 1:"#ef4444", 2:"#f97316", 3:"#eab308", 4:"#22c55e" };
                            return <div key={i} style={{ flex:1, height:"4px", borderRadius:"2px", backgroundColor: i<=str ? clr[str] : "#e5e7eb", transition:"background 0.2s" }} />;
                          })}
                        </div>
                        <div style={{ fontSize:"11px", color:"#9ca3af" }}>
                          {newPass.length < 6 ? "Too short" : newPass.length < 8 ? "Weak" : newPass.length < 12 ? "Good" : "Strong"}
                        </div>
                      </div>
                    )}

                    <label style={{ fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"6px", display:"block" }}>Confirm Password</label>
                    <div className="pg-input-wrap">
                      <input type={showConfirm ? "text" : "password"}
                        className={`pg-input ${confirmPass && newPass && confirmPass !== newPass ? "error" : ""}`}
                        placeholder="Re-enter new password"
                        value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(""); }} />
                      <button type="button" className="pg-eye" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}><EyeIcon show={showConfirm} /></button>
                    </div>

                    {error && <div className="pg-error">{error}</div>}
                    <button type="submit" className="pg-btn" disabled={!newPass || !confirmPass}>Reset Password</button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}