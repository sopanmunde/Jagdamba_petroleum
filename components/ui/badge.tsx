import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-red-100 text-red-800": variant === "default",
          "border-transparent bg-slate-100 text-slate-800": variant === "secondary",
          "border-transparent bg-red-600 text-white": variant === "destructive",
          "border border-slate-200 text-slate-700 bg-white": variant === "outline",
          "border-transparent bg-emerald-100 text-emerald-800 border border-emerald-200": variant === "success",
          "border-transparent bg-amber-100 text-amber-800 border border-amber-200": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
