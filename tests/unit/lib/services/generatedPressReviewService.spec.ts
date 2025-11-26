import { vi, describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "../../../../src/db/supabase.client";
import type {
  GeneratedPressReviewDetailDTO,
  GeneratedPressReviewDTO,
  GeneratedPressReviewsListDTO,
  GeneratedPressReviewsListWithTopicDTO,
  PressReviewContent,
} from "../../../../src/types";
import { ServiceError } from "../../../../src/lib/errors";
import { GeneratedPressReviewService } from "../../../../src/lib/services/generatedPressReviewService";

const mockSupabase = {
  from: vi.fn(),
};

describe("GeneratedPressReviewService", () => {
  let service: GeneratedPressReviewService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new GeneratedPressReviewService(mockSupabase as unknown as SupabaseClient);
  });

  describe("requestGenerationJob", () => {
    const pressReviewId = "press-review-id";
    const userId = "user-id";

    it("should throw NOT_FOUND if press review does not exist", async () => {
      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      };
      mockSupabase.from.mockReturnValue(pressReviewQuery);

      try {
        await service.requestGenerationJob(pressReviewId, userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "NOT_FOUND" });
      }
    });

    it("should throw NOT_FOUND if user is not the owner of the press review", async () => {
      const pressReview = { id: pressReviewId, user_id: "another-user-id" };
      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pressReview, error: null }),
      };
      mockSupabase.from.mockReturnValue(pressReviewQuery);

      try {
        await service.requestGenerationJob(pressReviewId, userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "NOT_FOUND" });
      }
    });

    it("should throw CONFLICT if there is an existing pending generation", async () => {
      const pressReview = { id: pressReviewId, user_id: userId };
      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pressReview, error: null }),
      };
      const pendingGeneration = { id: "pending-id", status: "pending" };
      const pendingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: pendingGeneration, error: null }),
      };
      mockSupabase.from.mockReturnValueOnce(pressReviewQuery).mockReturnValueOnce(pendingQuery);

      try {
        await service.requestGenerationJob(pressReviewId, userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "CONFLICT" });
      }
    });

    it("should throw DATABASE_ERROR if checking for pending generations fails", async () => {
      const pressReview = { id: pressReviewId, user_id: userId };
      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pressReview, error: null }),
      };
      const pendingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } }),
      };
      mockSupabase.from.mockReturnValueOnce(pressReviewQuery).mockReturnValueOnce(pendingQuery);

      try {
        await service.requestGenerationJob(pressReviewId, userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "DATABASE_ERROR" });
      }
    });

    it("should throw DATABASE_ERROR if creating a new generation record fails", async () => {
      const pressReview = { id: pressReviewId, user_id: userId };
      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pressReview, error: null }),
      };
      const pendingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "insert failed" } }),
      };
      mockSupabase.from
        .mockReturnValueOnce(pressReviewQuery)
        .mockReturnValueOnce(pendingQuery)
        .mockReturnValueOnce(insertQuery);

      try {
        await service.requestGenerationJob(pressReviewId, userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "DATABASE_ERROR" });
      }
    });

    it("should create and return a new generation job on success", async () => {
      const pressReview = { id: pressReviewId, user_id: userId };
      // Mock the DB response - now includes error field since we select it
      const dbResponse = {
        id: "new-gen-id",
        press_review_id: pressReviewId,
        status: "pending",
        content: null,
        generated_at: null,
        error: null,
      };

      const expectedDTO: GeneratedPressReviewDetailDTO = {
        id: "new-gen-id",
        press_review_id: pressReviewId,
        status: "pending",
        content: null,
        generated_at: null,
        error: null,
      };

      const pressReviewQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: pressReview, error: null }),
      };
      const pendingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbResponse, error: null }),
      };
      mockSupabase.from
        .mockReturnValueOnce(pressReviewQuery)
        .mockReturnValueOnce(pendingQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await service.requestGenerationJob(pressReviewId, userId);

      expect(result).toEqual(expectedDTO);
      expect(insertQuery.insert).toHaveBeenCalledWith({
        press_review_id: pressReviewId,
        user_id: userId,
        status: "pending",
        content: null,
        generated_at: null,
      });
    });
  });

  describe("getGeneratedPressReviews", () => {
    const userId = "user-id";

    it("should return generated press reviews for a user", async () => {
      const mockContent: PressReviewContent = {
        headline: "Test Headline",
        intro: "This is a test introduction paragraph.",
        sections: [
          {
            title: "Test Section",
            text: "This is the narrative content for the test section.",
            sources: [
              {
                id: "1",
                title: "Test Source",
                url: "https://example.com/article",
              },
            ],
          },
        ],
      };

      // Mock DB response (looser type)
      const dbReviews = [
        {
          id: "1",
          press_review_id: "pr-1",
          generated_at: new Date().toISOString(),
          status: "success",
          content: mockContent,
          error: null,
        },
      ];

      // Expected DTO
      const expectedReviews: GeneratedPressReviewsListDTO["data"] = [
        {
          id: "1",
          press_review_id: "pr-1",
          generated_at: dbReviews[0].generated_at,
          status: "success",
          content: mockContent,
          error: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: typeof dbReviews; count: number; error: null }) => void) =>
          resolve({ data: dbReviews, count: 1, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getGeneratedPressReviews(userId);

      expect(result).toEqual({ data: expectedReviews, count: 1 });
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should apply filters correctly", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: GeneratedPressReviewDTO[]; count: number; error: null }) => void) =>
          resolve({ data: [], count: 0, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getGeneratedPressReviews(userId, { pressReviewId: "pr-1", status: "success" });

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQuery.eq).toHaveBeenCalledWith("press_review_id", "pr-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "success");
    });

    it("should throw DATABASE_ERROR if the query fails", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: null; count: null; error: { message: string } }) => void) =>
          resolve({ data: null, count: null, error: { message: "db error" } }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await service.getGeneratedPressReviews(userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "DATABASE_ERROR" });
      }
    });
  });

  describe("getGeneratedPressReviewsWithTopic", () => {
    const userId = "user-id";

    it("should return generated press reviews with topic for a user", async () => {
      const mockContent: PressReviewContent = {
        headline: "Test Headline for Topic Review",
        intro: "This is a test introduction for a press review with topic.",
        sections: [
          {
            title: "Main Topic Section",
            text: "Narrative content discussing the main topic with synthesized information from sources.",
            sources: [
              {
                id: "1",
                title: "Primary Source",
                url: "https://example.com/source1",
              },
              {
                id: "2",
                title: "Secondary Source",
                url: "https://example.com/source2",
              },
            ],
          },
        ],
      };

      const dbReviews = [
        {
          id: "1",
          press_review_id: "pr-1",
          generated_at: new Date().toISOString(),
          status: "success",
          content: mockContent,
          error: null,
          press_reviews: { topic: "Test Topic" },
        },
      ];

      const expectedReviews: GeneratedPressReviewsListWithTopicDTO["data"] = [
        {
          id: "1",
          press_review_id: "pr-1",
          generated_at: dbReviews[0].generated_at,
          status: "success",
          content: mockContent,
          error: null,
          press_reviews: { topic: "Test Topic" },
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: typeof dbReviews; count: number; error: null }) => void) =>
          resolve({ data: dbReviews, count: 1, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getGeneratedPressReviewsWithTopic(userId);

      expect(result).toEqual({ data: expectedReviews, count: 1 });
      expect(mockQuery.select).toHaveBeenCalledWith(
        "id, press_review_id, generated_at, status, content, error, press_reviews!inner(topic)",
        { count: "exact" }
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should apply filters correctly", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: []; count: number; error: null }) => void) =>
          resolve({ data: [], count: 0, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getGeneratedPressReviewsWithTopic(userId, { pressReviewId: "pr-1", status: "success" });

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQuery.eq).toHaveBeenCalledWith("press_review_id", "pr-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "success");
    });

    it("should throw DATABASE_ERROR if the query fails", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: null; count: null; error: { message: string } }) => void) =>
          resolve({ data: null, count: null, error: { message: "db error" } }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await service.getGeneratedPressReviewsWithTopic(userId);
        expect.fail("Should have thrown ServiceError");
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect(error).toMatchObject({ code: "DATABASE_ERROR" });
      }
    });
  });
});
