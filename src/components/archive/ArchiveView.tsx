import { useState } from "react";
import { Archive } from "lucide-react";
import { useArchive } from "@/lib/hooks/useArchive";
import { GeneratedPressReviewList } from "./GeneratedPressReviewList";
import { GeneratedPressReviewContentDialog } from "./GeneratedPressReviewContentDialog";
import { GeneratedReviewDeleteDialog } from "./GeneratedReviewDeleteDialog";
import { TopicFilter } from "./TopicFilter";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingList } from "@/components/shared/LoadingList";

export default function ArchiveView() {
  const {
    reviews,
    filteredReviews,
    topicsWithCount,
    selectedTopics,
    status,
    selectedReview,
    isActionLoading,
    retry,
    selectReview,
    clearSelection,
    toggleTopic,
    deleteReview,
    retryReview,
  } = useArchive();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setReviewToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (reviewToDelete) {
      await deleteReview(reviewToDelete);
      setReviewToDelete(null);
    }
  };

  const handleRetryClick = async (id: string) => {
    await retryReview(id);
  };

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

  // Success state with data
  return (
    <div className="py-1">
      {reviews.length === 0 ? (
        <div className="py-6">
          <EmptyState
            title="No generated reviews yet"
            description="Your generated press reviews will appear here once they are created."
            icon={Archive}
          />
        </div>
      ) : (
        <>
          <TopicFilter topics={topicsWithCount} selectedTopics={selectedTopics} onToggle={toggleTopic} />
          <div className="mb-6">
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight">GENERATED PRESS REVIEWS</h2>
          </div>
          <GeneratedPressReviewList
            reviews={filteredReviews}
            onSelectReview={selectReview}
            onDelete={handleDeleteClick}
            onRetry={handleRetryClick}
            isActionLoading={isActionLoading}
          />
          <GeneratedPressReviewContentDialog
            review={selectedReview}
            onOpenChange={(isOpen: boolean) => {
              if (!isOpen) {
                clearSelection();
              }
            }}
          />
          <GeneratedReviewDeleteDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setReviewToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            isLoading={isActionLoading}
          />
        </>
      )}
    </div>
  );
}
