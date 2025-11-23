import type { ArchiveViewModel } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GeneratedPressReviewContentDialogProps {
  review: ArchiveViewModel | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function GeneratedPressReviewContentDialog({ review, onOpenChange }: GeneratedPressReviewContentDialogProps) {
  const isOpen = review !== null;

  const renderContent = () => {
    if (!review) return null;

    if (review.status === "pending") {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <svg
            className="mx-auto h-12 w-12 mb-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <p className="font-medium">Generation in progress</p>
          <p className="text-sm mt-2">This press review is currently being generated. Please check back later.</p>
        </div>
      );
    }

    if (review.status === "failed") {
      return (
        <div className="py-8 text-center text-destructive">
          <svg
            className="mx-auto h-12 w-12 mb-4"
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
          <p className="font-medium">Generation failed</p>
          <p className="text-sm mt-2 text-muted-foreground">An error occurred while generating this press review.</p>
        </div>
      );
    }

    if (review.status === "success" && review.content) {
      try {
        const { content } = review;

        if (!content.headline || !content.intro || !content.sections) {
          throw new Error("Invalid content structure");
        }

        return (
          <article className="prose prose-sm md:prose-base max-w-none">
            {/* Headline */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{content.headline}</h1>

            {/* Intro */}
            <p className="text-base md:text-lg italic text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary/20 pl-4">
              {content.intro}
            </p>

            {/* Sections */}
            {content.sections.length > 0 && (
              <div className="space-y-8">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-4">
                    {/* Section Title */}
                    <h2 className="text-xl md:text-2xl font-semibold mt-6 mb-3">{section.title}</h2>

                    {/* Section Narrative Text */}
                    <div className="text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {section.text}
                    </div>

                    {/* Sources */}
                    {section.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Sources:</p>
                        <ul className="space-y-1">
                          {section.sources.map((source, sourceIndex) => (
                            <li key={sourceIndex} className="text-xs md:text-sm">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                              >
                                {source.id && <span className="font-medium">[{source.id}]</span>}
                                <span>{source.title}</span>
                                <svg
                                  className="h-3 w-3 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </article>
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error parsing content:", error);
        return (
          <div className="py-8 text-center text-destructive">
            <p className="font-medium">Could not display content</p>
            <p className="text-sm mt-2 text-muted-foreground">The content format is invalid or corrupted.</p>
          </div>
        );
      }
    }

    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="font-medium">No content available</p>
        <p className="text-sm mt-2">This press review does not have any content.</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{review?.press_reviews?.topic || "Press Review"}</DialogTitle>
          <DialogDescription>
            {review?.generated_at
              ? `Generated on ${new Date(review.generated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Generation details unavailable"}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
