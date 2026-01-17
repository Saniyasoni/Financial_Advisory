import Goal from "../models/Goal.js";
import GoalContribution from "../models/GoalContribution.js";
import Notification from "../models/Notification.js";

/** Compute months diff (rounded up) from now to targetDate */
export function monthsRemaining(targetDate) {
  const now = new Date();
  const end = new Date(targetDate);
  const y = end.getFullYear() - now.getFullYear();
  const m = end.getMonth() - now.getMonth();
  let months = y * 12 + m;
  // if there are remaining days this month, count as one more month
  if (end.getDate() > now.getDate()) months += 1;
  return Math.max(months, 0);
}

export async function recomputeSavedAmount(goalId) {
  const agg = await GoalContribution.aggregate([
    { $match: { goal: goalId } },
    { $group: { _id: "$goal", total: { $sum: "$amount" } } }
  ]);
  const total = agg[0]?.total || 0;
  await Goal.findByIdAndUpdate(goalId, { savedAmount: total });
  return total;
}

export function requiredMonthlySaving(targetAmount, savedAmount, targetDate) {
  const remaining = Math.max(targetAmount - savedAmount, 0);
  const months = monthsRemaining(targetDate);
  if (months === 0) return remaining; // due this month
  return remaining / months;
}

/** Create milestone notifications: 25%, 50%, 75%, 100% and nearing deadline (30d) */
export async function maybeGoalAlerts(goal) {
  const progress = (goal.savedAmount / goal.targetAmount) * 100;
  const now = new Date();
  const daysLeft = Math.ceil((new Date(goal.targetDate) - now) / (1000 * 60 * 60 * 24));
  const month = now.getMonth();
  const year = now.getFullYear();

  async function createOnce(message) {
    const exists = await Notification.findOne({
      user: goal.user,
      message,
      month,
      year,
      category: "Goal:" + goal.name
    });
    if (!exists) {
      await Notification.create({
        user: goal.user,
        sourceType: "category",     // reuse "category" source
        alertType: "info",
        message,
        month,
        year,
        category: "Goal:" + goal.name,
        triggerLevel: Math.round(progress)
      });
    }
  }

  if (progress >= 25) await createOnce("🎉 ${goal.name}: 25% achieved");
  if (progress >= 50) await createOnce("🏆 ${goal.name}: 50% achieved");
  if (progress >= 75) await createOnce("🔥 ${goal.name}: 75% achieved");
  if (progress >= 100) await createOnce("✅ ${goal.name}: Goal reached!");

  if (daysLeft === 30) {
    await createOnce("⏳ ${goal.name}: 30 days remaining");
  }
}

/** Update goal status based on savedAmount & targetDate */
export async function autoUpdateGoalStatus(goal) {
  const now = new Date();
  if (goal.savedAmount >= goal.targetAmount && goal.status !== "completed") {
    goal.status = "completed";
    await goal.save();
    return "completed";
  }
  if (now > new Date(goal.targetDate) && goal.savedAmount < goal.targetAmount && goal.status !== "completed") {
    goal.status = "failed";
    await goal.save();
    return "failed";
  }
  return goal.status; // in-progress
}