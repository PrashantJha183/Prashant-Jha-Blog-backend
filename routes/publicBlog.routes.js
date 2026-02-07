import { Router } from "express";
import {
  getPublishedBlogs,
  getPublishedBlogBySlug,
} from "../controllers/publicBlog.controller.js";

const router = Router();

/* =========================
   PUBLIC BLOG ROUTES
   - No authentication required
========================= */

/**
 * @route   GET /api/blogs
 * @desc    Fetch all published blogs (paginated)
 * @access  Public
 */
router.get("/", getPublishedBlogs);

/**
 * @route   GET /api/blogs/:slug
 * @desc    Fetch single published blog by slug
 * @access  Public
 */
router.get("/:slug", getPublishedBlogBySlug);

export default router;
