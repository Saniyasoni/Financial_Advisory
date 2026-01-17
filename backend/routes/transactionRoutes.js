import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from "../controllers/transactionController.js";

const router = express.Router();

// Create & List
router.post("/", protect, addTransaction);
router.get("/", protect, getTransactions);

// Single item operations
router.get("/:id", protect, getTransactionById);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

export default router;