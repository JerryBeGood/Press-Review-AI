import { useState } from "react";
import type { ArchiveViewModel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GeneratedPressReviewListItemProps {
  review: ArchiveViewModel;
  onSelectReview: (review: ArchiveViewModel) => void;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  isActionLoading?: boolean;
}

export function GeneratedPressReviewListItem({
  review,
  onSelectReview,
  onDelete,
  onRetry,
  isActionLoading,
}: GeneratedPressReviewListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const formattedDate = review.generated_at
    ? new Date(review.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Pending";

  const statusVariant = {
    pending: "secondary" as const,
    generating_queries: "secondary" as const,
    researching_sources: "secondary" as const,
    synthesizing_content: "secondary" as const,
    success: "default" as const,
    failed: "destructive" as const,
  };

  const statusLabel = {
    pending: "PENDING",
    generating_queries: "GENERATING",
    researching_sources: "RESEARCHING",
    synthesizing_content: "SYNTHESIZING",
    success: "SUCCESS",
    failed: "FAILED",
  };

  const showRetryButton = review.status === "failed";

  return (
    <div
      className="border-2 border-black shadow-[4px_4px_0px_0px_#000] w-full bg-white mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => onSelectReview(review)}
        className="w-full text-left p-6 transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
        aria-label={`View generated press review: ${review.press_reviews?.topic || "Unknown topic"}`}
        aria-expanded={isHovered}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-bold text-l font-mono uppercase tracking-tight truncate">
              {review.content?.headline || `Pending press review on ${review.press_reviews?.topic}...`}
            </h3>
            <p className="text-sm font-mono">{formattedDate}</p>
          </div>
          <div className="shrink-0">
            <Badge variant={statusVariant[review.status]}>{statusLabel[review.status]}</Badge>
          </div>
        </div>
      </button>

      {/* Bottom Action Bar - Expands on hover */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden bg-white ${
          isHovered ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isHovered}
      >
        <div className="px-6 pb-4">
          <div className="flex gap-2 justify-start">
            {showRetryButton && onRetry && (
              <Button
                size="sm"
                variant="brutalist-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(review.id);
                }}
                disabled={isActionLoading}
                aria-label="Retry generating review"
                className="w-full sm:w-auto"
              >
                RETRY
              </Button>
            )}
            <Button
              size="sm"
              variant="brutalist-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(review.id);
              }}
              disabled={isActionLoading}
              aria-label="Delete review"
              className="w-full sm:w-auto"
            >
              DELETE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
