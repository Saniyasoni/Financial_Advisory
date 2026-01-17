import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const notes = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notes);
});

router.put("/:id/seen", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { seen: true });
  res.json({ message: "Marked as read" });
});

export default router;