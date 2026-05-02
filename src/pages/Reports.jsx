import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import DateRangeFilter, { getDefaultDateRange, filterByDateRange } from "./MonthFilter";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmt = (n) => `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });
const fmtMonth = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", year: "numeric" });
const getSaleTotal = (s) => {
  const t = parseFloat(s.total);
  return (!isNaN(t) && t > 0) ? t : (parseFloat(s.qty) || 1) * (parseFloat(s.unitPrice) || 0);
};

const EXPENSE_COLORS = {
  Rent: "#f97316", Utilities: "#ef4444", Supplies: "#3b82f6",
  Transportation: "#22c55e", Miscellaneous: "#a855f7", Other: "#9ca3af",
};
const ASSET_COLORS = {
  equipment: "#f97316", vehicle: "#3b82f6", property: "#22c55e",
  inventory: "#a855f7", other: "#9ca3af",
};
const CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#eab308", "#9ca3af"];

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#9ca3af", fontWeight: "600" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: "13px", fontWeight: "700", color: p.color }}>
          {p.name}: ₱{parseFloat(p.value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#9ca3af", fontWeight: "600" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: "13px", fontWeight: "700", color: p.fill }}>
          {p.name}: ₱{parseFloat(p.value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: payload[0].payload.fill || "#1a1a2e" }}>
        {payload[0].name}: {fmt(payload[0].value)}
      </p>
    </div>
  );
};

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "12px", color: "#9ca3af" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "#f97316", bg = "#fff7ed", icon }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", fontSize: "18px" }}>
        {icon}
      </div>
      <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "700", color }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

export default function Reports() {
  const [sales, setSales]         = useState([]);
  const [costs, setCosts]         = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [assets, setAssets]       = useState([]);
  const [confirmed, setConfirmed] = useState({});
  const [loading, setLoading]     = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [activeSection, setActiveSection] = useState("all");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, c, p, u, a, cf] = await Promise.all([
        axios.get(`${BASE_URL}/sales`),
        axios.get(`${BASE_URL}/costs`),
        axios.get(`${BASE_URL}/products`),
        axios.get(`${BASE_URL}/utang/customers`),
        axios.get(`${BASE_URL}/api/assets`),
        axios.get(`${BASE_URL}/sales/confirmed`),
      ]);
      setSales(s.data);
      setCosts(c.data);
      setProducts(p.data);
      setCustomers(u.data);
      setAssets(Array.isArray(a.data) ? a.data : []);
      setConfirmed(cf.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Filtered data ────────────────────────────────────────────────────────
  const rangeSales = filterByDateRange(sales, "saleDate", dateRange);
  const rangeCosts = filterByDateRange(costs, "costDate", dateRange);

  const totalRevenue  = rangeSales.reduce((s, x) => s + getSaleTotal(x), 0);
  const totalExpenses = rangeCosts.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
  const netProfit     = totalRevenue - totalExpenses;
  const totalUtang    = customers.reduce((s, c) => s + parseFloat(c.balance || 0), 0);
  const totalAssets   = assets.reduce((s, a) => s + Number(a.value || 0), 0);

  // ── Previous period comparison ───────────────────────────────────────────
  const rangeDays  = Math.round((new Date(dateRange.to) - new Date(dateRange.from)) / 86400000) + 1;
  const prevEnd    = new Date(dateRange.from); prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart  = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - (rangeDays - 1));
  const prevSales  = filterByDateRange(sales, "saleDate", { from: prevStart.toISOString().split("T")[0], to: prevEnd.toISOString().split("T")[0] });
  const prevCosts  = filterByDateRange(costs, "costDate", { from: prevStart.toISOString().split("T")[0], to: prevEnd.toISOString().split("T")[0] });
  const prevRev    = prevSales.reduce((s, x) => s + getSaleTotal(x), 0);
  const prevExp    = prevCosts.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
  const revChange  = prevRev > 0 ? (((totalRevenue - prevRev) / prevRev) * 100).toFixed(1) : null;
  const expChange  = prevExp > 0 ? (((totalExpenses - prevExp) / prevExp) * 100).toFixed(1) : null;

  // ── Revenue vs Expenses line chart (daily) ───────────────────────────────
  const revenueVsExpenseChart = (() => {
    const map = {};
    const start = new Date(dateRange.from);
    const end   = new Date(dateRange.to);
    const cur   = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split("T")[0];
      map[key] = { date: fmtShort(key), revenue: 0, expenses: 0, profit: 0 };
      cur.setDate(cur.getDate() + 1);
    }
    rangeSales.forEach(s => { const k = new Date(s.saleDate).toISOString().split("T")[0]; if (map[k]) map[k].revenue += getSaleTotal(s); });
    rangeCosts.forEach(c => { const k = new Date(c.costDate).toISOString().split("T")[0]; if (map[k]) map[k].expenses += parseFloat(c.amount || 0); });
    Object.values(map).forEach(d => d.profit = d.revenue - d.expenses);
    return Object.values(map);
  })();

  // ── Monthly trend (last 6 months) ────────────────────────────────────────
  const monthlyTrend = (() => {
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().split("T")[0].slice(0, 7);
      months[key] = { month: fmtMonth(key + "-01"), revenue: 0, expenses: 0 };
    }
    sales.forEach(s => { const k = new Date(s.saleDate).toISOString().split("T")[0].slice(0, 7); if (months[k]) months[k].revenue += getSaleTotal(s); });
    costs.forEach(c => { const k = new Date(c.costDate).toISOString().split("T")[0].slice(0, 7); if (months[k]) months[k].expenses += parseFloat(c.amount || 0); });
    return Object.values(months);
  })();

  // ── Top selling products ─────────────────────────────────────────────────
  const productSales = {};
  rangeSales.forEach(s => {
    if (!s.productName || s.isDailySummary) return;
    if (!productSales[s.productName]) productSales[s.productName] = 0;
    productSales[s.productName] += getSaleTotal(s);
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, total]) => ({ name: name.length > 18 ? name.slice(0, 16) + "…" : name, total }));

  // ── Expense breakdown by category ────────────────────────────────────────
  const expenseByCategory = Object.entries(
    rangeCosts.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + parseFloat(c.amount || 0); return acc; }, {})
  ).map(([name, value]) => ({ name, value, fill: EXPENSE_COLORS[name] || "#9ca3af" }))
    .sort((a, b) => b.value - a.value);

  // ── Inventory analytics ──────────────────────────────────────────────────
  const outOfStock   = products.filter(p => parseInt(p.stock) === 0);
  const lowStock     = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= (p.reorder || 10));
  const essential    = products.filter(p => p.isEssential);
  const essentialOOS = products.filter(p => p.isEssential && parseInt(p.stock) === 0);

  const stockByCategory = Object.entries(
    products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + parseInt(p.stock || 0); return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, stock]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, stock }));

  // ── Utang analytics ──────────────────────────────────────────────────────
  const debtors         = customers.filter(c => parseFloat(c.balance || 0) > 0).sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  const exceededLimit   = customers.filter(c => parseFloat(c.balance || 0) > parseFloat(c.creditLimit || 1000));
  const fullyPaid       = customers.filter(c => parseFloat(c.balance || 0) === 0 && c.status === "paid");
  const utangPieData    = [
    { name: "Unpaid", value: customers.filter(c => c.status === "unpaid").length, fill: "#ef4444" },
    { name: "Partial", value: customers.filter(c => c.status === "partial").length, fill: "#f97316" },
    { name: "Paid", value: fullyPaid.length, fill: "#22c55e" },
  ].filter(d => d.value > 0);

  // ── Asset analytics ──────────────────────────────────────────────────────
  const assetByCategory = Object.entries(
    assets.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + Number(a.value || 0); return acc; }, {})
  ).map(([name, value]) => ({ name, value, fill: ASSET_COLORS[name] || "#9ca3af" }))
    .sort((a, b) => b.value - a.value);

  const assetByStatus = [
    { name: "Active",      value: assets.filter(a => a.status === "active").length,      fill: "#22c55e" },
    { name: "Maintenance", value: assets.filter(a => a.status === "maintenance").length, fill: "#eab308" },
    { name: "Disposed",    value: assets.filter(a => a.status === "disposed").length,    fill: "#ef4444" },
  ].filter(d => d.value > 0);

  // ── Cash reconciliation summary ──────────────────────────────────────────
  const reconciliationDays = Object.entries(
    rangeSales.reduce((acc, s) => {
      const k = new Date(s.saleDate).toISOString().split("T")[0];
      if (!acc[k]) acc[k] = 0;
      acc[k] += getSaleTotal(s);
      return acc;
    }, {})
  ).map(([date, system]) => ({
    date,
    system,
    actual: confirmed[date] ?? null,
    diff: confirmed[date] != null ? confirmed[date] - system : null,
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  const confirmedDays  = reconciliationDays.filter(d => d.actual != null).length;
  const matchedDays    = reconciliationDays.filter(d => d.diff === 0).length;
  const overDays       = reconciliationDays.filter(d => d.diff > 0).length;
  const shortDays      = reconciliationDays.filter(d => d.diff < 0).length;
  const totalVariance  = reconciliationDays.reduce((s, d) => s + (d.diff || 0), 0);

  const rangeLabel = dateRange.from === dateRange.to
    ? fmtShort(dateRange.from)
    : `${fmtShort(dateRange.from)} – ${fmtShort(dateRange.to)}`;

  const SECTIONS = [
    { key: "all",       label: "All" },
    { key: "overview",  label: "Overview" },
    { key: "sales",     label: "Sales" },
    { key: "inventory", label: "Inventory" },
    { key: "expenses",  label: "Expenses" },
    { key: "utang",     label: "Utang" },
    { key: "assets",    label: "Assets" },
  ];

  const show = (key) => activeSection === "all" || activeSection === key;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f6fa", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
          <div style={{ fontSize: "16px", color: "#9ca3af" }}>Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .reports-page { background: #f5f6fa; min-height: 100vh; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }
        .reports-header { background: #fff; border-bottom: 1px solid #eeeff3; padding: 20px 20px 0; position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
        .reports-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .reports-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding-bottom: 0; }
        .reports-tab { padding: 8px 16px; border-radius: 10px 10px 0 0; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.15s; }
        .reports-tab.active { background: #f5f6fa; color: #f97316; border-bottom: 2px solid #f97316; }
        .reports-tab:not(.active) { background: none; color: #9ca3af; }
        .reports-body { flex: 1; overflow-y: auto; padding: 20px 16px 100px; display: flex; flex-direction: column; gap: 24px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stats-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .chart-legend { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 10px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7280; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .reconcile-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .badge { display: inline-block; padding: "2px 8px"; border-radius: 99px; font-size: 11px; font-weight: 700; }

        @media (min-width: 768px) {
          .reports-header { padding: 20px 32px 0; }
          .reports-body { padding: 24px 32px 40px; }
          .stats-grid   { grid-template-columns: repeat(4, 1fr); }
          .stats-grid-4 { grid-template-columns: repeat(4, 1fr); }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
          .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: start; }
        }
      `}</style>

      <div className="reports-page">

        {/* Header */}
        <div className="reports-header">
          <div className="reports-header-top">
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>Reports & Analytics</h1>
            <DateRangeFilter range={dateRange} onChange={setDateRange} />
          </div>
          <div className="reports-tabs">
            {SECTIONS.map(s => (
              <button key={s.key} className={`reports-tab ${activeSection === s.key ? "active" : ""}`} onClick={() => setActiveSection(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reports-body">

          {/* ── OVERVIEW ── */}
          {show("overview") && (
            <div>
              <SectionTitle icon="📊" title="Business Overview" subtitle={`Summary for ${rangeLabel}`} />

              {/* Hero banner */}
              <div style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#2d2d4e 100%)", borderRadius: "18px", padding: "20px 24px", color: "#fff", marginBottom: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "Revenue",   value: fmt(totalRevenue),  color: "#86efac", change: revChange },
                    { label: "Expenses",  value: fmt(totalExpenses), color: "#fca5a5", change: expChange },
                    { label: "Net Profit",value: fmt(netProfit),     color: netProfit >= 0 ? "#86efac" : "#fca5a5", change: null },
                  ].map(({ label, value, color, change }) => (
                    <div key={label}>
                      <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color }}>{value}</div>
                      {change !== null && change !== undefined && (
                        <div style={{ fontSize: "11px", marginTop: "3px", color: parseFloat(change) >= 0 ? "#86efac" : "#fca5a5" }}>
                          {parseFloat(change) >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs prev
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat cards */}
              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Products"   value={products.length}      sub={`${outOfStock.length} out of stock`} icon="📦" color="#3b82f6" bg="#eff6ff" />
                <StatCard label="Total Utang"      value={fmt(totalUtang)}      sub={`${debtors.length} debtors`}         icon="👥" color="#ef4444" bg="#fef2f2" />
                <StatCard label="Total Asset Value" value={fmt(totalAssets)}    sub={`${assets.length} assets`}           icon="🏠" color="#22c55e" bg="#f0fdf4" />
                <StatCard label="Customers"        value={customers.length}     sub={`${fullyPaid.length} fully paid`}    icon="🤝" color="#a855f7" bg="#fdf4ff" />
              </div>

              {/* Revenue vs Expenses line chart */}
              <Card style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Revenue vs Expenses · {rangeLabel}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueVsExpenseChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(revenueVsExpenseChart.length / 5) - 1)} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line type="monotone" dataKey="revenue"  stroke="#22c55e" strokeWidth={2.5} dot={false} name="Revenue"  />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Expenses" />
                    <Line type="monotone" dataKey="profit"   stroke="#f97316" strokeWidth={2}   dot={false} name="Profit" strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {[["Revenue","#22c55e"],["Expenses","#ef4444"],["Profit","#f97316"]].map(([l,c]) => (
                    <div key={l} className="legend-item"><div className="legend-dot" style={{ background: c }} />{l}</div>
                  ))}
                </div>
              </Card>

              {/* Monthly trend bar chart */}
              <Card>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>6-Month Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="revenue"  fill="#22c55e" radius={[4,4,0,0]} name="Revenue"  />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {[["Revenue","#22c55e"],["Expenses","#ef4444"]].map(([l,c]) => (
                    <div key={l} className="legend-item"><div className="legend-dot" style={{ background: c }} />{l}</div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── SALES ── */}
          {show("sales") && (
            <div>
              <SectionTitle icon="📈" title="Sales Analytics" subtitle={rangeLabel} />

              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Sales"     value={fmt(totalRevenue)}        sub={`${rangeSales.length} transactions`}   icon="💰" color="#16a34a" bg="#f0fdf4" />
                <StatCard label="Avg per Day"     value={fmt(totalRevenue / Math.max(rangeDays,1))} sub="daily average"       icon="📅" color="#f97316" bg="#fff7ed" />
                <StatCard label="Confirmed Days"  value={`${confirmedDays}d`}       sub={`${matchedDays} matched`}            icon="✅" color="#3b82f6" bg="#eff6ff" />
                <StatCard label="Cash Variance"   value={fmt(Math.abs(totalVariance))} sub={totalVariance >= 0 ? "over system" : "under system"} icon="⚖️" color={totalVariance >= 0 ? "#16a34a" : "#ef4444"} bg={totalVariance >= 0 ? "#f0fdf4" : "#fef2f2"} />
              </div>

              {/* Top selling products bar */}
              <Card style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Top Selling Products</div>
                {topProducts.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No product sales recorded for this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="total" fill="#f97316" radius={[0,4,4,0]} name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Cash reconciliation */}
              <Card>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>Cash Reconciliation</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "14px" }}>System vs confirmed actual cash per day</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                  {[
                    { label: "Matched",  value: matchedDays, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Over",     value: overDays,    color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Short",    value: shortDays,   color: "#ef4444", bg: "#fef2f2" },
                    { label: "Unconfirmed", value: reconciliationDays.length - confirmedDays, color: "#9ca3af", bg: "#f9fafb" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: "12px", padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: "700", color }}>{value}</div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {reconciliationDays.slice(0, 7).map((r, i) => (
                  <div key={r.date} className="reconcile-row" style={{ borderBottom: i === Math.min(6, reconciliationDays.length - 1) ? "none" : "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{fmtShort(r.date)}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>System: {fmt(r.system)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {r.actual != null ? (
                        <>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: r.diff === 0 ? "#16a34a" : r.diff > 0 ? "#3b82f6" : "#ef4444" }}>
                            {fmt(r.actual)}
                          </div>
                          <div style={{ fontSize: "11px", color: r.diff === 0 ? "#16a34a" : r.diff > 0 ? "#3b82f6" : "#ef4444" }}>
                            {r.diff === 0 ? "✓ matched" : r.diff > 0 ? `+${fmt(r.diff)} over` : `${fmt(r.diff)} short`}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#d1d5db" }}>Not confirmed</div>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── INVENTORY ── */}
          {show("inventory") && (
            <div>
              <SectionTitle icon="📦" title="Inventory Analytics" subtitle={`${products.length} total products`} />

              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Products"  value={products.length}        sub="in inventory"              icon="📦" color="#3b82f6" bg="#eff6ff" />
                <StatCard label="Out of Stock"    value={outOfStock.length}      sub="need restocking"           icon="🚨" color="#ef4444" bg="#fef2f2" />
                <StatCard label="Low Stock"       value={lowStock.length}        sub="below reorder level"       icon="⚠️" color="#d97706" bg="#fffbeb" />
                <StatCard label="Essential OOS"   value={essentialOOS.length}    sub="critical restock needed"   icon="⭐" color="#f97316" bg="#fff7ed" />
              </div>

              <div className="two-col" style={{ marginBottom: "14px" }}>
                {/* Stock by category */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Stock by Category</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stockByCategory} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [v + " pcs", "Stock"]} />
                      <Bar dataKey="stock" fill="#3b82f6" radius={[0,4,4,0]} name="Stock" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Out of stock list */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>🚨 Out of Stock</div>
                  {outOfStock.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>All products are in stock! 🎉</div>
                  ) : outOfStock.slice(0, 8).map(p => (
                    <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{p.category}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: p.isEssential ? "#fef08a" : "#fee2e2", color: p.isEssential ? "#a16207" : "#ef4444", padding: "2px 8px", borderRadius: "99px" }}>
                        {p.isEssential ? "⭐ ESSENTIAL" : "OOS"}
                      </span>
                    </div>
                  ))}
                  {outOfStock.length > 8 && <div style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", paddingTop: "10px" }}>+{outOfStock.length - 8} more</div>}
                </Card>
              </div>

              {/* Low stock list */}
              {lowStock.length > 0 && (
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>⚠️ Low Stock Items</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {lowStock.slice(0, 10).map(p => (
                      <div key={p._id} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: "#d97706", marginTop: "2px" }}>{p.stock} pcs left · reorder at {p.reorder || 10}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── EXPENSES ── */}
          {show("expenses") && (
            <div>
              <SectionTitle icon="💸" title="Expense Analytics" subtitle={rangeLabel} />

              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Expenses"  value={fmt(totalExpenses)}          sub={`${rangeCosts.length} entries`}   icon="🧾" color="#ef4444" bg="#fef2f2" />
                <StatCard label="Avg per Day"     value={fmt(totalExpenses / Math.max(rangeDays,1))} sub="daily average"    icon="📅" color="#f97316" bg="#fff7ed" />
                <StatCard label="Biggest Category" value={expenseByCategory[0]?.name || "—"} sub={expenseByCategory[0] ? fmt(expenseByCategory[0].value) : ""} icon="📌" color="#a855f7" bg="#fdf4ff" />
                <StatCard label="Net Profit"      value={fmt(netProfit)}              sub={netProfit >= 0 ? "profitable" : "at a loss"} icon={netProfit >= 0 ? "📈" : "📉"} color={netProfit >= 0 ? "#16a34a" : "#ef4444"} bg={netProfit >= 0 ? "#f0fdf4" : "#fef2f2"} />
              </div>

              <div className="two-col" style={{ marginBottom: "14px" }}>
                {/* Expense pie */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>By Category</div>
                  {expenseByCategory.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No expenses this period.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {expenseByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="chart-legend">
                        {expenseByCategory.map(e => (
                          <div key={e.name} className="legend-item"><div className="legend-dot" style={{ background: e.fill }} />{e.name}</div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* Expense breakdown list */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Breakdown</div>
                  {expenseByCategory.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No expenses this period.</div>
                  ) : expenseByCategory.map(e => {
                    const pct = totalExpenses > 0 ? ((e.value / totalExpenses) * 100).toFixed(1) : 0;
                    return (
                      <div key={e.name} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: e.fill }} />
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{e.name}</span>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a2e" }}>{fmt(e.value)}</span>
                        </div>
                        <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "99px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: e.fill, borderRadius: "99px", transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", textAlign: "right" }}>{pct}%</div>
                      </div>
                    );
                  })}
                </Card>
              </div>

              {/* Profit/Loss summary */}
              <Card>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Profit & Loss Summary</div>
                {[
                  { label: "Revenue",   value: totalRevenue,  color: "#16a34a" },
                  { label: "Expenses",  value: -totalExpenses, color: "#ef4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "14px", color: "#374151" }}>{label}</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color }}>{value < 0 ? "-" : ""}{fmt(Math.abs(value))}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e" }}>Net Profit</span>
                  <span style={{ fontSize: "18px", fontWeight: "700", color: netProfit >= 0 ? "#16a34a" : "#ef4444" }}>{fmt(netProfit)}</span>
                </div>
              </Card>
            </div>
          )}

          {/* ── UTANG ── */}
          {show("utang") && (
            <div>
              <SectionTitle icon="👥" title="Utang Analytics" subtitle={`${customers.length} customers`} />

              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Outstanding" value={fmt(totalUtang)}         sub={`${debtors.length} debtors`}         icon="💸" color="#ef4444" bg="#fef2f2" />
                <StatCard label="Exceeded Limit"    value={exceededLimit.length}    sub="over credit limit"                   icon="⚠️" color="#d97706" bg="#fffbeb" />
                <StatCard label="Fully Paid"        value={fullyPaid.length}        sub="customers"                           icon="✅" color="#16a34a" bg="#f0fdf4" />
                <StatCard label="Avg Balance"       value={fmt(totalUtang / Math.max(debtors.length,1))} sub="per debtor"    icon="📊" color="#3b82f6" bg="#eff6ff" />
              </div>

              <div className="two-col" style={{ marginBottom: "14px" }}>
                {/* Customer status pie */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Customer Status</div>
                  {utangPieData.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No customers yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={utangPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {utangPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="chart-legend">
                        {utangPieData.map(e => (
                          <div key={e.name} className="legend-item"><div className="legend-dot" style={{ background: e.fill }} />{e.name}: {e.value}</div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* Top debtors */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Top Debtors</div>
                  {debtors.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No outstanding balances! 🎉</div>
                  ) : debtors.slice(0, 6).map((c, i) => {
                    const bal   = parseFloat(c.balance || 0);
                    const limit = parseFloat(c.creditLimit || 1000);
                    const pct   = Math.min((bal / limit) * 100, 100);
                    const over  = bal > limit;
                    return (
                      <div key={c._id} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{c.customerName}</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: over ? "#ef4444" : "#1a1a2e" }}>{fmt(bal)}</span>
                        </div>
                        <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "99px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: over ? "#ef4444" : pct > 75 ? "#eab308" : "#22c55e", borderRadius: "99px" }} />
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Limit: {fmt(limit)}{over ? " · EXCEEDED" : ""}</div>
                      </div>
                    );
                  })}
                </Card>
              </div>

              {/* Customers exceeding limit */}
              {exceededLimit.length > 0 && (
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#ef4444", marginBottom: "14px" }}>⚠️ Customers Exceeding Credit Limit</div>
                  {exceededLimit.map(c => (
                    <div key={c._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{c.customerName}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>Limit: {fmt(c.creditLimit || 1000)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#ef4444" }}>{fmt(c.balance)}</div>
                        <div style={{ fontSize: "11px", color: "#ef4444" }}>+{fmt(parseFloat(c.balance) - parseFloat(c.creditLimit || 1000))} over</div>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ── ASSETS ── */}
          {show("assets") && (
            <div>
              <SectionTitle icon="🏠" title="Asset Analytics" subtitle={`${assets.length} total assets`} />

              <div className="stats-grid" style={{ marginBottom: "14px" }}>
                <StatCard label="Total Value"    value={fmt(totalAssets)}                      sub={`${assets.length} assets`}       icon="💎" color="#f97316" bg="#fff7ed" />
                <StatCard label="Active"         value={assets.filter(a=>a.status==="active").length}      sub="in service"         icon="✅" color="#16a34a" bg="#f0fdf4" />
                <StatCard label="Maintenance"    value={assets.filter(a=>a.status==="maintenance").length} sub="being serviced"     icon="🔧" color="#d97706" bg="#fffbeb" />
                <StatCard label="Disposed"       value={assets.filter(a=>a.status==="disposed").length}   sub="retired"            icon="📤" color="#9ca3af" bg="#f9fafb" />
              </div>

              <div className="two-col" style={{ marginBottom: "14px" }}>
                {/* Asset value by category pie */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Value by Category</div>
                  {assetByCategory.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No assets yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={assetByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {assetByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="chart-legend">
                        {assetByCategory.map(e => (
                          <div key={e.name} className="legend-item"><div className="legend-dot" style={{ background: e.fill }} />{e.name}</div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* Asset status pie */}
                <Card>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Status Distribution</div>
                  {assetByStatus.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: "13px" }}>No assets yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={assetByStatus} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                            {assetByStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="chart-legend">
                        {assetByStatus.map(e => (
                          <div key={e.name} className="legend-item"><div className="legend-dot" style={{ background: e.fill }} />{e.name}: {e.value}</div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* Asset list by value */}
              <Card>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "14px" }}>Assets by Value</div>
                {[...assets].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 8).map((a, i, arr) => (
                  <div key={a._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>{a.name}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>{a.category} · {a.status}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e" }}>{fmt(a.value)}</div>
                      {a.quantity != null && <div style={{ fontSize: "11px", color: "#9ca3af" }}>Qty: {a.quantity}</div>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

        </div>
      </div>
    </>
  );
}