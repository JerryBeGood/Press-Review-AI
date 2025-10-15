import { z } from "zod";

/**
 * Validation schema for POST /api/generated-press-reviews
 * Ensures press_review_id is a valid UUID
 */
export const createGeneratedPressReviewSchema = z.object({
  press_review_id: z.string().uuid({ message: "press_review_id must be a valid UUID" }),
});

export type CreateGeneratedPressReviewInput = z.infer<typeof createGeneratedPressReviewSchema>;
