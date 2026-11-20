"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useField } from "./field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isInvalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, startIcon, endIcon, isInvalid, disabled, value, ...props }, ref) => {
    const field = useField();
    const resolvedId = id || field?.id;
    const hasError = isInvalid || Boolean(field?.error);

    // Safeguard: jika input pernah dikontrol (controlled), jangan biarkan berubah ke uncontrolled saat value = undefined/null
    const isControlledRef = React.useRef(value !== undefined);
    if (value !== undefined) {
      isControlledRef.current = true;
    }
    const safeValue = isControlledRef.current ? (value ?? "") : value;

    return (
      <div className="relative flex w-full items-center">
        {startIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-gray-400">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={resolvedId}
          disabled={disabled}
          value={safeValue}
          aria-invalid={hasError}
          className={cn(
            "h-11 w-full min-w-0 rounded-[10px] border bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition-all placeholder:text-gray-400",
            "border-gray-300 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/20",
            startIcon && "pl-10",
            endIcon && "pr-10",
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900",
            disabled && "cursor-not-allowed border-gray-200 bg-gray-100/60 text-gray-400 shadow-none",
            "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-400 dark:focus:ring-brand-500/30",
            className
          )}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3.5 flex items-center justify-center text-gray-400">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
