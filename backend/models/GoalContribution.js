import mongoose from "mongoose";

const goalContributionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true },

    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("GoalContribution", goalContributionSchema);