import { PROVIDERS } from "./providers.js";

export function parseMessage(text) {
  if (!text) return null;

  for (const provider of PROVIDERS) {
    if (!provider.match.test(text)) continue;

    const match = provider.regex.exec(text);
    if (!match) continue;

    const amount = Number(match[2].replace(/[,₹ ]/g, ""));
    const merchant = cleanMerchant(match[3]);

    const isCredit = /(credited|received|refund|cashback|deposited)/i.test(text);
    const type = isCredit ? "income" : "expense";

    return {
      provider: provider.name,
      amount,
      merchant,
      type,
      reference: extractReference(text),
      date: extractDate(text)
    };
  }

  return null;
}


function parseAmount(val) {
  if (!val) return null;
  return Number(val.replace(/[₹, ]/g, ""));
}

function cleanMerchant(str) {
  return str
    .split("\n")[0]       // take only first line after "To"
    .replace(/on\s+\d+/i, "")
    .replace(/[^a-zA-Z0-9@.\-]/g, "")
    .trim();
}

function extractReference(text) {
  const m = text.match(/(ref|rrn|txn|utr)[\s:-]*([a-zA-Z0-9]+)/i);
  return m ? m[2] : null;
}

function extractDate(text) {
  const m = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
  return m ? new Date(m[0]) : new Date();
}
