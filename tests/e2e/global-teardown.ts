import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Global teardown function that runs after all tests
 * Cleans up the generated_press_reviews table
 */
async function globalTeardown() {
  console.log("🧹 Running global teardown: cleaning generated_press_reviews table...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials for teardown");
    return;
  }

  // Create a Supabase client with service role key for admin operations
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // Delete all entries from generated_press_reviews table
    const { error, count } = await supabase
      .from("generated_press_reviews")
      .delete()
      .eq("user_id", process.env.E2E_USER_ID);

    if (error) {
      console.error("❌ Error cleaning generated_press_reviews:", error);
    } else {
      console.log(`✅ Successfully cleaned generated_press_reviews table (${count || 0} rows deleted)`);
    }
  } catch (error) {
    console.error("❌ Unexpected error during teardown:", error);
  }
}

export default globalTeardown;
