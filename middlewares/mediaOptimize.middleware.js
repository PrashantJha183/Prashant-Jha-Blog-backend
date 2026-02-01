import sharp from "sharp";

/**
 * Optimize uploaded media
 * - Images: resize + compress
 * - Audio/Video: untouched (already size-limited)
 */
export const optimizeMedia = async (req, res, next) => {
  if (!req.files || !req.files.length) {
    return next();
  }

  try {
    for (const file of req.files) {
      // IMAGE OPTIMIZATION
      if (file.mimetype.startsWith("image/")) {
        file.buffer = await sharp(file.buffer)
          .resize({
            width: 1600, // max width
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 75, // compression
            mozjpeg: true,
          })
          .toBuffer();
      }

      // DO NOT TRANSCODE AUDIO / VIDEO
      // size is already validated in mediaSize middleware
    }

    next();
  } catch (err) {
    next(err);
  }
};
