import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "rounded-none border-2 border-black bg-[var(--button-blue)] text-black font-mono uppercase shadow-[2px_2px_0px_0px_#000]",
        secondary:
          "rounded-none border-2 border-black bg-gray-200 text-black font-mono uppercase shadow-[2px_2px_0px_0px_#000]",
        destructive:
          "rounded-none border-2 border-black bg-red-500 text-black font-mono uppercase shadow-[2px_2px_0px_0px_#000]",
        outline:
          "rounded-none border-2 border-black bg-white text-black font-mono uppercase shadow-[2px_2px_0px_0px_#000]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
