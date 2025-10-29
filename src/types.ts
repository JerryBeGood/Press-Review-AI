import type { anthropic } from "@ai-sdk/anthropic";
import type { openai } from "@ai-sdk/openai";

type OpenAIModel = ReturnType<typeof openai>;
type AnthropicModel = ReturnType<typeof anthropic>;

type Provider = OpenAIModel | AnthropicModel;

type Models = Record<string, Provider>;

export type { Models, AnthropicModel };

// ----------------------------------------------------------------------------------
// Domain DTOs & Command Models
// ----------------------------------------------------------------------------------
import type { Tables, TablesInsert, Enums } from "./db/database.types";

/* ------------------------------------------------------------------ *
 *  Shared helpers
 * ------------------------------------------------------------------ */
export type PressReviewStatus = Enums<"press_review_status">;
export type RatingValue = -1 | 1; // business rule: only -1 or 1

/* ------------------------------------------------------------------ *
 *  Press Reviews
 * ------------------------------------------------------------------ */
export type PressReviewDTO = Omit<Tables<"press_reviews">, "user_id">;

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
export type GeneratedPressReviewDTO = Omit<Tables<"generated_press_reviews">, "user_id" | "generation_log_id">;

export type GeneratedPressReviewDetailDTO = Omit<Tables<"generated_press_reviews">, "user_id">;

export interface GeneratedPressReviewsListDTO {
  data: GeneratedPressReviewDTO[];
  count: number;
}

/** Expected structure of the 'content' JSONB field */
export interface ContentSegment {
  title: string;
  summary: string;
  link: string;
}

export interface PressReviewContent {
  general_summary: string;
  segments: ContentSegment[];
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
 *  Generation Logs
 * ------------------------------------------------------------------ */
export type GenerationLogDTO = Omit<Tables<"generation_logs">, "user_id">;
