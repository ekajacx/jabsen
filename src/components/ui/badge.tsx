import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800",
        success: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
        warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        destructive: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
        info: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        secondary: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[11px] px-2 py-0.2",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}
