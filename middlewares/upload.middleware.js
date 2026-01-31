import multer from "multer";

const MB = 1024 * 1024;

const limits = {
  fileSize: Number(process.env.VIDEO_MAX_SIZE_MB) * MB, // max possible
};

const fileFilter = (req, file, cb) => {
  const { mimetype } = file;

  if (mimetype.startsWith("image/")) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimetype)) {
      return cb(new Error("Invalid image type"));
    }
  }

  if (mimetype.startsWith("audio/")) {
    if (!["audio/mpeg", "audio/wav"].includes(mimetype)) {
      return cb(new Error("Invalid audio type"));
    }
  }

  if (mimetype.startsWith("video/")) {
    if (!["video/mp4", "video/webm"].includes(mimetype)) {
      return cb(new Error("Invalid video type"));
    }
  }

  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(), // important
  limits,
  fileFilter,
});
