const isDev = process.env.APP_MODE !== "prod";

export async function ingestExternalMessage(payload) {
  if (isDev) {
    console.log("📥 DEV INGEST");
    console.log(payload);
    return;
  }

  // In production:
  // Gmail webhook / Twilio webhook will call /api/ingest/message
}
