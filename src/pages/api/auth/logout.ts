import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 *
 * Returns:
 * - 200: Logout successful, session cookies cleared
 * - 400: Error during logout
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Session cookies are automatically cleared by @supabase/ssr
    return new Response(null, { status: 200 });
  } catch (err) {
    /* eslint-disable no-console */
    console.error("Logout error:", err);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during logout.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
