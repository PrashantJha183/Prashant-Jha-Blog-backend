import { Router } from "express";
import { getPublishedBlogs } from "../controllers/publicBlog.controller.js";

const router = Router();

/* =========================
   PUBLIC BLOG ROUTES
========================= */

// anyone can access
router.get("/", getPublishedBlogs);

export default router;
