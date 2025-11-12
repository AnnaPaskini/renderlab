"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RenderLabPanelProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: "left" | "right" | "floating";
  className?: string;
}

export function RenderLabPanel({
  title,
  icon,
  children,
  variant = "left",
  className,
}: RenderLabPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] shadow-md backdrop-blur-md transition-all duration-300",
        variant === "floating" && "p-6 shadow-lg",
        variant !== "floating" && "p-4",
        className
      )}
    >
      {title && (
        <header className="flex items-center gap-2 pb-3 border-b border-[var(--rl-border)] mb-3">
          {icon && <div className="text-[var(--rl-accent)]">{icon}</div>}
          <h2 className="text-[var(--rl-text)] text-lg font-medium">{title}</h2>
        </header>
      )}
      <div className="text-[var(--rl-text-secondary)]">{children}</div>
    </section>
  );
}
