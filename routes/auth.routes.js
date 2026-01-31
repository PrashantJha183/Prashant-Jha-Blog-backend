import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  refreshToken,
} from "../controllers/auth.controller.js";

import { otpLimiter } from "../middlewares/otpLimiter.middleware.js";
import { otpCooldown } from "../middlewares/otpCooldown.middleware.js";

const router = Router();

/* =========================
   AUTH – OTP FLOW (NODE)
========================= */

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to email (Node + Nodemailer)
 * @access  Public (rate limited + cooldown)
 */
router.post("/send-otp", otpLimiter, otpCooldown, sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP
 * @access  Public (rate limited)
 */
router.post("/verify-otp", otpLimiter, verifyOtp);

/* =========================
   AUTH – TOKEN REFRESH (OPTIONAL)
========================= */

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 *
 * NOTE:
 * Keep this ONLY if you plan to issue
 * Supabase sessions or JWTs later.
 */
router.post("/refresh-token", refreshToken);

export default router;
