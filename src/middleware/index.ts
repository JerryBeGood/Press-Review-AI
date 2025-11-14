import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

const DISABLED_PATHS = ["/forgot-password", "/reset-password", "/api/auth/forgot-password"];

const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  // "/forgot-password",
  // "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/callback",
  "/api/auth/logout",
  // "/api/auth/forgot-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  } else {
    locals.user = null;
  }

  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);
  const isDisabledPath = DISABLED_PATHS.includes(url.pathname);

  if (isDisabledPath) {
    if (user) {
      return redirect("/dashboard");
    } else {
      return redirect("/login");
    }
  }

  if (user && isPublicPath && url.pathname !== "/api/auth/logout") {
    return redirect("/dashboard");
  }

  if (!user && !isPublicPath) {
    return redirect("/login");
  }

  return next();
});
