import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MonthFilter, { getCurrentMonthValue, filterByMonth } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const S = {
  page: { backgroundColor: "#f5f6fa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: "90px" },
  header: { padding: "20px 20px 12px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
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
  metricSub: { fontSize: "11px", color: "#9ca3af", marginTop: "3px" },
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 0" },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  actionCard: () => ({ backgroundColor: "#fff", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }),
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

  // Month summary banner
  monthBanner: { background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)", borderRadius: "16px", padding: "16px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" },
  monthBannerLabel: { fontSize: "12px", opacity: 0.6, marginBottom: "4px" },
  monthBannerValue: { fontSize: "22px", fontWeight: "700" },
  monthBannerSub: { fontSize: "11px", opacity: 0.5, marginTop: "2px" },
  monthStatItem: { textAlign: "right" },
};

const today = new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

const QUICK_ACTIONS = [
  { label: "Add Stock", icon: "📦", color: "#f97316", bg: "#fff7ed", route: "/products" },
  { label: "Record Sale", icon: "📈", color: "#16a34a", bg: "#f0fdf4", route: "/sales" },
  { label: "Add Expense", icon: "🧾", color: "#ef4444", bg: "#fef2f2", route: "/costs" },
  { label: "Add Utang", icon: "👤", color: "#3b82f6", bg: "#eff6ff", route: "/utang" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [costs, setCosts] = useState([]);
  const [utangCustomers, setUtangCustomers] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [salesRes, productsRes, costsRes, utangRes] = await Promise.all([
        axios.get(`${BASE_URL}/sales`),
        axios.get(`${BASE_URL}/products`),
        axios.get(`${BASE_URL}/costs`),
        axios.get(`${BASE_URL}/utang/customers`),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setCosts(costsRes.data);
      setUtangCustomers(utangRes.data);
    } catch (err) { console.error("Dashboard fetch error:", err); }
    finally { setLoading(false); }
  };

  const dismiss = (key) => setDismissedAlerts(p => [...p, key]);

  // ── Filter by selected month ─────────────────────────────────────────────
  const monthSales = filterByMonth(sales, "saleDate", selectedMonth);
  const monthCosts = filterByMonth(costs, "costDate", selectedMonth);

  const now = new Date();
  const todaySales = sales
    .filter(s => new Date(s.saleDate).toDateString() === now.toDateString())
    .reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);

  const monthRevenue = monthSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const monthExpenses = monthCosts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const netProfit = monthRevenue - monthExpenses;
  const totalUtang = utangCustomers.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);

  const lowStock = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= (p.reorder || 10));
  const outOfStock = products.filter(p => parseInt(p.stock) === 0);
  const expiringSoon = products.filter(p => {
    if (!p.expiry) return false;
    const exp = new Date(p.expiry);
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  // Previous month for comparison
  const [y, m] = selectedMonth.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prevMonthSales = filterByMonth(sales, "saleDate", prevMonthKey);
  const prevRevenue = prevMonthSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const revenueChange = prevRevenue > 0 ? (((monthRevenue - prevRevenue) / prevRevenue) * 100).toFixed(0) : null;

  const [selY, selM] = selectedMonth.split("-").map(Number);
  const selectedMonthLabel = new Date(selY, selM - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  const alerts = [
    outOfStock.length > 0 && { key: "outofstock", type: "danger", text: `${outOfStock.length} item${outOfStock.length > 1 ? "s are" : " is"} out of stock.`, link: "Restock", route: "/products" },
    lowStock.length > 0 && { key: "lowStock", type: "warning", text: `${lowStock.length} item${lowStock.length > 1 ? "s are" : " is"} running low on stock.`, link: "View", route: "/products" },
    expiringSoon.length > 0 && { key: "expiring", type: "danger", text: `${expiringSoon.length} item${expiringSoon.length > 1 ? "s are" : " is"} expiring within 7 days.`, link: "Check", route: "/products" },
    totalUtang > 0 && { key: "utang", type: "info", text: "Some customers have outstanding balances.", link: "View Utang", route: "/utang" },
  ].filter(Boolean).filter(a => !dismissedAlerts.includes(a.key));

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const METRICS = [
    { label: "Today's Sales", value: fmt(todaySales), color: "#16a34a", iconBg: "#f0fdf4", icon: "🛍️", sub: "today only", badge: null },
    { label: "Net Profit", value: fmt(netProfit), color: netProfit >= 0 ? "#f97316" : "#ef4444", iconBg: "#fff7ed", icon: "📈", sub: selectedMonthLabel, badge: revenueChange !== null ? { text: `${revenueChange > 0 ? "+" : ""}${revenueChange}% vs prev`, color: revenueChange >= 0 ? "#16a34a" : "#ef4444" } : null },
    { label: "Total Items", value: products.length, color: "#3b82f6", iconBg: "#eff6ff", icon: "📦", sub: `${outOfStock.length} out of stock`, badge: outOfStock.length > 0 ? { text: `${outOfStock.length} OOS`, color: "#ef4444" } : lowStock.length > 0 ? { text: `${lowStock.length} low`, color: "#d97706" } : null },
    { label: "Total Utang", value: fmt(totalUtang), color: "#ef4444", iconBg: "#fef2f2", icon: "👥", sub: `${utangCustomers.filter(c => parseFloat(c.balance) > 0).length} with debt`, badge: null },
  ];

  const alertColors = { warning: "#d97706", danger: "#ef4444", info: "#3b82f6" };
  const alertBgs = { warning: "#fffbeb", danger: "#fef2f2", info: "#eff6ff" };
  const alertBorders = { warning: "#fde68a", danger: "#fecaca", info: "#bfdbfe" };
  const alertIcons = { warning: "⚠️", danger: "🚨", info: "ℹ️" };

  const recentSales = [...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).slice(0, 5);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerTop}>
            <div>
              <h1 style={S.storeName}>Magandang Araw Honrado Fam! 👋</h1>
              <p style={S.date}>{today}</p>
            </div>
            <button style={S.reportsBtn} onClick={() => navigate("/sales")}>Reports</button>
          </div>
          {/* Month filter full width below greeting */}
          <MonthFilter value={selectedMonth} onChange={setSelectedMonth} />
        </div>

        <div style={S.body}>
          {/* Month Revenue Banner */}
          {!loading && (
            <div style={S.monthBanner}>
              <div>
                <div style={S.monthBannerLabel}>Monthly Revenue</div>
                <div style={S.monthBannerValue}>{fmt(monthRevenue)}</div>
                <div style={S.monthBannerSub}>{selectedMonthLabel}</div>
              </div>
              <div style={S.monthStatItem}>
                <div style={S.monthBannerLabel}>Expenses</div>
                <div style={{ fontSize: "17px", fontWeight: "700", color: "#fca5a5" }}>{fmt(monthExpenses)}</div>
                <div style={{ ...S.monthBannerLabel, marginTop: "8px" }}>Net Profit</div>
                <div style={{ fontSize: "17px", fontWeight: "700", color: netProfit >= 0 ? "#86efac" : "#fca5a5" }}>{fmt(netProfit)}</div>
              </div>
            </div>
          )}

          {/* Alerts */}
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
                  <div style={S.metricSub}>{m.sub}</div>
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
                  <div key={sale.id} style={{ ...S.activityItem, borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                    <div style={S.activityDot("#f97316")} />
                    <div style={{ flex: 1 }}>
                      <p style={S.activityName}>{sale.productName}</p>
                      <p style={S.activityDate}>{new Date(sale.saleDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div style={S.activityAmount(true)}>+₱{parseFloat(sale.total || sale.unitPrice || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
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