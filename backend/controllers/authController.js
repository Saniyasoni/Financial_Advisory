import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dns from "dns/promises";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import { sendSms } from "../services/smsService.js";
import { generateOtp, hashOtp, verifyOtp } from "../services/otpService.js";
import { create } from "domain";

function validateEmail(email) {
  const rfcRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return rfcRegex.test(email);
}

export const sendPhoneOtp = async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) return res.status(400).json({ message: "Invalid phone" });

  const otp = generateOtp();
  user.phoneOtpHash = await hashOtp(otp);
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendSms(phone, `Your FinTrack verification code is ${otp}`);

  res.json({ message: "OTP sent to phone" });
};

export const verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !user.phoneOtpHash)
    return res.status(400).json({ message: "Invalid request" });

  if (user.otpExpiresAt < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  const ok = await verifyOtp(otp, user.phoneOtpHash);
  if (!ok)
    return res.status(400).json({ message: "Invalid OTP" });

  user.phoneVerified = true;
  user.phoneOtpHash = null;
  user.lastVerifiedAt = new Date();
  await user.save();

  res.json({ message: "Phone verified" });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const emailOtp = generateOtp();
  const phoneOtp = generateOtp();

  user.emailOtpHash = await hashOtp(emailOtp);
  user.phoneOtpHash = await hashOtp(phoneOtp);
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;

  await user.save();

  await sendEmail({
    to: user.email,
    subject: "New OTP",
    text: `Email OTP: ${emailOtp}`
  });

  await sendSms(user.phone, `Phone OTP: ${phoneOtp}`);

  res.json({ message: "New OTP sent" });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: "All fields required" });

    if (!(await validateEmail(email)))
      return res.status(400).json({ message: "Invalid email" });

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    const user = await User.create({
      name,
      email,
      phone,
      password,
      emailOtpHash: await hashOtp(emailOtp),
      phoneOtpHash: await hashOtp(phoneOtp),
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      emailVerified: false,
      phoneVerified: false
    });

    await sendEmail({
      to: email,
      subject: "Verify your FinTrack account",
      text: `Your Email OTP is ${emailOtp}`
    });

    await sendSms(phone, `Your Phone OTP is ${phoneOtp}`);

    res.status(201).json({
      message: "OTP sent to email and phone"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.emailOtpHash)
    return res.status(400).json({ message: "Invalid request" });

  if (user.otpExpiresAt < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  const ok = await verifyOtp(otp, user.emailOtpHash);
  if (!ok)
    return res.status(400).json({ message: "Invalid OTP" });

  user.emailVerified = true;
  user.emailOtpHash = null;
  await user.save();

  res.json({ message: "Email verified" });
};


// ✅ LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.emailVerified)
      return res.status(403).json({ message: "Email not verified" });

    if (!user.phoneVerified)
      return res.status(403).json({ message: "Phone not verified" });

    // Re-verification every 7 days
      if (!user.lastVerifiedAt || Date.now() - new Date(user.lastVerifiedAt) > 7 * 24 * 60 * 60 * 1000) {
      const otp = generateOtp();
      const hash = await hashOtp(otp);

      user.emailOtpHash = hash;
      user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "Re-verify your FinTrack account",
        text: `Your verification code is ${otp}`
      });

      return res
        .status(403)
        .json({ message: "Re-verification required. OTP sent." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d"
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
