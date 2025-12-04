/* eslint-disable no-console */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import fs from "fs";
import path from "path";

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

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_USERNAME!,
    password: process.env.E2E_PASSWORD!,
  });

  if (signInError) {
    console.error("Error signing in:", signInError);
    throw signInError;
  }

  try {
    // Delete all entries from generated_press_reviews table
    const { error: generatedError } = await supabase
      .from("generated_press_reviews")
      .delete()
      .eq("user_id", process.env.E2E_USER_ID!);

    if (generatedError) {
      console.error("❌ Error cleaning generated_press_reviews:", generatedError);
    } else {
      console.log(`✅ Successfully cleaned generated_press_reviews table`);
    }

    // Delete all E2E test press reviews
    const { error: pressReviewError } = await supabase
      .from("press_reviews")
      .delete()
      .eq("user_id", process.env.E2E_USER_ID!);

    if (pressReviewError) {
      console.error("❌ Error cleaning press_reviews:", pressReviewError);
    } else {
      console.log(`✅ Successfully cleaned press_reviews table`);
    }
  } catch (error) {
    console.error("❌ Unexpected error during teardown:", error);
  }

  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error("Error signing out:", signOutError);
    throw signOutError;
  }

  console.log("✅ Successfully signed out");

  const AUTH_FILE = path.join(process.cwd(), "tests/e2e/.auth/user.json");

  try {
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
      console.log(`✅ Deleted ${AUTH_FILE}`);
    } else {
      console.log(`ℹ️ ${AUTH_FILE} does not exist, skipping deletion`);
    }
  } catch (err) {
    console.error(`❌ Error deleting ${AUTH_FILE}:`, err);
  }
}

export default globalTeardown;
