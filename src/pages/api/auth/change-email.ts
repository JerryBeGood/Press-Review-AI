import type { APIRoute } from "astro";
import { changeEmailApiSchema } from "@/lib/schemas/auth.schemas";
import type { ChangeEmailResponse } from "@/types/api";

export const prerender = false;

/**
 * POST /api/auth/change-email
 * Sends verification email to the new email address
 * The old email remains active until the new one is verified
 *
 * Request body:
 * - newEmail: string (valid email format)
 *
 * Returns:
 * - 200: Verification email sent successfully
 * - 400: Invalid input or validation error
 * - 401: Unauthorized (no session)
 * - 409: Email already in use
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        code: "UNAUTHORIZED",
        message: "You must be logged in to change your email",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Step 2: Parse and validate request body
    const body = await request.json();
    const { newEmail } = body;

    // Get current email from authenticated user
    const currentEmail = locals.user.email;

    if (!currentEmail) {
      return new Response(
        JSON.stringify({
          code: "MISSING_EMAIL",
          message: "Current email not found in session",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate with currentEmail comparison
    const validationResult = changeEmailApiSchema.safeParse({
      currentEmail,
      newEmail,
    });

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          errors: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get the origin for redirect URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/api/auth/callback?type=email_change`;

    // Step 4: Update email (sends verification email)
    const { error: updateError } = await locals.supabase.auth.updateUser(
      {
        email: newEmail,
      },
      {
        emailRedirectTo: redirectTo,
      }
    );

    if (updateError) {
      /* eslint-disable no-console */
      console.error("Error updating email:", updateError);

      // Check if email is already in use
      if (updateError.message.includes("already") || updateError.code === "email_exists") {
        return new Response(
          JSON.stringify({
            code: "EMAIL_EXISTS",
            message: "This email is already in use",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          code: "UPDATE_FAILED",
          message: "Failed to send verification email. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return success response
    const response: ChangeEmailResponse = {
      message: "Verification email sent to new address. Please check your inbox.",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Unexpected error in change-email:", error);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
