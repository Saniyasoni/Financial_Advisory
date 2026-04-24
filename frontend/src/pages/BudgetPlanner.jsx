import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BudgetPlanner() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const usernameSlug = user?.name?.trim().replace(/\s+/g, "_").toLowerCase() || "user";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Time selection
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth(); // 0-11
  const selectedYear = currentDate.getFullYear();

  // Data
  const [transactions, setTransactions] = useState([]);
  
  // Budget Form State
  const [totalBudget, setTotalBudget] = useState(0);
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "INR");

  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    fetchData();
  }, [token, selectedMonth, selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch budget for the selected month
      const budgetRes = await axios.get(`http://localhost:5000/api/budgets?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (budgetRes.data && !budgetRes.data.message?.includes("No budget")) {
        setTotalBudget(budgetRes.data.totalBudget || 0);
        setRolloverEnabled(budgetRes.data.rolloverEnabled || false);
        setCategoryBudgets(budgetRes.data.categoryBudgets || []);
      } else {
        // Reset if no budget
        setTotalBudget(0);
        setRolloverEnabled(false);
        setCategoryBudgets([]);
      }

      // Fetch all transactions (for simplicity, we'll filter on frontend)
      const txRes = await axios.get("http://localhost:5000/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(txRes.data.items || []);

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBudget() {
    setSaving(true);
    try {
      await axios.post("http://localhost:5000/api/budgets", {
        month: selectedMonth,
        year: selectedYear,
        totalBudget: Number(totalBudget),
        categoryBudgets,
        rolloverEnabled,
        currency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Budget saved successfully!");
    } catch (err) {
      alert("Failed to save budget: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName || !newCatAmount) return;
    
    const existing = categoryBudgets.find(c => c.category.toLowerCase() === newCatName.toLowerCase());
    if (existing) {
      alert("Category already exists in budget");
      return;
    }

    setCategoryBudgets([...categoryBudgets, { category: newCatName, amount: Number(newCatAmount) }]);
    setNewCatName("");
    setNewCatAmount("");
  }

  function removeCategory(catName) {
    setCategoryBudgets(categoryBudgets.filter(c => c.category !== catName));
  }

  // --- Calculations ---
  
  // Filter expenses for selected month
  const monthlyExpenses = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === "expense";
    });
  }, [transactions, selectedMonth, selectedYear]);

  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalProgress = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  
  // Calculate spent per category
  const categorySpending = useMemo(() => {
    const map = {};
    monthlyExpenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [monthlyExpenses]);

  return (
    <>
      <style>{CSS}</style>
      <div className="app tx-app">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>
          <nav className="nav">
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/dashboard`)}><span>📊</span> <label>Dashboard</label></div>
            <div className="nav-item"><span>📈</span> <label>Analytics</label></div>
            <div className="nav-item"><span>💡</span> <label>Insights</label></div>
            <div className="nav-item active"><span>🎯</span> <label>Budget Planner</label></div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/goals`)}><span>🏆</span> <label>Goals</label></div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/transactions`)}><span>💳</span> <label>Transactions</label></div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/profile`)}><span>👤</span> <label>Account Settings</label></div>
          </nav>
          <div className="nav-item logout" onClick={() => { localStorage.clear(); navigate("/"); }}>
            <span>🚪</span> <label>Logout</label>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
          
          <div className="header-actions">
            <div className="month-selector">
              <button onClick={() => setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1))}>◀</button>
              <h2>{MONTH_NAMES[selectedMonth]} {selectedYear}</h2>
              <button onClick={() => setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1))}>▶</button>
            </div>
            <button className="save-btn" onClick={handleSaveBudget} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Budget"}
            </button>
          </div>

          {loading ? (
            <div className="empty">Loading budget data...</div>
          ) : (
            <div className="budget-grid">
              
              {/* TOP: OVERALL BUDGET */}
              <div className="card span-full overall-card">
                <div className="overall-info">
                  <div className="stat-block">
                    <span>Total Monthly Budget</span>
                    <div className="input-wrap">
                      <b>₹</b>
                      <input 
                        type="number" 
                        value={totalBudget} 
                        onChange={(e) => setTotalBudget(e.target.value)} 
                        className="budget-input massive"
                      />
                    </div>
                  </div>
                  <div className="stat-block">
                    <span>Total Spent</span>
                    <b className={totalSpent > totalBudget && totalBudget > 0 ? "neg" : ""}>₹{totalSpent}</b>
                  </div>
                  <div className="stat-block">
                    <span>Remaining</span>
                    <b className={totalBudget - totalSpent < 0 ? "neg" : "pos"}>
                      ₹{Math.max(totalBudget - totalSpent, 0)}
                    </b>
                  </div>
                </div>

                <div className="progress-bar-wrap big-progress">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${totalProgress}%`, 
                      background: totalProgress >= 100 ? '#ff4d4d' : totalProgress > 80 ? '#ffd700' : 'linear-gradient(90deg,#6c7cff,#6cff9f)'
                    }}
                  ></div>
                </div>
                <div className="progress-text">{totalProgress}% of total budget used</div>
              </div>

              {/* LEFT: CATEGORY LIMITS */}
              <div className="card categories-card">
                <div className="card-header">
                  <h3>Category Limits</h3>
                </div>
                
                <div className="cat-list">
                  {categoryBudgets.length === 0 ? (
                    <div className="empty" style={{textAlign: "left"}}>No category budgets set.</div>
                  ) : (
                    categoryBudgets.map((cat, i) => {
                      const spent = categorySpending[cat.category] || 0;
                      const progress = cat.amount > 0 ? Math.min(Math.round((spent / cat.amount) * 100), 100) : 0;
                      return (
                        <div key={i} className="cat-item">
                          <div className="cat-header">
                            <span className="cat-name">{cat.category}</span>
                            <div className="cat-stats">
                              <span className={spent > cat.amount ? "neg" : ""}>₹{spent}</span> / ₹
                              <input 
                                type="number" 
                                value={cat.amount}
                                onChange={(e) => {
                                  const newArr = [...categoryBudgets];
                                  newArr[i].amount = Number(e.target.value);
                                  setCategoryBudgets(newArr);
                                }}
                                className="inline-input"
                              />
                              <button className="del-btn" onClick={() => removeCategory(cat.category)}>✕</button>
                            </div>
                          </div>
                          <div className="progress-bar-wrap">
                            <div 
                              className="progress-bar" 
                              style={{ 
                                width: `${progress}%`,
                                background: progress >= 100 ? '#ff4d4d' : progress > 80 ? '#ffd700' : 'linear-gradient(90deg,#6c7cff,#b06cff)'
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form className="add-cat-form" onSubmit={handleAddCategory}>
                  <input placeholder="Category (e.g. food)" value={newCatName} onChange={e=>setNewCatName(e.target.value)} required />
                  <input type="number" placeholder="Limit ₹" value={newCatAmount} onChange={e=>setNewCatAmount(e.target.value)} required />
                  <button type="submit">+</button>
                </form>
              </div>

              {/* RIGHT: SETTINGS & ROLLOVER */}
              <div className="card settings-side-card">
                <h3>Budget Settings</h3>
                
                <div className="setting-toggle">
                  <div className="setting-info">
                    <h4>Enable Rollover</h4>
                    <p className="muted">Automatically transfer unused budget to next month.</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={rolloverEnabled} onChange={(e) => setRolloverEnabled(e.target.checked)} />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="divider"></div>

                <div className="info-box">
                  <h4>💡 Budgeting Tip</h4>
                  <p className="muted">Try following the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.</p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </>
  );
}

const CSS = `
*{ margin:0; padding:0; box-sizing:border-box; font-family:Poppins, system-ui, -apple-system; }
body, html { background:#0b0f2a; }

.tx-app{
  display:grid;
  grid-template-columns:200px minmax(0,1fr);
  height:100vh;
  gap:16px;
  padding:16px;
  background:#0b0f2a;
  color:#e6e9ff;
  overflow:hidden;
}

/* SIDEBAR */
.sidebar{
  background:#0d132f;
  border-radius:20px;
  padding:24px 16px;
  display:flex;
  flex-direction:column;
  box-shadow:0 10px 30px rgba(0,0,0,0.4);
}
.logo{ font-size:22px; font-weight:600; text-align:center; margin-bottom:24px; color:#5A3D8C; }
.nav{ display:flex; flex-direction:column; gap:8px; }
.nav-item{
  display:flex; align-items:center; gap:12px; padding:12px;
  border-radius:12px; cursor:pointer; font-size:14px; font-weight:500;
  transition:0.3s; color:#9aa3d2;
}
.nav-item span{ font-size:18px; }
.nav-item:hover{ background:rgba(255,255,255,0.05); }
.nav-item.active{
  background:linear-gradient(135deg,#6c7cff,#8b5cf6);
  color:white; box-shadow:0 0 12px rgba(108,124,255,0.6);
}
.logout{ margin-top:auto; background:#1e2555; }

/* MAIN CONTENT */
.main{ display:flex; flex-direction:column; gap:20px; overflow-y:auto; padding-right:8px; }

.header-actions {
  display:flex; justify-content:space-between; align-items:center;
}
.month-selector {
  display:flex; align-items:center; gap:16px;
}
.month-selector h2 { font-size: 24px; color: white; width: 220px; text-align: center; }
.month-selector button {
  background: #1e2555; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.3s;
}
.month-selector button:hover { background: #6c7cff; }

.save-btn{
  background:linear-gradient(135deg,#d4af37,#ffd700); border:none; border-radius:8px;
  padding:10px 24px; color:#111; font-weight:600; cursor:pointer; transition:0.3s;
}
.save-btn:hover{ transform:translateY(-2px); box-shadow:0 4px 12px rgba(212,175,55,0.4); }
.save-btn:disabled{ opacity:0.6; cursor:not-allowed; transform:none; }

.budget-grid {
  display:grid; grid-template-columns:2fr 1fr; gap:20px;
}
.span-full { grid-column: 1 / -1; }

.card{
  background:#151a3a; border-radius:16px; padding:24px;
  border:1px solid rgba(255,255,255,0.05);
  box-shadow:0 10px 35px rgba(0,0,0,0.45);
}

/* OVERALL CARD */
.overall-info {
  display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;
}
.stat-block { display:flex; flex-direction:column; gap:4px; }
.stat-block span { font-size:14px; color:#9aa3d2; }
.stat-block b { font-size:28px; color:white; }
.stat-block b.neg { color:#ff4d4d; }
.stat-block b.pos { color:#6cff9f; }

.input-wrap { display:flex; align-items:center; gap:4px; }
.input-wrap b { color:white; font-size:28px; }
.budget-input.massive {
  background:transparent; border:none; border-bottom:2px dashed rgba(255,255,255,0.2);
  color:white; font-size:28px; font-weight:bold; width:150px; outline:none; transition:0.3s;
}
.budget-input.massive:focus { border-bottom-color:#6c7cff; }

.progress-bar-wrap { width:100%; background:rgba(255,255,255,0.1); border-radius:8px; overflow:hidden; }
.progress-bar { height:100%; transition:width 0.4s ease, background 0.4s ease; }
.big-progress { height: 12px; }
.progress-text { font-size:12px; color:#9aa3d2; text-align:right; margin-top:8px; }

/* CATEGORY CARD */
.card-header h3 { font-size: 18px; color: white; margin-bottom: 20px; }

.cat-list { display:flex; flex-direction:column; gap:20px; margin-bottom:24px; }
.cat-item { display:flex; flex-direction:column; gap:8px; }
.cat-header { display:flex; justify-content:space-between; align-items:center; }
.cat-name { font-weight:500; color:white; text-transform:capitalize; }
.cat-stats { display:flex; align-items:center; gap:6px; font-size:14px; color:#9aa3d2; }
.cat-stats span.neg { color:#ff4d4d; font-weight:bold; }
.inline-input {
  background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.2);
  color:white; font-size:14px; width:70px; outline:none; text-align:right;
}
.inline-input:focus { border-bottom-color:#6c7cff; }
.del-btn { background:none; border:none; color:#ff4d4d; cursor:pointer; margin-left:8px; }
.progress-bar-wrap { height:6px; }

.add-cat-form { display:flex; gap:8px; }
.add-cat-form input {
  background:#1e2555; border:1px solid rgba(255,255,255,0.1); padding:8px 12px;
  border-radius:8px; color:white; font-size:13px; outline:none;
}
.add-cat-form input:focus { border-color:#6c7cff; }
.add-cat-form input[type="text"] { flex:1; }
.add-cat-form input[type="number"] { width:100px; }
.add-cat-form button {
  background:#6c7cff; border:none; color:white; border-radius:8px; width:36px;
  font-weight:bold; cursor:pointer; font-size:18px;
}

/* SETTINGS CARD */
.setting-toggle { display:flex; justify-content:space-between; align-items:center; }
.setting-info h4 { color:white; font-size:15px; margin-bottom:4px; }
.muted { color:#9aa3d2; font-size:12px; line-height:1.4; }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: #6cff9f; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.divider { height:1px; background:rgba(255,255,255,0.05); margin:20px 0; }

.info-box { background:rgba(108,124,255,0.1); padding:16px; border-radius:12px; border:1px solid rgba(108,124,255,0.2); }
.info-box h4 { color:#6c7cff; margin-bottom:8px; font-size:14px; }

/* Responsive */
@media (max-width: 1024px) { .budget-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .tx-app { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; justify-content: space-between; }
  .month-selector h2 { width:auto; font-size:18px; }
}
`;
