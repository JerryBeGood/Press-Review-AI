import { useArchive } from "@/lib/hooks/useArchive";
import { GeneratedPressReviewList } from "./GeneratedPressReviewList";
import { GeneratedPressReviewContentDialog } from "./GeneratedPressReviewContentDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArchiveView() {
  const { reviews, status, selectedReview, retry, selectReview, clearSelection } = useArchive();

  // Loading state
  if (status === "loading") {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
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
        <h3 className="text-lg font-semibold mb-2">An error occurred while loading</h3>
        <p className="text-sm text-muted-foreground mb-6">Failed to load archive.</p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
          <div className="max-w-md space-y-6">
            <div className="text-muted-foreground">
              <div className="mx-auto w-fit p-4 rounded-full bg-primary/10 mb-6">
                <svg
                  className="h-12 w-12 sm:h-16 sm:w-16 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No generated reviews yet</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                Your generated press reviews will appear here once they are created.
              </p>
            </div>
          </div>
        </div>
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
    </>
  );
}
