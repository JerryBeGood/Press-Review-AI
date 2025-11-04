import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import type { Database } from "./database-types.ts";

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}
