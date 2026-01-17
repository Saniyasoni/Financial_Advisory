import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true },              // "Laptop"
    category: { type: String, default: "General" },      // Travel, Gadget, etc.

    targetAmount: { type: Number, required: true },      // e.g., 50000
    targetDate: { type: Date, required: true },          // deadline

    status: {
      type: String,
      enum: ["in-progress", "completed", "failed"],
      default: "in-progress",
    },

    // convenience cache (kept in sync after contributions)
    savedAmount: { type: Number, default: 0 },           // sum of contributions

    // optional UX fields
    notes: String,
    priority: { type: Number, default: 3 }               // 1=high, 5=low
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);