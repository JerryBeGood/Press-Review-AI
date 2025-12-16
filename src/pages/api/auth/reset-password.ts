import type { APIRoute } from "astro";
import { resetPasswordSchema } from "@/lib/schemas/auth.schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { password } = resetPasswordSchema.parse(body);

    const supabase = locals.supabase;

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({
          code: "SUPABASE_ERROR",
          message: updateError.message,
        }),
        { status: updateError.status || 500 }
      );
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return new Response(
        JSON.stringify({
          code: "SUPABASE_ERROR",
          message: signOutError.message,
        }),
        { status: signOutError.status || 500 }
      );
    }

    // Successful password update
    return new Response(
      JSON.stringify({
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Unexpected error during password reset:", error);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500 }
    );
  }
};
