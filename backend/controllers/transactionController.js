import Transaction from "../models/Transaction.js";
import { checkBudgetAlerts } from "../services/budgetAlertServices.js";

/**
 * @desc Add new transaction
 * @route POST /api/transactions
 * @access Private
 */
export const addTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, description } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: "Type, amount & category required" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      description: description || ""
    });

    // ✅ Check budget alerts after saving transaction
    await checkBudgetAlerts(req.user._id);

    res.status(201).json(transaction);
  } catch (error) {
    console.error("addTransaction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all user transactions (optional filters & pagination)
 * @route GET /api/transactions
 * @access Private
 */
export const getTransactions = async (req, res) => {
  try {
    const { type, category, start, end, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(100),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      items
    });
  } catch (error) {
    console.error("getTransactions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get single transaction
 * @route GET /api/transactions/:id
 * @access Private
 */
export const getTransactionById = async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ message: "Transaction not found" });

    if (trx.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(trx);
  } catch (error) {
    console.error("getTransactionById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Update transaction
 * @route PUT /api/transactions/:id
 * @access Private
 */
export const updateTransaction = async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ message: "Transaction not found" });

    if (trx.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const updates = {};
    const allowedFields = ["type", "amount", "category", "date", "description"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Transaction.findByIdAndUpdate(req.params.id, updates, {
      new: true
    });

    // ✅ Check budget alerts after update
    await checkBudgetAlerts(req.user._id);

    res.json(updated);
  } catch (error) {
    console.error("updateTransaction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Delete transaction
 * @route DELETE /api/transactions/:id
 * @access Private
 */
export const deleteTransaction = async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ message: "Transaction not found" });

    if (trx.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await trx.deleteOne();

    // ✅ Check budget alerts after deletion
    await checkBudgetAlerts(req.user._id);

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("deleteTransaction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};