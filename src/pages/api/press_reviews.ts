import type { APIRoute } from "astro";

import { handleServiceError } from "../../lib/apiErrorHandler";
import { createPressReviewSchema } from "../../lib/schemas/api.schemas";
import { PressReviewService } from "../../lib/services/pressReviewService";

export const prerender = false;

/**
 * POST /api/press_reviews
 * Creates a new press review for the authenticated user
 * Returns 201 Created with the newly created press review
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Parse and validate request body
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

  // Step 3: Call service to create press review
  const service = new PressReviewService(locals.supabase);

  try {
    const pressReview = await service.createPressReview({ topic, schedule }, locals.user.id);

    return new Response(JSON.stringify(pressReview), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Map service errors to HTTP responses
    return handleServiceError(error);
  }
};

/**
 * GET /api/press_reviews
 * Retrieves all press reviews for the authenticated user
 * Returns 200 OK with a list of press reviews and count
 */
export const GET: APIRoute = async ({ locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 2: Initialize service with Supabase client from middleware
    const service = new PressReviewService(locals.supabase);

    // Step 3: Get all press reviews for the authenticated user
    const result = await service.getPressReviews(locals.user.id);

    // Step 3: Return successful response with data and count
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Step 4: Handle errors
    return handleServiceError(error);
  }
};
