import type { SupabaseClient } from "../../db/supabase.client";
import type { CreatePressReviewCmd, PressReviewDTO } from "../../types";

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

    // Return without user_id (as per DTO definition)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...pressReviewWithoutUserId } = newPressReview;

    return pressReviewWithoutUserId;
  }

  /**
   * Deletes a press review by id for a specific user
   *
   * Business logic:
   * 1. Attempts to delete a press review matching both id and userId
   * 2. Ensures users can only delete their own resources
   * 3. Returns success status based on whether a record was deleted
   *
   * @param id - UUID of the press review to delete
   * @param userId - UUID of the authenticated user
   * @returns Object with success flag indicating if the resource was deleted
   */
  async deletePressReview(id: string, userId: string): Promise<{ success: boolean }> {
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
}
