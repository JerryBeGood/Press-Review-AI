import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schemas";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const supabase = locals.supabase;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/api/auth/callback?type=recovery`,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          code: "SUPABASE_ERROR",
          message: error.message,
        }),
        { status: error.status || 500 }
      );
    }

    // Always return 200 to prevent email enumeration
    // Generic message whether the user exists or not
    return new Response(
      JSON.stringify({
        message: "If an account exists with that email, we've sent you a link to reset your password.",
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
    console.error("Unexpected error during password reset request:", error);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500 }
    );
  }
};
