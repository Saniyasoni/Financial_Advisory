import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

// ✅ Create or update monthly budget
export const setBudget = async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets, currency, rolloverEnabled } = req.body;

    let budget = await Budget.findOne({ user: req.user._id, month, year });

    if (budget) {
      budget.totalBudget = totalBudget;
      budget.categoryBudgets = categoryBudgets || budget.categoryBudgets;
      budget.currency = currency || budget.currency;
      budget.rolloverEnabled = rolloverEnabled ?? budget.rolloverEnabled;

      await budget.save();
      return res.json({ message: "Budget updated", budget });
    }

    budget = await Budget.create({
      user: req.user._id,
      month,
      year,
      totalBudget,
      categoryBudgets,
      currency,
      rolloverEnabled
    });

    res.status(201).json({ message: "Budget set", budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get budget for specific month
export const getBudget = async (req, res) => {
  try {
    const { month, year } = req.query;
    const budget = await Budget.findOne({ user: req.user._id, month, year });

    if (!budget) return res.json({ message: "No budget set", budget: null });

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a budget
export const deleteBudget = async (req, res) => {
  try {
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Calculate rollover and reset budget on month change
export const handleRollover = async () => {
  const current = new Date();
  const prevMonth = current.getMonth() === 0 ? 11 : current.getMonth() - 1;
  const prevYear = prevMonth === 11 ? current.getFullYear() - 1 : current.getFullYear();

  const budgets = await Budget.find({ month: prevMonth, year: prevYear, rolloverEnabled: true });

  for (let budget of budgets) {
    const spent = await Transaction.aggregate([
      { $match: { user: budget.user, date: { $gte: new Date(prevYear, prevMonth, 1), $lt: new Date(prevYear, prevMonth+1, 1) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const used = spent[0]?.total || 0;
    const leftover = Math.max(budget.totalBudget - used, 0);

    await Budget.updateOne(
      { user: budget.user, month: current.getMonth(), year: current.getFullYear() },
      { $inc: { rolloverAmount: leftover } }
    );
  }
};