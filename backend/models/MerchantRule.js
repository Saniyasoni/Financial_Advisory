import mongoose from "mongoose";

const merchantRuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  pattern: { type: String, required: true }, // e.g. ravi@upi, dmrc, amazon

  category: { type: String, required: true },

  confidence: { type: Number, default: 1 },

  source: {
    type: String,
    enum: ["user", "system"],
    default: "user"
  }
});

merchantRuleSchema.index({ user: 1, pattern: 1 }, { unique: true });

export default mongoose.model("MerchantRule", merchantRuleSchema);
