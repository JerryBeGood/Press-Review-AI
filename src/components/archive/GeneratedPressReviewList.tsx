import type { ArchiveViewModel } from "@/types";
import { GeneratedPressReviewListItem } from "./GeneratedPressReviewListItem";

interface GeneratedPressReviewListProps {
  reviews: ArchiveViewModel[];
  onSelectReview: (review: ArchiveViewModel) => void;
}

export function GeneratedPressReviewList({ reviews, onSelectReview }: GeneratedPressReviewListProps) {
  return (
    <div className="space-y-4" role="list" aria-label="Generated press reviews">
      {reviews.map((review) => (
        <GeneratedPressReviewListItem key={review.id} review={review} onSelectReview={onSelectReview} />
      ))}
    </div>
  );
}
