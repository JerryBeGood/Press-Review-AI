import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/schemas/auth.schemas";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 *
 * Request body:
 * - email: string (valid email format)
 * - password: string (required)
 *
 * Returns:
 * - 200: Login successful, session cookies set automatically by Supabase
 * - 400: Invalid credentials or validation error
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error for security (don't reveal if user exists)
      return new Response(
        JSON.stringify({
          error: "Invalid email or password",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Session cookies are automatically set by @supabase/ssr
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    /* eslint-disable no-console */
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
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
