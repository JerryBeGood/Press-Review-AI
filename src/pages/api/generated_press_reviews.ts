import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { createGeneratedPressReviewSchema, getGeneratedPressReviewsQuerySchema } from "../../lib/schemas/api.schemas";
import { GeneratedPressReviewService } from "../../lib/services/generatedPressReviewService";

export const prerender = false;

/**
 * POST /api/generated_press_reviews
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
    const generationJob = await service.triggerGeneration(press_review_id, DEFAULT_USER_ID);

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

/**
 * GET /api/generated_press_reviews
 * Retrieves all generated press reviews for the authenticated user
 * Supports optional filtering by press_review_id and status
 * Supports optional include_topic parameter to join with press_reviews table
 * Returns 200 OK with a list of generated press reviews and count
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate query parameters
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

    // Step 2: Initialize service with Supabase client from middleware
    const service = new GeneratedPressReviewService(locals.supabase);

    // Step 3: Get generated press reviews with optional filters
    // Use method with topic join if include_topic is true
    const result = include_topic
      ? await service.getGeneratedPressReviewsWithTopic(DEFAULT_USER_ID, {
          pressReviewId: press_review_id,
          status,
        })
      : await service.getGeneratedPressReviews(DEFAULT_USER_ID, {
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
    // eslint-disable-next-line no-console
    console.error("[GET /api/generated_press_reviews] Error:", error);

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

    // Unexpected error
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
