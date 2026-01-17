import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [userName, setUserName] = useState("User");
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const usernameSlug = username || "user";
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCurrentMonthData, setHasCurrentMonthData] = useState(true);

  // Derived chart data
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  function isActive(path) {
   return location.pathname === path;
}

  // AUTH GUARD + DATA FETCH
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Unauthorized! Please log in.");
    navigate("/", { replace: true });
    return;
  }

  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.name) setUserName(parsed.name);
      const slug = parsed.name.trim().replace(/\s+/g, "_").toLowerCase();
      if (slug !== usernameSlug) {
        alert("Unauthorized access to another user's dashboard.");
        navigate("/", { replace: true });
        return;
      }
    } catch {
      // ignore parse error, keep default
    }
  }

  async function fetchTransactions() {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/transactions");

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.transactions)
        ? res.data.transactions
        : [];

      setTransactions(data);
      buildCharts(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
      setCategoryData([]);
      setMonthlyData([]);
      setHasCurrentMonthData(false);
    } finally {
      setLoading(false);
    }
  }

  fetchTransactions();
}, []); // no warning now


  function buildCharts(allTx) {
    if (!allTx || allTx.length === 0) {
      setCategoryData([]);
      setMonthlyData([]);
      setHasCurrentMonthData(false);
      return;
    }

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Filter current month expenses (type === "expense")
    const currentMonthExpenses = allTx.filter((t) => {
      const d = new Date(t.date || t.createdAt || Date.now());
      const isExpense =
        (t.type && t.type.toLowerCase() === "expense") ||
        (t.category && t.amount && t.amount < 0); // fallback
      return (
        isExpense &&
        d.getMonth() === curMonth &&
        d.getFullYear() === curYear
      );
    });

    if (currentMonthExpenses.length === 0) {
      setCategoryData([]);
      setHasCurrentMonthData(false);
    } else {
      setHasCurrentMonthData(true);
      // Group by category for pie chart
      const categoryMap = {};
      currentMonthExpenses.forEach((t) => {
        const cat = t.category || "Other";
        const amt = Math.abs(Number(t.amount) || 0);
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += amt;
      });
      const catArray = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(catArray);
    }

    // Build last 6 months bar chart (expense totals)
    const monthsBack = 6;
    const monthLabels = [];
    const monthMap = {};

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthLabels.push({ key, label: d.toLocaleString("en", { month: "short" }) });
      monthMap[key] = 0;
    }

    allTx.forEach((t) => {
      const d = new Date(t.date || t.createdAt || Date.now());
      const isExpense =
        (t.type && t.type.toLowerCase() === "expense") ||
        (t.category && t.amount && t.amount < 0);
      if (!isExpense) return;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthMap) {
        monthMap[key] += Math.abs(Number(t.amount) || 0);
      }
    });

    const monthlyArray = monthLabels.map(({ key, label }) => ({
      month: label,
      spending: monthMap[key],
    }));

    setMonthlyData(monthlyArray);
  }

  // Pie colors (within palette vibe)
  const PIE_COLORS = ["#E7C4A8", "#E9A96B", "#5A3D8C", "#F8EDE2", "#C58F6A"];

  // Recent transactions: latest 5
  const recentTx = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt || 0) -
        new Date(a.date || a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <>
      <style>{CSS}</style>

      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>

          <nav className="nav">
          <div
            className="nav-item active"
            onClick={() => navigate(`/${usernameSlug}/dashboard`)}
          >
            <span>📊</span>
            <label>Dashboard</label>
          </div>
            <div className="nav-item">
              <span>📈</span>
              <label>Analytics</label>
            </div>
            <div className="nav-item">
              <span>💡</span>
              <label>Insights</label>
            </div>
            <div className="nav-item">
              <span>🎯</span>
              <label>Budget Planner</label>
            </div>
            <div
              className="nav-item"
              onClick={() => navigate(`/${usernameSlug}/transactions`)}
            >
             <span>💳</span>
              <label>Transactions</label>
            </div>


            <div
              className="nav-item"
              onClick={() => navigate(`/${usernameSlug}/profile`)}
            >
             <span>👤</span>
              <label>Profile</label>
            </div>
          </nav>

          <div
            className="nav-item logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/", { replace: true });
            }}
          >
            <span>🚪</span>
            <label>Logout</label>
          </div>
        </aside>

        {/* MAIN CENTER */}
        <main className="main">
          {/* Top Section */}
          <section className="card big">
            <div className="top-header">
              <h2>Financial Overview</h2>
              {loading && <span className="muted small-text">Loading data…</span>}
            </div>

            <div className="kpi-row">
              <div className="kpi">
                <span className="kpi-label">Profit</span>
                <span className="kpi-value">12.5%</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Revenue</span>
                <span className="kpi-value">₹4.2L</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Goal</span>
                <span className="kpi-value">80%</span>
              </div>
            </div>

            {/* Main Visualization Area: Pie + Bar */}
            <div className="visual-row">
              <div className="visual-card">
                <div className="visual-title">Spending by Category (This Month)</div>
                <div className="visual-body">
                  {hasCurrentMonthData && categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              stroke="#FFFFFF"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      No expenditure in this month.
                    </div>
                  )}
                </div>
              </div>

              <div className="visual-card">
                <div className="visual-title">Last Months Overview</div>
                <div className="visual-body">
                  {monthlyData.some((m) => m.spending > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7C4A880" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value}`} />
                        <Legend />
                        <Bar
                          dataKey="spending"
                          name="Spending"
                          fill="#E9A96B"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      No last month overall report.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Section – investment cards */}
          <section className="cards">
            {[
              { id: 1, label: "Investment 1", target: 65 },
              { id: 2, label: "Investment 2", target: 70 },
              { id: 3, label: "Investment 3", target: 75 },
              { id: 4, label: "Investment 4", target: 80 },
            ].map((item) => (
              <div key={item.id} className="card small">
                <h3>{item.label}</h3>
                <div className="progress">
                  <div
                    className="fill"
                    style={{ width: `${item.target}%` }}
                  ></div>
                </div>
                <p className="muted">Target {item.target}%</p>
              </div>
            ))}
          </section>
        </main>

        {/* RIGHT SIDE */}
        <aside className="right">
          <div className="card user-card">
            <div className="avatar">👤</div>
            <h3>{userName}</h3>
            <p className="muted">Premium User</p>
          </div>

          <div className="card">
            <h3>Recent Transactions</h3>

            {recentTx.length === 0 && !loading && (
              <p className="muted small-text">No recent transactions found.</p>
            )}

            {recentTx.map((t) => {
              const title = t.title || t.description || t.category || "Transaction";
              const amt = Number(t.amount) || 0;
              const sign = amt >= 0 ? "+" : "−";
              const displayAmt = `${sign}₹${Math.abs(amt)}`;
              return (
                <div key={t._id || t.id} className="row">
                  <span>{title}</span>
                  <span className={amt >= 0 ? "pos" : "neg"}>{displayAmt}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}

/* ================= CSS (soft pastel palette) ================= */

const CSS = `
*{
  margin:0; padding:0; box-sizing:border-box;
  font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont;
}

body{
  background:#FFFFFF;
}

.app{
  background:#FFFFFF;
  display:flex;
  max-width:1440px;
  margin:auto;
  height:100vh;
  gap:16px;
  padding:16px;
  color:#2A2A2A;
}

/* SIDEBAR */
.sidebar{
  width:240px;
  background:#F8EDE2;
  border-radius:24px;
  padding:24px 16px;
  display:flex;
  flex-direction:column;
  box-shadow:
    -4px -4px 8px rgba(255,255,255,0.8),
    6px 6px 16px rgba(0,0,0,0.06);
}

.logo{
  font-size:22px;
  font-weight:600;
  text-align:center;
  margin-bottom:24px;
  color:#5A3D8C;
}

.nav{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.nav-item{
  display:flex;
  align-items:center;
  gap:12px;
  padding:10px 12px;
  border-radius:16px;
  cursor:pointer;
  font-size:14px;
  font-weight:500;
  transition:0.25s ease;
  color:#2A2A2A;
}

.nav-item span{
  font-size:18px;
  color:#5A3D8C;
}

.nav-item:hover{
  background:#F2E3D4;
}

.nav-item.active{
  background:#E7C4A8;
  box-shadow:0 0 8px rgba(231,196,168,0.7);
}

.logout{
  margin-top:auto;
  background:#F1E2D6;
}

/* MAIN CENTER */
.main{
  flex:1;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.card{
  border-radius:24px;
  padding:24px;
  background:#F8EDE2;
  box-shadow:
    -4px -4px 10px rgba(255,255,255,0.9),
    8px 8px 18px rgba(0,0,0,0.08);
}

.big{
  min-height:360px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.top-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.top-header h2{
  font-size:20px;
  font-weight:600;
}

/* KPI badges */
.kpi-row{
  display:flex;
  gap:12px;
  margin-top:4px;
}

.kpi{
  background:#E7C4A8;
  padding:8px 16px;
  border-radius:999px;
  display:flex;
  flex-direction:column;
  gap:2px;
}

.kpi-label{
  font-size:11px;
  color:#4b4b4b;
}

.kpi-value{
  font-size:14px;
  font-weight:600;
}

/* Visualization row */
.visual-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-top:16px;
}

.visual-card{
  background:#F8EDE2;
  border-radius:20px;
  padding:16px;
  box-shadow:
    -3px -3px 8px rgba(255,255,255,0.8),
    4px 4px 14px rgba(0,0,0,0.06);
  display:flex;
  flex-direction:column;
  gap:8px;
}

.visual-title{
  font-size:14px;
  font-weight:500;
  color:#2A2A2A;
}

.visual-body{
  flex:1;
  min-height:200px;
}

/* Empty states */
.empty-state{
  font-size:13px;
  color:#A0A0A0;
  display:flex;
  align-items:center;
  justify-content:center;
  height:100%;
}

/* Bottom cards (investments) */
.cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:16px;
}

.small{
  min-height:140px;
}

.progress{
  height:8px;
  background:#F1DCC9;
  border-radius:8px;
  margin:10px 0;
  overflow:hidden;
}

.fill{
  height:100%;
  background:#E9A96B;
  border-radius:8px;
}

/* RIGHT COLUMN */
.right{
  width:260px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* Profile */
.user-card{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
}

.avatar{
  width:60px;
  height:60px;
  border-radius:50%;
  background:#5A3D8C;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:30px;
  margin-bottom:8px;
  color:#F8EDE2;
}

.muted{
  color:#8c8c8c;
  font-size:12px;
}

.small-text{
  font-size:12px;
}

/* Recent transactions */
.row{
  display:flex;
  justify-content:space-between;
  font-size:13px;
  margin-top:8px;
}

.pos{
  color:#2d7a3f;
}

.neg{
  color:#b33939;
}

/* RESPONSIVE */
@media(max-width:1200px){
  .right{ display:none; }
}

@media(max-width:768px){
  .app{
    flex-direction:column;
    height:auto;
  }
  .sidebar{
    width:100%;
    flex-direction:row;
    align-items:center;
    justify-content:space-between;
  }
  .nav{
    flex-direction:row;
    flex-wrap:wrap;
  }
  .nav-item label{
    display:none;
  }
  .visual-row{
    grid-template-columns:1fr;
  }
}
`;
