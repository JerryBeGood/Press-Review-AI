import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { createGeneratedPressReviewSchema } from "../../lib/schemas/api.schemas";
import { GeneratedPressReviewService } from "../../lib/services/generatedPressReviewService";

export const prerender = false;

/**
 * POST /api/generated-press-reviews
 * Triggers on-demand generation of a press review
 * Returns 202 Accepted with a pending generation job
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Parse and validate request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = createGeneratedPressReviewSchema.safeParse(requestBody);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid request body",
        errors: validationResult.error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { press_review_id } = validationResult.data;

  // Step 2: Call service to create generation job
  const service = new GeneratedPressReviewService(locals.supabase);

  try {
    const generationJob = await service.createOnDemandGeneration(press_review_id, DEFAULT_USER_ID);

    return new Response(JSON.stringify(generationJob), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Map service errors to HTTP responses
    if (error instanceof Error) {
      switch (error.message) {
        case "NOT_FOUND":
          return new Response(
            JSON.stringify({
              message: "Press review not found or inactive",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        case "CONFLICT":
          return new Response(
            JSON.stringify({
              message: "A generation for this press review is already in progress",
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }
          );
        case "DATABASE_ERROR":
          return new Response(
            JSON.stringify({
              message: "Database error occurred",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        default:
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
    }

    // Unexpected error type
    // eslint-disable-next-line no-console
    console.error("Unexpected error type:", error);
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
