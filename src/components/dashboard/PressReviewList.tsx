import { Skeleton } from "@/components/ui/skeleton";
import { PressReviewListItem } from "./PressReviewListItem";
import type { PressReviewViewModel } from "@/types";

interface PressReviewListProps {
  pressReviews: PressReviewViewModel[];
  isLoading: boolean;
  onEdit: (pressReview: PressReviewViewModel) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

export function PressReviewList({ pressReviews, isLoading, onEdit, onDelete, onGenerate }: PressReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 container mx-auto px-4 py-8 sm:py-8 max-w-5xl">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

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
