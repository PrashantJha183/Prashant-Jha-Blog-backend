import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import path from "path";

/* =========================================================
   CREATE BLOG (ADMIN ONLY)
========================================================= */
export const createBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can create blogs",
    });
  }

  const { title, description, status = "published" } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Title and description are required",
    });
  }

  const images = Array.isArray(req.body.images) ? req.body.images : [];
  const videos = Array.isArray(req.body.videos) ? req.body.videos : [];
  const audios = Array.isArray(req.body.audios) ? req.body.audios : [];

  if (req.files) {
    for (const field of ["images", "videos", "audios"]) {
      if (!req.files[field]) continue;

      for (const file of req.files[field]) {
        const ext = path.extname(file.originalname);
        const fileName = `${crypto.randomUUID()}${ext}`;
        const filePath = `${field}/${fileName}`;

        const { error } = await supabase.storage
          .from("Prashant_Jha_blog_media")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("Prashant_Jha_blog_media")
          .getPublicUrl(filePath);

        if (field === "images") images.push(data.publicUrl);
        if (field === "videos") videos.push(data.publicUrl);
        if (field === "audios") audios.push(data.publicUrl);
      }
    }
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title,
      description,
      status,
      images,
      videos,
      audios,
      author_id: req.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    blog: data,
  });
};

/* =========================================================
   UPDATE BLOG (ADMIN ONLY)
   - append media
========================================================= */
export const updateBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can update blogs",
    });
  }

  const { id } = req.params;

  const { data: existingBlog, error: fetchError } = await supabase
    .from("blogs")
    .select("images, videos, audios")
    .eq("id", id)
    .single();

  if (fetchError || !existingBlog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  const updatePayload = { updated_at: new Date() };

  if (req.body.title) updatePayload.title = req.body.title;
  if (req.body.description) updatePayload.description = req.body.description;
  if (req.body.status) updatePayload.status = req.body.status;

  const images = [
    ...(existingBlog.images || []),
    ...(Array.isArray(req.body.images) ? req.body.images : []),
  ];

  const videos = [
    ...(existingBlog.videos || []),
    ...(Array.isArray(req.body.videos) ? req.body.videos : []),
  ];

  const audios = [
    ...(existingBlog.audios || []),
    ...(Array.isArray(req.body.audios) ? req.body.audios : []),
  ];

  if (req.files) {
    for (const field of ["images", "videos", "audios"]) {
      if (!req.files[field]) continue;

      for (const file of req.files[field]) {
        const ext = path.extname(file.originalname);
        const fileName = `${crypto.randomUUID()}${ext}`;
        const filePath = `${field}/${fileName}`;

        const { error } = await supabase.storage
          .from("Prashant_Jha_blog_media")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("Prashant_Jha_blog_media")
          .getPublicUrl(filePath);

        if (field === "images") images.push(data.publicUrl);
        if (field === "videos") videos.push(data.publicUrl);
        if (field === "audios") audios.push(data.publicUrl);
      }
    }
  }

  updatePayload.images = images;
  updatePayload.videos = videos;
  updatePayload.audios = audios;

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
   REMOVE SPECIFIC MEDIA (ADMIN ONLY)
========================================================= */
export const removeBlogMedia = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can remove media",
    });
  }

  const { id } = req.params;
  const { type, urls } = req.body;

  if (!["images", "videos", "audios"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid media type",
    });
  }

  if (!Array.isArray(urls) || !urls.length) {
    return res.status(400).json({
      success: false,
      message: "URLs are required",
    });
  }

  const { data: blog, error } = await supabase
    .from("blogs")
    .select("images, videos, audios")
    .eq("id", id)
    .single();

  if (error || !blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  const updatedMedia = (blog[type] || []).filter((url) => !urls.includes(url));

  const storagePaths = urls
    .filter((url) => url.includes("/storage/v1/object/public/"))
    .map((url) => url.split("/object/public/Prashant_Jha_blog_media/")[1])
    .filter(Boolean);

  if (storagePaths.length) {
    await supabase.storage.from("Prashant_Jha_blog_media").remove(storagePaths);
  }

  const { data: updatedBlog, error: updateError } = await supabase
    .from("blogs")
    .update({
      [type]: updatedMedia,
      updated_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) throw updateError;

  res.json({
    success: true,
    message: "Media removed successfully",
    blog: updatedBlog,
  });
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
    .select("images, videos, audios")
    .eq("id", id)
    .single();

  const filesToDelete = [
    ...(blog?.images || []),
    ...(blog?.videos || []),
    ...(blog?.audios || []),
  ];

  if (filesToDelete.length) {
    await supabase.storage
      .from("Prashant_Jha_blog_media")
      .remove(filesToDelete);
  }

  await supabase.from("blogs").delete().eq("id", id);

  res.json({ success: true, message: "Blog & media deleted successfully" });
};

/* =========================================================
   READ ALL BLOGS (ADMIN DASHBOARD)
========================================================= */
export const getAllBlogsAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can view all blogs",
    });
  }

  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      description,
      status,
      created_at,
      updated_at,
      images,
      videos,
      audios,
      profiles!blogs_author_id_fkey (
        id,
        name,
        email,
        role
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.json({ success: true, blogs: data });
};
