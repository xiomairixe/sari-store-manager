import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const S = {
  page: {
    backgroundColor: "#f5f6fa",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: "90px",
  },
  header: {
    padding: "20px 20px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  storeName: { fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  date: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  reportsBtn: {
    background: "none",
    border: "none",
    color: "#f97316",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: 0,
  },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" },

  // Alerts
  alert: (type) => {
    const colors = {
      warning: { bg: "#fffbeb", border: "#fde68a", icon: "#d97706", text: "#92400e", link: "#d97706" },
      danger:  { bg: "#fef2f2", border: "#fecaca", icon: "#ef4444", text: "#7f1d1d", link: "#ef4444" },
      info:    { bg: "#eff6ff", border: "#bfdbfe", icon: "#3b82f6", text: "#1e3a5f", link: "#3b82f6" },
    };
    return {
      backgroundColor: colors[type].bg,
      border: `1px solid ${colors[type].border}`,
      borderRadius: "12px",
      padding: "12px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
      _colors: colors[type],
    };
  },
  alertText: { fontSize: "13px", color: "#374151", flex: 1 },
  alertLink: (color) => ({
    fontSize: "12px",
    fontWeight: "700",
    color,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  }),
  alertClose: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    padding: 0,
  },

  // Metrics grid
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  metricIcon: (bg) => ({
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    backgroundColor: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
  }),
  metricLabel: { fontSize: "12px", color: "#9ca3af", marginBottom: "4px" },
  metricValue: (color) => ({ fontSize: "20px", fontWeight: "700", color, margin: 0 }),
  metricBadge: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "11px",
    fontWeight: "600",
    color,
    backgroundColor: `${color}18`,
    borderRadius: "20px",
    padding: "2px 7px",
    marginTop: "4px",
  }),

  // Quick actions
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 0" },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  actionCard: (color) => ({
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    transition: "transform 0.1s",
  }),
  actionIcon: (bg) => ({
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  actionLabel: (color) => ({ fontSize: "13px", fontWeight: "600", color }),

  // Recent activity
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  activityDot: (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    flexShrink: 0,
  }),
  activityName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: 0 },
  activityDate: { fontSize: "11px", color: "#9ca3af", marginTop: "2px" },
  activityAmount: (positive) => ({
    fontSize: "14px",
    fontWeight: "700",
    color: positive ? "#16a34a" : "#ef4444",
    marginLeft: "auto",
  }),
  emptyText: { fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "16px 0" },
};

const today = new Date().toLocaleDateString("en-PH", {
  month: "long", day: "numeric", year: "numeric"
});

const QUICK_ACTIONS = [
  { label: "Add Stock",    icon: "📦", color: "#f97316", bg: "#fff7ed", route: "/products" },
  { label: "Record Sale",  icon: "📈", color: "#16a34a", bg: "#f0fdf4", route: "/sales" },
  { label: "Add Expense",  icon: "🧾", color: "#ef4444", bg: "#fef2f2", route: "/costs" },
  { label: "Add Utang",    icon: "👤", color: "#3b82f6", bg: "#eff6ff", route: "/utang" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        axios.get(`${BASE_URL}/stats`),
        axios.get(`${BASE_URL}/sales`),
      ]);
      setStats(statsRes.data);
      setRecentSales(salesRes.data.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (key) => setDismissedAlerts(p => [...p, key]);

  // Build alerts from live stats
  const alerts = stats ? [
    stats.lowStock?.length > 0 && {
      key: "lowStock",
      type: "warning",
      text: `${stats.lowStock.length} item${stats.lowStock.length > 1 ? "s are" : " is"} running low on stock.`,
      link: "View Inventory",
      route: "/products",
    },
    stats.expiringSoon?.length > 0 && {
      key: "expiring",
      type: "danger",
      text: `${stats.expiringSoon.length} item${stats.expiringSoon.length > 1 ? "s are" : " is"} expiring soon.`,
      link: "Check Items",
      route: "/products",
    },
    parseFloat(stats.totalUtang) > 0 && {
      key: "utang",
      type: "info",
      text: "Some customers have exceeded their credit limit.",
      link: "View Utang",
      route: "/utang",
    },
  ].filter(Boolean).filter(a => !dismissedAlerts.includes(a.key)) : [];

  const fmt = (n) =>
    `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const METRICS = stats ? [
    {
      label: "Today's Sales",
      value: fmt(stats.todaySales),
      color: "#16a34a",
      iconBg: "#f0fdf4",
      icon: "🛍️",
      badge: null,
    },
    {
      label: "Net Profit (Mo)",
      value: fmt(stats.netProfitMo),
      color: "#f97316",
      iconBg: "#fff7ed",
      icon: "📈",
      badge: null,
    },
    {
      label: "Total Items",
      value: stats.totalItems,
      color: "#3b82f6",
      iconBg: "#eff6ff",
      icon: "📦",
      badge: stats.lowStock?.length > 0
        ? { text: `${stats.lowStock.length} low`, color: "#d97706" }
        : null,
    },
    {
      label: "Total Utang",
      value: fmt(stats.totalUtang),
      color: "#ef4444",
      iconBg: "#fef2f2",
      icon: "👥",
      badge: null,
    },
  ] : [];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.storeName}>Magandang Araw Honrado Fam! 👋</h1>
            <p style={S.date}>{today}</p>
          </div>
          <button style={S.reportsBtn} onClick={() => navigate("/sales")}>Reports</button>
        </div>

        <div style={S.body}>
          {/* Alerts */}
          {loading ? null : alerts.map((alert) => {
            const colors = {
              warning: "#d97706",
              danger:  "#ef4444",
              info:    "#3b82f6",
            };
            const bgs = {
              warning: "#fffbeb",
              danger:  "#fef2f2",
              info:    "#eff6ff",
            };
            const borders = {
              warning: "#fde68a",
              danger:  "#fecaca",
              info:    "#bfdbfe",
            };
            const icons = { warning: "⚠️", danger: "⊗", info: "ℹ️" };
            return (
              <div key={alert.key} style={{
                backgroundColor: bgs[alert.type],
                border: `1px solid ${borders[alert.type]}`,
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <span style={{ fontSize: "16px" }}>{icons[alert.type]}</span>
                <span style={{ fontSize: "13px", color: "#374151", flex: 1 }}>{alert.text}</span>
                <button
                  style={S.alertLink(colors[alert.type])}
                  onClick={() => navigate(alert.route)}
                >
                  {alert.link}
                </button>
                <button style={S.alertClose} onClick={() => dismiss(alert.key)}>✕</button>
              </div>
            );
          })}

          {/* Metrics */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", fontSize: "14px" }}>
              Loading...
            </div>
          ) : (
            <div style={S.metricsGrid}>
              {METRICS.map((m) => (
                <div key={m.label} style={S.metricCard}>
                  <div style={S.metricIcon(m.iconBg)}>
                    <span style={{ fontSize: "18px" }}>{m.icon}</span>
                  </div>
                  <div style={S.metricLabel}>{m.label}</div>
                  <div style={S.metricValue(m.color)}>{m.value}</div>
                  {m.badge && (
                    <div style={S.metricBadge(m.badge.color)}>{m.badge.text}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div style={S.sectionTitle}>Quick Actions</div>
          <div style={S.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} style={S.actionCard(a.color)} onClick={() => navigate(a.route)}>
                <div style={S.actionIcon(a.bg)}>
                  <span style={{ fontSize: "20px" }}>{a.icon}</span>
                </div>
                <span style={S.actionLabel(a.color)}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={S.sectionTitle}>Recent Activity</div>
          <div style={S.card}>
            {recentSales.length === 0 ? (
              <div style={S.emptyText}>No recent activity yet.</div>
            ) : (
              recentSales.map((sale, i) => {
                const isLast = i === recentSales.length - 1;
                return (
                  <div key={sale.id} style={{ ...S.activityItem, borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                    <div style={S.activityDot("#f97316")} />
                    <div style={{ flex: 1 }}>
                      <p style={S.activityName}>{sale.productName}</p>
                      <p style={S.activityDate}>
                        {new Date(sale.saleDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div style={S.activityAmount(true)}>
                      +₱{parseFloat(sale.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}