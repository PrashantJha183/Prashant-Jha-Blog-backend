import { supabase } from "../config/supabase.js";

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

export const validateSupabaseConnection = async () => {
  const { data, error } = await supabase.from("blogs").select("id").limit(1);

  if (error) {
    console.error("Supabase connection failed");
    console.error(error.message);
    process.exit(1);
  }

  console.log("Supabase connected successfully");
};
