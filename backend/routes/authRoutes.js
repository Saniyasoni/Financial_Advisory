import express from "express";
import { registerUser, loginUser, verifyEmailOtp } from "../controllers/authController.js";
import { sendPhoneOtp, verifyPhoneOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/send-phone-otp", sendPhoneOtp);
router.post("/verify-phone", verifyPhoneOtp);

export default router;