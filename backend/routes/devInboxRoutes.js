import express from "express";
import { ingestMessage } from "../controllers/ingestionController.js";

const router = express.Router();

// Dev inbox → just calls ingestion
router.post("/inbox", ingestMessage);

export default router;
