import { Link, useLocation } from "react-router-dom";
import React from "react";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Stocks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  { to: "/checkout", label: "Checkout", isCenter: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    to: "/sales",
    label: "Sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    to: "/costs",
    label: "Costs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
   {
    to: "/Assets",
    label: "Assets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

function Navbar() {
  const location = useLocation();

  return (
    <>
      <div style={{ height: "70px" }} />

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          if (item.isCenter) {
            return (
              <Link key={item.to} to={item.to} style={styles.centerWrapper}>
                <div style={{
                  ...styles.centerBtn,
                  backgroundColor: isActive ? "#ea6c00" : "#f97316",
                }}>
                  {item.icon}
                </div>
                <span style={{ ...styles.label, color: isActive ? "#f97316" : "#9ca3af", fontWeight: isActive ? "600" : "400" }}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              style={{ ...styles.navItem, color: isActive ? "#f97316" : "#9ca3af" }}
            >
              <span style={{ ...styles.iconWrapper, color: isActive ? "#f97316" : "#9ca3af" }}>
                {item.icon}
              </span>
              <span style={{ ...styles.label, color: isActive ? "#f97316" : "#9ca3af", fontWeight: isActive ? "600" : "400" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    gap: "3px",
    flex: 1,
    height: "100%",
    transition: "color 0.15s ease",
  },
  centerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    flex: 1,
    gap: "3px",
    marginTop: "-18px",
  },
  centerBtn: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    backgroundColor: "#f97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(249,115,22,0.45)",
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: "11px",
    letterSpacing: "0.01em",
  },
};

export default Navbar;