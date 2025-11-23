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
 * Single source reference within a section of press review content
 * Sources are now used as citations/footnotes, not as primary content
 * Corresponds to ContentSource in _shared/types.ts
 * NOTE: Renamed to PressReviewSource to match API types convention
 */
export const PressReviewSourceSchema = z.object({
  id: z.string().optional().describe("Optional citation marker (e.g., '1', '2')"),
  title: z.string().describe("The title of the source article"),
  url: z.string().url().describe("The URL of the source"),
});

export type PressReviewSource = z.infer<typeof PressReviewSourceSchema>;

/**
 * Thematic section of the press review with narrative text
 * Corresponds to PressReviewSection in _shared/types.ts
 */
export const PressReviewSectionSchema = z.object({
  title: z.string().describe("The section heading"),
  text: z.string().describe("The narrative content synthesizing multiple sources"),
  sources: z.array(PressReviewSourceSchema).describe("Referenced sources for this section"),
});
export type PressReviewSection = z.infer<typeof PressReviewSectionSchema>;

/**
 * Final press review content structure - narrative article format
 * Corresponds to PressReviewContent in _shared/types.ts
 */
export const PressReviewContentSchema = z.object({
  headline: z.string().describe("The main headline of the press review"),
  intro: z.string().describe("The introductory paragraph setting up the narrative"),
  sections: z.array(PressReviewSectionSchema).describe("Thematic sections with synthesized narratives"),
});

export type PressReviewContent = z.infer<typeof PressReviewContentSchema>;
