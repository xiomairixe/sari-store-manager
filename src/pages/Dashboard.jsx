import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DateRangeFilter, { getDefaultDateRange, filterByDateRange } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const today = new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
const fmtShort = (dateStr) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const QUICK_ACTIONS = [
  { label: "Add Stock", icon: "📦", color: "#f97316", bg: "#fff7ed", route: "/products" },
  { label: "Record Sale", icon: "📈", color: "#16a34a", bg: "#f0fdf4", route: "/sales" },
  { label: "Add Expense", icon: "🧾", color: "#ef4444", bg: "#fef2f2", route: "/costs" },
  { label: "Add Utang", icon: "👤", color: "#3b82f6", bg: "#eff6ff", route: "/utang" },
];

const alertColors = { warning: "#d97706", danger: "#ef4444", info: "#3b82f6" };
const alertBgs = { warning: "#fffbeb", danger: "#fef2f2", info: "#eff6ff" };
const alertBorders = { warning: "#fde68a", danger: "#fecaca", info: "#bfdbfe" };
const alertIcons = { warning: "⚠️", danger: "🚨", info: "ℹ️" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [costs, setCosts] = useState([]);
  const [utangCustomers, setUtangCustomers] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

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

  const rangeSales = filterByDateRange(sales, "saleDate", dateRange);
  const rangeCosts = filterByDateRange(costs, "costDate", dateRange);

  const now = new Date();
  const todaySales = sales
    .filter(s => new Date(s.saleDate).toDateString() === now.toDateString())
    .reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);

  const rangeRevenue = rangeSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const rangeExpenses = rangeCosts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const netProfit = rangeRevenue - rangeExpenses;
  const totalUtang = utangCustomers.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);

  const lowStock = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= (p.reorder || 10));
  const outOfStock = products.filter(p => parseInt(p.stock) === 0);
  const expiringSoon = products.filter(p => {
    if (!p.expiry) return false;
    const exp = new Date(p.expiry);
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const rangeDays = Math.round((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(dateRange.from);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (rangeDays - 1));
  const prevRangeSales = filterByDateRange(sales, "saleDate", {
    from: prevStart.toISOString().split("T")[0],
    to: prevEnd.toISOString().split("T")[0],
  });
  const prevRevenue = prevRangeSales.reduce((sum, s) => sum + parseFloat(s.total || s.unitPrice || 0), 0);
  const revenueChange = prevRevenue > 0 ? (((rangeRevenue - prevRevenue) / prevRevenue) * 100).toFixed(0) : null;

  const rangeLabel = dateRange.from === dateRange.to
    ? fmtShort(dateRange.from)
    : `${fmtShort(dateRange.from)} – ${fmtShort(dateRange.to)}`;

  const alerts = [
    outOfStock.length > 0 && { key: "outofstock", type: "danger", text: `${outOfStock.length} item${outOfStock.length > 1 ? "s are" : " is"} out of stock.`, link: "Restock", route: "/products" },
    lowStock.length > 0 && { key: "lowStock", type: "warning", text: `${lowStock.length} item${lowStock.length > 1 ? "s are" : " is"} running low on stock.`, link: "View", route: "/products" },
    expiringSoon.length > 0 && { key: "expiring", type: "danger", text: `${expiringSoon.length} item${expiringSoon.length > 1 ? "s are" : " is"} expiring within 7 days.`, link: "Check", route: "/products" },
    totalUtang > 0 && { key: "utang", type: "info", text: "Some customers have outstanding balances.", link: "View Utang", route: "/utang" },
  ].filter(Boolean).filter(a => !dismissedAlerts.includes(a.key));

  const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const METRICS = [
    { label: "Today's Sales", value: fmt(todaySales), color: "#16a34a", iconBg: "#f0fdf4", icon: "🛍️", sub: "today only", badge: null },
    { label: "Net Profit", value: fmt(netProfit), color: netProfit >= 0 ? "#f97316" : "#ef4444", iconBg: "#fff7ed", icon: "📈", sub: rangeLabel, badge: revenueChange !== null ? { text: `${revenueChange > 0 ? "+" : ""}${revenueChange}% vs prev`, color: revenueChange >= 0 ? "#16a34a" : "#ef4444" } : null },
    { label: "Total Items", value: products.length, color: "#3b82f6", iconBg: "#eff6ff", icon: "📦", sub: `${outOfStock.length} out of stock`, badge: outOfStock.length > 0 ? { text: `${outOfStock.length} OOS`, color: "#ef4444" } : lowStock.length > 0 ? { text: `${lowStock.length} low`, color: "#d97706" } : null },
    { label: "Total Utang", value: fmt(totalUtang), color: "#ef4444", iconBg: "#fef2f2", icon: "👥", sub: `${utangCustomers.filter(c => parseFloat(c.balance) > 0).length} with debt`, badge: null },
  ];

  const recentSales = [...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).slice(0, 5);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .db-page {
          background-color: #f5f6fa;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          /* Fill the full height of the app-content flex column */
          display: flex;
          flex-direction: column;
        }

        .db-header {
          background: #fff;
          border-bottom: 1px solid #eeeff3;
          padding: 18px 20px 14px;
          flex-shrink: 0;
        }

        .db-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .db-store-name {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .db-date {
          font-size: 13px;
          color: #9ca3af;
          margin: 2px 0 0;
        }

        .db-reports-btn {
          background: none;
          border: none;
          color: #f97316;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          flex-shrink: 0;
          margin-top: 4px;
        }

        /* The scrollable content area */
        .db-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .db-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .db-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .db-bottom-row {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .db-header {
            padding: 22px 32px 16px;
          }
          .db-store-name {
            font-size: 22px;
          }
          .db-body {
            padding: 24px 32px 40px;
          }
          .db-metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .db-actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .db-bottom-row {
            flex-direction: row;
            align-items: flex-start;
          }
          .db-bottom-left {
            flex: 0 0 360px;
          }
          .db-bottom-right {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>

      <div className="db-page">

        {/* ── Header ── */}
        <div className="db-header">
          <div className="db-header-row">
            <div>
              <h1 className="db-store-name">Magandang Araw Honrado Fam! 👋</h1>
              <p className="db-date">{today}</p>
            </div>
            <button className="db-reports-btn" onClick={() => navigate("/sales")}>Reports</button>
          </div>
          <DateRangeFilter range={dateRange} onChange={setDateRange} />
        </div>

        {/* ── Body ── */}
        <div className="db-body">

          {/* Revenue Banner */}
          {!loading && (
            <div style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)",
              borderRadius: "16px",
              padding: "20px 24px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}>Revenue</div>
                <div style={{ fontSize: "26px", fontWeight: "700" }}>{fmt(rangeRevenue)}</div>
                <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "2px" }}>{rangeLabel}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}>Expenses</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#fca5a5" }}>{fmt(rangeExpenses)}</div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "10px", marginBottom: "4px" }}>Net Profit</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: netProfit >= 0 ? "#86efac" : "#fca5a5" }}>{fmt(netProfit)}</div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {!loading && alerts.map((alert) => (
            <div key={alert.key} style={{
              backgroundColor: alertBgs[alert.type],
              border: `1px solid ${alertBorders[alert.type]}`,
              borderRadius: "12px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "16px" }}>{alertIcons[alert.type]}</span>
              <span style={{ fontSize: "13px", color: "#374151", flex: 1 }}>{alert.text}</span>
              <button style={{ fontSize: "12px", fontWeight: "700", color: alertColors[alert.type], background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }} onClick={() => navigate(alert.route)}>{alert.link}</button>
              <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px", padding: 0 }} onClick={() => dismiss(alert.key)}>✕</button>
            </div>
          ))}

          {/* Metrics */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" }}>Loading...</div>
          ) : (
            <div className="db-metrics-grid">
              {METRICS.map((m) => (
                <div key={m.label} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: m.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "18px" }}>{m.icon}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>{m.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>{m.sub}</div>
                  {m.badge && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "600", color: m.badge.color, backgroundColor: `${m.badge.color}18`, borderRadius: "20px", padding: "2px 7px", marginTop: "4px" }}>
                      {m.badge.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions + Recent Activity */}
          {!loading && (
            <div className="db-bottom-row">

              {/* Quick Actions */}
              <div className="db-bottom-left">
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "10px" }}>Quick Actions</div>
                <div className="db-actions-grid">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => navigate(a.route)}
                      style={{ backgroundColor: "#fff", borderRadius: "14px", padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", width: "100%" }}
                    >
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: a.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "20px" }}>{a.icon}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: a.color }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="db-bottom-right">
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "10px" }}>Recent Activity</div>
                <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {recentSales.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No recent activity yet.</div>
                  ) : (
                    recentSales.map((sale, i) => {
                      const isLast = i === recentSales.length - 1;
                      return (
                        <div key={sale._id || sale.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f97316", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a2e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sale.productName}</p>
                            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>
                              {new Date(sale.saleDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#16a34a", flexShrink: 0 }}>
                            +₱{parseFloat(sale.total || sale.unitPrice || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}