import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AreaChart, Area } from "recharts"
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
  LineChart,
  Line
} from "recharts";

/* ================= GLOBAL COLOR SYSTEM =================
Edit ONLY here to change entire dashboard theme
======================================================== */

const THEME = {

  /* background layers */
  page: "#0b0f2a",
  sidebar: "#0d132f",
  card: "#151a3a",

  /* glass overlay */
  glass: "rgba(21,26,58,0.65)",

  /* text */
  text: "#e6e9ff",
  muted: "#9aa3d2",
  title: "#ffffff",

  /* navigation */
  navActive: "#6c7cff",
  navHover: "#1e2555",

  /* financial */
  income: "#22c55e",
  expense: "#ff4d6d",

  /* charts */
  lineIncome: "#6c7cff",
  lineExpense: "#ff7ac6",
  grid: "#2b3368",

  /* pie palette */
  pie: [
    "#6c7cff",
    "#b06cff",
    "#6cff9f",
    "#ff7ac6",
    "#ffc857"
  ],

  /* glow */
  glow: "rgba(108,124,255,0.55)"
};

export default function Dashboard() {
  const [userName, setUserName] = useState("User");
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const usernameSlug = username || "user";
  const [transactions, setTransactions] = useState([]);
  const [dateFilter,setDateFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balanceChange,setBalanceChange] = useState(0);
  const [expenseChange,setExpenseChange] = useState(0);
  const [selectedCategory,setSelectedCategory] = useState(null);
  const [hasCurrentMonthData, setHasCurrentMonthData] = useState(true);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [periodTx,        setPeriodTx]        = useState([]);
  const [currentMonthTx,  setCurrentMonthTx]  = useState([]);
  const [currentWeekTx,   setCurrentWeekTx]   = useState([]);
  const [drillDownMonth, setDrillDownMonth] = useState(null);

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
      const data = Array.isArray(res.data?.items) ? res.data.items : [];
      setTransactions(data);
      buildCharts(data);           // ← call without filter
    } catch (err) {
      console.error(err);
      setTransactions([]);
      buildCharts([]);
    } finally {
      setLoading(false);
    }
  }

  fetchTransactions();
}, []);

useEffect(() => {
  if (transactions.length > 0) {
    buildCharts(transactions);
  }
}, [dateFilter, transactions]);

// NEW: Handle clicking on a month in the bar chart
useEffect(() => {
  if (!drillDownMonth || !transactions.length) return;

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mIndex = monthNames.indexOf(drillDownMonth);
  if (mIndex === -1) return;

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === mIndex && d.getFullYear() === new Date().getFullYear();
  });

  let vIncome = 0, vExpense = 0;
  monthTx.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "income") vIncome += amt;
    if (t.type === "expense") vExpense += amt;
  });

  setTotalBalance(vIncome - vExpense);
  setTotalExpense(vExpense);

  // Pie for this month
  const catMap = {};
  monthTx.forEach(t => {
    if (t.type === "expense") {
      const cat = t.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
    }
  });
  setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
}, [drillDownMonth, transactions]);


  function buildCharts(allTransactions) {
  if (!allTransactions || allTransactions.length === 0) {
    setPeriodTx([]);
    setCurrentMonthTx([]);
    setCurrentWeekTx([]);
    setCategoryData([]);
    setMonthlyData([]);
    setIncomeExpenseData([]);
    setTotalBalance(0);
    setTotalExpense(0);
    setBalanceChange(0);
    setExpenseChange(0);
    setHasCurrentMonthData(false);
    return;
  }

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear  = now.getFullYear();

  // ───────────────────────────────────────────────
  //  A. Current MONTH transactions (fixed – used for pie + bar + % calc)
  // ───────────────────────────────────────────────
  const currentMonthTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });

  setCurrentMonthTx(currentMonthTransactions);

  // Current month totals (for pie & % base)
  let monthIncome  = 0;
  let monthExpense = 0;

  currentMonthTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "income")  monthIncome  += amt;
    if (t.type === "expense") monthExpense += amt;
  });

  // ───────────────────────────────────────────────
  //  B. Previous month (for % change – always full month)
  // ───────────────────────────────────────────────
  const prevMonthStart = new Date(curYear, curMonth - 1, 1);
  const prevMonthEnd   = new Date(curYear, curMonth,     0);

  let prevIncome  = 0;
  let prevExpense = 0;

  allTransactions.forEach(t => {
    const d = new Date(t.date);
    if (d >= prevMonthStart && d <= prevMonthEnd) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income")  prevIncome  += amt;
      if (t.type === "expense") prevExpense += amt;
    }
  });

  const balanceDiff = monthIncome - prevIncome;
  const expenseDiff = monthExpense - prevExpense;

  setBalanceChange(prevIncome  === 0 ? "New" : ((balanceDiff  / prevIncome)  * 100).toFixed(1));
  setExpenseChange(prevExpense === 0 ? "New" : ((expenseDiff / prevExpense) * 100).toFixed(1));

  // ───────────────────────────────────────────────
  //  C. PERIOD filtered transactions (dropdown) → balance + recent list
  // ───────────────────────────────────────────────
  let startDate = new Date(0);

  if (dateFilter === "today") {
    startDate = new Date(now);
    startDate.setHours(0,0,0,0);
  } else if (dateFilter === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6); // last 7 days including today
  } else if (dateFilter === "month") {
    startDate = new Date(curYear, curMonth, 1);
  } else if (dateFilter === "3months") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3);
  }

  const filteredPeriod = allTransactions.filter(t => new Date(t.date) >= startDate);

  setPeriodTx(filteredPeriod);

  let periodIncome  = 0;
  let periodExpense = 0;

  filteredPeriod.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "income")  periodIncome  += amt;
    if (t.type === "expense") periodExpense += amt;
  });

  setTotalBalance(monthIncome - monthExpense);
  setTotalExpense(monthExpense);

  // ───────────────────────────────────────────────
  //  D. LAST 7 DAYS line chart – fixed for ISO dates
  // ───────────────────────────────────────────────
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const last7DaysTx = allTransactions.filter(t => {
    const txDate = new Date(t.date);  // ← works directly with "2026-03-16T00:00:00.000Z"
    return txDate >= sevenDaysAgo && txDate <= now;
  });

  console.log("Transactions in last 7 days:", last7DaysTx.length);
  console.log("Matched dates:", last7DaysTx.map(t => t.date));

  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build 7-day slots (oldest to newest)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayIndex = date.getDay();
    days.push({
      day: dayNames[dayIndex],
      income: 0,
      expense: 0
    });
  }

  last7DaysTx.forEach(t => {
    const txDate = new Date(t.date);
    const dayIndex = txDate.getDay();
    const dayName = dayNames[dayIndex];
    
    const found = days.find(item => item.day === dayName);
    if (found) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") found.income += amt;
      if (t.type === "expense") found.expense += amt;
    }
  });

  console.log("Final incomeExpenseData:", days);
  setIncomeExpenseData(days);

  // ───────────────────────────────────────────────
  //  E. Pie chart – always current month expenses
  // ───────────────────────────────────────────────
  const categoryMap = {};

  currentMonthTransactions.forEach(t => {
    if (t.type === "expense") {
      const cat = t.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
    }
  });

  const catArray = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  setCategoryData(catArray);
  setHasCurrentMonthData(catArray.length > 0);

  // ───────────────────────────────────────────────
  //  F. Monthly bar chart – always full year
  // ───────────────────────────────────────────────
  const monthMap = {};
  const monthLabels = [];

  for (let m = 0; m < 12; m++) {
    const d = new Date(curYear, m, 1);
    const key = `${curYear}-${m}`;
    monthLabels.push({ key, label: d.toLocaleString("en", { month: "short" }) });
    monthMap[key] = { income: 0, expense: 0 };
  }

  allTransactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthMap[key]) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income")  monthMap[key].income  += amt;
      if (t.type === "expense") monthMap[key].expense += amt;
    }
  });

  setMonthlyData(
    monthLabels.map(({ key, label }) => ({
      month: label,
      income: monthMap[key].income,
      expense: monthMap[key].expense,
      balance: monthMap[key].income - monthMap[key].expense
    }))
  );
}

  // Recent transactions: latest 5
  let displayTx = periodTx;

  if (drillDownMonth) {
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const mIndex = monthNames.indexOf(drillDownMonth);
    displayTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === mIndex && d.getFullYear() === new Date().getFullYear();
    });
  }

  const recentTx = displayTx
    .filter((t) => !selectedCategory || t.category === selectedCategory)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <>
      <style>{CSS}</style>

      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-title">FinTrack overview</div>
            <div
              className="header-user clickable"
              onClick={() => navigate(`/${usernameSlug}/profile`)}
            >
              <div className="avatar">👤</div>
              <span>{userName}</span>
            </div>
        </header>


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
          <div className="kpi-row">

            <div className="kpi">

            <div className="kpi-top">
            <span>Total Balance</span>

            <span className={balanceChange >= 0 ? "trend up":"trend down"}>
            {balanceChange}%
            </span>

            </div>

            <div className="kpi-value">
              ₹{totalBalance.toLocaleString()}
            </div>

          <div className="kpi-trend">
            <div style={{height:50,width:"100%"}}>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>

                  <defs>
                  <linearGradient id="balanceTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c83ff" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#7c83ff" stopOpacity={0}/>
                  </linearGradient>
                  </defs>

                  <XAxis
                  dataKey="month"
                  hide
                  />

                  <Tooltip
                  formatter={(v)=>[`₹${v}`, "Balance"]}
                  labelFormatter={(m)=>`Month: ${m}`}
                  />

                  <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#7c83ff"
                  fill="url(#balanceTrend)"
                  strokeWidth={2}
                  connectNulls
                  />

                  </AreaChart>
                </ResponsiveContainer>

              </div>
            </div>
            </div>


            <div className="kpi">

            <div className="kpi-top">
            <span>Total Expense</span>

            <span className={expenseChange >= 0 ? "trend up":"trend down"}>
            {expenseChange}%
            </span>

            </div>

            <div className="kpi-value">
            ₹{totalExpense.toLocaleString()}
            </div>

            </div>

            </div>

          <section className="card">

            <h3>Monthly Overview</h3>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart
              data={monthlyData}
              barCategoryGap="40%"
              barGap={4}
              >
              <defs>
                <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c83ff"/>
                <stop offset="100%" stopColor="#4953ff"/>
                </linearGradient>

                <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7ac6"/>
                <stop offset="100%" stopColor="#ff4fa6"/>
                </linearGradient>
                </defs>

              <CartesianGrid stroke={THEME.grid} strokeDasharray="3 3"/>

              <XAxis dataKey="month" stroke={THEME.muted}/>
              <YAxis stroke={THEME.muted}/>

              <Tooltip />

                <Bar
                  dataKey="income"
                  fill="url(#incomeBar)"
                  radius={[10,10,0,0]}
                  barSize={20}
                  onClick={(data) => setDrillDownMonth(data.month)}   // ← ADD THIS
                />

                <Bar
                  dataKey="expense"
                  fill="url(#expenseBar)"
                  radius={[10,10,0,0]}
                  barSize={20}
                  onClick={(data) => setDrillDownMonth(data.month)}   // ← ADD THIS
                />

              </BarChart>
              </ResponsiveContainer>

            </section>

          <section className="card transactions-card">
          <h3>Recent Transactions</h3>
          <h3>
            {drillDownMonth 
              ? `${drillDownMonth} Transactions` 
              : dateFilter === "today" ? "Today's Transactions"
              : dateFilter === "week" ? "This Week's Transactions"
              : dateFilter === "month" ? "This Month's Transactions"
              : "Last 3 Months Transactions"}
          </h3>
          {drillDownMonth && (
            <button
              onClick={() => setDrillDownMonth(null)}
              style={{
                marginBottom: "8px",
                padding: "4px 12px",
                background: "#ff4d6d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              ← Back to Current Month
            </button>
          )}
          <select
            value={dateFilter}
            onChange={(e) => {
            setDateFilter(e.target.value);
            setDrillDownMonth(null);}}
            style={{
            padding:"6px 10px",
            borderRadius:8,
            background:"#1e2555",
            color:"#fff",
            border:"1px solid #2b3368"
            }}
            >

            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>

            </select>

          <table className="tx-table">

          <thead>
          <tr>
          <th>Title</th>
          <th>Date</th>
          <th>Type</th>
          <th>Amount</th>
          </tr>
          </thead>

          <tbody>

          {recentTx.map((t)=>(
          <tr key={t._id || t.date}>

          <td>{t.description || t.category}</td>

          <td>{new Date(t.date).toLocaleDateString()}</td>

          <td className={t.type==="income" ? "income" : "expense"}>
          {t.type}
          </td>

          <td
          style={{
          color: t.type==="income"
          ? THEME.income
          : THEME.expense
          }}
          >
          {t.type==="income" ? "+" : "-"}₹{Math.abs(t.amount)}
          </td>

          </tr>
          ))}

          </tbody>

          </table>

          </section>


        </main>

        {/* RIGHT SIDE */}
        <aside className="right">
          <div className="card donut-card">

            <h3>Total Expense</h3>

              <div className="donut-wrapper">

                <div className="donut-chart">

                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>

                      <Pie
                        data={categoryData.length > 0 ? categoryData : [{ name: "No expenses", value: 1 }]}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={categoryData.length > 0 ? 3 : 0}
                        labelLine={false}
                        onClick={(data) => setSelectedCategory(data.name)}
                        label={categoryData.length > 0 ? 
                          ({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                            const RAD = Math.PI / 180;
                            const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + r * Math.cos(-midAngle * RAD);
                            const y = cy + r * Math.sin(-midAngle * RAD);
                            return (
                              <text x={x} y={y} fill="#000" textAnchor="middle" dominantBaseline="central" fontSize={11}>
                                {(percent * 100).toFixed(0)}%
                              </text>
                            );
                          } 
                          : false
                        }
                      >
                        {categoryData.length > 0 ? (
                          categoryData.map((entry, index) => (
                            <Cell key={index} fill={THEME.pie[index % THEME.pie.length]} />
                          ))
                        ) : (
                          <Cell fill="#000000" />   // pure black donut when no expense
                        )}
                      </Pie>

                    </PieChart>
                  </ResponsiveContainer>

                  <div
                    className="donut-center"
                    onClick={()=>setSelectedCategory(null)}
                  >
                    <div>₹{totalExpense.toLocaleString()}</div>
                    <span>Total</span>
                  </div>

                </div>

                <div className="pie-legend">
                  {categoryData.length > 0 && categoryData.map((c,i)=>(
                    <div key={i} className="legend-row">
                      <span
                        className="legend-dot"
                        style={{background:THEME.pie[i]}}
                      ></span>
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>


            <section className="card">
              <h3>Income vs Expenses (Last 7 Days)</h3>

              <ResponsiveContainer width="100%" height={180}>
                <AreaChart 
                  data={incomeExpenseData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  {/* defs same as before */}
                  <defs>
                    <linearGradient id="incomeWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c83ff" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#7c83ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff7ac6" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#ff7ac6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke={THEME.grid} strokeDasharray="3 3"/>

                  <XAxis dataKey="day" stroke={THEME.muted} />
                  <YAxis 
                    stroke={THEME.muted} 
                    domain={[0, 'dataMax + 5000']}  // force scale even for small/zero values
                    tickFormatter={v => `₹${v}`}
                  />

                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />

                  <Area type="monotone" dataKey="income" stroke="#7c83ff" fill="url(#incomeWave)" strokeWidth={3} dot={{ r: 4 }} />
                  <Area type="monotone" dataKey="expense" stroke="#ff7ac6" fill="url(#expenseWave)" strokeWidth={3} dot={{ r: 4 }} />

                  {incomeExpenseData.every(d => d.income === 0 && d.expense === 0) && (
                    <text x="50%" y="50%" textAnchor="middle" fill={THEME.muted} fontSize={14}>
                      No transactions in last 7 days
                    </text>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </section>
        </aside>
      </div>
    </>
  );
}

/* ================= CSS (soft pastel palette) ================= */
/* ================= COLOR SYSTEM ================= */


const CSS = `
*{
  margin:0; padding:0; box-sizing:border-box;
  font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont;
}

body{
  background:${THEME.page};
}

.app{
display:grid;
grid-template-columns:200px 1fr 360px;
grid-template-rows:60px 1fr;
grid-template-areas:
"sidebar header header"
"sidebar main right";

height:100vh;
gap:16px;
padding:16px;

overflow-y:auto;
overflow-x:hidden;
}

.header{
grid-area:header;
display:flex;
align-items:center;
justify-content:center;
position:relative;
background:${THEME.card};
border-radius:14px;
}

.header-user.clickable{
cursor:pointer;
transition:0.2s;
}

.header-user.clickable:hover{
opacity:0.8;
}

.header-title{
font-size:22px;
font-weight:600;
color:white;
}

.header-user{
position:absolute;
right:16px;
display:flex;
align-items:center;
gap:10px;
}

/* SIDEBAR */
.sidebar{
  grid-area:sidebar;
  background:${THEME.sidebar};
  border-radius:20px;
  padding:24px 16px;
  display:flex;
  flex-direction:column;
  box-shadow:0 10px 30px rgba(0,0,0,0.4);
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
  color:${THEME.muted};;
}

.nav-item span{
  font-size:18px;
  color:#5A3D8C;
}

.nav-item:hover{
  background:${THEME.navHover};
}

.nav-item.active{
  background:#6366f1;
  color:white;
}

.logout{
margin-top:auto;
background:linear-gradient(
145deg,
${THEME.card},
rgba(30,41,59,0.85)
);
color:${THEME.text};
border:1px solid rgba(255,255,255,0.06);
}

.tx-row{
display:flex;
justify-content:space-between;
align-items:center;
padding:10px 6px;
border-bottom:1px solid rgba(255,255,255,0.06);
}

.tx-title{
font-weight:500;
font-size:14px;
}

.tx-meta{
font-size:11px;
color:#94a3b8;
}

.tx-amount{
font-weight:600;
font-size:14px;
}

.tx-amount.income{
color:${THEME.income};
}

.tx-amount.expense{
color:${THEME.expense};
}

.donut-center{
position:absolute;
top:50%;
left:50%;
transform:translate(-50%,-50%);
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
text-align:center;

font-weight:700;
font-size:20px;
color:white;
line-height:1.1;
}


.donut-wrapper{
display:flex;
align-items:center;
justify-content:space-between;
gap:20px;
}

.donut-chart{
position:relative;
width:190px;
height:170px;
}

.donut-center{
position:absolute;
top:50%;
left:50%;
transform:translate(-50%,-50%);
text-align:center;
font-weight:700;
font-size:22px;
color:white;
}

.pie-legend{
position:absolute;
right:-5px;
top:50%;
transform:translateY(-50%);
display:flex;
flex-direction:column;
gap:8px;
font-size:13px;
}

.legend-row{
display:flex;
align-items:center;
gap:6px;
}

.legend-dot{
width:10px;
height:10px;
border-radius:50%;
}

/* MAIN CENTER */
.main{
grid-area:main;

display:flex;
flex-direction:column;
gap:16px;

min-height:100%;
padding-right:16px;
}

.card{
background:${THEME.card};
min-height:fit-content;
backdrop-filter:blur(12px);
border:1px solid rgba(255,255,255,0.05);
border-radius:16px;
padding:16px;
box-shadow:
0 10px 35px rgba(0,0,0,0.45),
0 0 20px rgba(108,124,255,0.08),
inset 0 0 0 1px rgba(255,255,255,0.03);
color:#e5e7eb;
transition:all .25s ease;
}

.card:hover{
transform:translateY(-2px);
box-shadow:0 12px 35px rgba(0,0,0,0.5);
}



h3{
  color:white;
  font-weight:600;
}

.big{
display:flex;
flex-direction:column;
gap:12px;
}

/* KPI badges */
.kpi-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-top:16px;
}
.tx-table{
width:100%;
border-collapse:collapse;
font-size:13px;
}

.kpi-top{
display:flex;
justify-content:space-between;
font-size:12px;
color:${THEME.muted};
}

.kpi-trend{
height:40px;
margin-top:6px;
}

.trend{
font-weight:600;
font-size:12px;
}

.trend.up{
color:${THEME.income};
}

.trend.down{
color:${THEME.expense};
}

.tx-table th{
text-align:left;
padding:8px;
color:${THEME.muted};
border-bottom:1px solid rgba(255,255,255,0.08);
}

.tx-table td{
padding:8px;
border-bottom:1px solid rgba(255,255,255,0.04);
}

.tx-table tr:hover{
background:rgba(255,255,255,0.03);
}

.kpi{
background:${THEME.card};
padding:18px 22px;
border-radius:14px;

display:flex;
flex-direction:column;
gap:10px;

width:100%;
min-height:150px;

box-shadow:
0 4px 12px rgba(0,0,0,0.35),
inset 0 0 0 1px rgba(255,255,255,0.05);
}

.kpi-sub{
font-size:11px;
color:${THEME.muted};
}
.kpi:hover{
background:rgba(99,102,241,0.08);
box-shadow:
0 8px 20px rgba(99,102,241,0.25);
}

 .kpi-value{
  font-size:20px;
  font-weight:600;
  color:white;
  }

/* Visualization row */


.visual-title{
  font-size:14px;
  font-weight:500;
  color:#e5e7eb;
}

.visual-body{
  flex:1;
  min-height:180px;
}

.tx-header{
display:flex;
justify-content:space-between;
align-items:center;
}

.tx-filters button{
background:#1e293b;
border:1px solid #334155;
color:#e5e7eb;
padding:6px 12px;
border-radius:8px;
margin-left:6px;
cursor:pointer;
}

.tx-filters button:hover{
background:#6366f1;
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
.category-rings{
margin-top:10px;
display:flex;
flex-direction:column;
gap:6px;
}

.ring-bar{
height:6px;
background:#1f2937;
border-radius:6px;
overflow:hidden;
}

.ring-fill{
height:100%;
border-radius:6px;
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
grid-area:right;
display:flex;
flex-direction:column;
gap:16px;
position:sticky;
top:0;
height:fit-content;
}

.right .card{
min-height:210px;
}

/* Profile */
.user-card{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
}

.avatar{
  width:40px;
  height:40px;
  border-radius:50%;
  background:#6366f1;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:30px;
  margin-bottom:8px;
  color:#F8EDE2;
  box-shadow:0 0 12px rgba(99,102,241,0.8);
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
  align-items:center;
  padding:6px 0;
  font-size:14px;
  border-bottom:1px solid rgba(255,255,255,0.04);
}

.pos{
  color:#2d7a3f;
}

.neg{
  color:#b33939;
}

.recharts-line{
filter:drop-shadow(0 0 8px rgba(99,102,241,0.6));
}

.recharts-area{
filter:drop-shadow(0 0 12px rgba(124,131,255,0.5));
}

.recharts-bar-rectangle{
filter:drop-shadow(0 2px 8px ${THEME.glow});
}

.recharts-pie-label-text{
font-size:11px;
font-weight:500;
fill:#cbd5f5;
}

.recharts-sector{
filter:drop-shadow(0 0 6px rgba(255,255,255,0.25));
}

.transactions-card{
display:flex;
flex-direction:column;
gap:6px;
overflow-y:auto;
padding-right:4px;
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
