import type { ArchiveViewModel } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react";

interface GeneratedPressReviewContentDialogProps {
  review: ArchiveViewModel | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function GeneratedPressReviewContentDialog({ review, onOpenChange }: GeneratedPressReviewContentDialogProps) {
  const isOpen = review !== null;

  const renderContent = () => {
    if (!review) return null;

    if (["pending", "generating_queries", "researching_sources", "synthesizing_content"].includes(review.status)) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-12 w-12 mb-4 animate-spin" />
          <p className="font-medium">Generation in progress</p>
          <p className="text-sm mt-2">This press review is currently being generated. Please check back later.</p>
        </div>
      );
    }

    if (review.status === "failed") {
      return (
        <div className="py-8 text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
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
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
