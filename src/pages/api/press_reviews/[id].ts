import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { deletePressReviewParamsSchema } from "../../../lib/schemas/api.schemas";
import { PressReviewService } from "../../../lib/services/pressReviewService";

export const prerender = false;

/**
 * DELETE /api/press_reviews/:id
 * Deletes an existing press review by id for the authenticated user
 * Returns 204 No Content on success, 404 Not Found if resource doesn't exist or doesn't belong to user
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Step 1: Validate path parameter
  const validationResult = deletePressReviewParamsSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid id parameter",
        errors: validationResult.error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { id } = validationResult.data;

  // Step 2: Call service to delete press review
  const service = new PressReviewService(locals.supabase);

  try {
    const result = await service.deletePressReview(id, DEFAULT_USER_ID);

    // Step 3: Return appropriate response based on result
    if (!result.success) {
      // Resource not found or doesn't belong to user
      return new Response(
        JSON.stringify({
          message: "Press review not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Step 4: Handle unexpected errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      return new Response(
        JSON.stringify({
          message: "Database error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Unexpected error type
    // eslint-disable-next-line no-console
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
