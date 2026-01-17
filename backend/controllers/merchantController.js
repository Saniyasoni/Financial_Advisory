import Transaction from "../models/Transaction.js";
import MerchantRule from "../models/MerchantRule.js";

export const confirmMerchant = async (req, res) => {
  const { transactionId, category } = req.body;

  const tx = await Transaction.findOne({
    _id: transactionId,
    user: req.user._id
  });

  if (!tx) return res.status(404).json({ message: "Transaction not found" });

  // Save rule
  await MerchantRule.create({
    user: req.user._id,
    pattern: tx.description.toLowerCase(),
    category,
    confidence: 1,
    source: "user"
  });

  // Update transaction
  tx.category = category;
  tx.needsReview = false;
  tx.reviewReason = null;
  await tx.save();

  res.json({ message: "Merchant learned and transaction fixed" });
};
