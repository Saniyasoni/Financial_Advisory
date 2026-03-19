import User from "../models/User.js";
import { verifyOtp } from "../services/emailService.js";

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.emailOtpHash) return res.status(400).json({ message: "Invalid" });

  if (user.otpExpiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

  const ok = await verifyOtp(otp, user.emailOtpHash);
  if (!ok) return res.status(400).json({ message: "Wrong OTP" });

  user.emailVerified = true;
  user.emailOtpHash = null;
  user.lastVerifiedAt = new Date();
  await user.save();

  res.json({ message: "Email verified" });
};

export const verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !user.phoneOtpHash) return res.status(400).json({ message: "Invalid" });

  if (user.otpExpiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

  const ok = await verifyOtp(otp, user.phoneOtpHash);
  if (!ok) return res.status(400).json({ message: "Wrong OTP" });

  user.phoneVerified = true;
  user.phoneOtpHash = null;
  user.lastVerifiedAt = new Date();
  await user.save();

  res.json({ message: "Phone verified" });
};

