import { useEffect, useState, useCallback, useMemo } from "react";
import type { ArchiveViewModel, GeneratedPressReviewsListWithTopicDTO } from "../../types";

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
  retry: () => void;
  selectReview: (review: ArchiveViewModel) => void;
  clearSelection: () => void;
  toggleTopic: (topic: string) => void;
  clearTopicFilter: () => void;
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
    retry,
    selectReview,
    clearSelection,
    toggleTopic,
    clearTopicFilter,
  };
}
