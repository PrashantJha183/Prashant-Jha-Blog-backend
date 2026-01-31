const otpCooldownMap = new Map();

export const otpCooldown = (req, res, next) => {
  const email = req.body?.email;
  if (!email) return next();

  const now = Date.now();
  const cooldownMs = Number(process.env.OTP_COOLDOWN_SECONDS) * 1000;

  const lastSent = otpCooldownMap.get(email);

  if (lastSent && now - lastSent < cooldownMs) {
    return res.status(429).json({
      success: false,
      message: `Please wait ${Math.ceil(
        (cooldownMs - (now - lastSent)) / 1000,
      )} seconds before requesting another OTP.`,
    });
  }

  otpCooldownMap.set(email, now);
  next();
};
