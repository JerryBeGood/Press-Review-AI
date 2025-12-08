import { Info } from "lucide-react";

interface QuotaBannerProps {
  scheduledCount: number;
  scheduledLimit: number;
  generatedCount: number;
  generatedLimit: number;
}

/**
 * Unified banner displaying quota information for both scheduled and generated press reviews
 * Shows yellow background when any limit is reached (5/5)
 */
export function QuotaBanner({ scheduledCount, scheduledLimit, generatedCount, generatedLimit }: QuotaBannerProps) {
  // Simple check: is any limit reached?
  const scheduledAtLimit = scheduledCount >= scheduledLimit;
  const generatedAtLimit = generatedCount >= generatedLimit;
  const anyLimitReached = scheduledAtLimit || generatedAtLimit;

  return (
    <div
      className={`mb-6 brutalist-box ${anyLimitReached ? "bg-[var(--yellow-banner)]" : "bg-white"} p-4`}
      role="alert"
      data-testid="quota-banner"
    >
      <div className="flex gap-3">
        <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="font-mono flex-1">
          <p className="font-bold uppercase text-black mb-2">Account quotas</p>

          {/* Scheduled Press Reviews Row */}
          <div className="flex justify-between items-center text-sm text-black mb-1">
            <span>Scheduled Press Reviews:</span>
            <span className={scheduledAtLimit ? "font-bold text-red-500" : ""}>
              {scheduledCount}/{scheduledLimit}
            </span>
          </div>

          {/* Generated Press Reviews Row */}
          <div className="flex justify-between items-center text-sm text-black">
            <span>Generated Press Reviews:</span>
            <span className={generatedAtLimit ? "font-bold text-red-500" : ""}>
              {generatedCount}/{generatedLimit}
            </span>
          </div>

          {/* Warning message */}
          {anyLimitReached && (
            <p className="mt-2 text-sm text-red-500 font-bold">
              {scheduledAtLimit && generatedAtLimit
                ? "Both limits reached. Thanks for testing Press Review AI :)"
                : scheduledAtLimit
                  ? "Scheduled limit reached. Thanks for testing Press Review AI :)"
                  : "Generation limit reached. Thanks for testing Press Review AI :)"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
