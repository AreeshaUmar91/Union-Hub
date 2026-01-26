import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // Default to gmail, or use host/port
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to, otp) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Skipping email send: EMAIL_USER or EMAIL_PASS not set.");
    console.log(`[MOCK EMAIL] To: ${to}, OTP: ${otp}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset OTP - Union Hub",
    text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendBroadcastEmail(bcc, subject, htmlContent) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Skipping email send: EMAIL_USER or EMAIL_PASS not set.");
    console.log(`[MOCK EMAIL] Bcc: ${bcc.length} recipients, Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    bcc, // Use BCC to hide recipients from each other
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}
