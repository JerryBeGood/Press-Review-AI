import type { APIRoute } from "astro";
import { deleteAccountSchema } from "@/lib/schemas/auth.schemas";
import { createSupabaseAdminClient } from "@/db/supabase.admin";
import type { DeleteAccountResponse } from "@/types/api";

export const prerender = false;

/**
 * POST /api/auth/delete-account
 * Permanently deletes the user's account and all associated data
 * Requires password confirmation for security
 *
 * Request body:
 * - password: string (required)
 *
 * Returns:
 * - 200: Account deleted successfully (user is logged out)
 * - 400: Invalid input or validation error
 * - 401: Unauthorized (no session or incorrect password)
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        code: "UNAUTHORIZED",
        message: "You must be logged in to delete your account",
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
    const validationResult = deleteAccountSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Step 3: Verify password by re-authenticating
    const { error: signInError } = await locals.supabase.auth.signInWithPassword({
      email: locals.user.email as string,
      password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          code: "INVALID_PASSWORD",
          message: "Incorrect password",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Delete user using Admin API
    const supabaseAdmin = createSupabaseAdminClient();
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(locals.user.id);

    if (deleteError) {
      /* eslint-disable no-console */
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({
          code: "DELETE_FAILED",
          message: "Failed to delete account. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Sign out the user (clear session)
    await locals.supabase.auth.signOut();

    // Step 6: Return success response
    const response: DeleteAccountResponse = {
      message: "Account deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Unexpected error in delete-account:", error);
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
