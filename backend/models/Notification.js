import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Source of alert
    sourceType: { type: String, enum: ["budget", "category"], required: true },

    // Alert severity
    alertType: { type: String, enum: ["info", "warning", "danger"], default: "info" },

    message: { type: String, required: true },

    month: Number,
    year: Number,

    category: String, // only used for category alerts

    triggerLevel: Number, // 70, 90, 100

    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);