import { AlertTriangle } from "lucide-react";

export function LimitWarning() {
  return (
    <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 sm:p-4 text-sm">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-700 dark:text-yellow-400">Press review limit reached</p>
          <p className="mt-1 text-yellow-600 dark:text-yellow-500">
            You can have up to 5 active press reviews. Delete one of the existing ones to add a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
