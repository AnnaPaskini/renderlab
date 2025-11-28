"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface RenderLabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outline" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function RenderLabButton({
  children,
  variant = "filled",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}: RenderLabButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--rl-accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variants = {
    filled:
      "bg-[var(--rl-accent)] text-white hover:bg-[var(--rl-accent-hover)] shadow hover:shadow-lg",
    outline:
      "border border-[var(--rl-border)] text-[var(--rl-text)] bg-transparent hover:bg-[var(--rl-surface)]/70 hover:border-[var(--rl-accent)]",
    gradient:
      "premium-generate-button",
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
}
