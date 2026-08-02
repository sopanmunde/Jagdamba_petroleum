import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border bg-white/90 px-4 py-2 text-sm text-slate-800 font-medium ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 transition duration-150 shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-red-500 focus-visible:ring-red-400/30"
            : "border-slate-300/90 focus-visible:border-red-500 focus-visible:ring-red-500/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
