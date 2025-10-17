import { PressReviewService } from "../../../lib/services/pressReviewService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { validateTopicSchema } from "../../../lib/schemas/api.schemas";
import type { APIRoute } from "astro";
import type { ValidateTopicCmd } from "../../../types";

export const prerender = false;

/**
 * POST /api/press_reviews/validate_topic
 *
 * Validates a press review topic using an AI agent (in dev returns static response)
 *
 * @returns 200 OK with ValidateTopicResultDTO or 400 Bad Request with error message
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body: ValidateTopicCmd = await request.json();

    // Validate input with Zod schema
    const result = validateTopicSchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.issues[0]?.message || "Invalid input" }), {
        status: 400,
      });
    }

    // Use a constant user ID in development
    const userId = DEFAULT_USER_ID;

    // Call service to validate topic
    const pressReviewService = new PressReviewService(locals.supabase);
    const validationResult = await pressReviewService.validateTopic(body.topic, userId);

    // Return validation result
    return new Response(JSON.stringify(validationResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error validating topic:", error);

    // Return generic server error
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
