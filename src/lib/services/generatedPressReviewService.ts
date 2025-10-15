import type { SupabaseClient } from "../../db/supabase.client";
import type { GeneratedPressReviewDetailDTO } from "../../types";

/**
 * Service for managing generated press reviews
 * Handles business logic for on-demand generation requests
 */
export class GeneratedPressReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new on-demand generation job for a press review
   *
   * Business logic checks:
   * 1. Verifies that the parent press_review exists and is active (is_active = true)
   * 2. Confirms that the authenticated user is the owner of the press_review
   * 3. Checks for any other pending generations for the same press_review_id to prevent duplicates
   *
   * @param pressReviewId - UUID of the press review to generate content for
   * @param userId - UUID of the authenticated user
   * @returns The newly created generation job with status 'pending'
   * @throws Error with specific message for different failure scenarios
   */
  async createOnDemandGeneration(pressReviewId: string, userId: string): Promise<GeneratedPressReviewDetailDTO> {
    // Step 1: Verify press_review exists, is active, and user is the owner
    const { data: pressReview, error: pressReviewError } = await this.supabase
      .from("press_reviews")
      .select("id, is_active, user_id")
      .eq("id", pressReviewId)
      .single();

    if (pressReviewError || !pressReview) {
      throw new Error("NOT_FOUND");
    }

    // Check if press_review is owned by the user
    if (pressReview.user_id !== userId) {
      throw new Error("NOT_FOUND"); // Don't leak information about existence
    }

    // Check if press_review is active
    if (!pressReview.is_active) {
      throw new Error("NOT_FOUND"); // Don't leak information about inactive reviews
    }

    // Step 2: Check for existing pending generations
    const { data: existingPending, error: pendingError } = await this.supabase
      .from("generated_press_reviews")
      .select("id, status")
      .eq("press_review_id", pressReviewId)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) {
      // eslint-disable-next-line no-console
      console.error("Error checking for pending generations:", pendingError);
      throw new Error("DATABASE_ERROR");
    }

    if (existingPending) {
      throw new Error("CONFLICT");
    }

    // Step 3: Create new generation record with pending status
    const { data: newGeneration, error: insertError } = await this.supabase
      .from("generated_press_reviews")
      .insert({
        press_review_id: pressReviewId,
        user_id: userId,
        status: "pending",
        content: null,
        generated_at: null,
        generation_log_id: null,
      })
      .select()
      .single();

    if (insertError || !newGeneration) {
      // eslint-disable-next-line no-console
      console.error("Error creating generation record:", insertError);
      throw new Error("DATABASE_ERROR");
    }

    // Return without user_id (as per DTO definition)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...generationWithoutUserId } = newGeneration;

    return generationWithoutUserId;
  }
}
