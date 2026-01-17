import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

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
  const slug = username.replace(/\s+/g, "_").toLowerCase();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* NEW */
  const [profileImg, setProfileImg] = useState(localStorage.getItem("avatar"));
  const [memberDays, setMemberDays] = useState(0);
  const hoverRef = React.useRef(null);


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

  /* ---------------- Greeting ---------------- */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  /* ---------------- Member since ---------------- */
const joinDate = useMemo(() => {
  if (!user?.createdAt) return null;
  const d = new Date(user.createdAt);
  return isNaN(d.getTime()) ? null : d;
}, [user?.createdAt]);

useEffect(() => {
  if (!joinDate) return;

  const totalDays = Math.floor(
    (Date.now() - joinDate.getTime()) / 86400000
  );

  let current = 0;
  let raf;

  const animate = () => {
    current += 1;
    setMemberDays(prev => (prev < totalDays ? current : prev));

    if (current < totalDays) {
      raf = requestAnimationFrame(animate);
    }
  };

  animate();

  return () => cancelAnimationFrame(raf);
}, [joinDate]);


  /* ---------------------- METRICS ---------------------- */

  const income = useMemo(
    () =>
      transactions
        .filter(t => t.type === "income")
        .reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const expense = useMemo(
    () =>
      transactions
        .filter(t => t.type === "expense")
        .reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const balance = income - expense;
  const savingsRate = income ? Math.round((balance / income) * 100) : 0;

  const healthScore = Math.min(
    100,
    Math.round(
      savingsRate * 0.5 +
        (transactions.length > 20 ? 30 : transactions.length * 1.5) +
        (balance > 0 ? 20 : 0)
    )
  );

  const expenseByCategory = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const topCategory = [...expenseByCategory]
  .sort((a,b)=>b.value-a.value)[0]?.name || "—";

  const barData = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        map[key] = (map[key] || 0) + t.amount;
      });
    return Object.entries(map)
      .slice(-6)
      .map(([k, v]) => ({ month: k, amount: v }));
  }, [transactions]);

  /* ---------------- Calendar ---------------- */
  const monthTx = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.date).getDate();
      if (!map[d] || map[d].amount < t.amount) map[d] = t;
    });
    return map;
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

  /* ---------------------- UI ---------------------- */

  return (
    <>
      <style>{CSS}</style>

      <div className="app tx-app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">FinTrack</div>

          <nav className="nav">
            <div className="nav-item" onClick={() => navigate(`/${slug}/dashboard`)}>📊 Dashboard</div>
            <div className="nav-item">📈 Analytics</div>
            <div className="nav-item">💡 Insights</div>
            <div className="nav-item">🎯 Budget Planner</div>
            <div className="nav-item" onClick={() => navigate(`/${slug}/transactions`)}>💳 Transactions</div>
            <div className="nav-item active">👤 Profile</div>
          </nav>

          <div className="nav-item logout" onClick={() => { localStorage.clear(); navigate("/"); }}>
            🚪 Logout
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">

          {/* PROFILE */}
          <div className="card big profile-card span-2">
            <label className="avatar-wrap">
              <input type="file" hidden onChange={uploadAvatar} />
              {profileImg ? <img src={profileImg} alt="" /> : <div className="avatar">👤</div>}
            </label>

            <h3>{greeting}, {username}</h3>
            <p className="muted">Member since {joinDate ? joinDate.toDateString() : "-"}</p>
            <p className="muted">{memberDays} days with FinTrack</p>

            <h1>₹{balance}</h1>

            <div className="progress">
              <div className="fill" style={{ width: `${savingsRate}%` }}></div>
            </div>
            <p className="muted">Savings Rate: {savingsRate}%</p>
            <div className="pie-wrap">
  <ResponsiveContainer width="100%" height={180}>
    <div className="pie-container">
  <PieChart width={220} height={220}>
    <Pie
      data={expenseByCategory}
      dataKey="value"
      cx="50%"
      cy="50%"
      innerRadius={55}
      outerRadius={85}
    >
      {expenseByCategory.map((_, i) => (
        <Cell
          key={i}
          fill={["#E7C4A8", "#E9A96B", "#F3D3B5", "#D96C6C"][i % 4]}
        />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</div>

  </ResponsiveContainer>
</div>

          </div>

          {/* HEALTH */}
          <div className="card small">
            <h3>Financial Health</h3>
            <h1>{healthScore}</h1>
            <p>{healthScore > 70 ? "Excellent" : healthScore > 40 ? "Stable" : "Risky"}</p>
          </div>

          {/* INSIGHTS */}
          <div className="card small">
            <p>Top Category: {topCategory}</p>
            <p>Monthly Burn: ₹{expense}</p>
          </div>

          {/* CALENDAR */}
          <div className="card">
            <h3>Transaction Calendar</h3>
            <div className="calendar">
              {[...Array(31)].map((_, i) => (
                <div
  className="day"
  onMouseEnter={() => (hoverRef.current = monthTx[i + 1])}
  onMouseLeave={() => (hoverRef.current = null)}
>

                  {i + 1}
                </div>
              ))}
            </div>
{hoverRef.current && (
  <div className="hover">
    <b>{hoverRef.current.description}</b> ₹{hoverRef.current.amount}
  </div>
)}

          </div>

        </main>

        {/* RIGHT */}
        <aside className="right">
          <div className="card chart-card">
            <h3>Monthly Expenses</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="amount" fill="#E9A96B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </aside>
      </div>
    </>
  );
}


/* USE SAME CSS AS TRANSACTIONS */
const CSS = `
*{
  margin:0; padding:0; box-sizing:border-box;
  font-family:Poppins, system-ui, -apple-system;
}
.span-2{
  grid-column: span 2;
}

.profile-card{
  align-items:center;
  text-align:center;
}

.avatar-wrap img{
  width:72px;
  height:72px;
  border-radius:50%;
  object-fit:cover;
  cursor:pointer;
}

.avatar{
  width:72px;
  height:72px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:32px;
  background:#E7C4A8;
  cursor:pointer;
}

.calendar{
  display:grid;
  grid-template-columns:repeat(7,1fr);
  position:relative;
  z-index:0;
  gap:6px;
  margin-top:10px;
}
.pie-container{
  width:100%;
  height:220px;
  display:flex;
  justify-content:center;
  align-items:center;
}


.day{
  background:#E7C4A833;
  padding:8px;
  border-radius:8px;
  text-align:center;
  cursor:pointer;
  font-size:12px;
}

.day:hover{
  background:#E9A96B;
}

.hover{
  margin-top:10px;
  background:#F8EDE2;
  padding:10px;
  border-radius:12px;
  font-size:13px;
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
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(280px, auto);
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

.big{
  min-height:380px;
  display:flex;
  flex-direction:column;
}


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

.card{
  position:relative;
  overflow:hidden;
  z-index:1;
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
