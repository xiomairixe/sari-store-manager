import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const S = {
  page: { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "90px" },
  header: { padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  storeName: { fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 },
  date: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  reportsBtn: { background: "none", border: "none", color: "#f97316", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 },
  body: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" },
  metricsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  metricCard: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  metricIcon: (bg) => ({ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }),
  metricLabel: { fontSize: "12px", color: "#9ca3af", marginBottom: "4px" },
  metricValue: (color) => ({ fontSize: "20px", fontWeight: "700", color, margin: 0 }),
  metricBadge: (color) => ({ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "600", color, backgroundColor: `${color}18`, borderRadius: "20px", padding: "2px 7px", marginTop: "4px" }),
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 0" },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  actionCard: () => ({ backgroundColor: "#fff", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "transform 0.1s" }),
  actionIcon: (bg) => ({ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }),
  actionLabel: (color) => ({ fontSize: "13px", fontWeight: "600", color }),
  card: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  activityItem: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
  activityDot: (color) => ({ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }),
  activityName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: 0 },
  activityDate: { fontSize: "11px", color: "#9ca3af", marginTop: "2px" },
  activityAmount: (positive) => ({ fontSize: "14px", fontWeight: "700", color: positive ? "#16a34a" : "#ef4444", marginLeft: "auto" }),
  emptyText: { fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "16px 0" },
  alertClose: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 },
  alertLink: (color) => ({ fontSize: "12px", fontWeight: "700", color, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }),
};

const today = new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

const QUICK_ACTIONS = [
  { label: "Add Stock",   icon: "📦", color: "#f97316", bg: "#fff7ed", route: "/products" },
  { label: "Record Sale", icon: "📈", color: "#16a34a", bg: "#f0fdf4", route: "/sales" },
  { label: "Add Expense", icon: "🧾", color: "#ef4444", bg: "#fef2f2", route: "/costs" },
  { label: "Add Utang",   icon: "👤", color: "#3b82f6", bg: "#eff6ff", route: "/utang" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      // ⚠️ NOTE: /stats endpoint needs to be added to server.js
      // For now, fetching sales and products directly as fallback
      const [salesRes, productsRes] = await Promise.all([
        axios.get(`${BASE_URL}/sales`),
        axios.get(`${BASE_URL}/products`),
      ]);

      const sales = salesRes.data;
      const products = productsRes.data;
      const now = new Date();

      const todaySales = sales
        .filter(s => new Date(s.saleDate).toDateString() === now.toDateString())
        .reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);

      const thisMonthSales = sales
        .filter(s => { const d = new Date(s.saleDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
        .reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);

      const lowStock = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= (p.reorder || 10));
      const expiringSoon = products.filter(p => {
        if (!p.expiry) return false;
        const exp = new Date(p.expiry);
        const diff = (exp - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });

      setStats({
        todaySales,
        netProfitMo: thisMonthSales,
        totalItems: products.length,
        totalUtang: 0,
        lowStock,
        expiringSoon,
      });
      setRecentSales(sales.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (key) => setDismissedAlerts(p => [...p, key]);

  const alerts = stats ? [
    stats.lowStock?.length > 0 && { key: "lowStock", type: "warning", text: `${stats.lowStock.length} item${stats.lowStock.length > 1 ? "s are" : " is"} running low on stock.`, link: "View Inventory", route: "/products" },
    stats.expiringSoon?.length > 0 && { key: "expiring", type: "danger", text: `${stats.expiringSoon.length} item${stats.expiringSoon.length > 1 ? "s are" : " is"} expiring soon.`, link: "Check Items", route: "/products" },
    parseFloat(stats.totalUtang) > 0 && { key: "utang", type: "info", text: "Some customers have exceeded their credit limit.", link: "View Utang", route: "/utang" },
  ].filter(Boolean).filter(a => !dismissedAlerts.includes(a.key)) : [];

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const METRICS = stats ? [
    { label: "Today's Sales",   value: fmt(stats.todaySales),  color: "#16a34a", iconBg: "#f0fdf4", icon: "🛍️", badge: null },
    { label: "Net Profit (Mo)", value: fmt(stats.netProfitMo), color: "#f97316", iconBg: "#fff7ed", icon: "📈", badge: null },
    { label: "Total Items",     value: stats.totalItems,       color: "#3b82f6", iconBg: "#eff6ff", icon: "📦", badge: stats.lowStock?.length > 0 ? { text: `${stats.lowStock.length} low`, color: "#d97706" } : null },
    { label: "Total Utang",     value: fmt(stats.totalUtang),  color: "#ef4444", iconBg: "#fef2f2", icon: "👥", badge: null },
  ] : [];

  const alertColors = { warning: "#d97706", danger: "#ef4444", info: "#3b82f6" };
  const alertBgs    = { warning: "#fffbeb", danger: "#fef2f2", info: "#eff6ff" };
  const alertBorders = { warning: "#fde68a", danger: "#fecaca", info: "#bfdbfe" };
  const alertIcons  = { warning: "⚠️", danger: "⊗", info: "ℹ️" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.page}>
        <div style={S.header}>
          <div>
            <h1 style={S.storeName}>Magandang Araw Honrado Fam! 👋</h1>
            <p style={S.date}>{today}</p>
          </div>
          <button style={S.reportsBtn} onClick={() => navigate("/sales")}>Reports</button>
        </div>

        <div style={S.body}>
          {!loading && alerts.map((alert) => (
            <div key={alert.key} style={{ backgroundColor: alertBgs[alert.type], border: `1px solid ${alertBorders[alert.type]}`, borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>{alertIcons[alert.type]}</span>
              <span style={{ fontSize: "13px", color: "#374151", flex: 1 }}>{alert.text}</span>
              <button style={S.alertLink(alertColors[alert.type])} onClick={() => navigate(alert.route)}>{alert.link}</button>
              <button style={S.alertClose} onClick={() => dismiss(alert.key)}>✕</button>
            </div>
          ))}

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", fontSize: "14px" }}>Loading...</div>
          ) : (
            <div style={S.metricsGrid}>
              {METRICS.map((m) => (
                <div key={m.label} style={S.metricCard}>
                  <div style={S.metricIcon(m.iconBg)}><span style={{ fontSize: "18px" }}>{m.icon}</span></div>
                  <div style={S.metricLabel}>{m.label}</div>
                  <div style={S.metricValue(m.color)}>{m.value}</div>
                  {m.badge && <div style={S.metricBadge(m.badge.color)}>{m.badge.text}</div>}
                </div>
              ))}
            </div>
          )}

          <div style={S.sectionTitle}>Quick Actions</div>
          <div style={S.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} style={S.actionCard(a.color)} onClick={() => navigate(a.route)}>
                <div style={S.actionIcon(a.bg)}><span style={{ fontSize: "20px" }}>{a.icon}</span></div>
                <span style={S.actionLabel(a.color)}>{a.label}</span>
              </button>
            ))}
          </div>

          <div style={S.sectionTitle}>Recent Activity</div>
          <div style={S.card}>
            {recentSales.length === 0 ? (
              <div style={S.emptyText}>No recent activity yet.</div>
            ) : (
              recentSales.map((sale, i) => {
                const isLast = i === recentSales.length - 1;
                return (
                  <div key={sale._id} style={{ ...S.activityItem, borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}> {/* ✅ fixed */}
                    <div style={S.activityDot("#f97316")} />
                    <div style={{ flex: 1 }}>
                      <p style={S.activityName}>{sale.productName}</p>
                      <p style={S.activityDate}>{new Date(sale.saleDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div style={S.activityAmount(true)}>+₱{parseFloat(sale.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
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