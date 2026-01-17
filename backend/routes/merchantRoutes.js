import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { confirmMerchant } from "../controllers/merchantController.js";

const router = express.Router();

router.post("/confirm", protect, confirmMerchant);

export default router;
