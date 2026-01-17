import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  const { month, year, unread } = req.query;
  const filter = { user: req.user._id };
  if (month !== undefined) filter.month = Number(month);
  if (year !== undefined) filter.year = Number(year);
  if (unread === "true") filter.read = false;

  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(items);
};

export const markRead = async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!n) return res.status(404).json({ message: "Not found" });
  n.read = true;
  await n.save();
  res.json({ message: "Marked read" });
};

export const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: "All marked read" });
};

export const deleteNotification = async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ message: "Deleted" });
};