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
 */
export interface ResearchArticle {
  title: string;
  url: string;
  author?: string;
  publishedDate?: string;
  summary: string;
  keyFacts: string[];
  opinions: string[];
}

/**
 * Collection of research results
 */
export type ResearchResults = ResearchArticle[];

/**
 * Analysis of the research process and source quality
 */
export interface ProcessAnalysis {
  totalSourcesEvaluated: number;
  relevantSources: number;
  irrelevantSources: number;
  keyThemes: string[];
  sourceQualityNotes: string;
}

/**
 * Final press review content structure
 */
export interface PressReviewContent {
  general_summary: string;
  segments: ContentSegment[];
}

export interface ContentSegment {
  title: string;
  summary: string;
  link: string;
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
