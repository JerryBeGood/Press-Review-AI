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

/** Body of POST /press-reviews */
export type CreatePressReviewCmd = Pick<TablesInsert<"press_reviews">, "topic" | "schedule" | "is_active">;

/** Body of PATCH /press-reviews/{id} */
export type UpdatePressReviewCmd = Partial<Pick<PressReviewDTO, "topic" | "schedule" | "is_active">>;

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

/* ------------------------------------------------------------------ *
 *  Generation Logs
 * ------------------------------------------------------------------ */
export type GenerationLogDTO = Omit<Tables<"generation_logs">, "user_id">;
