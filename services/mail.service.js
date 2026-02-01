import { Resend } from "resend";

/**
 * Initialize Resend client
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send OTP email (Production-safe)
 */
export const sendOtpMail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "Blog Auth <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Blog System Login</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="letter-spacing: 4px">${otp}</h1>
          <p>
            This OTP expires in
            <strong>${process.env.OTP_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <p>If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent via Resend to:", email);
  } catch (error) {
    console.error("❌ Resend email failed:", error);
    throw new Error("Failed to send OTP email");
  }
};
