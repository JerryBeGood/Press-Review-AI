import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pressReviewTopic?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  pressReviewTopic,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md" data-testid="delete-confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            This action cannot be undone. The press review
            {pressReviewTopic && (
              <>
                {" "}
                &ldquo;<strong className="text-foreground">{pressReviewTopic}</strong>&rdquo;
              </>
            )}
            will be permanently deleted along with all generated summaries.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onClose} className="w-full sm:w-auto" data-testid="cancel-button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="confirm-delete-button"
          >
            Delete press review
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
