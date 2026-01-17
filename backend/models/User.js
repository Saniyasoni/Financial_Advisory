import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },

    phone: { type: String, required: true },
    phoneVerified: { type: Boolean, default: false },

    password: { type: String, required: true },

    emailOtpHash: { type: String, default: null },
    phoneOtpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },

    lastVerifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
