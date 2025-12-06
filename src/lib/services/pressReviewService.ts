import type { SupabaseClient } from "../../db/supabase.client";
import type { Tables } from "../../db/database.types";
import type {
  CreatePressReviewCmd,
  PressReviewDTO,
  PressReviewsListDTO,
  UpdatePressReviewCmd,
  ValidateTopicResultDTO,
} from "../../types";
import { ServiceError } from "../errors";

// Type alias for database row
type PressReviewRow = Tables<"press_reviews">;

/**
 * Service for managing press reviews
 * Handles business logic for creating, updating, and retrieving press reviews
 */
export class PressReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Maps a database row to a PressReviewDTO
   * Removes user_id and returns only the fields defined in the DTO
   */
  private mapToDTO(row: Omit<PressReviewRow, "user_id">): PressReviewDTO {
    return {
      id: row.id,
      topic: row.topic,
      schedule: row.schedule,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Checks if a database error is due to the limit constraint
   * Database returns error code "LIMIT_EXCEEDED" from trigger
   */
  private isLimitError(error: { message?: string }): boolean {
    return error.message === "LIMIT_EXCEEDED";
  }

  /**
   * Checks if a database error is due to duplicate topic constraint
   * Database returns error code "DUPLICATE_TOPIC" from trigger
   */
  private isDuplicateTopicError(error: { message?: string }): boolean {
    return error.message === "DUPLICATE_TOPIC";
  }

  /**
   * Creates a new press review for a user
   *
   * Business logic:
   * 1. Inserts a new press_review record with the provided topic and schedule
   * 2. The database trigger enforces the limit of 5 press reviews per user
   * 3. Returns the newly created press review without exposing user_id
   *
   * @param cmd - Command object containing topic and schedule
   * @param userId - UUID of the authenticated user
   * @returns The newly created press review as PressReviewDTO
   * @throws Error with specific message for different failure scenarios
   */
  async createPressReview(cmd: CreatePressReviewCmd, userId: string): Promise<PressReviewDTO> {
    // Insert new press review - select only the fields we need
    const { data: newPressReview, error: insertError } = await this.supabase
      .from("press_reviews")
      .insert({
        user_id: userId,
        topic: cmd.topic,
        schedule: cmd.schedule,
      })
      .select("id, topic, schedule, created_at, updated_at")
      .single();

    if (insertError) {
      // Check if error is due to the trigger enforcing the limit
      if (this.isLimitError(insertError)) {
        throw new ServiceError("LIMIT_EXCEEDED", "Cannot have more than 5 press reviews", insertError);
      }

      // Check if error is due to duplicate topic for the same user (trigger)
      if (this.isDuplicateTopicError(insertError)) {
        throw new ServiceError("DUPLICATE_TOPIC", "A press review with this topic already exists", insertError);
      }

      // Log unexpected database errors
      // eslint-disable-next-line no-console
      console.error("Error creating press review:", insertError);
      throw new ServiceError("DATABASE_ERROR", "Failed to create press review", insertError);
    }

    if (!newPressReview) {
      throw new ServiceError("DATABASE_ERROR", "Failed to create press review: no data returned");
    }

    // Schedule the cron job for this press review
    const { error: scheduleError } = await this.supabase.rpc("schedule_press_review", {
      review_id: newPressReview.id,
      schedule_expression: newPressReview.schedule,
    });

    if (scheduleError) {
      // eslint-disable-next-line no-console
      console.error("Error scheduling press review:", scheduleError);
      throw new ServiceError("SCHEDULING_ERROR", "Failed to schedule press review generation", scheduleError);
    }

    // Map to DTO using the helper method
    return this.mapToDTO(newPressReview);
  }

  /**
   * Updates an existing press review by id for a specific user
   *
   * Business logic:
   * 1. Updates a press review matching both id and userId
   * 2. Ensures users can only update their own resources
   * 3. Only updates fields that are provided in the command object
   * 4. Returns the updated press review without exposing user_id
   *
   * @param id - UUID of the press review to update
   * @param cmd - Command object containing optional topic and/or schedule
   * @param userId - UUID of the authenticated user
   * @returns The updated press review as PressReviewDTO
   * @throws Error with specific message for different failure scenarios
   */
  async updatePressReview(id: string, cmd: UpdatePressReviewCmd, userId: string): Promise<PressReviewDTO> {
    // Build update object with only provided fields
    const updateData: Partial<{ topic: string; schedule: string }> = {};

    if (cmd.topic !== undefined) {
      updateData.topic = cmd.topic;
    }

    if (cmd.schedule !== undefined) {
      updateData.schedule = cmd.schedule;
    }

    // Update press review - select only the fields we need
    const { data: updatedPressReview, error: updateError } = await this.supabase
      .from("press_reviews")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, topic, schedule, created_at, updated_at")
      .single();

    if (updateError) {
      // Check if error is due to duplicate topic for the same user (trigger)
      if (this.isDuplicateTopicError(updateError)) {
        throw new ServiceError("DUPLICATE_TOPIC", "A press review with this topic already exists", updateError);
      }

      // Check if error is due to record not found (PostgREST error code)
      if (updateError.code === "PGRST116") {
        throw new ServiceError("NOT_FOUND", "Press review not found or access denied", updateError);
      }

      // Log unexpected database errors
      // eslint-disable-next-line no-console
      console.error("Error updating press review:", updateError);
      throw new ServiceError("DATABASE_ERROR", "Failed to update press review", updateError);
    }

    if (!updatedPressReview) {
      throw new ServiceError("NOT_FOUND", "Press review not found or access denied");
    }

    // If schedule was updated, reschedule the cron job
    if (cmd.schedule !== undefined) {
      const { error: scheduleError } = await this.supabase.rpc("schedule_press_review", {
        review_id: updatedPressReview.id,
        schedule_expression: updatedPressReview.schedule,
      });

      if (scheduleError) {
        // eslint-disable-next-line no-console
        console.error("Error rescheduling press review:", scheduleError);
        throw new ServiceError("SCHEDULING_ERROR", "Failed to reschedule press review generation", scheduleError);
      }
    }

    // Map to DTO using the helper method
    return this.mapToDTO(updatedPressReview);
  }

  /**
   * Deletes a press review by id for a specific user
   *
   * Business logic:
   * 1. Unschedules the cron job before deletion
   * 2. Attempts to delete a press review matching both id and userId
   * 3. Ensures users can only delete their own resources
   * 4. Returns success status based on whether a record was deleted
   *
   * @param id - UUID of the press review to delete
   * @param userId - UUID of the authenticated user
   * @returns Object with success flag indicating if the resource was deleted
   */
  async deletePressReview(id: string, userId: string): Promise<{ success: boolean }> {
    // Unschedule the cron job before deleting the press review
    const { error: unscheduleError } = await this.supabase.rpc("unschedule_press_review", {
      review_id: id,
    });

    if (unscheduleError) {
      // eslint-disable-next-line no-console
      console.error("Error unscheduling press review:", unscheduleError);
      throw new ServiceError("UNSCHEDULING_ERROR", "Failed to unschedule press review generation", unscheduleError);
    }

    const { error, count } = await this.supabase
      .from("press_reviews")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting press review:", error);
      throw new ServiceError("DATABASE_ERROR", "Failed to delete press review", error);
    }

    // If count is 0 or null, no record was deleted
    return { success: (count ?? 0) > 0 };
  }

  /**
   * Retrieves all press reviews for a specific user
   *
   * Business logic:
   * 1. Fetches all press_reviews records for the given userId
   * 2. Returns list with count (max 5 press reviews per user)
   * 3. Removes user_id from results to match PressReviewDTO
   *
   * @param userId - UUID of the authenticated user
   * @returns List of press reviews with total count
   * @throws Error with specific message for database failures
   */
  async getPressReviews(userId: string): Promise<PressReviewsListDTO> {
    // Select only the fields we need for the DTO (no user_id)
    const { data, error, count } = await this.supabase
      .from("press_reviews")
      .select("id, topic, schedule, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching press reviews:", error);
      throw new ServiceError("DATABASE_ERROR", "Failed to fetch press reviews", error);
    }

    // Map rows to DTOs
    const pressReviews: PressReviewDTO[] = (data || []).map((row) => this.mapToDTO(row));

    return {
      data: pressReviews,
      count: count || 0,
    };
  }

  /**
   * Validates a press review topic
   * @param topic - The topic to validate
   * @param userId - UUID of the authenticated user (for future AI agent context)
   * @returns Validation result with is_valid flag and suggestions array
   */
  async validateTopic(topic: string): Promise<ValidateTopicResultDTO> {
    const trimmed = topic.trim();
    const suggestions: string[] = [];

    // 1. Length constraints
    if (trimmed.length < 3) {
      return { is_valid: false, suggestions: ["Topic must be at least 3 characters"] };
    }

    if (trimmed.length > 50) {
      suggestions.push("Topic is too long - keep it short and focused");
    }

    // 2. Word count (3-4 words max)
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    if (words.length > 4) {
      suggestions.push("Topic should be maximum 4 words (e.g., 'Artificial Intelligence Healthcare')");
    }

    // 3. PROMPT INJECTION PATTERNS

    // Block instruction keywords
    const instructionPatterns = [
      /ignore/i,
      /disregard/i,
      /forget/i,
      /override/i,
      /system[\s:]*/i,
      /assistant[\s:]*/i,
      /prompt[\s:]*/i,
      /instruction/i,
      /command/i,
      /\bAI\b.*\b(say|respond|answer|tell)/i,
    ];

    for (const pattern of instructionPatterns) {
      if (pattern.test(trimmed)) {
        return {
          is_valid: false,
          suggestions: ["Topic contains invalid instruction keywords - use simple noun phrases"],
        };
      }
    }

    // Block role-playing attempts
    if (/\b(you are|act as|pretend|roleplay)/i.test(trimmed)) {
      return {
        is_valid: false,
        suggestions: ["Topic should be a subject, not an instruction"],
      };
    }

    // Block various dangerous patterns
    const characterChecks = [
      {
        pattern: /[<>{}[\]()\\|`~#$%^*_+=]/,
        message: "Remove special characters - use only letters, numbers, spaces, and basic punctuation (-, &, ')",
      },
      { pattern: /["']/, message: "Remove quotation marks" },
      { pattern: /[:;]/, message: "Remove colons and semicolons" },
      { pattern: /[.!?]{2,}/, message: "Remove excessive punctuation" },
      { pattern: /[\n\r\t]/, message: "Remove line breaks and special characters" },
    ];

    for (const check of characterChecks) {
      if (check.pattern.test(trimmed)) {
        suggestions.push(check.message);
      }
    }

    // 4. SEMANTIC CHECKS

    // Must contain at least one real word (2+ letters)
    const hasRealWord = words.some((w) => /^[A-Za-z]{2,}$/.test(w));
    if (!hasRealWord) {
      suggestions.push("Topic must contain at least one meaningful word");
    }

    // Should be mostly letters
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const ratio = letterCount / trimmed.length;
    if (ratio < 0.6) {
      suggestions.push("Topic should be primarily text-based");
    }

    // Whitelist approach: only allow safe characters
    if (!/^[a-zA-Z0-9\s\-&.'/]+$/.test(trimmed)) {
      suggestions.push("Use only letters, numbers, spaces, hyphens, ampersands, periods, and apostrophes");
    }

    return {
      is_valid: suggestions.length === 0,
      suggestions,
    };
  }
}
