import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for client-side usage (React components)
 * This client handles authentication state and cookies automatically
 *
 * @returns Configured Supabase client for browser usage
 */
export const createSupabaseBrowserInstance = () => {
  return createBrowserClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_KEY);
};

/**
 * Singleton instance for browser-side Supabase client
 * Use this in React components for authentication operations
 */
export const supabaseBrowser = createSupabaseBrowserInstance();
