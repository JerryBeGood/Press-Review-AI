import { Button } from "@/components/ui/button";
import type { PressReviewViewModel } from "@/types";
import { formatCronToReadable } from "@/lib/cronUtils";

interface PressReviewListItemProps {
  pressReview: PressReviewViewModel;
  onEdit: (pressReview: PressReviewViewModel) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

// TODO: pressReview.status is never set and does not take any effect on the component
export function PressReviewListItem({ pressReview, onEdit, onDelete, onGenerate }: PressReviewListItemProps) {
  const isDeleting = pressReview.status === "deleting";
  const isGenerating = pressReview.status === "generating";

  return (
    <div
      className={`p-4 sm:p-5 border rounded-lg transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
        isDeleting ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{pressReview.topic}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatCronToReadable(pressReview.schedule)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(pressReview)}
            disabled={isDeleting || isGenerating}
            aria-label={`Edytuj prasówkę: ${pressReview.topic}`}
            className="w-full sm:w-auto"
          >
            Edytuj
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(pressReview.id)}
            disabled={isDeleting || isGenerating}
            aria-label={`Usuń prasówkę: ${pressReview.topic}`}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onGenerate(pressReview.id)}
            disabled={isDeleting || isGenerating}
            aria-label={`Generuj prasówkę: ${pressReview.topic}`}
            className="w-full sm:w-auto"
          >
            {isGenerating ? "Generowanie..." : "Generuj teraz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
