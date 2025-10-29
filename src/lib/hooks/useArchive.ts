import { useEffect, useState, useCallback } from "react";
import type { ArchiveViewModel, GeneratedPressReviewsListWithTopicDTO } from "../../types";

type FetchStatus = "loading" | "success" | "error";

interface UseArchiveReturn {
  reviews: ArchiveViewModel[];
  status: FetchStatus;
  selectedReview: ArchiveViewModel | null;
  retry: () => void;
  selectReview: (review: ArchiveViewModel) => void;
  clearSelection: () => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

/**
 * Custom hook for managing Archive view state
 * Handles data fetching, polling for pending reviews, and selection state
 */
export function useArchive(): UseArchiveReturn {
  const [reviews, setReviews] = useState<ArchiveViewModel[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [selectedReview, setSelectedReview] = useState<ArchiveViewModel | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  /**
   * Fetches generated press reviews with topic from the API
   */
  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/generated_press_reviews?include_topic=true");

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data: GeneratedPressReviewsListWithTopicDTO = await response.json();
      setReviews(data.data);
      setStatus("success");

      // Check if any reviews are pending to enable polling
      const hasPending = data.data.some((review) => review.status === "pending");
      setPollingEnabled(hasPending);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching reviews:", error);
      setStatus("error");
      setPollingEnabled(false);
    }
  }, []);

  /**
   * Retry function for error state
   */
  const retry = useCallback(() => {
    setStatus("loading");
    fetchReviews();
  }, [fetchReviews]);

  /**
   * Select a review for viewing in dialog
   */
  const selectReview = useCallback((review: ArchiveViewModel) => {
    setSelectedReview(review);
  }, []);

  /**
   * Clear the selected review (close dialog)
   */
  const clearSelection = useCallback(() => {
    setSelectedReview(null);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Set up polling when there are pending reviews
  useEffect(() => {
    if (!pollingEnabled) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchReviews();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingEnabled, fetchReviews]);

  return {
    reviews,
    status,
    selectedReview,
    retry,
    selectReview,
    clearSelection,
  };
}
