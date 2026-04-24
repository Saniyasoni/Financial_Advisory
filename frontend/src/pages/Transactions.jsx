// frontend/src/pages/Transactions.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate} from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = [
"#6c7cff",
"#b06cff",
"#6cff9f",
"#ff7ac6",
"#ffc857"
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({income: 0,expense: 0,balance: 0,topGoal: null});
  const [visibleCount, setVisibleCount] = useState(12); // infinite scroll chunk
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [ERROR, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | income | expense
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFilter,setDateFilter] = useState("month")

  const [newTx, setNewTx] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const listRef = useRef(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();
  const token = localStorage.getItem("token");
    useEffect(() => {
  if (!token) {
    navigate("/", { replace: true });
  }
}, [token, navigate]);


  // SECURITY: if no token, force login

  const username = storedUser?.name || "User";
  const usernameSlug =
    storedUser?.name?.trim().replace(/\s+/g, "_").toLowerCase() || "user";

  // Fetch all transactions
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
  navigate("/", { replace: true });
  return;
}

    async function fetchTx() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:5000/api/transactions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = Array.isArray(res.data?.items)
          ? res.data.items
          : [];

setTransactions(data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchTx();

    async function fetchSummary() {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/stats/summary",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSummary(res.data);
      } catch (err) {
        console.error("summary error", err);
      }
    }

    fetchSummary();

  }, [token]);

  // Infinite scroll on container
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 40) {
      setVisibleCount((prev) => prev + 10);
    }
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Filtering
    const filteredTx = useMemo(() => {

    const now = new Date();

    let startDate = null;

    if(dateFilter === "week"){
    startDate = new Date();
    startDate.setDate(now.getDate()-7);
    }

    if(dateFilter === "month"){
    startDate = new Date(now.getFullYear(),now.getMonth(),1);
    }

    if(dateFilter === "3months"){
    startDate = new Date();
    startDate.setMonth(now.getMonth()-3);
    }

    return transactions
    .filter((t)=>{

    const txDate = new Date(t.date);

    if(startDate && txDate < startDate) return false;

    if(filterType !== "all" && t.type !== filterType) return false;

    if(filterCategory !== "all" && t.category !== filterCategory) return false;

    if(!search.trim()) return true;

    const q = search.toLowerCase();

    return (
    t.description?.toLowerCase().includes(q) ||
    t.category?.toLowerCase().includes(q)
    );

    })
    .sort((a,b)=> new Date(b.date)-new Date(a.date));

    },[transactions,filterType,filterCategory,search,dateFilter]);


  const visibleTx = filteredTx.slice(0, visibleCount);

  // Categories from actual data
  const allCategories = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Pie chart: category-wise expense total
  const pieData = useMemo(() => {
    const sums = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category || "Other";
        sums[key] = (sums[key] || 0) + Number(t.amount || 0);
      });
    return Object.entries(sums).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Monthly summary for current month
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const thisMonthTotal = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        return key === currentMonthKey;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions, currentMonthKey]);

  const thisMonthIncome = useMemo(() => {
  return transactions
    .filter((t) => {
      if (t.type !== "income") return false;

      const d = new Date(t.date);

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      return key === currentMonthKey;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}, [transactions, currentMonthKey]);

const thisMonthBalance = thisMonthIncome - thisMonthTotal;


  // Add transaction
  async function handleAddTx(e) {
    e.preventDefault();
    if (!newTx.amount || !newTx.category || !newTx.type) {
      alert("Type, amount, and category are required");
      return;
    }
    setAdding(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/transactions",
        {
          type: newTx.type,
          amount: Number(newTx.amount),
          category: newTx.category,
          description: newTx.description,
          date: newTx.date
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTransactions((prev) => [res.data, ...prev]);
      setNewTx({ type: "expense", amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0] });
      setIsNewCategory(false);
      setAdding(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add transaction");
      setAdding(false);
    }
  }

  // Delete transaction
  async function handleDelete(id) {
    const confirm = window.confirm("Delete this transaction?");
    if (!confirm) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/transactions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete transaction");
    }
  }

  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <style>{CSS}</style>

      <div className="app tx-app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>

          <nav className="nav">
            <div
              className="nav-item"
              onClick={() => navigate(`/${usernameSlug}/dashboard`)}

            >
              <span>📊</span>
              <label>Dashboard</label>
            </div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/analytics`)}>
              <span>📈</span>
              <label>Analytics</label>
            </div>
            <div 
              className="nav-item"
              onClick={() => navigate(`/${usernameSlug}/insights`)}
            >
              <span>💡</span>
              <label>Insights</label>
            </div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/budget`)}>
              <span>🎯</span>
              <label>Budget Planner</label>
            </div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/goals`)}>
              <span>🏆</span>
              <label>Goals</label>
            </div>
            <div
              className="nav-item active"
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
              <label>Account Settings</label>
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
          <section className="card big">
            <div className="tx-header">
              <div className="tx-kpis">

                <div className="kpi">
                  <span>This month Income</span>
                  <b className="pos">₹{thisMonthIncome}</b>
                </div>

                <div className="kpi">
                  <span>This month Expense</span>
                  <b className="neg">₹{thisMonthTotal}</b>
                </div>

                <div className="kpi">
                  <span>This month Balance</span>
                  <b>₹{thisMonthBalance}</b>
                </div>

                {summary.topGoal && (
                  <div className="kpi goal">
                    <span>{summary.topGoal.name}</span>
                    <b>{summary.topGoal.progress}%</b>
                  </div>
                )}

              </div>

              <div className="tx-actions">

              <button
                className="goal-btn"
                onClick={() => navigate(`/${usernameSlug}/goals`)}
              >
              + Goal
              </button>

              <button
                className="add-btn"
                onClick={() => {
                  setShowModal(true);
                  setIsNewCategory(false);
                }}
              >
              + Add
              </button>

              </div>

            </div>

            {/* Filters */}
            <div className="filters">
              <input
                className="filter-input"
                placeholder="Search description or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
                <option value="goal">Goals</option>
              </select>

              <select
                className="filter-select"
                value={dateFilter}
                onChange={(e)=>setDateFilter(e.target.value)}
                >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">Last 3 Months</option>
              </select>

              <select
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="tx-list" ref={listRef}>
              {loading && <div className="empty">Loading transactions...</div>}
              {!loading && filteredTx.length === 0 && (
                <div className="empty">
                  No transactions found. Add your first transaction.
                </div>
              )}

              {!loading &&
                visibleTx.map((t) => (
                  <div key={t._id} className="tx-row">
                    <div className="tx-main">
                      <div className="tx-title">
                        {t.description || "(No description)"}
                      </div>
                      <div className="tx-meta">
                        <span className="badge cat">{t.category}</span>
                        <span className={`badge type ${t.type}`}>
                          {t.type === "expense" ? "Expense" : "Income"}
                        </span>
                        <span className="muted">
                          {new Date(t.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div className={
                        t.type === "expense"
                        ? "amt neg"
                        : t.type === "goal"
                        ? "amt goal"
                        : "amt pos"
                        }
                        >
                        {t.type === "expense" ? "-" : "+"}₹{t.amount}
                      </div>
                      <button
                        className="tx-delete"
                        onClick={() => handleDelete(t._id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </main>

        {/* RIGHT SIDE: Charts & summary */}
        <aside className="right">
          <div className="card chart-card">
            <h3>Expense by Category</h3>

            {pieData.length === 0 ? (
              <div className="empty small">No expense data yet.</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: "22px", fontWeight: 700, fill: "#e6e9ff" }}
                    >
                      ₹{thisMonthTotal}
                    </text>

                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: "12px", fill: "#9aa3d2" }}
                    >
                      Total
                    </text>

                    <ReTooltip
                      formatter={(value) => `₹${value}`}
                      contentStyle={{
                        background: "#151a3a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px"
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* LEGEND CARD */}
          <div className="card legend-card">
            <h3>Categories</h3>

            <div className="pie-legend">
              {pieData.map((item, i) => (
                <div key={i} className="legend-row">
                  <span
                    className="legend-dot"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ADD TRANSACTION MODAL */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Add Transaction</h3>
              <form onSubmit={handleAddTx} className="modal-form">
                <label>
                  <span>Type</span>
                  <select
                    value={newTx.type}
                    onChange={(e) =>
                      setNewTx({ ...newTx, type: e.target.value })
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>

                <label>
                  <span>Amount</span>
                  <input
                    type="number"
                    value={newTx.amount}
                    onChange={(e) =>
                      setNewTx({ ...newTx, amount: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={newTx.date}
                    onChange={(e)=>
                      setNewTx({...newTx, date:e.target.value})
                    }
                    required
                  />
                </label>

                <label>
                  <span>Category</span>
                  {!isNewCategory ? (
                    <select
                      value={newTx.category}
                      onChange={(e) => {
                        if (e.target.value === "__new") {
                          setIsNewCategory(true);
                          setNewTx({ ...newTx, category: "" });
                        } else {
                          setNewTx({ ...newTx, category: e.target.value });
                        }
                      }}
                    >
                      <option value="">Select Category</option>
                      {allCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__new">+ Add New Category</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        placeholder="Enter new category"
                        value={newTx.category}
                        onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsNewCategory(false);
                          setNewTx({ ...newTx, category: "" });
                        }}
                        style={{ padding: '0 12px', borderRadius: '8px', background: '#1e2555', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  )}
                </label>

                <label>
                  <span>Description</span>
                  <input
                    value={newTx.description}
                    onChange={(e) =>
                      setNewTx({ ...newTx, description: e.target.value })
                    }
                  />
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={adding}>
                    {adding ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= CSS ================= */
const CSS = `
*{
  margin:0; padding:0; box-sizing:border-box;
  font-family:Poppins, system-ui, -apple-system;
}

body{
background:#0b0f2a;
}

html{
background:#0b0f2a;
}

.tx-app{
display:grid;
grid-template-columns:200px minmax(0,1fr) 300px;
overflow-x:hidden;
grid-template-rows:1fr;
grid-template-areas:
"sidebar main right";

height:100vh;
gap:16px;
padding:16px;
background:#0b0f2a;
color:#e6e9ff;
}

.tx-actions{
display:flex;
gap:10px;
}

.goal-btn{
background:linear-gradient(135deg,#d4af37,#ffd700);
color:#111;
border:none;
border-radius:999px;
padding:8px 16px;
font-weight:600;
cursor:pointer;
box-shadow:0 0 10px rgba(255,215,0,0.4);
}

/* SIDEBAR */
.sidebar{
grid-area:sidebar;
background:#0d132f;
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
  padding:12px;
  border-radius:12px;
  cursor:pointer;
  font-size:14px;
  font-weight:500;
  transition:0.3s;
  color:#9aa3d2;
}

.nav-item span{ font-size:18px; }

.nav-item:hover{
  background:#E7C4A834;
}

.nav-item.active{
background:linear-gradient(135deg,#6c7cff,#8b5cf6);
color:white;
box-shadow:0 0 12px rgba(108,124,255,0.6);
}

.logout{
margin-top:auto;
background:#1e2555;
}

/* CENTER */
.main{
display:flex;
flex-direction:column;
height:100%;
min-width:0;
overflow:hidden;
}


.card{
background:#151a3a;
border-radius:16px;
padding:18px;
border:1px solid rgba(255,255,255,0.05);
box-shadow:
0 10px 35px rgba(0,0,0,0.45),
0 0 20px rgba(108,124,255,0.08);
color:#e6e9ff;
}

.big{
display:flex;
flex-direction:column;
height:100%;
overflow:hidden;
}

.tx-header{
display:flex;
align-items:flex-start;
justify-content: space-between;
gap:24px;
flex-wrap: wrap;
}


.tx-kpis{
display:flex;
gap:16px;
align-items:center;
flex-wrap: wrap;
}

.tx-actions{
margin-left:auto;
display:flex;
gap:12px;
}

.kpi{
flex-shrink:0;
}

.kpi{
display:flex;
flex-direction:column;
justify-content:center;

background:#1a2045;

padding:12px 16px;
border-radius:12px;

min-width:150px;
height:64px;

border:1px solid rgba(255,255,255,0.05);

box-shadow:
0 8px 20px rgba(0,0,0,0.45),
0 0 14px rgba(108,124,255,0.08);
}



.kpi span{
color:#9aa3d2;
font-size:12px;
white-space:nowrap;
}

.kpi b{
font-size:20px;
font-weight:700;
margin-top:4px;
}

.pie-legend{
display:flex;
flex-direction:column;
gap:8px;
margin-top:10px;
}

.legend-row{
display:flex;
align-items:center;
gap:8px;
font-size:13px;
color:#cfd6ff;
}

.legend-dot{
width:10px;
height:10px;
border-radius:50%;
}

.legend-card{
padding-top:14px;
}

.legend-card h3{
font-size:14px;
margin-bottom:10px;
}

.kpi.goal{
background:#262d66;
}

.pos{color:#22c55e}
.neg{color:#ff4d6d}


h2{ font-size:22px; }

.muted{ color:#A9A9A9; font-size:12px; }

.small{ font-size:12px; }

.add-btn{
background:#6c7cff;
color:white;
border-radius:999px;
padding:8px 18px;
border:none;
font-weight:500;
cursor:pointer;
box-shadow:0 0 12px rgba(108,124,255,0.5);
}

/* Filters */
.filters{
  display:flex;
  gap:8px;
  margin-top:12px;
}


.filter-input,
.filter-select{
background:#1a2045;
border:1px solid rgba(255,255,255,0.08);
color:#e6e9ff;
border-radius:10px;
padding:8px 10px;
font-size:13px;
}

/* List */
.tx-list{
flex:1;
overflow-y:auto;
margin-top:10px;
padding-right:6px;
}

.tx-row{
display:flex;
justify-content:space-between;
align-items:center;
padding:12px 0;
border-bottom:1px solid rgba(255,255,255,0.06);
}

.tx-title{
  font-size:14px;
  font-weight:500;
}

.tx-meta{
  display:flex;
  gap:6px;
  align-items:center;
  margin-top:4px;
}

.badge{
  font-size:11px;
  padding:3px 8px;
  border-radius:999px;
}

.badge.cat{ background:#E7C4A833; }
.badge.type{ background:#E9A96B33; }
.badge.goal{background:rgba(255,215,0,0.18);color:#ffd700;}

.tx-right{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:4px;
}

.amt{
  font-weight:600;
  font-size:14px;
}

.amt.pos{ color:#22c55e; }
.amt.neg{ color:#ff4d6d; }
.amt.goal{
color:#ffd700;
font-weight:600;
}

.tx-delete{
  border:none;
  background:transparent;
  font-size:14px;
  cursor:pointer;
  color:#A9A9A9;
}

/* Bottom cards reuse */
.cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:16px;
}

.small{ height:140px; }

.progress{
  height:6px;
  background:#A9A9A940;
  border-radius:6px;
  margin:10px 0;
  overflow:hidden;
}

.fill{
  height:100%;
  background:#E9A96B;
  border-radius:6px;
}

/* RIGHT */
.right{
width:100%;
max-width:300px;
display:flex;
flex-direction:column;
gap:16px;
}

.user-card{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
}

.avatar{
  font-size:38px;
  margin-bottom:8px;
}

/* Charts */
.chart-card{
height:260px;
display:flex;
flex-direction:column;
justify-content:center;
}
.chart-wrap{ width:100%; height:220px; }


.summary-card h3{ font-size:15px; margin-bottom:4px; }

/* Empty states */
.empty{
  font-size:13px;
  color:#A9A9A9;
  padding:8px 0;
}

/* Modal */
.modal-backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.2);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:50;
}

.modal{
background:#151a3a;
padding:22px;
border-radius:18px;
width:360px;
border:1px solid rgba(255,255,255,0.06);
box-shadow:0 10px 40px rgba(0,0,0,0.5);
}

.modal-form{
  display:flex;
  flex-direction:column;
  gap:12px;
  margin-top:10px;
}

.modal-form label{
  display:flex;
  flex-direction:column;
  gap:4px;
  font-size:13px;
}

.modal-form input,
.modal-form select{
  padding:8px 10px;
  border-radius:10px;
  border:1px solid #A9A9A9;
  font-size:13px;
}

.modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  margin-top:8px;
}

.btn-cancel,
.btn-save{
  padding:6px 12px;
  border-radius:999px;
  border:none;
  cursor:pointer;
  font-size:13px;
}

.btn-cancel{ background:transparent; border:1px solid #A9A9A9; }
.btn-save{ background:#E7C4A8; }

/* RESPONSIVE */
@media(max-width:1024px){
  .right{ display:none; }
}

@media(max-width:768px){
  .tx-app{ flex-direction:column; }
  .sidebar{ width:100%; flex-direction:row; align-items:center; justify-content:space-between; }
  .main{ order:2; }
}
`;
