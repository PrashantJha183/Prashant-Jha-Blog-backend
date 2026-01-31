import { z } from "zod";

/* =========================
   CREATE BLOG (ADMIN)
========================= */
export const createBlogSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(10, "Content is required"),

  // optional fields
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),

  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  audios: z.array(z.string().url()).optional(),
});

/* =========================
   UPDATE BLOG (ADMIN)
   (PARTIAL UPDATE)
========================= */
export const updateBlogSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  audios: z.array(z.string().url()).optional(),
});
