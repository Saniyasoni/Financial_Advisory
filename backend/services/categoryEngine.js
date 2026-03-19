import { isPersonalPayee } from "./classifier.js";
import MerchantRule from "../models/MerchantRule.js";

const CATEGORY_MAP = {
  food: ["zomato", "swiggy", "dominos", "mcdonald"],
  transport: ["uber", "ola", "dmrc", "nmrc", "rapido"],
  shopping: ["amazon", "flipkart", "myntra", "ajio"],
  telecom: ["airtel", "jio", "vi"],
  subscription: ["netflix", "spotify", "prime", "hotstar"],
  wallet: ["paytm", "googlepay", "phonepe"],
  utilities: ["electricity", "water", "broadband", "gas"],
  groceries: ["bigbasket", "grofers", "dmart"],
  dining: ["restaurant", "cafe", "bar"],
  entertainment: ["movie", "theatre", "concert"],
  health: ["pharmacy", "hospital", "clinic", "doctor"],
  education: ["school", "college", "university", "course", "tuition"],
  travel: ["hotel", "airline", "railway", "irctc", "booking"]
};

const SALARY_KEYWORDS = [
  "salary", "payroll", "pay slip", "credit salary", "credited salary"
];

const REFUND_KEYWORDS = [
  "refund", "reversal", "reversed", "chargeback"
];

export async function categorize(userId, merchant, description = "") {
  const text = `${merchant || ""} ${description || ""}`.toLowerCase();

  if (!text.trim()) {
    return UNCERTAIN("Missing merchant");
  }

  /* -------------------------------------------------
     1️⃣ SALARY DETECTION (Highest priority)
  --------------------------------------------------*/
  for (const k of SALARY_KEYWORDS) {
    if (text.includes(k)) {
      return {
        category: "salary",
        confidence: 0.99,
        flagged: false
      };
    }
  }

  /* -------------------------------------------------
     2️⃣ REFUND / REVERSAL DETECTION
  --------------------------------------------------*/
  for (const k of REFUND_KEYWORDS) {
    if (text.includes(k)) {
      return {
        category: "refund",
        confidence: 0.95,
        flagged: false
      };
    }
  }

  /* -------------------------------------------------
     3️⃣ PERSONAL UPI (must override business)
  --------------------------------------------------*/
  if (isPersonalPayee(text)) {
    return {
      category: "personal_transfer",
      confidence: 0.95,
      flagged: true,
      reason: "Payment to personal UPI account"
    };
  }

  /* -------------------------------------------------
     4️⃣ USER-LEARNED RULES
  --------------------------------------------------*/
    const rule = await MerchantRule.findOne({
    user: userId,
    pattern: new RegExp(merchant, "i")
    });
  if (rule) {
    return {
      category: rule.category,
      confidence: rule.confidence,
      flagged: false,
      learned: true
    };
  }

  /* -------------------------------------------------
     5️⃣ SYSTEM BUSINESS CATEGORY MAP
  --------------------------------------------------*/
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const k of keywords) {
      if (text.includes(k)) {
        return {
          category,
          confidence: 0.9,
          flagged: false
        };
      }
    }
  }

  /* -------------------------------------------------
     6️⃣ FALLBACK
  --------------------------------------------------*/
  return UNCERTAIN("Unknown merchant");
}

function UNCERTAIN(reason) {
  return {
    category: "UNCERTAIN",
    confidence: 0.2,
    flagged: true,
    reason
  };
}
