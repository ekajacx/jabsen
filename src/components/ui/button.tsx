import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition-all select-none outline-none focus-visible:outline-none focus-visible:ring-3 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 focus-visible:ring-brand-500/25 active:bg-brand-700",
        secondary:
          "bg-gray-100 text-gray-900 shadow-theme-xs hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        outline:
          "border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-300/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-300/50 dark:text-gray-300 dark:hover:bg-gray-800",
        destructive:
          "bg-red-500 text-white shadow-theme-xs hover:bg-red-600 focus-visible:ring-red-500/25 active:bg-red-700",
        link: "h-auto p-0 text-brand-500 underline-offset-4 hover:underline dark:text-brand-400 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        xs: "h-8 px-2.5 py-1 text-xs rounded-lg",
        sm: "h-9 px-3.5 py-2 text-xs rounded-lg",
        lg: "h-11 px-5 py-3 text-base rounded-[10px]",
        icon: "size-10 p-0 rounded-[10px]",
        "icon-sm": "size-9 p-0 rounded-lg",
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
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
