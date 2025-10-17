import { isValidCron } from "cron-validator";
import { z } from "zod";

const uuidSchema = z.string().uuid({ message: "Must be a valid UUID" });

/**
 * Validation schema for POST /api/press_reviews/validate_topic
 * Simple validation for topic string
 */
export const validateTopicSchema = z.object({
  topic: z.string(),
});

export type ValidateTopicInput = z.infer<typeof validateTopicSchema>;

/**
 * Validation schema for POST /api/generated-press-reviews
 * Ensures press_review_id is a valid UUID
 */
export const createGeneratedPressReviewSchema = z.object({
  press_review_id: uuidSchema,
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

/**
 * Validation schema for DELETE /api/press-reviews/:id
 * Validates that the id parameter is a valid UUID
 */
export const deletePressReviewParamsSchema = z.object({
  id: uuidSchema,
});

export type DeletePressReviewParams = z.infer<typeof deletePressReviewParamsSchema>;

/**
 * Validation schema for PATCH /api/press-reviews/:id
 * Validates that the id parameter is a valid UUID
 */
export const updatePressReviewParamsSchema = z.object({
  id: uuidSchema,
});

export type UpdatePressReviewParams = z.infer<typeof updatePressReviewParamsSchema>;

/**
 * Validation schema for PATCH /api/press-reviews/:id body
 * Validates topic (optional string) and schedule (optional CRON format)
 * At least one field must be present
 */
export const updatePressReviewSchema = z
  .object({
    topic: z.string().optional(),
    schedule: z
      .string()
      .refine((val) => isValidCron(val), {
        message: "Schedule must be a valid CRON expression (e.g., '0 9 * * *')",
      })
      .optional(),
  })
  .refine((data) => data.topic !== undefined || data.schedule !== undefined, {
    message: "At least one field (topic or schedule) must be provided",
  });

export type UpdatePressReviewInput = z.infer<typeof updatePressReviewSchema>;
