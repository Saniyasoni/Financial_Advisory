import express from "express";
import { getTransactionSummary } from "../controllers/statsController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMonthlyStats,
  getCategoryStats,
  getSavingsStats,
  getGoalStats
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/monthly", protect, getMonthlyStats);
router.get("/categories", protect, getCategoryStats);
router.get("/savings", protect, getSavingsStats);
router.get("/goals", protect, getGoalStats);
router.get("/summary", protect, getTransactionSummary);

export default router;