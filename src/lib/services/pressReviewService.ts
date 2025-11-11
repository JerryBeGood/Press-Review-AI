import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreatePressReviewCmd,
  PressReviewDTO,
  PressReviewsListDTO,
  UpdatePressReviewCmd,
  ValidateTopicResultDTO,
} from "../../types";

/**
 * Service for managing press reviews
 * Handles business logic for creating, updating, and retrieving press reviews
 */
export class PressReviewService {
  constructor(private supabase: SupabaseClient) {}

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
    // Insert new press review
    const { data: newPressReview, error: insertError } = await this.supabase
      .from("press_reviews")
      .insert({
        user_id: userId,
        topic: cmd.topic,
        schedule: cmd.schedule,
      })
      .select()
      .single();

    if (insertError) {
      // Check if error is due to the trigger enforcing the limit
      if (insertError.message.includes("cannot have more than 5 press reviews")) {
        throw new Error("LIMIT_EXCEEDED");
      }

      // Check if error is due to duplicate topic for the same user (trigger)
      if (insertError.message.includes("already has a press review with topic")) {
        throw new Error("DUPLICATE_TOPIC");
      }

      // Log unexpected database errors
      // eslint-disable-next-line no-console
      console.error("Error creating press review:", insertError);
      throw new Error("DATABASE_ERROR");
    }

    if (!newPressReview) {
      throw new Error("DATABASE_ERROR");
    }

    // Schedule the cron job for this press review
    const { error: scheduleError } = await this.supabase.rpc("schedule_press_review", {
      review_id: newPressReview.id,
      schedule_expression: newPressReview.schedule,
    });

    if (scheduleError) {
      // eslint-disable-next-line no-console
      console.error("Error scheduling press review:", scheduleError);
      throw new Error("SCHEDULING_ERROR");
    }

    // Return without user_id (as per DTO definition)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...pressReviewWithoutUserId } = newPressReview;

    return pressReviewWithoutUserId;
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
    const updateData: Partial<{ topic: string; schedule: string; updated_at: string }> = {};

    if (cmd.topic !== undefined) {
      updateData.topic = cmd.topic;
    }

    if (cmd.schedule !== undefined) {
      updateData.schedule = cmd.schedule;
    }

    // Update press review
    const { data: updatedPressReview, error: updateError } = await this.supabase
      .from("press_reviews")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      // Check if error is due to duplicate topic for the same user (trigger)
      if (updateError.message.includes("already has a press review with topic")) {
        throw new Error("DUPLICATE_TOPIC");
      }

      // Check if error is due to record not found
      if (updateError.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }

      // Log unexpected database errors
      // eslint-disable-next-line no-console
      console.error("Error updating press review:", updateError);
      throw new Error("DATABASE_ERROR");
    }

    if (!updatedPressReview) {
      throw new Error("NOT_FOUND");
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
        throw new Error("SCHEDULING_ERROR");
      }
    }

    // Return without user_id (as per DTO definition)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...pressReviewWithoutUserId } = updatedPressReview;

    return pressReviewWithoutUserId;
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
      throw new Error("UNSCHEDULING_ERROR");
    }

    const { error, count } = await this.supabase
      .from("press_reviews")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting press review:", error);
      throw new Error("DATABASE_ERROR");
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
    const { data, error, count } = await this.supabase
      .from("press_reviews")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching press reviews:", error);
      throw new Error("DATABASE_ERROR");
    }

    // Remove user_id from results to match PressReviewDTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pressReviews: PressReviewDTO[] = (data || []).map(({ user_id, ...rest }) => rest);

    return {
      data: pressReviews,
      count: count || 0,
    };
  }

  /**
   * Validates a press review topic
   *
   * In development phase, this always returns a static success response.
   * In production, this would use AI agent to validate the topic.
   *
   * @param topic - The topic to validate
   * @param userId - UUID of the authenticated user (for future AI agent context)
   * @returns Validation result with is_valid flag and suggestions array
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateTopic(_topic: string, _userId: string): Promise<ValidateTopicResultDTO> {
    // Currently returns a static response in development phase
    // AI validation to be implemented in production
    return {
      is_valid: true,
      suggestions: [],
    };
  }
}
