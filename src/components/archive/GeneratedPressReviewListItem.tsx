import type { ArchiveViewModel } from "@/types";
import { Badge } from "@/components/ui/badge";

interface GeneratedPressReviewListItemProps {
  review: ArchiveViewModel;
  onSelectReview: (review: ArchiveViewModel) => void;
}

export function GeneratedPressReviewListItem({ review, onSelectReview }: GeneratedPressReviewListItemProps) {
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
    success: "default" as const,
    failed: "destructive" as const,
  };

  const statusLabel = {
    pending: "Pending",
    success: "Success",
    failed: "Failed",
  };

  return (
    <button
      type="button"
      onClick={() => onSelectReview(review)}
      className="w-full text-left rounded-lg border border-border p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`View generated press review: ${review.press_reviews?.topic || "Unknown topic"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-base sm:text-lg truncate">
            {review.press_reviews?.topic || "Unknown topic"}
          </h3>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant={statusVariant[review.status]}>{statusLabel[review.status]}</Badge>
        </div>
      </div>
    </button>
  );
}
