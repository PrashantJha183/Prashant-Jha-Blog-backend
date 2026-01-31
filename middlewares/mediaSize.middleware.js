export const validateMediaSize = (req, res, next) => {
  if (!req.files) return next();

  const MB = 1024 * 1024;

  const imageLimit = Number(process.env.IMAGE_MAX_SIZE_MB) * MB;
  const audioLimit = Number(process.env.AUDIO_MAX_SIZE_MB) * MB;
  const videoLimit = Number(process.env.VIDEO_MAX_SIZE_MB) * MB;

  for (const file of req.files) {
    if (file.mimetype.startsWith("image/") && file.size > imageLimit) {
      return res.status(400).json({
        success: false,
        message: `Image exceeds ${process.env.IMAGE_MAX_SIZE_MB}MB`,
      });
    }

    if (file.mimetype.startsWith("audio/") && file.size > audioLimit) {
      return res.status(400).json({
        success: false,
        message: `Audio exceeds ${process.env.AUDIO_MAX_SIZE_MB}MB`,
      });
    }

    if (file.mimetype.startsWith("video/") && file.size > videoLimit) {
      return res.status(400).json({
        success: false,
        message: `Video exceeds ${process.env.VIDEO_MAX_SIZE_MB}MB`,
      });
    }
  }

  next();
};
