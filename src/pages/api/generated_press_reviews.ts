import type { APIRoute } from "astro";

import { handleServiceError } from "../../lib/apiErrorHandler";
import { createGeneratedPressReviewSchema, getGeneratedPressReviewsQuerySchema } from "../../lib/schemas/api.schemas";
import { GeneratedPressReviewService } from "../../lib/services/generatedPressReviewService";

export const prerender = false;

/**
 * POST /api/generated_press_reviews
 * Triggers generation of a press review
 * Returns 202 Accepted with a pending generation job
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

  // Step 3: Call service to create generation job
  const service = new GeneratedPressReviewService(locals.supabase);

  try {
    const generationJob = await service.requestGenerationJob(press_review_id, locals.user.id);

    return new Response(JSON.stringify(generationJob), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Map service errors to HTTP responses
    return handleServiceError(error);
  }
};

/**
 * GET /api/generated_press_reviews
 * Retrieves all generated press reviews for the authenticated user
 * Supports optional filtering by press_review_id and status
 * Supports optional include_topic parameter to join with press_reviews table
 * Returns 200 OK with a list of generated press reviews and count
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      press_review_id: url.searchParams.get("press_review_id") || undefined,
      status: url.searchParams.get("status") || undefined,
      include_topic: url.searchParams.get("include_topic") || undefined,
    };

    const validationResult = getGeneratedPressReviewsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid query parameters",
          errors: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { press_review_id, status, include_topic } = validationResult.data;

    // Step 3: Initialize service with Supabase client from middleware
    const service = new GeneratedPressReviewService(locals.supabase);

    // Step 4: Get generated press reviews with optional filters
    // Use method with topic join if include_topic is true
    const result = include_topic
      ? await service.getGeneratedPressReviewsWithTopic(locals.user.id, {
          pressReviewId: press_review_id,
          status,
        })
      : await service.getGeneratedPressReviews(locals.user.id, {
          pressReviewId: press_review_id,
          status,
        });

    // Step 4: Return successful response with data and count
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Step 5: Handle errors
    return handleServiceError(error);
  }
};
