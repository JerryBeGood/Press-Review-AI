import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Public paths that don't require authentication
 * Includes both server-rendered pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase instance with cookie management
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase client available in locals
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  } else {
    locals.user = null;
  }

  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Redirect authenticated users away from auth pages to dashboard
  if (user && isPublicPath && url.pathname !== "/api/auth/logout") {
    return redirect("/dashboard");
  }

  // Redirect unauthenticated users to login for protected routes
  if (!user && !isPublicPath) {
    return redirect("/login");
  }

  return next();
});
