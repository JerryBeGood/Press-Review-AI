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

  return (
    <button
      type="button"
      onClick={() => onSelectReview(review)}
      className="border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-z-10 hover:shadow-[6px_6px_0px_0px_#000] w-full text-left bg-white brutalist-box-interactive brutalist-pressed p-6 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      aria-label={`View generated press review: ${review.press_reviews?.topic || "Unknown topic"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-bold text-xl font-mono uppercase tracking-tight truncate">
            {review.press_reviews?.topic || "Unknown topic"}
          </h3>
          <p className="text-sm font-mono">{formattedDate}</p>
        </div>
        <Badge variant={statusVariant[review.status]}>{statusLabel[review.status]}</Badge>
      </div>
    </button>
  );
}
