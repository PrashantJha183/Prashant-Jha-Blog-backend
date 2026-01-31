import { supabase } from "../config/supabase.js";

export const checkHealthService = async () => {
  // Optional DB check (recommended)
  const { error } = await supabase
    .from("_dummy_health_check") // can be ANY existing table
    .select("*")
    .limit(1);

  return {
    status: "ok",
    database: error ? "down" : "up",
    timestamp: new Date().toISOString(),
  };
};
