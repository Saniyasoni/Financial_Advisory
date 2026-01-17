import { generateInsights } from "../services/insightsService.js";

export const getInsights = async (req, res) => {
  try {
    const insights = await generateInsights(req.user._id);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};