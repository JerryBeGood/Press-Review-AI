import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDTO, QuotaInfoDTO } from "../../types";
import { ServiceError } from "../errors";

/**
 * Service for managing user profiles and quota information
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user profile with quota counters
   *
   * @param userId - UUID of the authenticated user
   * @returns User profile with quota information
   * @throws ServiceError with "NOT_FOUND" if profile doesn't exist
   * @throws ServiceError with "DATABASE_ERROR" for database failures
   */
  async getProfile(userId: string): Promise<ProfileDTO> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, scheduled_reviews_count, generated_reviews_count, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new ServiceError("NOT_FOUND", "User profile not found", error);
      }
      console.error("Error fetching profile:", error);
      throw new ServiceError("DATABASE_ERROR", "Failed to fetch profile", error);
    }

    if (!data) {
      throw new ServiceError("NOT_FOUND", "User profile not found");
    }

    return data;
  }

  /**
   * Get quota information for display purposes
   *
   * @param userId - UUID of the authenticated user
   * @returns Quota information with current counts and limits
   */
  async getQuotaInfo(userId: string): Promise<QuotaInfoDTO> {
    const profile = await this.getProfile(userId);

    return {
      scheduled_count: profile.scheduled_reviews_count,
      scheduled_limit: 5,
      generated_count: profile.generated_reviews_count,
      generated_limit: 10,
    };
  }
}
