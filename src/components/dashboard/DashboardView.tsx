import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { usePressReviews } from "@/lib/hooks/usePressReviews";
import { useDialog } from "@/lib/hooks/useDialog";
import { PressReviewList } from "./PressReviewList";
import { PressReviewFormDialog } from "./PressReviewFormDialog";
import { PressReviewCreationForm } from "./PressReviewCreationForm";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { LimitWarning } from "./LimitWarning";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingList } from "@/components/shared/LoadingList";
import type { PressReviewViewModel, CreatePressReviewCmd, UpdatePressReviewCmd } from "@/types";

export function DashboardView() {
  const {
    pressReviews,
    isLoading,
    error,
    addPressReview,
    updatePressReview,
    deletePressReview,
    generatePressReview,
    retry,
  } = usePressReviews();

  const {
    isOpen: isFormOpen,
    data: editingPressReview,
    open: openForm,
    close: closeForm,
  } = useDialog<PressReviewViewModel>();

  const {
    isOpen: isDeleteDialogOpen,
    data: deletingPressReviewId,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog<string>();

  const [isCreating, setIsCreating] = useState(false);

  const hasReachedLimit = pressReviews.length >= 5;

  const handleOpenEditDialog = useCallback(
    (pressReview: PressReviewViewModel) => {
      openForm(pressReview);
    },
    [openForm]
  );

  const handleCreateSubmit = useCallback(
    async (data: CreatePressReviewCmd) => {
      setIsCreating(true);
      try {
        await addPressReview(data);
        toast.success("Press review created");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [addPressReview]
  );

  const handleEditSubmit = useCallback(
    async (data: UpdatePressReviewCmd) => {
      if (!editingPressReview) return;

      try {
        await updatePressReview(editingPressReview.id, data);
        toast.success("Press review updated");
        closeForm();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(errorMessage);
        throw error;
      }
    },
    [editingPressReview, updatePressReview, closeForm]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingPressReviewId) return;

    try {
      await deletePressReview(deletingPressReviewId);
      toast.success("Press review deleted");
    } catch {
      toast.error("Failed to delete press review. Please try again.");
    } finally {
      closeDeleteDialog();
    }
  }, [deletingPressReviewId, deletePressReview, closeDeleteDialog]);

  const handleGenerate = useCallback(
    async (id: string) => {
      try {
        await generatePressReview(id);
        toast.success("Press review generation started");
      } catch (error) {
        if ((error as { status?: number }).status === 409) {
          toast.error("Generation of this press review is already in progress.");
        } else {
          toast.error("Failed to start generation. Please try again.");
        }
      }
    },
    [generatePressReview]
  );

  const deletingPressReview = pressReviews.find((pr) => pr.id === deletingPressReviewId);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <ErrorState
          title="An error occurred while loading"
          description="Failed to load press reviews list."
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-1">
      {/* Top Section: Add New Press Review */}
      <div className="mb-12">
        <PressReviewCreationForm
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
          hasReachedLimit={hasReachedLimit}
        />
      </div>

      {/* List Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight">CONFIGURED PRESS REVIEWS</h2>
      </div>

      {hasReachedLimit && pressReviews.length > 0 && <LimitWarning />}

      {isLoading ? (
        <LoadingList count={5} />
      ) : pressReviews.length === 0 ? (
        <EmptyState
          title="No scheduled press reviews"
          description="Start by creating your first press review above."
          icon={Newspaper}
          action={
            null
            // Hide default action button as we have the top input
          }
        />
      ) : (
        <PressReviewList
          pressReviews={pressReviews}
          onEdit={handleOpenEditDialog}
          onDelete={openDeleteDialog}
          onGenerate={handleGenerate}
        />
      )}
      <PressReviewFormDialog
        key={editingPressReview?.id}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleEditSubmit}
        initialData={editingPressReview || undefined}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        pressReviewTopic={deletingPressReview?.topic}
      />
    </div>
  );
}
