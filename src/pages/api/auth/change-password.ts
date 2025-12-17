import type { APIRoute } from "astro";
import { changePasswordSchema } from "@/lib/schemas/auth.schemas";
import type { ChangePasswordResponse } from "@/types/api";

export const prerender = false;

/**
 * POST /api/auth/change-password
 * Changes the user's password after verifying the current password
 *
 * Request body:
 * - currentPassword: string (required)
 * - newPassword: string (min 8 chars, 1 uppercase, 1 number, 1 special char)
 *
 * Returns:
 * - 200: Password changed successfully
 * - 400: Invalid input or validation error
 * - 401: Unauthorized (no session or incorrect current password)
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        code: "UNAUTHORIZED",
        message: "You must be logged in to change your password",
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

    // Remove confirmPassword from the request body for API validation
    const { currentPassword, newPassword } = body;
    const validationResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword: newPassword, // For validation purposes
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

    // Step 3: Verify current password by re-authenticating
    const { error: signInError } = await locals.supabase.auth.signInWithPassword({
      email: locals.user.email as string,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          code: "INVALID_PASSWORD",
          message: "Current password is incorrect",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Update password
    const { error: updateError } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      /* eslint-disable no-console */
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({
          code: "UPDATE_FAILED",
          message: "Failed to update password. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return success response
    const response: ChangePasswordResponse = {
      message: "Password updated successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Unexpected error in change-password:", error);
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
