import { supabase } from "../config/supabase.js";

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

  const images = [];
  const audios = [];
  const videos = [];

  if (req.files?.length) {
    for (const file of req.files) {
      const fakeUrl = `https://storage.example.com/${file.originalname}`;

      if (file.mimetype.startsWith("image/")) images.push(fakeUrl);
      if (file.mimetype.startsWith("audio/")) audios.push(fakeUrl);
      if (file.mimetype.startsWith("video/")) videos.push(fakeUrl);
    }
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title,
      description,
      status,
      images,
      audios,
      videos,
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
========================================================= */
export const updateBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can update blogs",
    });
  }

  const { id } = req.params;
  const { title, description, status } = req.body;

  const updatePayload = {
    updated_at: new Date(),
  };

  if (title) updatePayload.title = title;
  if (description) updatePayload.description = description;
  if (status) updatePayload.status = status;

  const { data, error } = await supabase
    .from("blogs")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  res.json({
    success: true,
    blog: data,
  });
};

/* =========================================================
   DELETE BLOG (ADMIN ONLY)
========================================================= */
export const deleteBlog = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can delete blogs",
    });
  }

  const { id } = req.params;

  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) throw error;

  res.json({
    success: true,
    message: "Blog deleted successfully",
  });
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

  res.json({
    success: true,
    blogs: data,
  });
};
