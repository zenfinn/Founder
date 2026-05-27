import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.info("E-Mail nicht gesendet, SMTP_ENV fehlt:", { to, subject });
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Founder <no-reply@founder.example>",
    to,
    subject,
    text,
  });
}
