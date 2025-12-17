import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase Admin Client with service role key
 * Use ONLY for operations that require elevated privileges (e.g., deleting users)
 * NEVER expose this client to the frontend
 */
export const createSupabaseAdminClient = () => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase Admin credentials");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;
