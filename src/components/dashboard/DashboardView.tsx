import { useState } from "react";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { usePressReviews } from "@/lib/hooks/usePressReviews";
import { PressReviewList } from "./PressReviewList";
import { PressReviewFormDialog } from "./PressReviewFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPressReview, setEditingPressReview] = useState<PressReviewViewModel | null>(null);
  const [deletingPressReviewId, setDeletingPressReviewId] = useState<string | null>(null);

  const hasReachedLimit = pressReviews.length >= 5;

  const handleOpenCreateDialog = () => {
    setEditingPressReview(null);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (pressReview: PressReviewViewModel) => {
    setEditingPressReview(pressReview);
    setIsFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormOpen(false);
    setEditingPressReview(null);
  };

  const handleFormSubmit = async (data: CreatePressReviewCmd | UpdatePressReviewCmd) => {
    try {
      if (editingPressReview) {
        await updatePressReview(editingPressReview.id, data);
        toast.success("Press review updated");
      } else {
        await addPressReview(data as CreatePressReviewCmd);
        toast.success("Press review created");
      }
      handleCloseFormDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingPressReviewId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPressReviewId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPressReviewId) return;

    try {
      await deletePressReview(deletingPressReviewId);
      toast.success("Press review deleted");
    } catch {
      toast.error("Failed to delete press review. Please try again.");
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleGenerate = async (id: string) => {
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
  };

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

      {hasReachedLimit && pressReviews.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 sm:p-4 text-sm">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Press review limit reached</p>
              <p className="mt-1 text-yellow-600 dark:text-yellow-500">
                You can have up to 5 active press reviews. Delete one of the existing ones to add a new one.
              </p>
            </div>
          </div>
        </div>
      )}

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
          onDelete={handleOpenDeleteDialog}
          onGenerate={handleGenerate}
        />
      )}
      <PressReviewFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleFormSubmit}
        initialData={editingPressReview || undefined}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        pressReviewTopic={deletingPressReview?.topic}
      />
    </div>
  );
}
