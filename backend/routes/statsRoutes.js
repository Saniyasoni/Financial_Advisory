import express from "express";
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

export default router;