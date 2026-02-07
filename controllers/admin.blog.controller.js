import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import path from "path";

/* =========================================================
   helpers
========================================================= */
const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* =========================================================
   CREATE BLOG (ADMIN ONLY)
   - supports real blog structure
   - headings, paragraphs, media anywhere
========================================================= */
export const createBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin" });
  }

  const contentBlocks =
    typeof req.body.content_blocks === "string"
      ? JSON.parse(req.body.content_blocks)
      : req.body.content_blocks || [];

  const { title, status = "draft" } = req.body;

  if (!title || !Array.isArray(contentBlocks)) {
    return res.status(400).json({
      success: false,
      message: "Title & content blocks are required",
    });
  }

  const slug = generateSlug(title);

  const fileMap = {};
  (req.files || []).forEach((file) => {
    fileMap[file.fieldname] = file;
  });

  const processedBlocks = [];

  for (const block of contentBlocks) {
    if (block.type === "heading" || block.type === "paragraph") {
      processedBlocks.push({
        id: crypto.randomUUID(),
        type: block.type,
        text: block.text || "",
      });
      continue;
    }

    if (block.type === "media" && block.fileKey) {
      const file = fileMap[block.fileKey];
      if (!file) continue;

      const ext = path.extname(file.originalname);
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = `blogs/${fileName}`;

      const { error } = await supabase.storage
        .from("Prashant_Jha_blog_media")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("Prashant_Jha_blog_media")
        .getPublicUrl(filePath);

      processedBlocks.push({
        id: crypto.randomUUID(),
        type: "media",
        media: {
          url: data.publicUrl,
          fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
        },
      });
      continue;
    }

    if (block.type === "media" && block.media?.url) {
      processedBlocks.push({
        id: crypto.randomUUID(),
        type: "media",
        media: {
          url: block.media.url,
          fileType: block.media.fileType || "image",
        },
      });
    }
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title,
      slug,
      status,
      content_blocks: processedBlocks,
      author_id: req.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({ success: true, blog: data });
};

/* =========================================================
   UPDATE BLOG (ADMIN ONLY)
========================================================= */
export const updateBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can update blogs",
    });
  }

  const { id } = req.params;

  const contentBlocks =
    typeof req.body.content_blocks === "string"
      ? JSON.parse(req.body.content_blocks)
      : req.body.content_blocks || [];

  const { title, status } = req.body;

  const { data: existingBlog, error: fetchError } = await supabase
    .from("blogs")
    .select("content_blocks")
    .eq("id", id)
    .single();

  if (fetchError || !existingBlog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  const fileMap = {};
  (req.files || []).forEach((file) => {
    fileMap[file.fieldname] = file;
  });

  const updatedBlocks = [];

  for (const block of contentBlocks) {
    if (block._delete === true) {
      if (block.type === "media" && block.media?.url) {
        const storagePath = block.media.url.split(
          "/object/public/Prashant_Jha_blog_media/",
        )[1];

        if (storagePath) {
          await supabase.storage
            .from("Prashant_Jha_blog_media")
            .remove([storagePath]);
        }
      }
      continue;
    }

    if (!block.fileKey) {
      updatedBlocks.push(block);
      continue;
    }

    const file = fileMap[block.fileKey];
    if (!file) continue;

    const ext = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${ext}`;
    const filePath = `blogs/${fileName}`;

    await supabase.storage
      .from("Prashant_Jha_blog_media")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    const { data } = supabase.storage
      .from("Prashant_Jha_blog_media")
      .getPublicUrl(filePath);

    updatedBlocks.push({
      id: crypto.randomUUID(),
      type: "media",
      media: {
        url: data.publicUrl,
        fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
      },
    });
  }

  const updatePayload = {
    updated_at: new Date(),
    content_blocks: updatedBlocks,
  };

  if (title) {
    updatePayload.title = title;
    updatePayload.slug = generateSlug(title);
  }
  if (status) updatePayload.status = status;

  const { data, error } = await supabase
    .from("blogs")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  res.json({ success: true, blog: data });
};

/* =========================================================
   DELETE BLOG (ADMIN ONLY)
========================================================= */
export const deleteBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { id } = req.params;

  const { data: blog } = await supabase
    .from("blogs")
    .select("content_blocks")
    .eq("id", id)
    .single();

  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  const mediaPaths = [];

  for (const block of blog.content_blocks || []) {
    if (block.type === "media" && block.media?.url) {
      const path = block.media.url.split(
        "/object/public/Prashant_Jha_blog_media/",
      )[1];
      if (path) mediaPaths.push(path);
    }
  }

  if (mediaPaths.length) {
    await supabase.storage.from("Prashant_Jha_blog_media").remove(mediaPaths);
  }

  await supabase.from("blogs").delete().eq("id", id);

  res.json({ success: true, message: "Blog & media deleted successfully" });
};

/* =========================================================
   READ ALL BLOGS (ADMIN DASHBOARD)
   - cursor based pagination (FAST)
========================================================= */
export const getAllBlogsAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can view all blogs",
    });
  }

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const cursor = req.query.cursor || null;

  let query = supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      slug,
      status,
      created_at,
      updated_at,
      content_blocks,
      profiles!blogs_author_id_fkey (
        id,
        name,
        email,
        role
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  let nextCursor = null;
  let blogs = data;

  if (data.length > limit) {
    const last = data[limit - 1];
    nextCursor = last.created_at;
    blogs = data.slice(0, limit);
  }

  res.json({
    success: true,
    nextCursor,
    blogs,
  });
};
