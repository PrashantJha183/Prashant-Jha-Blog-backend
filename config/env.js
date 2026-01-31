import dotenv from "dotenv";

dotenv.config();

/**
 * =========================================================
 * REQUIRED ENVIRONMENT VARIABLES
 * ---------------------------------------------------------
 * This is the single source of truth for env validation.
 * If any variable is missing, the server MUST NOT start.
 * =========================================================
 */
const requiredEnvVars = [
  /* -------------------------
     Server
  -------------------------- */
  "PORT",
  "NODE_ENV",

  /* -------------------------
     Supabase (backend only)
  -------------------------- */
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",

  /* -------------------------
     JWT (future-ready)
  -------------------------- */
  "JWT_SECRET",
  "ACCESS_TOKEN_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_IN",

  /* -------------------------
     Rate limiting
  -------------------------- */
  "API_RATE_LIMIT_WINDOW",
  "API_RATE_LIMIT_MAX",
  "OTP_RATE_LIMIT_WINDOW",
  "OTP_RATE_LIMIT_MAX",
  "OTP_COOLDOWN_SECONDS",

  /* -------------------------
     OTP
  -------------------------- */
  "OTP_EXPIRY_MINUTES",

  /* -------------------------
     SMTP (NodeMailer)
  -------------------------- */
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
];

/**
 * Check for missing variables
 */
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

/**
 * Log only in non-production
 */
if (process.env.NODE_ENV !== "production") {
  console.log("Environment variables loaded successfully");
}
