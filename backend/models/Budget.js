import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    month: {
      type: Number, // 0 = Jan, 11 = Dec
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    totalBudget: {
      type: Number,
      required: true
    },

    categoryBudgets: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],

    currency: {
      type: String,
      default: "INR"
    },

    rolloverEnabled: {
      type: Boolean,
      default: false
    },

    rolloverAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);