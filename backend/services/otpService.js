import bcrypt from "bcryptjs";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtp(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

export async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}
