import Goal from "../models/Goal.js";
import GoalContribution from "../models/GoalContribution.js";
import {
  recomputeSavedAmount,
  requiredMonthlySaving,
  maybeGoalAlerts,
  autoUpdateGoalStatus
} from "../services/goalService.js";

/** Create a new goal */
export const createGoal = async (req, res) => {
  try {
    const { name, category, targetAmount, targetDate, notes, priority } = req.body;
    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({ message: "name, targetAmount, targetDate are required" });
    }

    const goal = await Goal.create({
      user: req.user._id,
      name,
      category,
      targetAmount,
      targetDate,
      notes,
      priority
    });

    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** List all goals for user, with derived fields */
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });

    const enriched = goals.map(g => {
      const progress = g.targetAmount ? (g.savedAmount / g.targetAmount) * 100 : 0;
      const reqPerMonth = requiredMonthlySaving(g.targetAmount, g.savedAmount, g.targetDate);
      return {
        ...g.toObject(),
        progress: Math.min(Math.round(progress), 100),
        requiredMonthlySaving: Math.ceil(reqPerMonth)
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get single goal + contributions */
export const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const contributions = await GoalContribution.find({ goal: goal._id }).sort({ date: -1 });

    const progress = goal.targetAmount ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
    const reqPerMonth = requiredMonthlySaving(goal.targetAmount, goal.savedAmount, goal.targetDate);

    res.json({
      goal,
      contributions,
      progress: Math.min(Math.round(progress), 100),
      requiredMonthlySaving: Math.ceil(reqPerMonth)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Update a goal */
export const updateGoal = async (req, res) => {
  try {
    const allowed = ["name", "category", "targetAmount", "targetDate", "notes", "priority", "status"];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    await autoUpdateGoalStatus(goal);
    await maybeGoalAlerts(goal);

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Delete a goal (and its contributions) */
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    await GoalContribution.deleteMany({ goal: goal._id, user: req.user._id });
    await goal.deleteOne();
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
    
  }
};

/** Add contribution */
export const addContribution = async (req, res) => {
  try {
    const { amount, date, note } = req.body;
    if (!amount) return res.status(400).json({ message: "amount is required" });

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const contrib = await GoalContribution.create({
      user: req.user._id,
      goal: goal._id,
      amount,
      date: date ? new Date(date) : new Date(),
      note
    });

    // recompute saved & update status/alerts
    await recomputeSavedAmount(goal._id);
    const fresh = await Goal.findById(goal._id);
    await autoUpdateGoalStatus(fresh);
    await maybeGoalAlerts(fresh);

    res.status(201).json(contrib);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** List contributions for a goal */
export const getContributions = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const contributions = await GoalContribution.find({ goal: goal._id }).sort({ date: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Delete a contribution */
export const deleteContribution = async (req, res) => {
  try {
    const contrib = await GoalContribution.findOne({
      _id: req.params.contribId,
      user: req.user._id
    });
    if (!contrib) return res.status(404).json({ message: "Contribution not found" });

    const goalId = contrib.goal;
    await contrib.deleteOne();

    await recomputeSavedAmount(goalId);
    const fresh = await Goal.findById(goalId);
    await autoUpdateGoalStatus(fresh);

    res.json({ message: "Contribution deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};