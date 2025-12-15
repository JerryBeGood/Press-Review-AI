import type { APIRoute } from "astro";

import { handleServiceError } from "../../../lib/apiErrorHandler";
import {
  deleteGeneratedPressReviewParamsSchema,
  retryGeneratedPressReviewParamsSchema,
} from "../../../lib/schemas/api.schemas";
import { GeneratedPressReviewService } from "../../../lib/services/generatedPressReviewService";
import type { DeleteGeneratedPressReviewResponse, RetryGeneratedPressReviewResponse } from "../../../types/api";

export const prerender = false;

/**
 * DELETE /api/generated-press-reviews/:id
 * Deletes a generated press review by id for the authenticated user
 * Returns 200 OK with success response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Validate path parameter
  const validationResult = deleteGeneratedPressReviewParamsSchema.safeParse(params);

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

  // Step 3: Call service to delete generated press review
  const service = new GeneratedPressReviewService(locals.supabase);

  try {
    await service.deleteGeneratedPressReview(id, locals.user.id);

    // Success - return 200 OK with success response
    const response: DeleteGeneratedPressReviewResponse = {
      success: true,
      deletedId: id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 4: Handle errors
    return handleServiceError(error);
  }
};

/**
 * POST /api/generated-press-reviews/:id?action=retry
 * Retries a failed generation by deleting the old record and creating a new one
 * Returns 200 OK with the new generation job
 */
export const POST: APIRoute = async ({ params, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Validate path parameter
  const validationResult = retryGeneratedPressReviewParamsSchema.safeParse(params);

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

  // Step 3: Call service to retry generation
  const service = new GeneratedPressReviewService(locals.supabase);

  try {
    const newReview = await service.retryGeneratedPressReview(id, locals.user.id);

    // Success - return 200 OK with new review
    const response: RetryGeneratedPressReviewResponse = {
      success: true,
      oldReviewId: id,
      newReview,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 4: Handle errors
    return handleServiceError(error);
  }
};
