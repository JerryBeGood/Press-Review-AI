import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
  const authCode = url.searchParams.get("code");
  const type = url.searchParams.get("type");

  if (!authCode || !["recovery", "verification"].includes(type || "")) {
    return redirect("/login");
  }

  if (type === "recovery") {
    const { data, error } = await locals.supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    const { access_token, refresh_token } = data.session;
    cookies.set("sb-access-token", access_token, {
      path: "/",
    });
    cookies.set("sb-refresh-token", refresh_token, {
      path: "/",
    });

    return redirect("/reset-password");
  } else if (type === "verification") {
    cookies.set("show-verification-success", "true", {
      path: "/",
      maxAge: 60,
    });
  }

  return redirect("/login");
};
