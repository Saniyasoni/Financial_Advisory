import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Verify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { email, phone } = state;

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  async function verify() {
    try {
      await axios.post("http://localhost:5000/api/auth/verify-email", {
        email,
        otp: emailOtp
      });

      await axios.post("http://localhost:5000/api/auth/verify-phone", {
        phone,
        otp: phoneOtp
      });

      alert("Verified!");
      navigate("/register", { state: { verified: true } });
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
    }
  }

  return (
    <div>
      <h2>Verify your account</h2>

      <input placeholder="Email OTP" onChange={e => setEmailOtp(e.target.value)} />
      <input placeholder="Phone OTP" onChange={e => setPhoneOtp(e.target.value)} />

      <button onClick={verify}>Verify</button>
    </div>
  );
}
