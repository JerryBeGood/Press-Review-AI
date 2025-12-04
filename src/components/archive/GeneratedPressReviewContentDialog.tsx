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
        <div className="py-8 text-center">
          <div className="inline-block p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-[var(--yellow-banner)] mb-4">
            <Loader2 className="h-10 w-10 animate-spin text-black" />
          </div>
          <p className="font-bold font-mono uppercase">Generation in progress</p>
          <p className="text-sm font-mono mt-2">
            This press review is currently being generated. Please check back later.
          </p>
        </div>
      );
    }

    if (review.status === "failed") {
      return (
        <div className="py-8 text-center">
          <div className="inline-block p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-red-500 mb-4">
            <AlertTriangle className="h-10 w-10 text-black" />
          </div>
          <p className="font-bold font-mono uppercase text-red-600">Generation failed</p>
          <p className="text-sm font-mono mt-2">An error occurred while generating this press review.</p>
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
          <article className="font-mono">
            {/* Headline */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight uppercase tracking-tight">
              {content.headline}
            </h1>

            {/* Intro */}
            <p className="text-base md:text-lg leading-relaxed mb-8 border-l-4 border-black pl-4 bg-gray-100 py-2">
              {content.intro}
            </p>

            {/* Sections */}
            {content.sections.length > 0 && (
              <div className="space-y-8">
                {content.sections.map((section, index) => (
                  <section key={index} className="space-y-4">
                    {/* Section Title */}
                    <h2 className="text-xl md:text-2xl font-bold mt-6 mb-3 uppercase tracking-tight">
                      {section.title}
                    </h2>

                    {/* Section Narrative Text */}
                    <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{section.text}</div>

                    {/* Sources */}
                    {section.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-black">
                        <p className="text-xs font-bold uppercase mb-2">Sources:</p>
                        <ul className="border-2 border-black shadow-[4px_4px_0px_0px_#000] p-2 space-y-1">
                          {section.sources.map((source, sourceIndex) => (
                            <li key={sourceIndex} className="text-xs md:text-sm">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--text-color)] hover:underline decoration-2 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                              >
                                {source.id && <span className="font-bold">[{source.id}]</span>}
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
          <div className="py-8 text-center">
            <p className="font-bold font-mono uppercase text-red-600">Could not display content</p>
            <p className="text-sm font-mono mt-2">The content format is invalid or corrupted.</p>
          </div>
        );
      }
    }

    return (
      <div className="py-8 text-center">
        <p className="font-bold font-mono uppercase">No content available</p>
        <p className="text-sm font-mono mt-2">This press review does not have any content.</p>
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
