import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!code) {
    /* eslint-disable no-console */
    console.error("No code provided for auth callback.");
    return redirect(next);
  }

  cookies.set("show-verification-success", "true", {
    path: "/",
    maxAge: 60,
  });

  return redirect("/login");
};
