import { z } from "zod";

/**
 * Generated search queries for research
 * Corresponds to GeneratedQueries in _shared/types.ts
 */
export const GeneratedQueriesSchema = z.array(z.string());
export type GeneratedQueries = z.infer<typeof GeneratedQueriesSchema>;

/**
 * Single research result from Exa search
 * Corresponds to ResearchArticle in _shared/types.ts
 */
export const ResearchArticleSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  author: z.string().optional(),
  publishedDate: z.string().optional(),
  summary: z.string(),
  keyFacts: z.array(z.string()),
  opinions: z.array(z.string()),
});

export type ResearchArticle = z.infer<typeof ResearchArticleSchema>;

/**
 * Collection of research results
 * Corresponds to ResearchResults in _shared/types.ts
 */
export const ResearchResultsSchema = z.array(ResearchArticleSchema);
export type ResearchResults = z.infer<typeof ResearchResultsSchema>;

/**
 * Analysis of the research process and source quality
 * Corresponds to ProcessAnalysis in _shared/types.ts
 */
export const ProcessAnalysisSchema = z.object({
  totalSourcesEvaluated: z.number(),
  sourcesUsedCount: z.number(),
  topicsCovered: z.array(z.string()),
  sourceQualityNotes: z.string(),
});

export type ProcessAnalysis = z.infer<typeof ProcessAnalysisSchema>;

/**
 * Single source within a segment of press review content
 * Corresponds to ContentSegment in _shared/types.ts
 * NOTE: Renamed to PressReviewSource to match API types convention
 */
export const PressReviewSourceSchema = z.object({
  title: z.string(),
  summary: z.string(),
  link: z.string().url(),
});

export type PressReviewSource = z.infer<typeof PressReviewSourceSchema>;

/**
 * Segment of categorized content with sources
 * Corresponds to PressReviewSegment in _shared/types.ts
 */
export const PressReviewSegmentSchema = z.object({
  category: z.string(),
  summary: z.string(),
  sources: z.array(PressReviewSourceSchema),
});
export type PressReviewSegment = z.infer<typeof PressReviewSegmentSchema>;

/**
 * Final press review content structure
 * Corresponds to PressReviewContent in _shared/types.ts
 */
export const PressReviewContentSchema = z.object({
  general_summary: z.string(),
  segments: z.array(PressReviewSegmentSchema),
});

export type PressReviewContent = z.infer<typeof PressReviewContentSchema>;
