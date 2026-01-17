import nodemailer from "nodemailer";

const isDev = process.env.APP_MODE !== "prod";

let transporter = null;

if (!isDev) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendEmail({ to, subject, text, html }) {
  if (isDev) {
    console.log("📧 DEV EMAIL");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Message:", text || html);
    return;
  }

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html
  });
}
