import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";

/**
 * OTP rate limiter
 * - Protects OTP endpoints
 * - Safe for IPv4 + IPv6
 * - Rate limit per IP + email
 */
export const otpLimiter = rateLimit({
  windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW),
  max: Number(process.env.OTP_RATE_LIMIT_MAX),

  /**
   * IMPORTANT:
   * ipKeyGenerator() prevents IPv6 bypass attacks
   */
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    const email = req.body?.email?.toLowerCase() || "unknown";
    return `${ip}:${email}`;
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});
