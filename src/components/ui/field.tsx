"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldContextValue {
  id: string;
  error?: string;
}

const FieldContext = React.createContext<FieldContextValue | undefined>(undefined);

export function useField() {
  return React.useContext(FieldContext);
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
}

export function Field({ className, error, children, ...props }: FieldProps) {
  const generatedId = React.useId();

  return (
    <FieldContext.Provider value={{ id: generatedId, error }}>
      <div className={cn("flex flex-col gap-1.5", className)} {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FieldLabel({ className, required, children, ...props }: FieldLabelProps) {
  const field = useField();

  return (
    <label
      htmlFor={field?.id}
      className={cn("text-sm font-medium text-gray-700 dark:text-gray-200 select-none", className)}
      {...props}
    >
      {children}
      {required && <span className="ms-1 text-red-500">*</span>}
    </label>
  );
}

export function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-gray-500 dark:text-gray-400", className)} {...props} />
  );
}

export function FieldError({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const field = useField();
  const errorMessage = children || field?.error;

  if (!errorMessage) return null;

  return (
    <p className={cn("text-xs font-medium text-red-500 dark:text-red-400 mt-0.5", className)} {...props}>
      {errorMessage}
    </p>
  );
}
