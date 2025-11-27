import { PressReviewListItem } from "./PressReviewListItem";
import type { PressReviewViewModel } from "@/types";

interface PressReviewListProps {
  pressReviews: PressReviewViewModel[];
  onEdit: (pressReview: PressReviewViewModel) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

export function PressReviewList({ pressReviews, onEdit, onDelete, onGenerate }: PressReviewListProps) {
  return (
    <div className="space-y-4" data-testid="press-review-list">
      {pressReviews.map((pressReview) => (
        <PressReviewListItem
          key={pressReview.id}
          pressReview={pressReview}
          onEdit={onEdit}
          onDelete={onDelete}
          onGenerate={onGenerate}
        />
      ))}
    </div>
  );
}
