import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  addContribution,
  getContributions,
  deleteContribution
} from "../controllers/goalController.js";

const router = express.Router();

// Goals
router.post("/", protect, createGoal);
router.get("/", protect, getGoals);
router.get("/:id", protect, getGoalById);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);

// Contributions for a goal
router.post("/:id/contributions", protect, addContribution);
router.get("/:id/contributions", protect, getContributions);
router.delete("/:id/contributions/:contribId", protect, deleteContribution);

export default router;