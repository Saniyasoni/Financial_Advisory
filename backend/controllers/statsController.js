import Transaction from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import Budget from "../models/Budget.js";

// ✅ Monthly income vs expense summary
export const getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.user._id;

    const match = {
      user: userId,
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) }
    };

    const data = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const result = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0
    }));

    data.forEach(item => {
      const idx = item._id.month - 1;
      if (item._id.type === "income") result[idx].income = item.total;
      else result[idx].expense = item.total;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    /* -----------------------------
       INCOME / EXPENSE TOTAL
    ------------------------------*/
    const trx = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let income = 0;
    let expense = 0;

    trx.forEach(t => {
      if (t._id === "income") income = t.total;
      if (t._id === "expense") expense = t.total;
    });

    const balance = income - expense;

    /* -----------------------------
       TOP GOAL (highest progress)
    ------------------------------*/

    const goals = await Goal.find({ user: userId });

    let topGoal = null;
    let maxProgress = 0;

    goals.forEach(g => {
      const progress =
        g.targetAmount > 0
          ? (g.savedAmount / g.targetAmount) * 100
          : 0;

      if (progress > maxProgress) {
        maxProgress = progress;
        topGoal = {
          name: g.name,
          progress: Math.min(Math.round(progress), 100)
        };
      }
    });

    res.json({
      income,
      expense,
      balance,
      topGoal
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Category spending summary
export const getCategoryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const data = await Transaction.aggregate([
      { $match: { user: userId, type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);

    res.json(data.map(d => ({ category: d._id, amount: d.total })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Monthly savings summary
export const getSavingsStats = async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.user._id;

    const match = {
      user: userId,
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) }
    };

    const data = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const result = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      savings: 0
    }));

    data.forEach(item => {
      const idx = item._id.month - 1;
      if (item._id.type === "income") result[idx].income = item.total;
      else result[idx].expense = item.total;
    });

    result.forEach(r => r.savings = r.income - r.expense);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Goal summary (progress only)
export const getGoalStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const goals = await Goal.find({ user: userId });

    const summary = goals.map(g => ({
      name: g.name,
      progress: Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100),
      status: g.status
    }));

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};