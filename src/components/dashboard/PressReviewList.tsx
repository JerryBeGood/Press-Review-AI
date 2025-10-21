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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 sm:p-5 border rounded-lg">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-9 w-full sm:w-20" />
              <Skeleton className="h-9 w-full sm:w-20" />
              <Skeleton className="h-9 w-full sm:w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
