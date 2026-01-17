import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "No auth token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "User not found" });

    // 🔐 Email + Phone must be verified
    if (!user.emailVerified || !user.phoneVerified) {
      return res.status(403).json({
        message: "Account not verified. Verify email and phone."
      });
    }

    // 🔐 Force re-verification every 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (!user.lastVerifiedAt || Date.now() - user.lastVerifiedAt.getTime() > maxAge) {
      return res.status(403).json({
        message: "Re-verification required"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
