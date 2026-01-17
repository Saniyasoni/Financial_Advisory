import cron from "node-cron";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import Notification from "../models/Notification.js";
import { recomputeSavedAmount, autoUpdateGoalStatus } from "../services/goalService.js";
import { generateInsights } from "../services/insightsService.js";

console.log("⏳ Cron scheduler started...");

// ✅ Monthly Budget Rollover — 1st of month @ 00:05
cron.schedule("5 0 1 * *", async () => {
  console.log("🚀 Cron: Running monthly budget rollover");

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const budgets = await Budget.find({ month: prevMonth, year: prevYear });

  for (const b of budgets) {
    if (b.rolloverEnabled) {
      const spent = b.spent || 0;
      const leftover = b.totalBudget - spent;

      await Budget.create({
        user: b.user,
        month,
        year,
        totalBudget: b.totalBudget + (leftover > 0 ? leftover : 0),
        categoryBudgets: b.categoryBudgets,
        rolloverEnabled: true
      });
    }
  }

  console.log("✅ Cron: Budget rollover complete");
});

// ✅ Daily Goal Status Check — Midnight
cron.schedule("0 0 * * *", async () => {
  console.log("📆 Cron: Running daily goal status check");

  const goals = await Goal.find({ status: "in-progress" });

  for (const g of goals) {
    await recomputeSavedAmount(g._id);
    await autoUpdateGoalStatus(g);
  }

  console.log("✅ Cron: Goal status updated");
});

// ✅ Daily Insights Push — 8 AM
cron.schedule("0 8 * * *", async () => {
  console.log("🧠 Cron: Generating daily insights");

  const users = await Goal.distinct("user");

  for (const user of users) {
    const insights = await generateInsights(user);
    
    await Notification.create({
      user,
      sourceType: "category",
      alertType: "info",
      message: insights[0], 
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      category: "Daily Insight"
    });
  }

  console.log("✅ Cron: Daily insights sent");
});

// ✅ Clean notifications > 60 days — 1st @ 2AM
cron.schedule("0 2 1 * *", async () => {
  console.log("🧹 Cron: Cleaning old notifications");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  await Notification.deleteMany({ createdAt: { $lt: cutoff } });

  console.log("✅ Cron: Old notifications cleaned");
});

console.log("✅ All cron jobs scheduled successfully");