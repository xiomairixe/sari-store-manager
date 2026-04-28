import { Link, useLocation } from "react-router-dom";
import React from "react";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/checkout",
    label: "Checkout / POS",
    isHighlight: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Inventory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    to: "/sales",
    label: "Sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    to: "/costs",
    label: "Expenses",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    to: "/Assets",
    label: "Assets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="10" width="18" height="11" rx="1" />
        <path d="M3 10l9-7 9 7" />
        <rect x="9" y="14" width="6" height="7" />
      </svg>
    ),
  },
  {
    to: "/utang",
    label: "Utang",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// Bottom nav items for mobile (subset, with center button)
const mobileNavItems = [
  navItems[0], // Dashboard
  navItems[2], // Inventory
  { ...navItems[1], isCenter: true }, // Checkout - center
  navItems[3], // Sales
  navItems[4], // Expenses
];

function Navbar() {
  const location = useLocation();

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      <style>{`
        /* ── DESKTOP SIDEBAR ── */
        .sidebar {
          display: none;
        }
        .sidebar-spacer {
          display: none;
        }
        .mobile-nav {
          display: flex;
        }
        .mobile-spacer {
          display: block;
        }

        @media (min-width: 768px) {
          .sidebar {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 220px;
            background: #ffffff;
            border-right: 1px solid #f0f0f0;
            z-index: 1000;
            padding: 0;
            box-shadow: 2px 0 8px rgba(0,0,0,0.04);
          }
          .sidebar-spacer {
            display: block;
            width: 220px;
            flex-shrink: 0;
          }
          .mobile-nav {
            display: none !important;
          }
          .mobile-spacer {
            display: none !important;
          }
        }

        /* Sidebar header/logo area */
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 20px 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 8px;
        }
        .sidebar-logo {
          width: 38px;
          height: 38px;
          background: #f97316;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sidebar-store-name {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .sidebar-store-sub {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.2;
        }

        /* Sidebar nav links */
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          margin: 2px 10px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: background 0.15s, color 0.15s;
          cursor: pointer;
        }
        .sidebar-link:hover {
          background: #fff7ed;
          color: #f97316;
        }
        .sidebar-link.active {
          background: #fff7ed;
          color: #f97316;
          font-weight: 600;
        }
        .sidebar-link.highlight {
          background: #f97316;
          color: #ffffff;
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .sidebar-link.highlight:hover {
          background: #ea6c00;
          color: #ffffff;
        }
        .sidebar-link.highlight.active {
          background: #ea6c00;
          color: #ffffff;
        }
        .sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          flex-shrink: 0;
        }

        /* Reports section at bottom */
        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #f3f4f6;
          padding-top: 8px;
          padding-bottom: 16px;
        }
        .sidebar-section-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #d1d5db;
          padding: 8px 26px 4px;
        }

        /* ── MOBILE BOTTOM NAV ── */
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          gap: 3px;
          flex: 1;
          height: 100%;
          color: #9ca3af;
          transition: color 0.15s;
        }
        .mobile-nav-item.active {
          color: #f97316;
        }
        .mobile-nav-label {
          font-size: 11px;
          letter-spacing: 0.01em;
        }
        .mobile-center-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex: 1;
          gap: 3px;
          margin-top: -18px;
        }
        .mobile-center-btn {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 14px rgba(249,115,22,0.45);
        }
        .mobile-center-btn.active {
          background: #ea6c00;
        }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar">
        {/* Logo / Store Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">T</div>
          <div>
            <div className="sidebar-store-name">Tindahan</div>
            <div className="sidebar-store-sub">ni Aling</div>
          </div>
        </div>

        {/* Main nav items */}
        <nav style={{ flex: 1 }}>
          {navItems.slice(0, -1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link${item.isHighlight ? " highlight" : ""}${isActive(item.to) ? " active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Utang at bottom before reports */}
          <Link
            to="/utang"
            className={`sidebar-link${isActive("/utang") ? " active" : ""}`}
          >
            <span className="sidebar-icon">{navItems[navItems.length - 1].icon}</span>
            Utang
          </Link>
        </nav>

        {/* Reports & Analytics at bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-section-label">Analytics</div>
          <Link
            to="/reports"
            className={`sidebar-link${isActive("/reports") ? " active" : ""}`}
          >
            <span className="sidebar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            Reports &amp; Analytics
          </Link>
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div className="sidebar-spacer" />

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-spacer" style={{ height: "70px" }} />
      <nav className="mobile-nav">
        {mobileNavItems.map((item) => {
          const active = isActive(item.to);

          if (item.isCenter) {
            return (
              <Link key={item.to} to={item.to} className="mobile-center-wrapper">
                <div className={`mobile-center-btn${active ? " active" : ""}`}>
                  {item.icon}
                </div>
                <span className={`mobile-nav-label${active ? " active" : ""}`} style={{ color: active ? "#f97316" : "#9ca3af", fontWeight: active ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link key={item.to} to={item.to} className={`mobile-nav-item${active ? " active" : ""}`}>
              {item.icon}
              <span className="mobile-nav-label" style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;