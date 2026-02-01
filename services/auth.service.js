import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

/* =========================
   Mail transporter
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   Helpers
========================= */
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  });

const generateRefreshToken = () => crypto.randomBytes(40).toString("hex");

/* =========================
   ALLOWED ROLES FOR LOGIN
========================= */
const LOGIN_ALLOWED_ROLES = ["admin", "editor", "writer"];

/* =========================
   Send OTP (LOGIN ONLY)
========================= */
export const sendOtpService = async (email) => {
  // Check user exists
  const { data: user, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error(
      "Access denied. This email is not registered in the system.",
    );
  }

  // Role validation
  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied. Role is not allowed to login.");
  }

  // Generate OTP
  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + Number(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000,
  );

  // Store OTP
  const { error: otpError } = await supabase.from("email_otps").upsert({
    email,
    otp_hash: hashOtp(otp),
    expires_at: expiresAt,
    attempts: 0,
  });

  if (otpError) throw otpError;

  // Send Email
  await transporter.sendMail({
    from: `"Blog Auth" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Login OTP",
    html: `
      <h2>Blog System Login</h2>
      <h1>${otp}</h1>
      <p>This OTP expires in ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>
    `,
  });

  return { message: "OTP sent successfully" };
};

/* =========================
   Verify OTP + ISSUE TOKENS
========================= */
export const verifyOtpService = async ({ email, otp }) => {
  // Fetch OTP
  const { data: otpRow, error } = await supabase
    .from("email_otps")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !otpRow) {
    throw new Error("Invalid or expired OTP");
  }

  // Expiry check
  if (new Date(otpRow.expires_at) < new Date()) {
    throw new Error("OTP expired");
  }

  // Validate OTP
  if (otpRow.otp_hash !== hashOtp(otp)) {
    await supabase
      .from("email_otps")
      .update({ attempts: otpRow.attempts + 1 })
      .eq("email", email);

    throw new Error("Invalid OTP");
  }

  // Fetch EXISTING USER
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("email", email)
    .single();

  if (userError || !user) {
    throw new Error("Access denied. User not found.");
  }

  // Role validation
  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied. Role is not allowed to login.");
  }

  // Cleanup OTP
  await supabase.from("email_otps").delete().eq("email", email);

  // Issue tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  const refreshExpiresAt = new Date(
    Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
  );

  await supabase.from("refresh_tokens").insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: refreshExpiresAt,
  });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  };
};

/* =========================
   Refresh Access Token
========================= */
export const refreshTokenService = async (refreshToken) => {
  const { data, error } = await supabase
    .from("refresh_tokens")
    .select("*, profiles(*)")
    .eq("token", refreshToken)
    .single();

  if (error || !data) {
    throw new Error("Invalid refresh token");
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new Error("Refresh token expired");
  }

  const user = data.profiles;

  // Extra safety
  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied");
  }

  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  };
};
