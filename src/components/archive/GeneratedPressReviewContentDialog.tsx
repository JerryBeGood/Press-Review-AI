import type { ArchiveViewModel, PressReviewContent } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        const content = review.content as unknown as PressReviewContent;

        if (!content.general_summary || !content.segments) {
          throw new Error("Invalid content structure");
        }

        return (
          <div className="space-y-6">
            {/* General Summary */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Summary</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{content.general_summary}</p>
            </div>

            {/* Segments */}
            {content.segments.length > 0 && (
              <div className="space-y-4">
                {content.segments.map((segment, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{segment.category}</CardTitle>
                      <CardDescription>{segment.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {segment.sources.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                          {segment.sources.map((source, sourceIndex) => (
                            <AccordionItem value={`item-${sourceIndex}`} key={sourceIndex}>
                              <AccordionTrigger>{source.title}</AccordionTrigger>
                              <AccordionContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">{source.summary}</p>
                                <a
                                  href={source.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                                >
                                  Read full article
                                  <svg
                                    className="h-3 w-3"
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
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
