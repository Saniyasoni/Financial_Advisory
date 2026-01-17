import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

// ✅ Prevent duplicate alert creation for same level in same month
async function maybeCreateAlert({ user, percent, message, category, month, year }) {
  const exists = await Notification.findOne({
    user,
    message,
    month,
    year,
    category
  });

  if (!exists) {
    await Notification.create({
      user,
      sourceType: category ? "category" : "budget",
      alertType:
        percent >= 100 ? "danger" :
        percent >= 90 ? "warning" :
        "info",
      message,
      month,
      year,
      category,
      triggerLevel: percent
    });
  }
}

export const checkBudgetAlerts = async (userId) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const budget = await Budget.findOne({ user: userId, month, year });
  if (!budget) return;

  // ✅ Total spending this month
  const spentAgg = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: new Date(year, month, 1) } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const spent = spentAgg[0]?.total || 0;
  const percent = (spent / budget.totalBudget) * 100;

  // ✅ Overall budget alerts
  if (percent >= 100) {
    await maybeCreateAlert({
      user: userId,
      percent,
      message: `⛔ Monthly budget exceeded (${percent.toFixed(1)}%)`,
      month,
      year
    });
  } else if (percent >= 90) {
    await maybeCreateAlert({
      user: userId,
      percent,
      message: `🚨 You've used 90% of your monthly budget`,
      month,
      year
    });
  } else if (percent >= 70) {
    await maybeCreateAlert({
      user: userId,
      percent,
      message: "⚠ Warning: you've used 70% of your monthly budget",
      month,
      year
    });
  }

  // ✅ Category-wise budget alerts
  for (let cat of budget.categoryBudgets) {
    const catSpentAgg = await Transaction.aggregate([
      { $match: { user: userId, category: cat.category } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const catSpent = catSpentAgg[0]?.total || 0;
    const catPercent = (catSpent / cat.amount) * 100;

    if (catPercent >= 100) {
      await maybeCreateAlert({
        user: userId,
        percent: catPercent,
        category: cat.category,
        message: "⛔ Category budget exceeded: ${cat.category}",
        month,
        year
      });
    } else if (catPercent >= 90) {
      await maybeCreateAlert({
        user: userId,
        percent: catPercent,
        category: cat.category,
        message: "🚨 ${cat.category} spending reached 90%",
        month,
        year
      });
    } else if (catPercent >= 70) {
      await maybeCreateAlert({
        user: userId,
        percent: catPercent,
        category: cat.category,
        message: "⚠ ${cat.category} budget is 70% used",
        month,
        year
      });
    }
  }
};