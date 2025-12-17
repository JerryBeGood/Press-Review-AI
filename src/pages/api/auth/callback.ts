import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
  const authCode = url.searchParams.get("code");
  const type = url.searchParams.get("type");

  if (!authCode || !["recovery", "verification", "email_change"].includes(type || "")) {
    return redirect("/login");
  }

  if (type === "recovery") {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return redirect("/reset-password");
  } else if (type === "verification" || type === "email_change") {
    cookies.set(`show-${type.replace("_", "-")}-success`, "true", {
      path: "/",
      maxAge: 60,
    });
  }

  return redirect("/login");
};
