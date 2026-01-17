import RawMessage from "../models/RawMessage.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { parseMessage } from "../services/parsers/transactionParser.js";
import { categorize } from "../services/categoryEngine.js";


export const ingestMessage = async (req, res) => {
    console.log("📩 INGEST HIT", req.body);
  try {
    const { channel, sender, subject, body, toPhone, toEmail } = req.body;

    if (!channel || !sender || !body)
      return res.status(400).json({ message: "Invalid message" });

    let user;

    if (channel === "sms") {
        if (!toPhone) {
            return res.status(400).json({ message: "Missing toPhone" });
    }
        user = await User.findOne({ phone: toPhone });
    }

    if (channel === "email") {
        if (!toEmail) {
            return res.status(400).json({ message: "Missing toEmail" });
        }
        user = await User.findOne({ email: toEmail.toLowerCase() });
    }

    if (!user) {
        return res.status(400).json({ message: "No user found for this recipient" });
    }


    // 1️⃣ Save raw message first
    const raw = await RawMessage.create({
        user: user._id,
        channel,
        sender,
        toPhone,
        toEmail,
        subject,
        body
    });


    // 2️⃣ Parse it
    const parsed = parseMessage(body);
    if (!parsed) {
      raw.parseError = "No matching provider rule";
      await raw.save();
      return res.json({ message: "Stored but not parsed", rawId: raw._id });
    }

    // 3️⃣ Categorize
    const { category, confidence, flagged, reason } = await categorize(user._id, parsed.merchant, body);

    // 4️⃣ Insert transaction
    if (!parsed.amount || !parsed.type) {
        raw.parseError = "Missing amount or type";
        await raw.save();
        return res.json({ message: "Stored but invalid transaction" });
        }
    const tx = await Transaction.create({
        user: user._id,
        type: parsed.type,
        amount: Number(parsed.amount),
        category: flagged ? "UNCERTAIN" : category,
        needsReview: flagged,
        reviewReason: flagged ? reason : null,
        description: parsed.merchant,
        date: parsed.date || new Date()
    });
    // 5️⃣ Update raw message
    raw.parsed = true;
    raw.detectedProvider = parsed.provider;
    raw.detectedType = parsed.type;
    raw.detectedAmount = parsed.amount;
    raw.detectedMerchant = parsed.merchant;
    raw.detectedReference = parsed.reference;
    raw.transactionId = tx._id;
    raw.confidenceScore = confidence;
    await raw.save();

    res.json({
      message: "Transaction ingested",
      transaction: tx,
      flagged,
      reason
    });
  } catch (err) {
    res.status(500).json({ message: "Ingestion failed" });
  }
};
