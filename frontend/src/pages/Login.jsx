import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [triggered, setTriggered] = useState(false);
  const [msg, setMsg] = useState(false);
  const pigRef = useRef(null);

useEffect(() => {
  if (email.length === 1 && !triggered) {
    setTriggered(true);
    collectCoins();
  }
  if (email.length === 0 && triggered) {
    scatterCoins();
    setTriggered(false);
  }
}, [email, triggered]);

  function collectCoins() {
    const coins = document.querySelectorAll(".coin");
    const pig = pigRef.current.getBoundingClientRect();

    coins.forEach((coin, i) => {
      const c = coin.getBoundingClientRect();
      const dx = pig.x - c.x + 40;
      const dy = pig.y - c.y + 40;
      setTimeout(() => {
        coin.style.animation = "none";
        coin.style.transition = "0.9s cubic-bezier(0.34,1.3,0.64,1)";
        coin.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
        coin.style.opacity = "0";
      }, i * 100);
    });
    setTimeout(() => setMsg(true), 900);
  }

  function scatterCoins() {
    const coins = document.querySelectorAll(".coin");
    coins.forEach((coin, i) => {
      setTimeout(() => {
        const x = Math.random() * 300 - 150;
        const y = Math.random() * 300 - 150;
        coin.style.transition = "1.5s ease-out";
        coin.style.transform = `translate(${x}px, ${y}px) scale(1)`;
        coin.style.opacity = "1";
        coin.style.animation = "floatCoins 3s infinite alternate ease-in-out";
      }, i * 120);
    });
    setMsg(false);
  }
    async function handleLogin() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password
    });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    const slug = res.data.user.name.trim().replace(/\s+/g, "_").toLowerCase();
    window.location.href = `/${slug}/dashboard`;

  } catch (err) {
    alert(err.response?.data?.message || "User not found. Check credentials.");
  }
}


  return (
    <>
      <style>{CSS}</style>

      <div className="root">
        <div className="bg-symbols">
          {["₹","$","€","⤴","📈","¥"].map((s,i)=>
            <span key={i} style={{
              left: Math.random()*100+"%",
              top: Math.random()*100+"%",
              animationDelay: i*0.8+"s"
            }}>{s}</span>
          )}
        </div>

        <div className="container">

          <div className="card">
            <h1>Welcome Back</h1>

            <div className="input-box">
              <span>✉</span>
              <input
                placeholder="Email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>

            <div className="input-box">
              <span>🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

           <button className="btn" onClick={handleLogin}>Sign In</button>
           <button
            className="btn-outline"
            onClick={() => (window.location.href = "/register")}
            >Create Account </button>

          </div>

          <div className="visual">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="coin"
                style={{
                  left: Math.random() * 80 + 10 + "%",
                  top: Math.random() * 80 + 10 + "%"
                }}
              />
            ))}

            <div ref={pigRef} className="pig">🐷</div>
            {msg && <div className="msg">WELCOME! Back User Saving money is a good habit</div>}
          </div>

        </div>
      </div>
    </>
  );
}

const CSS = `
*{margin:0; padding:0; box-sizing:border-box; font-family:Poppins;}

.root{
  height:100vh;
  background:#FFFFFF;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  position:relative;
}

.root::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at center, rgba(238,193,160,0.22), transparent 70%),
    radial-gradient(circle at top left, rgba(238,193,160,0.12), transparent 45%),
    radial-gradient(circle at bottom right, rgba(169,169,169,0.12), transparent 45%);
  z-index:0;
}

.root::after{
  content:"";
  position:absolute;
  inset:0;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  opacity:0.35;
  z-index:0;
}

.bg-symbols span{
  position:absolute;
  font-size:22px;
  opacity:0.12;
  color:#A9A9A9;
  animation:float 6s infinite alternate ease-in-out;
  z-index:0;
}

@keyframes float{
  from{transform:translateY(0)}
  to{transform:translateY(-20px)}
}

.container{
  width:1200px;
  height:620px;
  display:grid;
  grid-template-columns:520px 1fr;
  gap:32px;
  padding:32px;
  position:relative;
  z-index:2;
}

.card{
  background:rgba(238,193,160,0.25);
  border-radius:32px;
  padding:32px;
  display:flex;
  flex-direction:column;
  gap:24px;
  justify-content:center;
  backdrop-filter:blur(38px);
  border:1px solid rgba(255,255,255,0.5);
  box-shadow:0 8px 30px rgba(0,0,0,0.06), inset 0 0 14px rgba(255,255,255,0.6);
}

.card h1{
  font-size:30px;
  font-weight:600;
  color:#000;
}

.input-box{
  height:50px;
  border-radius:999px;
  display:flex;
  align-items:center;
  gap:12px;
  padding:0 16px;
  border:1.2px solid #A9A9A9;
  background:rgba(255,255,255,0.6);
  transition:0.3s;
}

.input-box input{
  border:none;
  background:none;
  outline:none;
  width:100%;
  font-size:16px;
  color:#000;
}

.input-box:focus-within{
  border-color:#EEC1A0;
  box-shadow:0 0 12px rgba(238,193,160,0.8);
}

.btn{
  width:140px;
  height:42px;
  border-radius:999px;
  background:#EEC1A0;
  border:none;
  font-weight:600;
  cursor:pointer;
  font-size:15px;
  color:#000;
  transition:0.3s;
}

.btn:hover{
  transform:scale(1.04);
  box-shadow:0 4px 12px rgba(238,193,160,0.6);
}
.btn-outline{
  width:140px;
  height:42px;
  border-radius:999px;
  background:transparent;
  border:1.5px solid #EEC1A0;
  font-weight:600;
  cursor:pointer;
  font-size:15px;
  color:#000;
  transition:0.3s;
}

.btn-outline:hover{
  background:#EEC1A0;
  transform:scale(1.04);
}

.visual{
  background:rgba(238,193,160,0.12);
  border-radius:32px;
  position:relative;
  overflow:hidden;
  display:flex;
  justify-content:center;
  align-items:center;
  backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.5);
}

.pig{
  font-size:120px;
  z-index:2;
  filter:drop-shadow(0 0 18px rgba(238,193,160,0.7));
  animation:breathe 1.8s infinite alternate ease-in-out;
}

@keyframes breathe{
  0%{transform:scale(1)}
  100%{transform:scale(1.07)}
}

/* GOLD COIN + FLOAT */
.coin {
  position:absolute;
  width:36px;
  height:36px;
  background: linear-gradient(145deg,#FFD700,#FFA500);
  border-radius:50%;
  box-shadow:0 0 12px rgba(255,185,0,0.9), inset 0 0 6px rgba(255,255,255,0.5);
  animation: floatCoins 3s infinite alternate ease-in-out;
  opacity:1;
}

@keyframes floatCoins {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-25px); }
}

.coin::after{
  content:"₹";
  position:absolute;
  font-size:18px;
  font-weight:700;
  color:#000;
  left:50%; top:50%;
  transform:translate(-50%,-50%);
}

.msg{
  position:absolute;
  bottom:22px;
  background:#EEC1A0;
  padding:12px 18px;
  border-radius:12px;
  font-size:14px;
  font-weight:500;
  color:#000;
  animation:pop 0.4s ease;
}

@keyframes pop{
  from{opacity:0; transform:translateY(10px)}
  to{opacity:1; transform:translateY(0)}
}

@media(max-width:1024px){
  .container{grid-template-columns:1fr 1fr;}
}
@media(max-width:768px){
  .container{grid-template-columns:1fr;}
  .visual{display:none;}
}
`;
