import type { Tables, TablesInsert, Enums } from "../db/database.types";
import type { PressReviewContent } from "./json-schemas";

/* ------------------------------------------------------------------ *
 *  Shared helpers
 * ------------------------------------------------------------------ */
export type GenerationStatus = Enums<"generation_status">;

/* ------------------------------------------------------------------ *
 *  Press Reviews
 * ------------------------------------------------------------------ */
export type PressReviewDTO = Pick<Tables<"press_reviews">, "id" | "topic" | "schedule" | "created_at" | "updated_at">;

export interface PressReviewsListDTO {
  data: PressReviewDTO[];
  count: number;
}

/** View model extending PressReviewDTO with UI state */
export type PressReviewViewModel = PressReviewDTO & {
  status?: "deleting" | "generating";
};

/** Body of POST /press-reviews */
export type CreatePressReviewCmd = Pick<TablesInsert<"press_reviews">, "topic" | "schedule">;

/** Body of PATCH /press-reviews/{id} */
export type UpdatePressReviewCmd = Partial<Pick<PressReviewDTO, "topic" | "schedule">>;

/* Topic validation */
export interface ValidateTopicCmd {
  topic: string;
}

export interface ValidateTopicResultDTO {
  is_valid: boolean;
  suggestions: string[];
}

/* ------------------------------------------------------------------ *
 *  Generated Press Reviews - Discriminated Unions
 * ------------------------------------------------------------------ */

type BaseGeneratedReview = Pick<Tables<"generated_press_reviews">, "id" | "press_review_id" | "generated_at">;

// 1. Pending / Processing States
// In these states, content is null and error is null
export type GeneratedPressReviewPending = BaseGeneratedReview & {
  status: "pending" | "generating_queries" | "researching_sources" | "synthesizing_content";
  content: null;
  error: null;
};

// 2. Failed State
// In this state, error is usually present (but nullable in DB, so string | null), content is null
export type GeneratedPressReviewFailed = BaseGeneratedReview & {
  status: "failed";
  content: null;
  error: string | null;
};

// 3. Success State
// In this state, content MUST be present.
export type GeneratedPressReviewSuccess = BaseGeneratedReview & {
  status: "success";
  content: PressReviewContent;
  error: null;
};

// The Discriminated Union
export type GeneratedPressReviewDTO =
  | GeneratedPressReviewPending
  | GeneratedPressReviewFailed
  | GeneratedPressReviewSuccess;

// Full details DTO
export type GeneratedPressReviewDetailDTO = GeneratedPressReviewDTO;

export interface GeneratedPressReviewsListDTO {
  data: GeneratedPressReviewDTO[];
  count: number;
}

/** Modified DTO from API to include the topic from press_reviews relation */
export type GeneratedPressReviewWithTopicDTO = GeneratedPressReviewDTO & {
  press_reviews: {
    topic: string;
  } | null;
};

/** ViewModel for the Archive View components */
export type ArchiveViewModel = GeneratedPressReviewWithTopicDTO;

/** API Response Type for the list with topic included */
export interface GeneratedPressReviewsListWithTopicDTO {
  data: GeneratedPressReviewWithTopicDTO[];
  count: number;
}

/* ------------------------------------------------------------------ *
 *  User Profiles & Quotas
 * ------------------------------------------------------------------ */

/**
 * User profile with quota counters
 */
export interface ProfileDTO {
  id: string;
  scheduled_reviews_count: number;
  generated_reviews_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Quota information for display
 */
export interface QuotaInfoDTO {
  scheduled_count: number;
  scheduled_limit: number;
  generated_count: number;
  generated_limit: number;
}

/* ------------------------------------------------------------------ *
 *  Generated Press Reviews - Actions
 * ------------------------------------------------------------------ */

/**
 * Response for DELETE /api/generated-press-reviews/:id
 */
export interface DeleteGeneratedPressReviewResponse {
  success: boolean;
  deletedId: string;
}

/**
 * Response for POST /api/generated-press-reviews/:id/retry
 */
export interface RetryGeneratedPressReviewResponse {
  success: boolean;
  oldReviewId: string;
  newReview: GeneratedPressReviewDetailDTO;
}
