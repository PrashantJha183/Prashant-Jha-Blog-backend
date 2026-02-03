import { supabase } from "../config/supabase.js";

/* =========================
   CREATE editor / writer
========================= */
export const createUserByAdmin = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email and role are required",
    });
  }

  if (!["editor", "writer", "admin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be editor,writer or admin",
    });
  }

  const { data: exists } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (exists) {
    return res.status(409).json({
      success: false,
      message: "User already exists",
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ name, email, role })
    .select("id, name, email, role")
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    user: data,
  });
};

/* =========================
   READ all editors & writers
========================= */
export const getAllStaff = async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .in("role", ["editor", "writer", "admin"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.status(200).json({
    success: true,
    users: data,
  });
};

/* =========================
   UPDATE editor / writer
========================= */
export const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;

  if (!name && !role) {
    return res.status(400).json({
      success: false,
      message: "Nothing to update",
    });
  }

  if (role && !["editor", "writer"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ name, role })
    .eq("id", id)
    .select("id, name, email, role")
    .single();

  if (error) throw error;

  res.status(200).json({
    success: true,
    user: data,
  });
};

/* =========================
   DELETE editor / writer
========================= */
export const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;

  // prevent admin deleting himself
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot delete himself",
    });
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) throw error;

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
};
