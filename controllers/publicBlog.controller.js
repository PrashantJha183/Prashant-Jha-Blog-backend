import { supabase } from "../config/supabase.js";

/* =========================
   GET PUBLISHED BLOGS (PUBLIC)
========================= */
export const getPublishedBlogs = async (req, res) => {
  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      description,
      images,
      audios,
      videos,
      created_at,
      profiles!blogs_author_id_fkey (
        id,
        name,
        email,
        role
      )
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.json({
    success: true,
    blogs: data,
  });
};
