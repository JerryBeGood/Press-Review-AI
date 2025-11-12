import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * TODO: Configure Supabase Auth URLs in Production
 *
 * Before deploying to production, configure the following in Supabase Dashboard:
 * https://app.supabase.com/project/_/auth/url-configuration
 *
 * 1. Site URL: Set to your production domain (e.g., https://yourdomain.com)
 * 2. Redirect URLs: Add these allowed redirect URLs:
 *    - https://yourdomain.com/login (after email verification)
 *    - https://yourdomain.com/reset-password (after password reset link)
 *    - http://localhost:4321/login (for local development)
 *    - http://localhost:4321/reset-password (for local development)
 *
 * During development, use localhost URLs for testing.
 */

/**
 * Cookie configuration for Supabase auth session management
 * These settings ensure secure, HTTP-only cookies for production use
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parses the Cookie header string into an array of cookie objects
 * Required by @supabase/ssr for cookie management
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client instance with proper cookie management for SSR
 * This function should be used in middleware, API routes, and Astro pages
 *
 * @param context - Object containing Astro headers and cookies
 * @returns Configured Supabase client with session management
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
