import Transaction from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import Budget from "../models/Budget.js";

export const generateInsights = async (userId) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const startThisMonth = new Date(thisYear, thisMonth, 1);
  const startLastMonth = new Date(lastMonthYear, lastMonth, 1);

  // Get this month's & last month's spending
  const [currentSpend, lastSpend] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: "expense", date: { $gte: startThisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: "expense", date: { $gte: startLastMonth, $lt: startThisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  const spendNow = currentSpend[0]?.total || 0;
  const spendPrev = lastSpend[0]?.total || 0;

  const insights = [];

  // Spending Trend Insight
  if (spendPrev > 0) {
    const diff = spendNow - spendPrev;
    const percent = ((diff / spendPrev) * 100).toFixed(1);

    if (diff > 0) insights.push(`📈 You spent ${percent}% more than last month`);
    else if (diff < 0) insights.push(`📉 You reduced spending by ${Math.abs(percent)}% vs last month. Great job! 🎉`);
  }

  // Category Spike alerts
  const categories = await Transaction.aggregate([
    { $match: { user: userId, type: "expense", date: { $gte: startThisMonth } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);

  categories.forEach(cat => {
    if (cat.total > spendNow * 0.4) {
      insights.push(`🍽 High spend detected in ${cat._id}. Consider reviewing this category.`);
    }
  });

  // Budget projection
  const budget = await Budget.findOne({ user: userId, month: thisMonth, year: thisYear });
  if (budget) {
    const daysPassed = now.getDate();
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();

    const projected = Math.round((spendNow / daysPassed) * daysInMonth);

    if (projected > budget.totalBudget) {
      insights.push(`⚠ At this pace, you may exceed your monthly budget by ₹${projected - budget.totalBudget}`);
    }
  }

  // Goal forecast
  const goals = await Goal.find({ user: userId, status: "in-progress" });
  goals.forEach(g => {
    const remainingAmt = g.targetAmount - g.savedAmount;
    const monthsLeft = Math.ceil((new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24 * 30));

    const monthlyNeeded = monthsLeft > 0 ? Math.round(remainingAmt / monthsLeft) : remainingAmt;

    insights.push(`🎯 Goal "${g.name}": Save ₹${monthlyNeeded} per month to stay on track`);
  });

  return insights.length ? insights : ["✅ All good! You're on track financially."];
};