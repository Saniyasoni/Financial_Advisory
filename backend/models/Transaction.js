import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
     type: String,
     default: "UNCERTAIN"
   },

    needsReview: {
      type: Boolean,
      default: false
    },

    reviewReason: String,

    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);