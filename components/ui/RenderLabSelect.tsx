"use client";
import { cn } from "@/lib/utils";
import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface RenderLabSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export function RenderLabSelect({
  children,
  className,
  error,
  ...props
}: RenderLabSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <select
          className={cn(
            "rounded-lg border bg-[var(--rl-surface)] text-[var(--rl-text)] w-full",
            "border-[var(--rl-border)] focus:border-[var(--rl-accent)] focus:ring-2 focus:ring-[var(--rl-accent)] focus:ring-offset-1",
            "transition-all duration-200 px-3 py-2 pr-10 outline-none appearance-none",
            error && "border-[var(--rl-error)] focus:ring-[var(--rl-error)]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rl-text-secondary)]"
          size={16}
        />
      </div>
      {error && (
        <span className="text-sm text-[var(--rl-error)]">{error}</span>
      )}
    </div>
  );
}
