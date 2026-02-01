import multer from "multer";

const MB = 1024 * 1024;

const IMAGE_MAX = Number(process.env.IMAGE_MAX_SIZE_MB || 5) * MB;
const AUDIO_MAX = Number(process.env.AUDIO_MAX_SIZE_MB || 10) * MB;
const VIDEO_MAX = Number(process.env.VIDEO_MAX_SIZE_MB || 50) * MB;

const fileFilter = (req, file, cb) => {
  const { mimetype, size } = file;

  // IMAGE
  if (mimetype.startsWith("image/")) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimetype)) {
      return cb(
        new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid image type"),
      );
    }
    if (size > IMAGE_MAX) {
      return cb(new multer.MulterError("LIMIT_FILE_SIZE", "Image too large"));
    }
    return cb(null, true);
  }

  // AUDIO
  if (mimetype.startsWith("audio/")) {
    if (!["audio/mpeg", "audio/wav"].includes(mimetype)) {
      return cb(
        new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid audio type"),
      );
    }
    if (size > AUDIO_MAX) {
      return cb(new multer.MulterError("LIMIT_FILE_SIZE", "Audio too large"));
    }
    return cb(null, true);
  }

  // VIDEO
  if (mimetype.startsWith("video/")) {
    if (!["video/mp4", "video/webm"].includes(mimetype)) {
      return cb(
        new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid video type"),
      );
    }
    if (size > VIDEO_MAX) {
      return cb(new multer.MulterError("LIMIT_FILE_SIZE", "Video too large"));
    }
    return cb(null, true);
  }

  // ❌ BLOCK EVERYTHING ELSE
  return cb(
    new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported file type"),
  );
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    files: 5, // max 5 media files per blog
  },
});
