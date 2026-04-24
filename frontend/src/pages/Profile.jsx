import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const username = user?.name || "User";
  const email = user?.email || "user@example.com";
  const slug = username.replace(/\s+/g, "_").toLowerCase();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profileImg, setProfileImg] = useState(localStorage.getItem("avatar"));
  
  // Settings State
  const [editName, setEditName] = useState(username);
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "INR");

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setTransactions(res.data.items || []);
        setLoading(false);
      });
  }, [token, navigate]);

  const joinDate = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }, [user?.createdAt]);


  /* ---------------- Activity Calendar ---------------- */
  // Find which days of the current month have transactions to simulate "activity"
  const activeDays = useMemo(() => {
    const active = new Set();
    const currentMonth = new Date().getMonth();
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth) {
        active.add(d.getDate());
      }
    });
    return active;
  }, [transactions]);


  /* ---------------- Avatar Upload ---------------- */
  function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("avatar", reader.result);
      setProfileImg(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    alert("Profile saved successfully! (Mock)");
  }

  function handleCurrencyChange(e) {
    setCurrency(e.target.value);
    localStorage.setItem("currency", e.target.value);
  }

  function handleExport() {
    alert("Downloading your data as CSV... (Mock)");
  }

  function handleDelete() {
    if(window.confirm("Are you sure you want to completely delete your account? This action cannot be undone.")) {
       localStorage.clear();
       navigate("/");
    }
  }

  /* ---------------------- UI ---------------------- */

  return (
    <>
      <style>{CSS}</style>

      <div className="app tx-app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>

          <nav className="nav">
            <div className="nav-item" onClick={() => navigate(`/${slug}/dashboard`)}><span>📊</span> <label>Dashboard</label></div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/analytics`)}><span>📈</span> <label>Analytics</label></div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/insights`)}><span>💡</span> <label>Insights</label></div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/budget`)}><span>🎯</span> <label>Budget Planner</label></div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/goals`)}><span>🏆</span> <label>Goals</label></div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/transactions`)}><span>💳</span> <label>Transactions</label></div>
            <div className="nav-item active"><span>👤</span> <label>Account Settings</label></div>
          </nav>

          <div className="nav-item logout" onClick={() => { localStorage.clear(); navigate("/"); }}>
            <span>🚪</span> <label>Logout</label>
          </div>
        </aside>

        {/* MAIN SETTINGS AREA */}
        <main className="main">
          
          <div className="settings-header">
            <h2>Account Settings</h2>
            <p className="muted">Manage your personal information, preferences, and security.</p>
          </div>

          <div className="settings-grid">
            
            {/* PERSONAL DETAILS CARD */}
            <form className="card settings-card" onSubmit={handleSaveProfile}>
              <h3>Personal Details</h3>
              
              <div className="avatar-section">
                <label className="avatar-wrap">
                  <input type="file" hidden onChange={uploadAvatar} />
                  {profileImg ? <img src={profileImg} alt="" /> : <div className="avatar">👤</div>}
                  <div className="avatar-overlay">Change</div>
                </label>
                <div className="avatar-text">
                  <p>Profile Picture</p>
                  <span className="muted">Click to upload a new avatar</span>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} readOnly disabled className="disabled-input" />
                <span className="helper-text">Email cannot be changed directly. Contact support to update.</span>
              </div>

              <div className="card-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>

            {/* PREFERENCES CARD */}
            <div className="card settings-card">
              <h3>App Preferences</h3>
              
              <div className="form-group">
                <label>Display Currency</label>
                <select value={currency} onChange={handleCurrencyChange}>
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                </select>
                <span className="helper-text">This will update the currency symbol across your dashboards.</span>
              </div>

              <div className="form-group">
                <label>Theme</label>
                <select disabled>
                  <option>Dark Mode (Default)</option>
                </select>
                <span className="helper-text">Light mode is currently in development.</span>
              </div>
            </div>

            {/* ACTIVITY CALENDAR */}
            <div className="card settings-card calendar-card">
              <h3>Activity & Engagement</h3>
              <p className="muted" style={{marginBottom: "16px"}}>Days you were active on FinTrack this month</p>
              <div className="calendar-grid">
                {[...Array(31)].map((_, i) => (
                  <div key={i} className={`cal-cell ${activeDays.has(i + 1) ? "active-cell" : ""}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="helper-text" style={{marginTop: "16px"}}>Member since {joinDate ? joinDate.toDateString() : "recently"}</p>
            </div>

            {/* SECURITY & DATA CARD */}
            <div className="card settings-card danger-card">
              <h3>Security & Data Management</h3>
              
              <div className="setting-row">
                <div className="setting-info">
                  <h4>Change Password</h4>
                  <p className="muted">Secure your account with a strong password.</p>
                </div>
                <button className="btn-secondary" onClick={() => alert("Change Password modal would open here.")}>Update Password</button>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>Export Financial Data</h4>
                  <p className="muted">Download all your transactions and goals as a CSV file.</p>
                </div>
                <button className="btn-secondary" onClick={handleExport}>Download CSV</button>
              </div>

              <div className="divider"></div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4 className="danger-text">Delete Account</h4>
                  <p className="muted">Permanently delete your account and all associated data.</p>
                </div>
                <button className="btn-danger" onClick={handleDelete}>Delete Account</button>
              </div>

            </div>

          </div>

        </main>
      </div>
    </>
  );
}

const CSS = `
*{
  margin:0; padding:0; box-sizing:border-box;
  font-family:Poppins, system-ui, -apple-system;
}
body, html { background:#0b0f2a; }

.tx-app{
  background:#0b0f2a;
  display:grid;
  grid-template-columns:200px minmax(0,1fr);
  height:100vh;
  gap:24px;
  padding:16px;
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
  background:rgba(255,255,255,0.05);
}

.nav-item.active{
  background:linear-gradient(135deg,#6c7cff,#8b5cf6);
  color:white;
  box-shadow:0 0 12px rgba(108,124,255,0.6);
}

.logout{ margin-top:auto; background:#1e2555; }

/* MAIN SETTINGS AREA */
.main{
  display:flex;
  flex-direction:column;
  gap:24px;
  overflow-y:auto;
  padding-right:8px;
  padding-bottom:40px;
}

.settings-header h2 {
  font-size: 28px;
  color: white;
  margin-bottom: 4px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
}

.card {
  border-radius:16px;
  padding:28px;
  background:#151a3a;
  border:1px solid rgba(255,255,255,0.05);
  box-shadow: 0 10px 35px rgba(0,0,0,0.45);
}

.settings-card h3 {
  font-size: 18px;
  color: white;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.muted { color: #9aa3d2; font-size: 13px; }

/* Avatar Section */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar {
  width: 100%;
  height: 100%;
  background: #1e2555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
  opacity: 0;
  transition: 0.3s;
}

.avatar-wrap:hover .avatar-overlay {
  opacity: 1;
}

.avatar-text p {
  color: white;
  font-weight: 500;
  margin-bottom: 4px;
}

/* Forms */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 13px;
  color: #9aa3d2;
  font-weight: 500;
}

.form-group input, 
.form-group select {
  background: #1e2555;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #6c7cff;
}

.disabled-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.helper-text {
  font-size: 12px;
  color: #6872a3;
}

/* Buttons */
.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #6c7cff, #8b5cf6);
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108,124,255,0.4);
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(108,124,255,0.4);
  color: #6c7cff;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.3s;
}
.btn-secondary:hover {
  background: rgba(108,124,255,0.1);
}

.btn-danger {
  background: rgba(255,77,77,0.1);
  border: 1px solid rgba(255,77,77,0.4);
  color: #ff4d4d;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.3s;
}
.btn-danger:hover {
  background: rgba(255,77,77,0.2);
}

/* Security Rows */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.setting-info h4 {
  color: white;
  font-size: 15px;
  margin-bottom: 4px;
}

.danger-text { color: #ff4d4d !important; }

.divider {
  height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 24px 0;
}

/* Calendar */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.cal-cell {
  background: rgba(255,255,255,0.03);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  color: #6872a3;
  transition: 0.3s;
}

.active-cell {
  background: linear-gradient(135deg, #6c7cff, #6cff9f);
  color: #0b0f2a;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(108,124,255,0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .tx-app { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; justify-content: space-between; }
}
`;
