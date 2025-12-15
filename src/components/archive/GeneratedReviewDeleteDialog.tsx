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

interface GeneratedReviewDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function GeneratedReviewDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: GeneratedReviewDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md" data-testid="generated-review-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed font-mono">
            This action cannot be undone. The generated review will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel onClick={onClose} className="w-full sm:w-auto" disabled={isLoading}>
            CANCEL
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto"
            disabled={isLoading}
            data-testid="confirm-delete-button"
          >
            {isLoading ? "DELETING..." : "DELETE"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
