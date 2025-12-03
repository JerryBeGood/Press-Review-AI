import { Archive } from "lucide-react";
import { useArchive } from "@/lib/hooks/useArchive";
import { GeneratedPressReviewList } from "./GeneratedPressReviewList";
import { GeneratedPressReviewContentDialog } from "./GeneratedPressReviewContentDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingList } from "@/components/shared/LoadingList";

export default function ArchiveView() {
  const { reviews, status, selectedReview, retry, selectReview, clearSelection } = useArchive();

  // Loading state
  if (status === "loading") {
    return (
      <div className="py-6">
        <LoadingList count={5} />
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="py-6">
        <ErrorState title="An error occurred while loading" description="Failed to load archive." onRetry={retry} />
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          title="No generated reviews yet"
          description="Your generated press reviews will appear here once they are created."
          icon={Archive}
        />
      </div>
    );
  }

  // Success state with data
  return (
    <div className="py-1">
      <div className="mb-6">
        <h2 className="text-xl font-bold font-mono uppercase tracking-tight">GENERATED PRESS REVIEWS</h2>
      </div>
      <GeneratedPressReviewList reviews={reviews} onSelectReview={selectReview} />
      <GeneratedPressReviewContentDialog
        review={selectedReview}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            clearSelection();
          }
        }}
      />
    </div>
  );
}
