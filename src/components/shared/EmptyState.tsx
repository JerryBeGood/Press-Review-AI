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
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-muted-foreground">
          <div className="mx-auto w-fit p-4 rounded-full bg-primary/10 mb-6">
            <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm sm:text-base leading-relaxed">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
