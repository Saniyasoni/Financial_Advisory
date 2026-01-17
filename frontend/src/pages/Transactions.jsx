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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12); // infinite scroll chunk
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [ERROR, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | income | expense
  const [filterCategory, setFilterCategory] = useState("all");

  const [newTx, setNewTx] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
  });
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
    return transactions
      .filter((t) => {
        if (filterType !== "all" && t.type !== filterType) return false;
        if (filterCategory !== "all" && t.category !== filterCategory)
          return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterType, filterCategory, search]);

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

  // Bar chart: monthly expenses for last 6 months
  const barData = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        map[key] = (map[key] || 0) + Number(t.amount || 0);
      });

    const entries = Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6);
    return entries.map(([k, v]) => ({ month: k, amount: v }));
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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTransactions((prev) => [res.data, ...prev]);
      setNewTx({ type: "expense", amount: "", category: "", description: "" });
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
          <section className="card big">
            <div className="tx-header">
              <div>
                <h2>Transactions</h2>
                <p className="muted small">
                  Track your expenses and income in real-time.
                </p>
              </div>
              <button
                className="add-btn"
                onClick={() => setShowModal(true)}
              >
                + Add Transaction
              </button>
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
                        <span className="badge type">
                          {t.type === "expense" ? "Expense" : "Income"}
                        </span>
                        <span className="muted">
                          {new Date(t.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div
                        className={
                          t.type === "expense" ? "amt neg" : "amt pos"
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

          {/* Bottom investment cards re-using style */}
          <section className="cards">
            {[65, 70, 75, 80].map((target, i) => (
              <div key={i} className="card small">
                <h3>Investment {i + 1}</h3>
                <div className="progress">
                  <div className="fill" style={{ width: `${target}%` }}></div>
                </div>
                <p className="muted">Target {target}%</p>
              </div>
            ))}
          </section>
        </main>

        {/* RIGHT SIDE: Charts & summary */}
        <aside className="right">
          <div className="card user-card">
            <div className="avatar">👤</div>
            <h3>{username}</h3>
            <p className="muted">Premium User</p>
          </div>

          <div className="card chart-card">
            <h3>Expense by Category</h3>
            {pieData.length === 0 ? (
              <div className="empty small">No expense data yet.</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#E9A96B",
                              "#E7C4A8",
                              "#F3D3B5",
                              "#F8EDE2",
                              "#5A3D8C",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card chart-card">
            <h3>Monthly Expenses</h3>
            {barData.length === 0 ? (
              <div className="empty small">
                No expenditure in this month or recent months.
              </div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Bar dataKey="amount" fill="#E9A96B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card summary-card">
            <h3>This Month Summary</h3>
            {thisMonthTotal === 0 ? (
              <p className="muted">No expenditure in this month.</p>
            ) : (
              <p>Total expenses this month: ₹{thisMonthTotal}</p>
            )}
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
                  <span>Category</span>
                  <input
                    value={newTx.category}
                    onChange={(e) =>
                      setNewTx({ ...newTx, category: e.target.value })
                    }
                    required
                  />
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

.tx-app{
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
    -4px -4px 8px rgba(255,255,255,0.7),
    6px 6px 12px rgba(0,0,0,0.08);
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
  color:#2A2A2A;
}

.nav-item span{ font-size:18px; }

.nav-item:hover{
  background:#E7C4A834;
}

.nav-item.active{
  background:#E7C4A8;
  font-weight:600;
  box-shadow:0 0 6px #E7C4A8;
}

.logout{ margin-top:auto; background:#E7C4A820; }

/* CENTER */
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
  backdrop-filter:blur(20px);
  box-shadow:
    -4px -4px 8px rgba(255,255,255,0.7),
    6px 6px 14px rgba(0,0,0,0.08);
}

.big{ height:380px; display:flex; flex-direction:column; gap:16px; }

.tx-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

h2{ font-size:22px; }

.muted{ color:#A9A9A9; font-size:12px; }

.small{ font-size:12px; }

.add-btn{
  padding:8px 16px;
  border-radius:999px;
  border:none;
  background:#E7C4A8;
  color:#2A2A2A;
  font-weight:500;
  cursor:pointer;
  box-shadow:0 4px 10px rgba(0,0,0,0.12);
}

/* Filters */
.filters{
  display:flex;
  gap:8px;
  margin-top:12px;
}

.filter-input{
  flex:1;
  padding:8px 12px;
  border-radius:12px;
  border:1px solid #A9A9A9;
  font-size:13px;
}

.filter-select{
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #A9A9A9;
  font-size:13px;
}

/* List */
.tx-list{
  margin-top:12px;
  flex:1;
  overflow-y:auto;
  padding-right:4px;
}

.tx-row{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  padding:10px 0;
  border-bottom:1px dashed rgba(0,0,0,0.05);
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

.amt.neg{ color:#C0392B; }
.amt.pos{ color:#1E8449; }

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
  width:280px;
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
.chart-card h3{ font-size:15px; margin-bottom:6px; }
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
  background:#F8EDE2;
  padding:20px 22px;
  border-radius:20px;
  width:360px;
  box-shadow:0 10px 30px rgba(0,0,0,0.18);
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
