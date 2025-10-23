import { useState } from "react";
import { toast } from "sonner";
import { usePressReviews } from "@/lib/hooks/usePressReviews";
import { PressReviewList } from "./PressReviewList";
import { EmptyState } from "./EmptyState";
import { PressReviewFormDialog } from "./PressReviewFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
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
    refetch,
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
        toast.success("Prasówka została zaktualizowana");
      } else {
        await addPressReview(data as CreatePressReviewCmd);
        toast.success("Prasówka została utworzona");
      }
      handleCloseFormDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      if (errorMessage.includes("409") || errorMessage.includes("duplicate")) {
        toast.error("Prasówka o takim temacie już istnieje");
      } else if (errorMessage.includes("limit")) {
        toast.error("Osiągnięto limit 5 prasówek");
      } else {
        toast.error("Nie udało się zapisać prasówki. Spróbuj ponownie.");
      }
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
      toast.success("Prasówka została usunięta");
    } catch {
      toast.error("Nie udało się usunąć prasówki. Spróbuj ponownie.");
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      await generatePressReview(id);
      toast.success("Generowanie prasówki rozpoczęte");
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        toast.error("Generowanie tej prasówki już trwa.");
      } else {
        toast.error("Nie udało się rozpocząć generowania. Spróbuj ponownie.");
      }
    }
  };

  const deletingPressReview = pressReviews.find((pr) => pr.id === deletingPressReviewId);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <div className="text-destructive mb-4">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Wystąpił błąd podczas ładowania</h3>
          <p className="text-sm text-muted-foreground mb-6">Nie udało się załadować listy prasówek.</p>
          <Button onClick={refetch}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      {!isLoading && pressReviews.length > 0 ? (
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pulpit</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Zarządzaj swoimi cyklicznymi prasówkami</p>
          </div>
          {!isLoading && pressReviews.length > 0 && (
            <Button onClick={handleOpenCreateDialog} disabled={hasReachedLimit} size="lg" className="w-full sm:w-auto">
              Dodaj prasówkę
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
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Osiągnięto limit prasówek</p>
              <p className="mt-1 text-yellow-600 dark:text-yellow-500">
                Możesz mieć maksymalnie 5 aktywnych prasówek. Usuń jedną z istniejących, aby dodać nową.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && pressReviews.length === 0 ? (
        <EmptyState onCreateFirst={handleOpenCreateDialog} />
      ) : (
        <PressReviewList
          pressReviews={pressReviews}
          isLoading={isLoading}
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
