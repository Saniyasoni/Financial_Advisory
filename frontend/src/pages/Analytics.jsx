import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function Analytics() {
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

  const [year, setYear] = useState(new Date().getFullYear());
  const [savingsData, setSavingsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const COLORS = ['#6c7cff', '#6cff9f', '#ff4d6d', '#ffd700', '#b06cff', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    fetchAnalytics();
  }, [token, year]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [savingsRes, categoriesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/stats/savings?year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/stats/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Format savings data
      const formattedSavings = savingsRes.data.map(item => ({
        name: monthNames[item.month - 1],
        Income: item.income,
        Expense: item.expense,
        Savings: item.savings
      }));
      setSavingsData(formattedSavings);

      // Format category data
      const formattedCategories = categoriesRes.data.map(item => ({
        name: item.category,
        value: item.amount
      }));
      setCategoryData(formattedCategories);

    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app tx-app">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>
          <nav className="nav">
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/dashboard`)}><span>📊</span> <label>Dashboard</label></div>
            <div className="nav-item active"><span>📈</span> <label>Analytics</label></div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/insights`)}><span>💡</span> <label>Insights</label></div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/budget`)}><span>🎯</span> <label>Budget Planner</label></div>
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
          
          <div className="analytics-header">
            <div>
              <h2>Financial Analytics</h2>
              <p className="muted">Deep dive into your spending and saving trends.</p>
            </div>
            <select 
              className="year-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4].map(offset => {
                const y = new Date().getFullYear() - offset;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>

          {loading ? (
            <div className="loader-box">
              <div className="spinner"></div>
              <p>Loading analytics...</p>
            </div>
          ) : (
            <div className="charts-container">
              
              {/* Year in Review Chart */}
              <div className="chart-card full-width">
                <h3>Year in Review ({year})</h3>
                <p className="muted mb-4">Income vs Expense vs Savings</p>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6c7cff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6c7cff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#cfd6ff" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#cfd6ff" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e2555', border: 'none', borderRadius: '8px', color: 'white' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px', color: '#cfd6ff' }}/>
                      <Area type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="Expense" stroke="#ff4d6d" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                      <Area type="monotone" dataKey="Savings" stroke="#6c7cff" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Chart */}
              <div className="chart-card">
                <h3>Category Breakdown</h3>
                <p className="muted mb-4">Where your money goes</p>
                <div className="chart-wrapper pie-wrapper">
                  {categoryData.length === 0 ? (
                    <div className="empty-chart">No expenses recorded yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `₹${value}`}
                          contentStyle={{ backgroundColor: '#1e2555', border: 'none', borderRadius: '8px', color: 'white' }}
                        />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ fontSize: '13px', color: '#cfd6ff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
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
  gap:24px;
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
.main{ display:flex; flex-direction:column; gap:24px; overflow-y:auto; padding-right:8px; padding-bottom: 40px; }

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.analytics-header h2 {
  font-size: 28px;
  color: white;
  margin-bottom: 4px;
}
.muted { color: #9aa3d2; font-size: 14px; }
.mb-4 { margin-bottom: 16px; }

.year-select {
  background: #151a3a;
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  cursor: pointer;
}

/* CHARTS */
.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.chart-card {
  background: #151a3a;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 10px 35px rgba(0,0,0,0.3);
}

.chart-card h3 {
  font-size: 18px;
  color: white;
}

.chart-wrapper {
  height: 350px;
  width: 100%;
}

.pie-wrapper {
  height: 300px;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9aa3d2;
  font-style: italic;
}

/* Loader */
.loader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #9aa3d2;
  gap: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(108,124,255,0.2);
  border-top-color: #6c7cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1024px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .tx-app { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; justify-content: space-between; padding: 16px; }
  .nav { flex-direction: row; flex-wrap: wrap; justify-content: center; }
  .nav-item span { display: none; }
  .analytics-header { flex-direction: column; align-items: flex-start; gap: 16px; }
}
`;
