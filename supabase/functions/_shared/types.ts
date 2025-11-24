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
 * Single source reference within a section of press review content
 * Sources are now used as citations/footnotes, not as primary content
 */
export interface ContentSource {
  id?: string; // Optional citation marker (e.g., '1', '2')
  title: string; // The title of the source article
  url: string; // The URL of the source
}

/**
 * Thematic section of the press review with narrative text
 */
export interface PressReviewSection {
  title: string; // The section heading
  text: string; // The narrative content synthesizing multiple sources
  sources: ContentSource[]; // Referenced sources for this section
}

/**
 * Final press review content structure - narrative article format
 */
export interface PressReviewContent {
  headline: string; // The main headline of the press review
  intro: string; // The introductory paragraph setting up the narrative
  sections: PressReviewSection[]; // Thematic sections with synthesized narratives
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
