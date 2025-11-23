/**
 * Shared types for Supabase Edge Functions
 * These types define the data structures used across all agent functions
 */

/**
 * Request body structure for Edge Function invocations
 */
export interface EdgeFunctionRequest {
  generated_press_review_id: string;
}

/**
 * Standard response format for all Edge Functions
 */
export interface AgentFunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Generated search queries for research
 */
export type GeneratedQueries = string[];

/**
 * Single research result from Exa search
 * Schema focuses on specific data extraction rather than generic summarization
 */
export interface ResearchArticle {
  title: string;
  url: string;
  author?: string;
  publishedDate?: string;
  main_event: string; // Specific description of what happened
  quantitative_data?: string[]; // Numbers, dates, prices (optional - do not hallucinate)
  quotes: string[]; // Direct citations
  opinions: string[]; // High priority: Interesting perspectives or controversies
  unique_angle: string; // Value proposition vs. general knowledge
  relevance_score: number; // Score from Phase 3 evaluation (1-10)
}

/**
 * Collection of research results
 */
export type ResearchResults = ResearchArticle[];

/**
 * Single source within a segment of press review content
 */
export interface ContentSegment {
  title: string;
  summary: string;
  link: string;
}

/**
 * Segment of categorized content with sources
 */
export interface PressReviewSegment {
  category: string;
  summary: string;
  sources: ContentSegment[];
}

/**
 * Final press review content structure
 */
export interface PressReviewContent {
  general_summary: string;
  segments: PressReviewSegment[];
}

/**
 * Generation status enum matching database
 */
export type GenerationStatus =
  | "pending"
  | "generating_queries"
  | "researching_sources"
  | "synthesizing_content"
  | "success"
  | "failed";

/**
 * Single News Angle for targeted research
 */
export interface NewsAngle {
  name: string; // e.g. "Legal Regulations"
  description: string; // e.g. "New laws and directives"
  keywords: string[]; // e.g. ["act", "voting", "veto", "directive"] - triggers for Phase 2
}

/**
 * Full generation context persisted to database
 */
export interface GenerationContext {
  audience: string;
  persona: string;
  goal: string;
  news_angles: NewsAngle[];
}
