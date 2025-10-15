import { isValidCron } from "cron-validator";
import { z } from "zod";

/**
 * Validation schema for POST /api/generated-press-reviews
 * Ensures press_review_id is a valid UUID
 */
export const createGeneratedPressReviewSchema = z.object({
  press_review_id: z.string().uuid({ message: "press_review_id must be a valid UUID" }),
});

export type CreateGeneratedPressReviewInput = z.infer<typeof createGeneratedPressReviewSchema>;

/**
 * Validation schema for POST /api/press-reviews
 * Validates topic (string) and schedule (CRON format)
 *
 * Note: Topic validation will be enhanced with a custom validator in the future
 */
export const createPressReviewSchema = z.object({
  topic: z.string(),
  schedule: z.string().refine((val) => isValidCron(val), {
    message: "Schedule must be a valid CRON expression (e.g., '0 9 * * *')",
  }),
});

export type CreatePressReviewInput = z.infer<typeof createPressReviewSchema>;
