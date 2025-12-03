import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-full max-w-md bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 sm:p-8 transition-all hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
        <div className="flex flex-col items-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-[var(--button-blue)]">
            <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-black" />
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h3 className="text-base sm:text-lg font-bold font-mono uppercase tracking-tight text-black">{title}</h3>
            <p className="text-sm sm:text-base font-mono leading-relaxed text-black">{description}</p>
          </div>

          {/* Action */}
          {action && <div className="w-full pt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
