import { AlertTriangle } from "lucide-react";

export function LimitWarning() {
  return (
    <div className="mb-6 brutalist-box bg-[var(--yellow-banner)] p-4" role="alert">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="font-mono">
          <p className="font-bold uppercase text-black">Press review limit reached</p>
          <p className="mt-1 text-sm text-black">
            You can have up to 5 active press reviews. Delete one to add a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
