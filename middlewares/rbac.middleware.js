import { supabase } from "../config/supabase.js";

export const allowRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !allowedRoles.includes(data.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user.role = data.role;
    next();
  };
};
