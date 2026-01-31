import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendOtpService,
  verifyOtpService,
  refreshTokenService,
} from "../services/auth.service.js";

/* =========================
   Send OTP
========================= */
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  await sendOtpService(email);

  res.status(200).json({
    success: true,
    message: "OTP sent",
  });
});

/* =========================
   Verify OTP (NODE OTP)
========================= */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const result = await verifyOtpService({ email, otp });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/* =========================
   Refresh Token (OPTIONAL)
========================= */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const data = await refreshTokenService(refreshToken);

  res.status(200).json({
    success: true,
    ...data,
  });
});
