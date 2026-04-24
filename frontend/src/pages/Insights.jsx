import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Insights() {
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

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/insights", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setInsights(res.data.insights || []);
      })
      .catch(err => {
        console.error("Failed to load insights", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate]);

  // Helper function to style cards based on the insight content
  const getCardStyle = (text) => {
    if (text.includes("📈") || text.includes("exceed") || text.includes("⚠")) {
      return { className: "alert-card", icon: "⚠️" };
    }
    if (text.includes("📉") || text.includes("✅")) {
      return { className: "success-card", icon: "✨" };
    }
    if (text.includes("🎯")) {
      return { className: "goal-card", icon: "🎯" };
    }
    if (text.includes("🍽") || text.includes("High spend")) {
      return { className: "warning-card", icon: "🔥" };
    }
    return { className: "info-card", icon: "💡" };
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
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/analytics`)}><span>📈</span> <label>Analytics</label></div>
            <div className="nav-item active"><span>💡</span> <label>Insights</label></div>
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
          
          <div className="insights-header">
            <h2>Smart Insights</h2>
            <p className="muted">Your personalized, AI-driven financial feed.</p>
          </div>

          <div className="insights-feed">
            {loading ? (
              <div className="loader-box">
                <div className="spinner"></div>
                <p>Analyzing your financial data...</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="empty">No insights available at the moment.</div>
            ) : (
              insights.map((insight, i) => {
                const { className, icon } = getCardStyle(insight);
                // Remove the emojis from the backend string to use our own styling
                const cleanText = insight.replace(/[📈📉🍽⚠🎯✅]/g, "").trim();

                return (
                  <div key={i} className={`insight-card ${className}`}>
                    <div className="icon-wrapper">{icon}</div>
                    <div className="insight-content">
                      <p>{cleanText}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

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

.insights-header h2 {
  font-size: 28px;
  color: white;
  margin-bottom: 4px;
}
.muted { color: #9aa3d2; font-size: 14px; }

/* FEED */
.insights-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}

.insight-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: #151a3a;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.insight-content p {
  font-size: 15px;
  color: #e6e9ff;
  line-height: 1.5;
  font-weight: 500;
}

/* Card Variations */

.alert-card {
  background: linear-gradient(145deg, #2a1118, #151a3a);
  border-left: 4px solid #ff4d6d;
}
.alert-card .icon-wrapper {
  background: rgba(255,77,109,0.15);
  color: #ff4d6d;
}

.warning-card {
  background: linear-gradient(145deg, #2a2011, #151a3a);
  border-left: 4px solid #ffd700;
}
.warning-card .icon-wrapper {
  background: rgba(255,215,0,0.15);
  color: #ffd700;
}

.success-card {
  background: linear-gradient(145deg, #112a1f, #151a3a);
  border-left: 4px solid #22c55e;
}
.success-card .icon-wrapper {
  background: rgba(34,197,94,0.15);
  color: #22c55e;
}

.goal-card {
  background: linear-gradient(145deg, #1a112a, #151a3a);
  border-left: 4px solid #b06cff;
}
.goal-card .icon-wrapper {
  background: rgba(176,108,255,0.15);
  color: #b06cff;
}

.info-card {
  background: linear-gradient(145deg, #111b2a, #151a3a);
  border-left: 4px solid #6c7cff;
}
.info-card .icon-wrapper {
  background: rgba(108,124,255,0.15);
  color: #6c7cff;
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
@media (max-width: 768px) {
  .tx-app { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; justify-content: space-between; padding: 16px; }
  .nav { flex-direction: row; flex-wrap: wrap; justify-content: center; }
  .nav-item span { display: none; }
}
`;
