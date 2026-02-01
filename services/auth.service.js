import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

/* =========================
   Resend Client
========================= */
const resend = new Resend(process.env.RESEND_API_KEY);

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
  console.log("📩 sendOtpService called with:", email);

  /* 1️⃣ Check user exists */
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

  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied. Role is not allowed to login.");
  }

  /* 2️⃣ Generate OTP */
  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + Number(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000,
  );

  /* 3️⃣ Store OTP */
  const { error: otpError } = await supabase.from("email_otps").upsert({
    email,
    otp_hash: hashOtp(otp),
    expires_at: expiresAt,
    attempts: 0,
  });

  if (otpError) throw otpError;

  /* 4️⃣ Send OTP Email (RESEND) */
  try {
    await resend.emails.send({
      from: "Blog Auth <onboarding@resend.dev>",
      to: email,
      subject: "Your Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Blog System Login</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>
            This OTP expires in
            <strong>${process.env.OTP_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <p>If you didn’t request this, ignore this email.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent via Resend to:", email);
  } catch (error) {
    console.error("❌ Resend email failed:", error);
    throw new Error("Failed to send OTP email");
  }

  return { message: "OTP sent successfully" };
};

/* =========================
   Verify OTP + ISSUE TOKENS
========================= */
export const verifyOtpService = async ({ email, otp }) => {
  const { data: otpRow, error } = await supabase
    .from("email_otps")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !otpRow) {
    throw new Error("Invalid or expired OTP");
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    throw new Error("OTP expired");
  }

  if (otpRow.otp_hash !== hashOtp(otp)) {
    await supabase
      .from("email_otps")
      .update({ attempts: otpRow.attempts + 1 })
      .eq("email", email);

    throw new Error("Invalid OTP");
  }

  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("email", email)
    .single();

  if (userError || !user) {
    throw new Error("Access denied. User not found.");
  }

  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied. Role not allowed.");
  }

  await supabase.from("email_otps").delete().eq("email", email);

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

  if (!LOGIN_ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Access denied");
  }

  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  };
};
