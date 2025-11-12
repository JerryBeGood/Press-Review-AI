import type { APIRoute } from "astro";

import {
  deletePressReviewParamsSchema,
  updatePressReviewParamsSchema,
  updatePressReviewSchema,
} from "../../../lib/schemas/api.schemas";
import { PressReviewService } from "../../../lib/services/pressReviewService";

export const prerender = false;

/**
 * PATCH /api/press_reviews/:id
 * Updates an existing press review for the authenticated user
 * Returns 200 OK with the updated press review
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Validate path parameters
  const paramsValidationResult = updatePressReviewParamsSchema.safeParse(params);
  if (!paramsValidationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid press review ID",
        errors: paramsValidationResult.error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { id } = paramsValidationResult.data;

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

  const validationResult = updatePressReviewSchema.safeParse(requestBody);
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

  const updateData = validationResult.data;

  // Step 4: Call service to update press review
  const service = new PressReviewService(locals.supabase);

  try {
    const pressReview = await service.updatePressReview(id, updateData, locals.user.id);

    return new Response(JSON.stringify(pressReview), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 4: Map service errors to HTTP responses
    if (error instanceof Error) {
      switch (error.message) {
        case "NOT_FOUND":
          return new Response(
            JSON.stringify({
              message: "Press review not found or you do not have permission to update it",
            }),
            {
              status: 404,
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
 * DELETE /api/press_reviews/:id
 * Deletes an existing press review by id for the authenticated user
 * Returns 204 No Content on success, 404 Not Found if resource doesn't exist or doesn't belong to user
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

  // Step 3: Call service to delete press review
  const service = new PressReviewService(locals.supabase);

  try {
    const result = await service.deletePressReview(id, locals.user.id);

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
