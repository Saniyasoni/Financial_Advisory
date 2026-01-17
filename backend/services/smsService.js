const isDev = process.env.APP_MODE !== "prod";

export async function sendSms(phone, message) {
  if (isDev) {
    console.log("📱 DEV SMS");
    console.log("To:", phone);
    console.log("Message:", message);
    return;
  }

  // Later: Twilio / Fast2SMS / Exotel API
}
