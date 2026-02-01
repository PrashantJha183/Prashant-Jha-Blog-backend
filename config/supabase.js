import { createClient } from "@supabase/supabase-js";

/* =========================================================
   Environment validation
========================================================= */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// console.log(
//   "SUPABASE KEY PREFIX:",
//   process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10),
// );

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

/* =========================================================
   Supabase ADMIN client (explicit Bearer token)
   ---------------------------------------------------------
   This FIXES:
   - AuthApiError: no_authorization
   - Bearer token missing in admin APIs
========================================================= */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "X-Client-Info": "node-backend",
    },
  },
});
