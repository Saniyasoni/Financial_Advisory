// models/RawMessage.js
import mongoose from "mongoose";

const rawMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  channel: {
    type: String,
    enum: ["email", "sms"],
    required: true
  },

  sender: { type: String, required: true },

  toEmail: String,
  toPhone: String,
  subject: String,
  body: { type: String, required: true },

  receivedAt: { type: Date, default: Date.now },

  parsed: { type: Boolean, default: false },
  parseError: String,

  detectedProvider: String,
  detectedType: String, // credit / debit
  detectedAmount: Number,
  detectedMerchant: String,
  detectedReference: String,

  confidenceScore: { type: Number, default: 0 },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  }
});

export default mongoose.model("RawMessage", rawMessageSchema);
