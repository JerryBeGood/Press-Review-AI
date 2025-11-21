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
 *  Generated Press Reviews
 * ------------------------------------------------------------------ */

// Whitelisting fields for list view - safe and clean
export type GeneratedPressReviewDTO = Pick<
  Tables<"generated_press_reviews">,
  "id" | "press_review_id" | "status" | "generated_at"
> & {
  // Overriding content type from Json to specific Zod type
  // Note: It's nullable in DB, so we keep it nullable here
  content: PressReviewContent | null;
  error: string | null;
};

// Full details DTO (currently same as list DTO + potentially more fields in future)
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
