import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { usePressReviews } from "@/lib/hooks/usePressReviews";
import { useDialog } from "@/lib/hooks/useDialog";
import { PressReviewList } from "./PressReviewList";
import { PressReviewFormDialog } from "./PressReviewFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { LimitWarning } from "./LimitWarning";
import { Button } from "@/components/ui/button";
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

  const [formResetKey, setFormResetKey] = useState(0);

  const hasReachedLimit = pressReviews.length >= 5;

  const handleOpenCreateDialog = useCallback(() => {
    setFormResetKey((prev) => prev + 1);
    openForm(null);
  }, [openForm]);

  const handleOpenEditDialog = useCallback(
    (pressReview: PressReviewViewModel) => {
      openForm(pressReview);
    },
    [openForm]
  );

  const handleFormSubmit = useCallback(
    async (data: CreatePressReviewCmd | UpdatePressReviewCmd) => {
      try {
        if (editingPressReview) {
          await updatePressReview(editingPressReview.id, data);
          toast.success("Press review updated");
        } else {
          await addPressReview(data as CreatePressReviewCmd);
          toast.success("Press review created");
        }
        closeForm();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(errorMessage);
        throw error;
      }
    },
    [editingPressReview, updatePressReview, addPressReview, closeForm]
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
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      {!isLoading && pressReviews.length > 0 ? (
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your recurring press reviews</p>
          </div>
          {!isLoading && pressReviews.length > 0 && (
            <Button onClick={handleOpenCreateDialog} disabled={hasReachedLimit} size="lg" className="w-full sm:w-auto">
              Add press review
            </Button>
          )}
        </div>
      ) : (
        <></>
      )}

      {hasReachedLimit && pressReviews.length > 0 && <LimitWarning />}

      {isLoading ? (
        <LoadingList count={5} />
      ) : pressReviews.length === 0 ? (
        <EmptyState
          title="No scheduled press reviews"
          description="Start by creating your first press review. Define the topic and schedule and we'll automatically generate recurring summaries for you."
          icon={Newspaper}
          action={
            <Button onClick={handleOpenCreateDialog} size="lg" className="w-full sm:w-auto">
              Create first press review
            </Button>
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
        key={editingPressReview ? editingPressReview.id : `create-${formResetKey}`}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
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
