import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import TreeGrowth from "../components/TreeGrowth";
import { useNavigate } from "react-router-dom";

export default function Register() {

const navigate = useNavigate();
const panelRef = useRef(null);

const [showOtp, setShowOtp] = useState(false);
const [treeStage, setTreeStage] = useState(0);

const [emailOtp, setEmailOtp] = useState("");
const [phoneOtp, setPhoneOtp] = useState("");
const [otpError, setOtpError] = useState("");
const [verified, setVerified] = useState(false);
const [resendLoading, setResendLoading] = useState(false);

const growthQuotes = [
  "The foundation of wealth starts with one small step.",
  "Plant the seed today: small savings grow into big futures.",
  "Nurture your savings daily. Consistency creates strong roots.",
  "Your money is growing stronger every day. Keep watering it.",
  "Patience + time = a tall tree of wealth. You're building it!",
  "Start with a small investment. Watch it payout big later. Your money tree is here! 🌳💰"
];

const [form, setForm] = useState({
name:"",
email:"",
phone:"",
password:"",
confirm:""
});

const nameValid = form.name.trim().length > 2;

const emailValid =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

const phoneValid =
/^[6-9]\d{9}$/.test(form.phone);

const passwordValid =
/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password);

const confirmValid =
form.confirm.length > 0 &&
form.confirm === form.password;

useEffect(() => {

let stage = 0;

if(nameValid){
  stage = 1;
  if(emailValid){
    stage = 2;
    if(phoneValid){
      stage = 3;
      if(passwordValid){
        stage = 4;
        if(confirmValid){
          stage = 5;
        }
      }
    }
  }
}
setTreeStage(stage);
},[
form.name,
form.email,
form.phone,
form.password,
form.confirm
]);
  const handleMove = (e) => {
    const rect = panelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    panelRef.current.style.setProperty("--x", x * 15 + "px");
    panelRef.current.style.setProperty("--y", y * 15 + "px");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });

      alert("Registration Successful");
      navigate("/login");
      console.log(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="root">

      <div
        className="left"
        ref={panelRef}
        onMouseMove={handleMove}
        onMouseLeave={() => {
          panelRef.current.style.setProperty("--x", 0);
          panelRef.current.style.setProperty("--y", 0);
        }}
      >
        <div className="tree-area">
          <TreeGrowth stage={treeStage} quote={growthQuotes[treeStage]} />
        </div>
      </div>

      <div className="right">
        <h1>Create Your Account</h1>

        <form onSubmit={handleRegister}>

          <div className="inputBox">
            <span>👤</span>
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="inputBox">
            <span>✉</span>
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="inputBox">
            <span>📱</span>
            <input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) {
                    setForm({ ...form, phone: val });
                  }
                }}
                required
          />

          </div>

          <div className="inputBox">
            <span>🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
              title="Must contain uppercase, lowercase, number, and symbol"
              required
            />
          </div>

          <div className="inputBox">
            <span>🔐</span>
            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          <div className="btn-row">
           <button
              type="button"
              className="otp-btn"
              onClick={async () => {

                // PHONE validation
                if (!/^[6-9]\d{9}$/.test(form.phone)) {
                  alert("Enter valid 10-digit Indian mobile number");
                  return;
                }

                // PASSWORD validation
                if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)) {
                  alert("Password must contain uppercase, lowercase, number and symbol");
                  return;
                }

                try {
                  await axios.post("http://localhost:5000/api/auth/register", {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password
                  });

                  setShowOtp(true);   // show popup
                  setOtpError("");

                } catch (err) {
                    console.log(err.response?.data);
                    alert(err.response?.data?.message || "Failed to send OTP");
                }
              }}
            >Send OTP
            </button>


          <button
            disabled={!verified}
            onClick={async () => {
              try {
                const res = await axios.post("http://localhost:5000/api/auth/login", {
                  email: form.email,
                  password: form.password
                });

                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));

                navigate(`/${res.data.user.name.replace(/\s+/g, "_")}/dashboard`);
              } catch {
                alert("Login failed after verification");
              }
            }}
          >Create Account
          </button>
        </div>

        </form>

        <p>
  Already have an account?{" "}
  <span className="link" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
    Login
  </span>
</p>

      </div>
      {showOtp && (
        <div className="otp-backdrop">
          <div className="otp-card">

            <div className="otp-icon">📱🔒</div>
            <h2>Authenticate Your Account</h2>
            <p>Enter the 2-factor verification codes sent to you</p>

            <div className="otp-row">
              <input
                placeholder="Email OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
              />
              <input
                placeholder="Phone OTP"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
              />
            </div>

            {otpError && <div className="otp-error">{otpError}</div>}

            <button className="otp-btn" onClick={async () => {
              try {
                await axios.post("http://localhost:5000/api/auth/verify-email", {
                  email: form.email,
                  otp: emailOtp
                });

                await axios.post("http://localhost:5000/api/auth/verify-phone", {
                  phone: form.phone,
                  otp: phoneOtp
                });

                setVerified(true);
                setShowOtp(false);
                alert("Verification complete");
              } catch (err) {
                setOtpError(err.response?.data?.message || "Invalid OTP");
              }
            }}>
              Verify & Continue
            </button>
             <button
              className="otp-resend"
              disabled={resendLoading}
              onClick={async () => {
                try {
                  setResendLoading(true);

                  await axios.post("http://localhost:5000/api/auth/register", {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password
                  });

                  alert("New OTP sent");
                } catch {
                  alert("Failed to resend OTP");
                } finally {
                  setResendLoading(false);
                }
              }}
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>


          </div>
        </div>
        )}


      <style>{css}</style>
    </div>
  );
}

const css = `
*{
margin:0;
padding:0;
box-sizing:border-box;
}

html,body{
height:100%;
background:#0b0f2a;
overflow-x:hidden;
}

.root{
background:#0b0f2a;
height:100vh;

display:grid;
grid-template-columns:1fr 1fr;

gap:32px;
padding:40px 80px;

font-family:Poppins;
color:#e6e9ff;
}

.left,.right{
border-radius:24px;
height:520px;
}

/* LEFT VISUAL PANEL */

.left {
  background: #151a3a;
  display: flex;
  align-items: stretch;       
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow:
    0 10px 35px rgba(0,0,0,0.45),
    0 0 20px rgba(108,124,255,0.08);
  overflow: hidden;             
  height: auto;                
}


.left h2{
color:#e6e9ff;
font-size:26px;
font-weight:600;
z-index:2;
text-align:center;
}

.tree-area {
  width: 100%;
  height: 100%;
  position: relative;          
}


/* COINS */

.coin{
position:absolute;
width:30px;
height:30px;
background:linear-gradient(145deg,#FFD700,#FFA500);
border-radius:50%;

box-shadow:
0 0 10px rgba(255,200,0,0.8),
inset 0 0 4px rgba(255,255,255,0.6);

opacity:0.9;
animation:float 4s infinite alternate ease-in-out;
}

.coin::after{
content:"₹";
position:absolute;
left:50%;
top:50%;
transform:translate(-50%,-50%);
font-weight:700;
color:#111;
font-size:14px;
}

@keyframes float{
from{transform:translateY(0)}
to{transform:translateY(-15px)}
}

/* RIGHT FORM PANEL */

.right{
background:#151a3a;

padding:40px;

display:flex;
flex-direction:column;
justify-content:center;

border:1px solid rgba(255,255,255,0.05);

box-shadow:
0 10px 35px rgba(0,0,0,0.45),
0 0 20px rgba(108,124,255,0.08);
}

.right h1{
font-size:26px;
margin-bottom:10px;
}

/* INPUTS */

.inputBox{
height:48px;
display:flex;
align-items:center;
gap:12px;
width:100%;
padding:0 16px;

border:1px solid rgba(255,255,255,0.08);

border-radius:12px;
background:#1a2045;

transition:0.3s;
}

input:-webkit-autofill{
-webkit-box-shadow:0 0 0 1000px #1a2045 inset !important;
-webkit-text-fill-color:#e6e9ff !important;
}

.inputBox span{
font-size:18px;
}

.inputBox input{
width:100%;
border:none;
outline:none;
font-size:15px;
color:#e6e9ff;
background:transparent;
}

.inputBox input::placeholder{
color:#9aa3d2;
}

.inputBox:focus-within{
border-color:#6c7cff;

box-shadow:
0 0 10px rgba(108,124,255,0.5);
}

/* FORM */

form{
display:flex;
flex-direction:column;
gap:14px;
}

/* BUTTONS */

.btn-row{
display:flex;
gap:16px;
margin-top:10px;
}

.btn-row button{
flex:1;
height:46px;
font-size:14px;
border-radius:12px;
border:none;
cursor:pointer;
color:white;
}

.otp-btn{
background:#3b4cff;
box-shadow:0 0 10px rgba(59,76,255,0.5);
}

.create-btn{
background:#5d6bff;
box-shadow:0 0 10px rgba(93,107,255,0.5);
}

button:hover{
transform:scale(1.03);
}

/* LINK */

p{
font-size:14px;
color:#9aa3d2;
text-align:center;
}

.link{
color:#6c7cff;
font-weight:500;
cursor:pointer;
text-decoration:none;
}

.link:hover{
text-decoration:underline;
}

/* OTP MODAL */

.otp-backdrop{
position:fixed;
inset:0;

background:rgba(11,15,42,0.9);

backdrop-filter:blur(8px);

display:flex;
align-items:center;
justify-content:center;

z-index:100;
}

.otp-card{

width:420px;

background:#151a3a;

border-radius:24px;

padding:36px;

box-shadow:
0 10px 40px rgba(0,0,0,0.6),
0 0 20px rgba(108,124,255,0.08);

text-align:center;
}

.otp-icon{
font-size:48px;
margin-bottom:12px;
}

.otp-row{
display:flex;
gap:12px;
justify-content:center;
}

.otp-row input{

width:140px;
height:52px;

border-radius:12px;

border:1px solid rgba(255,255,255,0.08);

background:#1a2045;

color:#e6e9ff;

font-size:18px;
text-align:center;
}


.otp-error{
color:#ff4d6d;
margin-top:10px;
}

.otp-resend{

margin-top:12px;

background:transparent;

border:none;

color:#6c7cff;

font-size:14px;

cursor:pointer;

text-decoration:underline;
}

/* RESPONSIVE */

@media(max-width:1000px){

.root{
grid-template-columns:1fr;
padding:40px;
}

.left{
height:260px;
}

}
`;
