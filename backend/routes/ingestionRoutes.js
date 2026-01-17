import express from "express";
import { ingestMessage } from "../controllers/ingestionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Normal ingestion (email gateway / SMS gateway)
router.post("/message", protect, ingestMessage);

export default router;
