import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Legacy variants (kept for compatibility during migration)
        default: "rounded-md bg-gray-900 text-white shadow hover:bg-gray-800",
        destructive: "rounded-md bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline: "rounded-md border border-input bg-background shadow-sm hover:bg-gray-100",
        secondary: "rounded-md bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "rounded-md hover:bg-gray-100",
        link: "text-gray-900 underline-offset-4 hover:underline",
        // Neo-Brutalist variants
        brutalist:
          "rounded-none border-2 border-black bg-[var(--button-blue)] text-black font-bold uppercase font-mono shadow-[4px_4px_0px_0px_#000] hover:bg-[#5eb0ef] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        "brutalist-destructive":
          "rounded-none border-2 border-black bg-red-500 text-black font-bold uppercase font-mono shadow-[4px_4px_0px_0px_#000] hover:bg-red-600 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        "brutalist-outline":
          "rounded-none border-2 border-black bg-white text-black font-bold uppercase font-mono shadow-[4px_4px_0px_0px_#000] hover:bg-gray-100 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        "brutalist-ghost":
          "rounded-none border-2 border-black bg-gray-200 text-black font-bold uppercase font-mono shadow-[2px_2px_0px_0px_#000] hover:bg-gray-300 hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
