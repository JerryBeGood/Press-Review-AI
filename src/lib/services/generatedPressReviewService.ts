import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GeneratedPressReviewDetailDTO,
  GeneratedPressReviewsListDTO,
  GeneratedPressReviewsListWithTopicDTO,
  GenerationStatus,
} from "../../types";

/**
 * Service for managing generated press reviews
 * Handles business logic for on-demand generation requests
 */
export class GeneratedPressReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a generation job for a press review
   *
   * Business logic checks:
   * 1. Verifies that the parent press_review exists
   * 2. Confirms that the authenticated user is the owner of the press_review
   * 3. Checks for any other pending generations for the same press_review_id to prevent duplicates
   *
   * @param pressReviewId - UUID of the press review to generate content for
   * @param userId - UUID of the authenticated user
   * @returns The newly created generation job with status 'pending'
   * @throws Error with specific message for different failure scenarios
   */
  async triggerGeneration(pressReviewId: string, userId: string): Promise<GeneratedPressReviewDetailDTO> {
    // Step 1: Verify press_review exists and user is the owner
    const { data: pressReview, error: pressReviewError } = await this.supabase
      .from("press_reviews")
      .select("id, user_id")
      .eq("id", pressReviewId)
      .single();

    if (pressReviewError || !pressReview) {
      throw new Error("NOT_FOUND");
    }

    // Check if press_review is owned by the user
    if (pressReview.user_id !== userId) {
      throw new Error("NOT_FOUND"); // Don't leak information about existence
    }

    // Step 2: Check for existing pending generations
    const { data: existingPending, error: pendingError } = await this.supabase
      .from("generated_press_reviews")
      .select("id, status")
      .eq("press_review_id", pressReviewId)
      .in("status", ["pending", "generating_queries", "researching_sources", "synthesizing_content"])
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

  /**
   * Retrieves generated press reviews for a user with optional filters
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with count
   * @throws Error with "DATABASE_ERROR" message if query fails
   */
  async getGeneratedPressReviews(
    userId: string,
    filters?: {
      pressReviewId?: string;
      status?: GenerationStatus;
    }
  ): Promise<GeneratedPressReviewsListDTO> {
    try {
      // Build query with user filter
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content", { count: "exact" })
        .eq("user_id", userId)
        .order("generated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });

      // Apply optional filters
      if (filters?.pressReviewId) {
        query = query.eq("press_review_id", filters.pressReviewId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching generated press reviews:", error);
        throw new Error("DATABASE_ERROR");
      }

      // Return data without user_id (as per DTO definition)
      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a known error
      if (error instanceof Error && error.message === "DATABASE_ERROR") {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviews:", error);
      throw new Error("DATABASE_ERROR");
    }
  }

  /**
   * Retrieves generated press reviews with topic for a user with optional filters
   * Includes topic from the parent press_reviews table via JOIN
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with topic and count
   * @throws Error with "DATABASE_ERROR" message if query fails
   */
  async getGeneratedPressReviewsWithTopic(
    userId: string,
    filters?: {
      pressReviewId?: string;
      status?: GenerationStatus;
    }
  ): Promise<GeneratedPressReviewsListWithTopicDTO> {
    try {
      // Build query with user filter and join to press_reviews for topic
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content, press_reviews!inner(topic)", { count: "exact" })
        .eq("user_id", userId)
        .order("generated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });

      // Apply optional filters
      if (filters?.pressReviewId) {
        query = query.eq("press_review_id", filters.pressReviewId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching generated press reviews with topic:", error);
        throw new Error("DATABASE_ERROR");
      }

      // Return data without user_id (as per DTO definition)
      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a known error
      if (error instanceof Error && error.message === "DATABASE_ERROR") {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviewsWithTopic:", error);
      throw new Error("DATABASE_ERROR");
    }
  }
}
