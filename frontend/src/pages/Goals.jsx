import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    category: "",
    priority: 3,
    notes: ""
  });

  const [showAddContrib, setShowAddContrib] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [newContrib, setNewContrib] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: ""
  });

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();
  const token = localStorage.getItem("token");
  const usernameSlug = storedUser?.name?.trim().replace(/\s+/g, "_").toLowerCase() || "user";

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    fetchGoals();
  }, [token, navigate]);

  async function fetchGoals() {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGoal(e) {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/goals", newGoal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddGoal(false);
      setNewGoal({ name: "", targetAmount: "", targetDate: "", category: "", priority: 3, notes: "" });
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add goal");
    }
  }

  async function handleDeleteGoal(id) {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.filter(g => g._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete goal");
    }
  }

  async function handleAddContribution(e) {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/goals/${selectedGoalId}/contributions`, newContrib, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddContrib(false);
      setNewContrib({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add contribution");
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app goal-app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>
          <nav className="nav">
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/dashboard`)}>
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
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/budget`)}>
              <span>🎯</span>
              <label>Budget Planner</label>
            </div>
            <div className="nav-item active" onClick={() => navigate(`/${usernameSlug}/goals`)}>
              <span>🏆</span>
              <label>Goals</label>
            </div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/transactions`)}>
              <span>💳</span>
              <label>Transactions</label>
            </div>
            <div className="nav-item" onClick={() => navigate(`/${usernameSlug}/profile`)}>
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

        {/* MAIN CONTENT */}
        <main className="main">
          <section className="card big">
            <div className="header-actions">
              <h2>Financial Goals</h2>
              <button className="add-btn" onClick={() => setShowAddGoal(true)}>+ New Goal</button>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="goals-grid">
              {loading ? (
                <div className="empty">Loading goals...</div>
              ) : goals.length === 0 ? (
                <div className="empty">No goals found. Create your first goal!</div>
              ) : (
                goals.map(goal => (
                  <div key={goal._id} className="goal-card">
                    <div className="goal-header">
                      <h3>{goal.name}</h3>
                      <button className="del-btn" onClick={() => handleDeleteGoal(goal._id)}>✕</button>
                    </div>
                    <div className="goal-stats">
                      <div className="stat">
                        <span>Target</span>
                        <b>₹{goal.targetAmount}</b>
                      </div>
                      <div className="stat">
                        <span>Saved</span>
                        <b className="pos">₹{goal.savedAmount || 0}</b>
                      </div>
                      <div className="stat">
                        <span>Monthly Req.</span>
                        <b>₹{goal.requiredMonthlySaving || 0}</b>
                      </div>
                    </div>
                    
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${goal.progress || 0}%` }}></div>
                    </div>
                    <div className="progress-text">{goal.progress || 0}% Completed • Target: {new Date(goal.targetDate).toLocaleDateString()}</div>
                    
                    <button 
                      className="contrib-btn" 
                      onClick={() => {
                        setSelectedGoalId(goal._id);
                        setShowAddContrib(true);
                      }}
                    >
                      + Add Funds
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        {/* ADD GOAL MODAL */}
        {showAddGoal && (
          <div className="modal-backdrop" onClick={() => setShowAddGoal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Create New Goal</h3>
              <form onSubmit={handleAddGoal} className="modal-form">
                <label>
                  <span>Name</span>
                  <input required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                </label>
                <label>
                  <span>Target Amount</span>
                  <input type="number" required value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} />
                </label>
                <label>
                  <span>Target Date</span>
                  <input type="date" required value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})} />
                </label>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddGoal(false)}>Cancel</button>
                  <button type="submit" className="btn-save">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD CONTRIBUTION MODAL */}
        {showAddContrib && (
          <div className="modal-backdrop" onClick={() => setShowAddContrib(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Add Funds to Goal</h3>
              <form onSubmit={handleAddContribution} className="modal-form">
                <label>
                  <span>Amount</span>
                  <input type="number" required value={newContrib.amount} onChange={e => setNewContrib({...newContrib, amount: e.target.value})} />
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" required value={newContrib.date} onChange={e => setNewContrib({...newContrib, date: e.target.value})} />
                </label>
                <label>
                  <span>Note (Optional)</span>
                  <input value={newContrib.note} onChange={e => setNewContrib({...newContrib, note: e.target.value})} />
                </label>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddContrib(false)}>Cancel</button>
                  <button type="submit" className="btn-save">Add Funds</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
*{ margin:0; padding:0; box-sizing:border-box; font-family:Poppins, system-ui, -apple-system; }
body, html { background:#0b0f2a; }

.goal-app{
  display:grid;
  grid-template-columns:200px minmax(0,1fr);
  height:100vh;
  gap:16px;
  padding:16px;
  background:#0b0f2a;
  color:#e6e9ff;
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
.nav-item:hover{ background:#E7C4A834; }
.nav-item.active{
  background:linear-gradient(135deg,#6c7cff,#8b5cf6);
  color:white; box-shadow:0 0 12px rgba(108,124,255,0.6);
}
.logout{ margin-top:auto; background:#1e2555; }

/* MAIN CONTENT */
.main{ display:flex; flex-direction:column; min-width:0; overflow:hidden; }
.card{
  background:#151a3a; border-radius:16px; padding:24px;
  border:1px solid rgba(255,255,255,0.05);
  box-shadow:0 10px 35px rgba(0,0,0,0.45);
  height:100%; overflow-y:auto;
}

.header-actions {
  display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;
}
.header-actions h2 { font-size: 24px; font-weight: 600; color: white; }

.add-btn{
  background:linear-gradient(135deg,#6c7cff,#8b5cf6); border:none; border-radius:999px;
  padding:10px 20px; color:white; font-weight:600; cursor:pointer; transition:0.3s;
}
.add-btn:hover{ filter:brightness(1.1); transform:scale(1.02); }

.goals-grid {
  display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;
}
.goal-card {
  background:#1e2555; padding:20px; border-radius:16px;
  border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:16px;
}
.goal-header { display:flex; justify-content:space-between; align-items:center; }
.goal-header h3 { font-size:18px; color:white; }
.del-btn { background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-size:16px; font-weight:bold; }
.del-btn:hover { color:#ff1a1a; }

.goal-stats { display:flex; justify-content:space-between; }
.stat { display:flex; flex-direction:column; gap:4px; }
.stat span { font-size:12px; color:#9aa3d2; }
.stat b { font-size:16px; color:#e6e9ff; }
.stat b.pos { color:#6cff9f; }

.progress-bar-wrap { width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; }
.progress-bar { height:100%; background:linear-gradient(90deg,#6c7cff,#6cff9f); border-radius:4px; transition:width 0.4s ease; }
.progress-text { font-size:12px; color:#9aa3d2; text-align:right; }

.contrib-btn {
  align-self:flex-start; padding:8px 16px; border-radius:8px;
  background:rgba(108,124,255,0.15); border:1px solid rgba(108,124,255,0.4);
  color:#6c7cff; cursor:pointer; font-weight:600; transition:0.3s;
}
.contrib-btn:hover { background:rgba(108,124,255,0.3); }

/* MODALS */
.modal-backdrop{
  position:fixed; top:0; left:0; width:100vw; height:100vh;
  background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
  display:flex; justify-content:center; align-items:center; z-index:999;
}
.modal{
  background:#151a3a; width:400px; max-width:90%; border-radius:16px;
  padding:24px; box-shadow:0 10px 40px rgba(0,0,0,0.5);
}
.modal h3{ margin-bottom:20px; font-size:20px; color:white; }
.modal-form{ display:flex; flex-direction:column; gap:16px; }
.modal-form label{ display:flex; flex-direction:column; gap:6px; font-size:14px; color:#9aa3d2; }
.modal-form input{
  background:#1e2555; border:1px solid rgba(255,255,255,0.1);
  padding:10px 12px; border-radius:8px; color:white; font-size:15px; outline:none;
}
.modal-form input:focus{ border-color:#6c7cff; }
.modal-actions{ display:flex; justify-content:flex-end; gap:12px; margin-top:10px; }
.btn-cancel{ padding:10px 16px; background:transparent; border:none; color:#9aa3d2; cursor:pointer; font-weight:500; }
.btn-save{ padding:10px 20px; background:linear-gradient(135deg,#d4af37,#ffd700); border:none; color:#111; border-radius:8px; font-weight:600; cursor:pointer; }
.error { color:#ff4d4d; background:rgba(255,77,77,0.1); padding:10px; border-radius:8px; }
`;
