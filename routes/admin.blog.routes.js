import { Router } from "express";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin,
  removeBlogMedia,
} from "../controllers/admin.blog.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/rbac.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { validateMediaSize } from "../middlewares/mediaSize.middleware.js";
import { optimizeMedia } from "../middlewares/mediaOptimize.middleware.js";

const router = Router();

/* =========================================================
   ADMIN BLOG ROUTES
   - Only ADMIN can access these routes
   - Auth + RBAC enforced globally
========================================================= */

// Authentication + Role-based authorization
router.use(protect, allowRoles("admin"));

/**
 * @route   POST /api/admin/blogs
 * @desc    Admin creates & publishes a blog
 * @access  Admin only
 */
router.post(
  "/",
  upload.array("media", 5), // images/audio/video (max 5)
  validateMediaSize,
  optimizeMedia,
  createBlog,
);

/**
 * @route   GET /api/admin/blogs
 * @desc    Admin fetches all blogs (own + editor + writer)
 * @access  Admin only
 */
router.get("/", getAllBlogsAdmin);

/**
 * @route   PUT /api/admin/blogs/:id
 * @desc    Admin updates any blog (append media supported)
 * @access  Admin only
 */
router.put(
  "/:id",
  upload.array("media", 5),
  validateMediaSize,
  optimizeMedia,
  updateBlog,
);

/**
 * @route   PATCH /api/admin/blogs/:id/media
 * @desc    Admin removes specific media (images/videos/audios)
 * @access  Admin only
 */
router.patch("/:id/media", removeBlogMedia);

/**
 * @route   DELETE /api/admin/blogs/:id
 * @desc    Admin deletes any blog
 * @access  Admin only
 */
router.delete("/:id", deleteBlog);

export default router;
