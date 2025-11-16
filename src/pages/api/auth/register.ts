import type { APIRoute } from "astro";
import { registerApiSchema } from "@/lib/schemas/auth.schemas";
import { ZodError } from "zod";
import type { AuthError } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = registerApiSchema.parse(body);

    const supabase = locals.supabase;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/api/auth/callback`,
      },
    });

    if (error) {
      // Supabase-specific error for user already existing
      if ((error as AuthError).code === "user_already_exists") {
        return new Response(
          JSON.stringify({
            code: "USER_ALREADY_EXISTS",
            message: "User with this email already exists.",
          }),
          { status: 409 }
        );
      }

      return new Response(
        JSON.stringify({
          code: "SUPABASE_ERROR",
          message: error.message,
        }),
        { status: error.status || 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email for a verification link.",
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          errors: error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    /* eslint-disable no-console */
    console.error("Unexpected error during registration:", error);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500 }
    );
  }
};
