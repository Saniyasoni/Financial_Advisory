const BUSINESS_KEYWORDS = [
  "amazon", "zomato", "uber", "flipkart", "swiggy", "myntra",
  "airtel", "jio", "netflix", "spotify", "ola", "paytm", "googlepay","dmrc","nmrc"
];

export function isPersonalPayee(nameOrUpi) {
  if (!nameOrUpi) return false;

  const lower = nameOrUpi.toLowerCase();

  // UPI pattern of humans
  if (/@(upi|ybl|okaxis|oksbi|okhdfc)$/i.test(lower)) {
    return true;
  }

  // If no business keyword matches → assume personal
  for (const b of BUSINESS_KEYWORDS) {
    if (lower.includes(b)) return false;
  }

  return true;
}
