import { Button } from "@/components/ui/button";
import type { PressReviewViewModel } from "@/types";
import { formatCronToReadable } from "@/lib/cronUtils";
import { Clock } from "lucide-react";

interface PressReviewListItemProps {
  pressReview: PressReviewViewModel;
  onEdit: (pressReview: PressReviewViewModel) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

export function PressReviewListItem({ pressReview, onEdit, onDelete, onGenerate }: PressReviewListItemProps) {
  const isDeleting = pressReview.status === "deleting";
  const isGenerating = pressReview.status === "generating";

  return (
    <div
      className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 mb-6 transition-all hover:translate-z-10 hover:shadow-[6px_6px_0px_0px_#000] ${
        isDeleting ? "opacity-50" : "opacity-100"
      }`}
      data-testid={`press-review-list-item-${pressReview.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl uppercase mb-2 truncate font-mono tracking-tight">{pressReview.topic}</h3>
          <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{formatCronToReadable(pressReview.schedule)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-shrink-0">
          <Button
            variant="brutalist-ghost"
            size="sm"
            onClick={() => onEdit(pressReview)}
            disabled={isDeleting || isGenerating}
            aria-label={`Edit press review: ${pressReview.topic}`}
            className="w-full sm:w-auto"
            data-testid="edit-press-review-button"
          >
            EDIT
          </Button>
          <Button
            variant="brutalist-destructive"
            size="sm"
            onClick={() => onDelete(pressReview.id)}
            disabled={isDeleting || isGenerating}
            aria-label={`Delete press review: ${pressReview.topic}`}
            className="w-full sm:w-auto"
            data-testid="delete-press-review-button"
          >
            {isDeleting ? "DELETING..." : "DELETE"}
          </Button>
          <Button
            variant="brutalist"
            size="sm"
            onClick={() => onGenerate(pressReview.id)}
            disabled={isDeleting || isGenerating}
            aria-label={`Generate press review: ${pressReview.topic}`}
            className="w-full sm:w-auto"
            data-testid="generate-press-review-button"
          >
            {isGenerating ? "GENERATING..." : "GENERATE"}
          </Button>
        </div>
      </div>
    </div>
  );
}
