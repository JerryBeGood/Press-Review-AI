import { useState, useEffect, useCallback } from "react";
import type {
  PressReviewViewModel,
  CreatePressReviewCmd,
  UpdatePressReviewCmd,
  PressReviewsListDTO,
  PressReviewDTO,
} from "@/types";

interface UsePressReviewsReturn {
  pressReviews: PressReviewViewModel[];
  isLoading: boolean;
  error: Error | null;
  addPressReview: (data: CreatePressReviewCmd) => Promise<void>;
  updatePressReview: (id: string, data: UpdatePressReviewCmd) => Promise<void>;
  deletePressReview: (id: string) => Promise<void>;
  generatePressReview: (id: string) => Promise<void>;
  retry: () => void;
}

export function usePressReviews(): UsePressReviewsReturn {
  const [pressReviews, setPressReviews] = useState<PressReviewViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPressReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/press_reviews");

      if (!response.ok) {
        throw new Error(`Failed to fetch press reviews: ${response.statusText}`);
      }

      const data: PressReviewsListDTO = await response.json();
      setPressReviews(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPressReviews();
  }, [fetchPressReviews]);

  const addPressReview = useCallback(async (data: CreatePressReviewCmd) => {
    const response = await fetch("/api/press_reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const { message: errorText } = await response.json();
      throw new Error(errorText || `Failed to create press review: ${response.statusText}`);
    }

    const newPressReview: PressReviewDTO = await response.json();
    setPressReviews((prev) => [...prev, newPressReview]);
  }, []);

  const updatePressReview = useCallback(async (id: string, data: UpdatePressReviewCmd) => {
    const response = await fetch(`/api/press_reviews/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const { message: errorText } = await response.json();
      throw new Error(errorText || `Failed to update press review: ${response.statusText}`);
    }

    const updatedPressReview: PressReviewDTO = await response.json();
    setPressReviews((prev) => prev.map((pr) => (pr.id === id ? updatedPressReview : pr)));
  }, []);

  const deletePressReview = useCallback(async (id: string) => {
    // Optimistic UI update
    setPressReviews((prev) => prev.map((pr) => (pr.id === id ? { ...pr, status: "deleting" as const } : pr)));

    try {
      const response = await fetch(`/api/press_reviews/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete press review: ${response.statusText}`);
      }

      // Remove from list on success
      setPressReviews((prev) => prev.filter((pr) => pr.id !== id));
    } catch (err) {
      // Revert optimistic update on error
      setPressReviews((prev) => prev.map((pr) => (pr.id === id ? { ...pr, status: undefined } : pr)));
      throw err;
    }
  }, []);

  const generatePressReview = useCallback(async (id: string) => {
    // Mark as generating
    setPressReviews((prev) => prev.map((pr) => (pr.id === id ? { ...pr, status: "generating" as const } : pr)));

    try {
      const response = await fetch("/api/generated_press_reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ press_review_id: id }),
      });

      if (!response.ok) {
        const error = { message: `Failed to generate press review: ${response.statusText}`, status: response.status };
        throw error;
      }

      // Clear generating status after a short delay
      setTimeout(() => {
        setPressReviews((prev) => prev.map((pr) => (pr.id === id ? { ...pr, status: undefined } : pr)));
      }, 1000);
    } catch (err) {
      // Clear generating status on error
      setPressReviews((prev) => prev.map((pr) => (pr.id === id ? { ...pr, status: undefined } : pr)));
      throw err;
    }
  }, []);

  /**
   * Retry function for error state
   */
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchPressReviews();
  }, [fetchPressReviews]);

  return {
    pressReviews,
    isLoading,
    error,
    addPressReview,
    updatePressReview,
    deletePressReview,
    generatePressReview,
    retry,
  };
}
