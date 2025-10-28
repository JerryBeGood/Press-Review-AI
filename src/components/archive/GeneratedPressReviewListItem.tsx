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
      className="w-full text-left rounded-lg border border-border p-4 transition-colors hover:bg-accent hover:border-accent-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`View generated press review: ${review.press_reviews?.topic || "Unknown topic"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{review.press_reviews?.topic || "Unknown topic"}</h3>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <Badge variant={statusVariant[review.status]}>{statusLabel[review.status]}</Badge>
      </div>
    </button>
  );
}
