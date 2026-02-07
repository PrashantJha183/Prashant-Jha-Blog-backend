import { supabase } from "../config/supabase.js";

/* =========================
   GET PUBLISHED BLOGS (PUBLIC)
   - no authentication required
   - cursor based pagination (FAST)
   - includes slug for sharing
========================= */
export const getPublishedBlogs = async (req, res) => {
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
      content_blocks,
      profiles!blogs_author_id_fkey (
        id,
        name
      )
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to detect next page

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }

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

/* =========================
   GET SINGLE PUBLISHED BLOG (PUBLIC)
   - slug based (shareable)
========================= */
export const getPublishedBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      slug,
      status,
      created_at,
      content_blocks,
      profiles!blogs_author_id_fkey (
        id,
        name
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  res.json({ success: true, blog: data });
};
