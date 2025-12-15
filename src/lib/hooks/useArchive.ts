import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  ArchiveViewModel,
  GeneratedPressReviewsListWithTopicDTO,
  RetryGeneratedPressReviewResponse,
} from "../../types";

type FetchStatus = "loading" | "success" | "error";

export interface TopicWithCount {
  topic: string;
  count: number;
}

interface UseArchiveReturn {
  reviews: ArchiveViewModel[];
  filteredReviews: ArchiveViewModel[];
  topicsWithCount: TopicWithCount[];
  selectedTopics: Set<string>;
  status: FetchStatus;
  selectedReview: ArchiveViewModel | null;
  isActionLoading: boolean;
  retry: () => void;
  selectReview: (review: ArchiveViewModel) => void;
  clearSelection: () => void;
  toggleTopic: (topic: string) => void;
  clearTopicFilter: () => void;
  deleteReview: (id: string) => Promise<void>;
  retryReview: (id: string) => Promise<void>;
}

const POLLING_INTERVAL = 5000; // 5 seconds

/**
 * Custom hook for managing Archive view state
 * Handles data fetching, polling for pending reviews, and selection state
 */
const UNKNOWN_TOPIC = "Unknown topic";

export function useArchive(): UseArchiveReturn {
  const [reviews, setReviews] = useState<ArchiveViewModel[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [selectedReview, setSelectedReview] = useState<ArchiveViewModel | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [isActionLoading, setIsActionLoading] = useState(false);

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

      // Check if any reviews are in an in-progress state to enable polling
      const inProgressStatuses = ["pending", "generating_queries", "researching_sources", "synthesizing_content"];
      const hasInProgress = data.data.some((review) => inProgressStatuses.includes(review.status));
      setPollingEnabled(hasInProgress);
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

  /**
   * Toggle topic in selection (add if not present, remove if present)
   */
  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  }, []);

  /**
   * Clear all topic selections
   */
  const clearTopicFilter = useCallback(() => {
    setSelectedTopics(new Set());
  }, []);

  /**
   * Deletes a generated press review with optimistic update
   */
  const deleteReview = useCallback(
    async (id: string) => {
      setIsActionLoading(true);

      // 1. Optimistic: remove from list
      const previousReviews = reviews;
      setReviews((prev) => prev.filter((r) => r.id !== id));

      try {
        // 2. API call
        const response = await fetch(`/api/generated-press-reviews/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete");
        }

        // 3. Success toast
        toast.success("Press review deleted");
      } catch (error) {
        // 4. Rollback + error toast
        setReviews(previousReviews);
        toast.error("Failed to delete. Please try again.");
        // eslint-disable-next-line no-console
        console.error("Error deleting review:", error);
      } finally {
        setIsActionLoading(false);
      }
    },
    [reviews]
  );

  /**
   * Retries a failed generation with optimistic update
   */
  const retryReview = useCallback(
    async (id: string) => {
      setIsActionLoading(true);

      // 1. Optimistic: change status to pending
      const previousReviews = reviews;
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "pending" as const, content: null, error: null } : r))
      );

      try {
        // 2. API call
        const response = await fetch(`/api/generated-press-reviews/${id}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to retry");
        }

        const data: RetryGeneratedPressReviewResponse = await response.json();

        // 3. Replace old with new review (preserve press_reviews relation)
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...data.newReview, press_reviews: r.press_reviews } : r))
        );

        // 4. Enable polling to track the new generation
        setPollingEnabled(true);

        // 5. Success toast
        toast.success("Retry initiated - generating new review");
      } catch (error) {
        // 6. Rollback + error toast
        setReviews(previousReviews);
        toast.error("Failed to retry. Please try again.");
        // eslint-disable-next-line no-console
        console.error("Error retrying review:", error);
      } finally {
        setIsActionLoading(false);
      }
    },
    [reviews]
  );

  /**
   * Compute unique topics with their review counts
   */
  const topicsWithCount = useMemo<TopicWithCount[]>(() => {
    const counts = new Map<string, number>();

    for (const review of reviews) {
      const topic = review.press_reviews?.topic ?? UNKNOWN_TOPIC;
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [reviews]);

  /**
   * Filter reviews based on selected topics
   * Returns all reviews if no topics are selected
   */
  const filteredReviews = useMemo<ArchiveViewModel[]>(() => {
    if (selectedTopics.size === 0) {
      return reviews;
    }

    return reviews.filter((review) => {
      const topic = review.press_reviews?.topic ?? UNKNOWN_TOPIC;
      return selectedTopics.has(topic);
    });
  }, [reviews, selectedTopics]);

  /**
   * Clean up selected topics that no longer exist in the data
   */
  useEffect(() => {
    const availableTopics = new Set(topicsWithCount.map((t) => t.topic));
    setSelectedTopics((prev) => {
      const cleaned = new Set([...prev].filter((t) => availableTopics.has(t)));
      if (cleaned.size !== prev.size) {
        return cleaned;
      }
      return prev;
    });
  }, [topicsWithCount]);

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
    filteredReviews,
    topicsWithCount,
    selectedTopics,
    status,
    selectedReview,
    isActionLoading,
    retry,
    selectReview,
    clearSelection,
    toggleTopic,
    clearTopicFilter,
    deleteReview,
    retryReview,
  };
}
