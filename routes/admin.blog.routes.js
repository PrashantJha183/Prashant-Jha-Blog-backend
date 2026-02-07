import { Router } from "express";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin,
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
 * @desc    Admin creates a blog with real content structure
 *          (headings, paragraphs, images, PDFs)
 * @access  Admin only
 */
router.post(
  "/",
  upload.any(), // dynamic media per content block
  validateMediaSize,
  optimizeMedia,
  createBlog,
);

/**
 * @route   GET /api/admin/blogs
 * @desc    Admin fetches all blogs
 * @access  Admin only
 */
router.get("/", getAllBlogsAdmin);

/**
 * @route   PUT /api/admin/blogs/:id
 * @desc    Admin updates blog
 *          - edit text
 *          - add media
 *          - remove media
 *          - reorder blocks
 * @access  Admin only
 */
router.put("/:id", upload.any(), validateMediaSize, optimizeMedia, updateBlog);

/**
 * @route   DELETE /api/admin/blogs/:id
 * @desc    Admin deletes blog & all associated media
 * @access  Admin only
 */
router.delete("/:id", deleteBlog);

export default router;
