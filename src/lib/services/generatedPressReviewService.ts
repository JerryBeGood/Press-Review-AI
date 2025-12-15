import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GeneratedPressReviewDTO,
  GeneratedPressReviewDetailDTO,
  GeneratedPressReviewsListDTO,
  GeneratedPressReviewsListWithTopicDTO,
  GeneratedPressReviewWithTopicDTO,
  GenerationStatus,
  PressReviewContent,
} from "../../types";
import { ServiceError } from "../errors";

/**
 * Service for managing generated press reviews
 * Handles business logic for on-demand generation requests
 */
export class GeneratedPressReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Maps a database row to a GeneratedPressReviewDTO
   * Handles the discriminated union by checking the status
   * Accepts only the fields we select from the database (not full row)
   */
  private mapToDTO(row: {
    id: string;
    press_review_id: string;
    generated_at: string | null;
    status: GenerationStatus;
    content: unknown;
    error: string | null;
  }): GeneratedPressReviewDTO {
    const base = {
      id: row.id,
      press_review_id: row.press_review_id,
      generated_at: row.generated_at,
    };

    // Handle discriminated union based on status
    if (row.status === "success") {
      return {
        ...base,
        status: "success",
        content: row.content as PressReviewContent, // Safe cast: content is required for success
        error: null,
      };
    }

    if (row.status === "failed") {
      return {
        ...base,
        status: "failed",
        content: null,
        error: row.error,
      };
    }

    // Pending states: pending, generating_queries, researching_sources, synthesizing_content
    return {
      ...base,
      status: row.status,
      content: null,
      error: null,
    };
  }

  /**
   * Maps a database row with topic relation to GeneratedPressReviewWithTopicDTO
   */
  private mapToDTOWithTopic(row: {
    id: string;
    press_review_id: string;
    generated_at: string | null;
    status: GenerationStatus;
    content: unknown;
    error: string | null;
    press_reviews: { topic: string } | null;
  }): GeneratedPressReviewWithTopicDTO {
    const baseDTO = this.mapToDTO(row);
    return {
      ...baseDTO,
      press_reviews: row.press_reviews,
    };
  }

  /**
   * Helper to check if error is due to generation limit trigger
   */
  private isGenerationLimitError(error: { message?: string }): boolean {
    return error?.message === "GENERATION_LIMIT_EXCEEDED";
  }

  /**
   * Creates a generation job for a press review
   *
   * Business logic checks:
   * 1. Verifies that the parent press_review exists
   * 2. Confirms that the authenticated user is the owner of the press_review
   * 3. Checks for any other pending generations for the same press_review_id to prevent duplicates
   * 4. Enforces generation limit (checked by database trigger)
   *
   * @param pressReviewId - UUID of the press review to generate content for
   * @param userId - UUID of the authenticated user
   * @returns The newly created generation job with status 'pending'
   * @throws ServiceError with specific code for different failure scenarios
   */
  async requestGenerationJob(pressReviewId: string, userId: string): Promise<GeneratedPressReviewDetailDTO> {
    // Step 1: Verify press_review exists and user is the owner
    const { data: pressReview, error: pressReviewError } = await this.supabase
      .from("press_reviews")
      .select("id, user_id")
      .eq("id", pressReviewId)
      .single();

    if (pressReviewError || !pressReview) {
      throw new ServiceError("NOT_FOUND", "Press review not found", pressReviewError);
    }

    // Check if press_review is owned by the user
    if (pressReview.user_id !== userId) {
      throw new ServiceError("NOT_FOUND", "Press review not found"); // Don't leak information about existence
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
      throw new ServiceError("DATABASE_ERROR", "Failed to check for pending generations", pendingError);
    }

    if (existingPending) {
      throw new ServiceError("CONFLICT", "A generation is already in progress for this press review");
    }

    // Step 3: Create new generation record with pending status
    // Select only the fields we need, excluding user_id
    const { data: newGeneration, error: insertError } = await this.supabase
      .from("generated_press_reviews")
      .insert({
        press_review_id: pressReviewId,
        user_id: userId,
        status: "pending",
        content: null,
        generated_at: null,
      })
      .select("id, press_review_id, generated_at, status, content, error")
      .single();

    if (insertError || !newGeneration) {
      // Check if error is due to generation limit trigger
      if (this.isGenerationLimitError(insertError)) {
        throw new ServiceError("GENERATION_LIMIT_EXCEEDED", "Cannot generate more than 5 press reviews", insertError);
      }

      // eslint-disable-next-line no-console
      console.error("Error creating generation record:", insertError);
      throw new ServiceError("DATABASE_ERROR", "Failed to create generation job", insertError);
    }

    // Map to DTO - we know this is a pending state
    return this.mapToDTO(newGeneration) as GeneratedPressReviewDetailDTO;
  }

  /**
   * Retrieves generated press reviews for a user with optional filters
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with count
   * @throws ServiceError with "DATABASE_ERROR" code if query fails
   */
  async getGeneratedPressReviews(
    userId: string,
    filters?: {
      pressReviewId?: string;
      status?: GenerationStatus;
    }
  ): Promise<GeneratedPressReviewsListDTO> {
    try {
      // Build query with user filter - select only fields we need (exclude user_id)
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content, error", { count: "exact" })
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
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch generated press reviews", error);
      }

      // Map rows to DTOs using the type-safe mapper
      const mappedData: GeneratedPressReviewDTO[] = (data || []).map((row) => this.mapToDTO(row));

      return {
        data: mappedData,
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a ServiceError
      if (ServiceError.isServiceError(error)) {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviews:", error);
      throw new ServiceError("DATABASE_ERROR", "Unexpected error fetching generated press reviews", error);
    }
  }

  /**
   * Retrieves generated press reviews with topic for a user with optional filters
   * Includes topic from the parent press_reviews table via JOIN
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with topic and count
   * @throws ServiceError with "DATABASE_ERROR" code if query fails
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
      // Select only fields we need (exclude user_id)
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content, error, press_reviews!inner(topic)", {
          count: "exact",
        })
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
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch generated press reviews with topic", error);
      }

      // Map rows to DTOs using the type-safe mapper
      const mappedData: GeneratedPressReviewWithTopicDTO[] = (data || []).map((row) => this.mapToDTOWithTopic(row));

      return {
        data: mappedData,
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a ServiceError
      if (ServiceError.isServiceError(error)) {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviewsWithTopic:", error);
      throw new ServiceError("DATABASE_ERROR", "Unexpected error fetching generated press reviews with topic", error);
    }
  }

  /**
   * Deletes a generated press review
   *
   * Business logic checks:
   * 1. Verifies that the generated review exists
   * 2. Confirms that the authenticated user is the owner
   *
   * @param reviewId - UUID of the generated review to delete
   * @param userId - UUID of the authenticated user
   * @returns Promise<void>
   * @throws ServiceError with specific code for different failure scenarios
   */
  async deleteGeneratedPressReview(reviewId: string, userId: string): Promise<void> {
    // Step 1: Verify review exists and user is the owner
    const { data: review, error: reviewError } = await this.supabase
      .from("generated_press_reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      throw new ServiceError("NOT_FOUND", "Generated press review not found", reviewError);
    }

    // Check if review is owned by the user
    if (review.user_id !== userId) {
      throw new ServiceError("NOT_FOUND", "Generated press review not found"); // Don't leak information about existence
    }

    // Step 2: Delete the review
    const { error: deleteError } = await this.supabase.from("generated_press_reviews").delete().eq("id", reviewId);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("Error deleting generated press review:", deleteError);
      throw new ServiceError("DATABASE_ERROR", "Failed to delete generated press review", deleteError);
    }
  }

  /**
   * Retries a failed generation by deleting the old record and creating a new one
   *
   * Business logic checks:
   * 1. Verifies that the generated review exists
   * 2. Confirms that the authenticated user is the owner
   * 3. Checks that the review status is 'failed'
   * 4. Deletes the old record and creates a new one with 'pending' status
   * 5. Database trigger automatically starts the generation pipeline
   *
   * @param reviewId - UUID of the failed review to retry
   * @param userId - UUID of the authenticated user
   * @returns The newly created generation job with status 'pending'
   * @throws ServiceError with specific code for different failure scenarios
   */
  async retryGeneratedPressReview(reviewId: string, userId: string): Promise<GeneratedPressReviewDetailDTO> {
    // Step 1: Verify review exists, user is owner, and status is 'failed'
    const { data: review, error: reviewError } = await this.supabase
      .from("generated_press_reviews")
      .select("id, user_id, press_review_id, status")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      throw new ServiceError("NOT_FOUND", "Generated press review not found", reviewError);
    }

    // Check if review is owned by the user
    if (review.user_id !== userId) {
      throw new ServiceError("NOT_FOUND", "Generated press review not found"); // Don't leak information about existence
    }

    // Step 2: Delete the old failed review
    const { error: deleteError } = await this.supabase.from("generated_press_reviews").delete().eq("id", reviewId);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("Error deleting old failed review:", deleteError);
      throw new ServiceError("DATABASE_ERROR", "Failed to delete old review during retry", deleteError);
    }

    // Step 3: Create new generation record with pending status
    const { data: newGeneration, error: insertError } = await this.supabase
      .from("generated_press_reviews")
      .insert({
        press_review_id: review.press_review_id,
        user_id: userId,
        status: "pending",
        content: null,
        generated_at: null,
      })
      .select("id, press_review_id, generated_at, status, content, error")
      .single();

    if (insertError || !newGeneration) {
      // Check if error is due to generation limit trigger
      if (this.isGenerationLimitError(insertError)) {
        throw new ServiceError("GENERATION_LIMIT_EXCEEDED", "Cannot generate more than 5 press reviews", insertError);
      }

      // eslint-disable-next-line no-console
      console.error("Error creating new generation record during retry:", insertError);
      throw new ServiceError("DATABASE_ERROR", "Failed to create new generation job during retry", insertError);
    }

    // Map to DTO - we know this is a pending state
    return this.mapToDTO(newGeneration) as GeneratedPressReviewDetailDTO;
  }
}
