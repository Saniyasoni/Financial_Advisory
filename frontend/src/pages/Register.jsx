import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function Register() {
  const panelRef = useRef(null);
  const [showOtp, setShowOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);



  const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: ""
});



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
        password: form.password,
      });

      alert("Registration Successful");
      navigate("/login");
      console.log(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };
const navigate = useNavigate();

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
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="coin"
            style={{
              left: Math.random() * 90 + "%",
              top: Math.random() * 90 + "%",
              animationDelay: i * 0.3 + "s",
            }}
          />
        ))}
        <h2>Build Your Financial Future</h2>
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

                } catch {
                  alert("Failed to send OTP");
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

        </form>

        <p>
  Already have an account?{" "}
  <span className="link" onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
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
.root{
  background:#FFFFFF;
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  gap:32px;
  font-family:Poppins;
  padding:24px;
}

.left, .right{
  border-radius:32px;
  height:620px;
}

.left{
  width:600px;
  background:rgba(238,193,160,0.2);
  position:relative;
  overflow:hidden;
  display:flex;
  justify-content:center;
  align-items:center;
  flex-direction:column;
  transition:0.1s;
  transform: translate(var(--x,0), var(--y,0));
}

.left h2{
  color:#000;
  font-size:26px;
  font-weight:600;
  z-index:2;
  text-align:center;
}

.coin{
  position:absolute;
  width:32px;
  height:32px;
  background:#EEC1A0;
  border-radius:50%;
  opacity:0.7;
  animation: float 4s infinite alternate ease-in-out;
}

.coin::after{
  content:"₹";
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  font-weight:bold;
  color:#000;
}

@keyframes float{
  from{transform:translateY(0)}
  to{transform:translateY(-15px)}
}

.right{
  width:500px;
  background:#FFFFFF;
  padding:32px;
  box-shadow:0 6px 22px rgba(0,0,0,0.04);
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:24px;
  border:1px solid rgba(169,169,169,0.3);
}

.right h1{
  font-size:32px;
  font-weight:600;
  color:#000000;
}

.inputBox{
  height:52px;
  display:flex;
  align-items:center;
  gap:12px;
  padding:0 16px;
  border:1.5px solid #A9A9A9;
  border-radius:12px;
  background:#FFFFFF;
  transition:0.3s;
}

.inputBox input{
  width:100%;
  border:none;
  outline:none;
  font-size:16px;
  color:#000;
  background:transparent;
}

.inputBox input::placeholder{
  color:#A9A9A9;
}

.inputBox:focus-within{
  border-color:#EEC1A0;
  box-shadow:0 0 6px rgba(238,193,160,0.3);
}

form{
  display:flex;
  flex-direction:column;
  gap:24px;
}

button{
  height:56px;
  background:#EEC1A0;
  border:none;
  border-radius:12px;
  font-size:16px;
  font-weight:500;
  cursor:pointer;
  color:#000;
  transition:0.3s;
}

button:hover{
  transform:scale(1.04);
  box-shadow:0 4px 12px rgba(238,193,160,0.4);
}

p{
  font-size:14px;
  color:#000;
  text-align:center;
}

.link{
  color:#000;
  font-weight:500;
  cursor:pointer;
  text-decoration:underline;
}
.otp-backdrop{
  position:fixed;
  inset:0;
  background:rgba(248,237,226,0.85);
  backdrop-filter:blur(8px);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:100;
}

.otp-card{
  width:420px;
  background:#FFFFFF;
  border-radius:32px;
  padding:36px;
  box-shadow:0 20px 60px rgba(0,0,0,0.1);
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
  height:54px;
  border-radius:14px;
  border:2px solid #EEC1A0;
  font-size:20px;
  text-align:center;
}

.otp-btn{
  margin-top:20px;
  width:100%;
  height:52px;
  background:#EEC1A0;
  border:none;
  border-radius:16px;
  font-size:16px;
  cursor:pointer;
}

.otp-error{
  color:red;
  margin-top:10px;
}
.otp-resend{
  margin-top:12px;
  background:transparent;
  border:none;
  color:#EEC1A0;
  font-size:14px;
  cursor:pointer;
  text-decoration:underline;
}


@media(max-width:1100px){
  .root{flex-direction:column;}
  .left, .right{width:100%; height:auto; padding:20px;}
  .left{height:260px;}
}
`;
