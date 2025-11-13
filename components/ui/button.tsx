"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * RenderLab Button — hybrid of ShadCN logic + Aceternity visuals.
 * Compatible with Radix Slot for polymorphic composition.
 * LUXURY: Default variant uses gradient background with shimmer effect.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rl-accent)] focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rl-btn-primary",
        secondary:
          "bg-[var(--rl-panel)] text-[var(--rl-text)] hover:bg-[var(--rl-surface-elevated)] border border-[var(--rl-border)]",
        ghost:
          "text-[var(--rl-text)] hover:bg-[var(--rl-panel)]",
        outline:
          "border border-[var(--rl-border)] hover:bg-[var(--rl-panel)] text-[var(--rl-text)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-6 text-sm",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
