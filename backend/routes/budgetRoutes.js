import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { setBudget, getBudget, deleteBudget } from "../controllers/budgetController.js";

const router = express.Router();

router.post("/", protect, setBudget);
router.get("/", protect, getBudget);
router.delete("/:id", protect, deleteBudget);

export default router;