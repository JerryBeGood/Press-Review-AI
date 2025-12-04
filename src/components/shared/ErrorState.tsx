import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16" role="alert" aria-live="polite">
      <div className="w-full max-w-sm bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-8">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="bg-red-500 border-2 border-black p-4 mb-6" aria-hidden="true">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold font-mono uppercase tracking-tight mb-3 text-black">{title}</h3>

          {/* Description */}
          <p className="text-sm font-mono mb-8 text-black">{description}</p>

          {/* Retry Button */}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full rounded-none border-2 border-black bg-[var(--button-blue)] text-black font-bold uppercase font-mono shadow-[4px_4px_0px_0px_#000] hover:bg-[#5eb0ef] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
