"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface RenderLabInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const RenderLabInput = forwardRef<HTMLInputElement, RenderLabInputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        className={cn(
          "rounded-lg border bg-[var(--rl-surface)] text-[var(--rl-text)] placeholder-[var(--rl-text-secondary)]",
          "border-[var(--rl-border)] focus:border-[var(--rl-accent)] focus:ring-2 focus:ring-[var(--rl-accent)] focus:ring-offset-1",
          "transition-all duration-200 px-3 py-2 outline-none",
          error && "border-[var(--rl-error)] focus:ring-[var(--rl-error)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-sm text-[var(--rl-error)]">{error}</span>
      )}
    </div>
  )
);
RenderLabInput.displayName = "RenderLabInput";
