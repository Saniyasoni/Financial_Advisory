export const PROVIDERS = [
  {
    name: "HDFC",
    match: /(hdfc|alerts@hdfc|hdfcbank)/i,
    regex: /(rs\.?|inr)\s*([\d,.]+)[\s\S]*?to\s*([a-z0-9 .@\-]+)/i
  },
  {
    name: "SBI",
    match: /(sbi|sbibank)/i,
    regex: /(rs\.?|inr)\s*([\d,.]+)[\s\S]*?to\s*([a-z0-9 .@\-]+)/i
  },
  {
    name: "ICICI",
    match: /(icici)/i,
    regex: /(rs\.?|inr)\s*([\d,.]+)[\s\S]*?to\s*([a-z0-9 .@\-]+)/i
  },
  {
    name: "AXIS",
    match: /(axis)/i,
    regex: /(rs\.?|inr)\s*([\d,.]+)[\s\S]*?to\s*([a-z0-9 .@\-]+)/i
  },
  {
    name: "UPI",
    match: /(upi|paytm|gpay|google pay|phonepe|bhim)/i,
    regex: /(rs\.?|inr)\s*([\d,.]+)[\s\S]*?to\s*([a-z0-9 .@\-]+)/i
  }
];
