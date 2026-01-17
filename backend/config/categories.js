export const CATEGORY_RULES = [
  { match: /zomato|swiggy|ubereats/i, category: "food", confidence: 0.95 },
  { match: /amazon|flipkart|myntra/i, category: "shopping", confidence: 0.95 },
  { match: /uber|ola/i, category: "travel", confidence: 0.9 },
  { match: /netflix|spotify/i, category: "subscription", confidence: 0.9 }
];