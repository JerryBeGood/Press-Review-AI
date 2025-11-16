import { vi, describe, it, expect, beforeEach } from "vitest";
import { PressReviewService } from "../../../../src/lib/services/pressReviewService";
import type { SupabaseClient } from "../../../../src/db/supabase.client";
import type { CreatePressReviewCmd, PressReviewDTO, UpdatePressReviewCmd } from "../../../../src/types";

// This object represents the query builder that is returned by `from()`
// and is used for chaining methods like `select`, `insert`, etc.
const queryBuilderMock = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  then: vi.fn(), // Makes the query builder "thenable" for `await`
};

// This is the main mock for the Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
} as unknown as SupabaseClient;

// Before each test, reset all mocks to a clean state
beforeEach(() => {
  vi.clearAllMocks();

  // `from()` returns the query builder mock
  vi.mocked(mockSupabase.from).mockReturnValue(queryBuilderMock);

  // Chainable methods on the query builder return the builder itself
  queryBuilderMock.insert.mockReturnValue(queryBuilderMock);
  queryBuilderMock.select.mockReturnValue(queryBuilderMock);
  queryBuilderMock.update.mockReturnValue(queryBuilderMock);
  queryBuilderMock.delete.mockReturnValue(queryBuilderMock);
  queryBuilderMock.eq.mockReturnValue(queryBuilderMock);

  // Reset terminating methods that return results
  queryBuilderMock.single.mockReset();
  queryBuilderMock.then.mockReset();
});

const service = new PressReviewService(mockSupabase);
const userId = "test-user-id";

describe("PressReviewService", () => {
  describe("createPressReview", () => {
    const cmd: CreatePressReviewCmd = { topic: "Test Topic", schedule: "0 0 * * *" };
    const newPressReviewRecord = {
      id: "new-id",
      user_id: userId,
      topic: "Test Topic",
      schedule: "0 0 * * *",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should create a press review and schedule it successfully", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({ data: newPressReviewRecord, error: null });
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: null });

      const result = await service.createPressReview(cmd, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("press_reviews");
      expect(queryBuilderMock.insert).toHaveBeenCalledWith({ ...cmd, user_id: userId });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("schedule_press_review", {
        review_id: newPressReviewRecord.id,
        schedule_expression: newPressReviewRecord.schedule,
      });
      expect(result).toEqual({
        id: newPressReviewRecord.id,
        topic: newPressReviewRecord.topic,
        schedule: newPressReviewRecord.schedule,
        created_at: newPressReviewRecord.created_at,
        updated_at: newPressReviewRecord.updated_at,
      });
    });

    it("should throw LIMIT_EXCEEDED error if user has too many press reviews", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: "cannot have more than 5 press reviews" },
      });

      await expect(service.createPressReview(cmd, userId)).rejects.toThrow("LIMIT_EXCEEDED");
    });

    it("should throw DUPLICATE_TOPIC error if topic already exists", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: "already has a press review with topic" },
      });

      await expect(service.createPressReview(cmd, userId)).rejects.toThrow("DUPLICATE_TOPIC");
    });

    it("should throw DATABASE_ERROR on unexpected insert error", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Some other error" },
      });

      await expect(service.createPressReview(cmd, userId)).rejects.toThrow("DATABASE_ERROR");
    });

    it("should throw DATABASE_ERROR if insert returns no data", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.createPressReview(cmd, userId)).rejects.toThrow("DATABASE_ERROR");
    });

    it("should throw SCHEDULING_ERROR if scheduling fails", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({ data: newPressReviewRecord, error: null });
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: { message: "Scheduling failed" } });

      await expect(service.createPressReview(cmd, userId)).rejects.toThrow("SCHEDULING_ERROR");
    });
  });

  describe("updatePressReview", () => {
    const reviewId = "existing-id";
    const cmd: UpdatePressReviewCmd = { topic: "Updated Topic", schedule: "0 1 * * *" };
    const updatedPressReviewRecord = {
      id: reviewId,
      user_id: userId,
      topic: "Updated Topic",
      schedule: "0 1 * * *",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should update a press review and reschedule it successfully", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({ data: updatedPressReviewRecord, error: null });
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: null });

      const result = await service.updatePressReview(reviewId, cmd, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("press_reviews");
      expect(queryBuilderMock.update).toHaveBeenCalledWith(expect.objectContaining(cmd));
      expect(queryBuilderMock.eq).toHaveBeenCalledWith("id", reviewId);
      expect(queryBuilderMock.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("schedule_press_review", {
        review_id: updatedPressReviewRecord.id,
        schedule_expression: updatedPressReviewRecord.schedule,
      });
      expect(result.topic).toBe(cmd.topic);
    });

    it("should not reschedule if schedule is not updated", async () => {
      const updateCmd = { topic: "Just the topic" };
      const record = { ...updatedPressReviewRecord, topic: "Just the topic" };
      queryBuilderMock.single.mockResolvedValueOnce({ data: record, error: null });

      await service.updatePressReview(reviewId, updateCmd, userId);

      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND if update returns a PGRST116 error", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      await expect(service.updatePressReview(reviewId, cmd, userId)).rejects.toThrow("NOT_FOUND");
    });

    it("should throw NOT_FOUND if update returns no data", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({ data: null, error: null });
      await expect(service.updatePressReview(reviewId, cmd, userId)).rejects.toThrow("NOT_FOUND");
    });

    it("should throw DUPLICATE_TOPIC on duplicate topic error", async () => {
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: "already has a press review with topic" },
      });
      await expect(service.updatePressReview(reviewId, cmd, userId)).rejects.toThrow("DUPLICATE_TOPIC");
    });
  });

  describe("deletePressReview", () => {
    const reviewId = "id-to-delete";

    it("should unschedule and delete a press review successfully", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: null });
      queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({ error: null, count: 1 }));

      const result = await service.deletePressReview(reviewId, userId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("unschedule_press_review", { review_id: reviewId });
      expect(mockSupabase.from).toHaveBeenCalledWith("press_reviews");
      expect(queryBuilderMock.delete).toHaveBeenCalledWith({ count: "exact" });
      expect(queryBuilderMock.eq).toHaveBeenCalledWith("id", reviewId);
      expect(queryBuilderMock.eq).toHaveBeenCalledWith("user_id", userId);
      expect(result).toEqual({ success: true });
    });

    it("should return success: false if no record was deleted", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: null });
      queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({ error: null, count: 0 }));

      const result = await service.deletePressReview(reviewId, userId);
      expect(result).toEqual({ success: false });
    });

    it("should throw UNSCHEDULING_ERROR if unscheduling fails", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: { message: "Unscheduling failed" } });

      await expect(service.deletePressReview(reviewId, userId)).rejects.toThrow("UNSCHEDULING_ERROR");
    });

    it("should throw DATABASE_ERROR on delete failure", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ error: null });
      queryBuilderMock.then.mockImplementationOnce((resolve) =>
        resolve({ error: { message: "Delete failed" }, count: null })
      );

      await expect(service.deletePressReview(reviewId, userId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("getPressReviews", () => {
    const pressReviews: PressReviewDTO[] = [
      { id: "1", topic: "T1", schedule: "S1", created_at: "", updated_at: "" },
      { id: "2", topic: "T2", schedule: "S2", created_at: "", updated_at: "" },
    ];
    const pressReviewsWithUserId = pressReviews.map((pr) => ({ ...pr, user_id: userId }));

    it("should return a list of press reviews for the user", async () => {
      queryBuilderMock.then.mockImplementationOnce((resolve) =>
        resolve({ data: pressReviewsWithUserId, error: null, count: 2 })
      );

      const result = await service.getPressReviews(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("press_reviews");
      expect(queryBuilderMock.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(queryBuilderMock.eq).toHaveBeenCalledWith("user_id", userId);
      expect(result.data).toEqual(pressReviews);
      expect(result.count).toBe(2);
    });

    it("should return an empty list if user has no press reviews", async () => {
      queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({ data: [], error: null, count: 0 }));

      const result = await service.getPressReviews(userId);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should throw DATABASE_ERROR on fetch failure", async () => {
      queryBuilderMock.then.mockImplementationOnce((resolve) =>
        resolve({ data: null, error: { message: "Fetch failed" }, count: null })
      );

      await expect(service.getPressReviews(userId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("validateTopic", () => {
    it("should return a static success response", async () => {
      const result = await service.validateTopic("any topic", userId);

      expect(result).toEqual({
        is_valid: true,
        suggestions: [],
      });
    });
  });
});
