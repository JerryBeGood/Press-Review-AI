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
      <div className="container mx-auto px-4 py-8 sm:py-8 max-w-5xl">
        <LoadingList count={5} />
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-8 max-w-5xl">
        <ErrorState title="An error occurred while loading" description="Failed to load archive." onRetry={retry} />
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
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
    <>
      <div className="container mx-auto px-4 py-8 sm:py-8 max-w-5xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Archive</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Browse your generated press reviews history
            </p>
          </div>
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
    </>
  );
}
