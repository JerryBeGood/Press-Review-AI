import type { ArchiveViewModel } from "@/types";
import { GeneratedPressReviewListItem } from "./GeneratedPressReviewListItem";

interface GeneratedPressReviewListProps {
  reviews: ArchiveViewModel[];
  onSelectReview: (review: ArchiveViewModel) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  isActionLoading?: boolean;
}

export function GeneratedPressReviewList({
  reviews,
  onSelectReview,
  onDelete,
  onRetry,
  isActionLoading,
}: GeneratedPressReviewListProps) {
  return (
    <div className="space-y-4" role="list" aria-label="Generated press reviews">
      {reviews.map((review) => (
        <GeneratedPressReviewListItem
          key={review.id}
          review={review}
          onSelectReview={onSelectReview}
          onDelete={onDelete}
          onRetry={onRetry}
          isActionLoading={isActionLoading}
        />
      ))}
    </div>
  );
}
