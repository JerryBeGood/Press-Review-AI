import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { createPressReviewSchema } from "../../lib/schemas/api.schemas";
import { PressReviewService } from "../../lib/services/pressReviewService";

export const prerender = false;

/**
 * POST /api/press_reviews
 * Creates a new press review for the authenticated user
 * Returns 201 Created with the newly created press review
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

  const validationResult = createPressReviewSchema.safeParse(requestBody);
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

  const { topic, schedule } = validationResult.data;

  // Step 2: Call service to create press review
  const service = new PressReviewService(locals.supabase);

  try {
    const pressReview = await service.createPressReview({ topic, schedule }, DEFAULT_USER_ID);

    return new Response(JSON.stringify(pressReview), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Map service errors to HTTP responses
    if (error instanceof Error) {
      switch (error.message) {
        case "LIMIT_EXCEEDED":
          return new Response(
            JSON.stringify({
              message: "User cannot have more than 5 press reviews",
            }),
            {
              status: 403,
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
        case "DUPLICATE_TOPIC":
          return new Response(
            JSON.stringify({
              message: "Press review with the same topic already exists",
            }),
            {
              status: 409,
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
