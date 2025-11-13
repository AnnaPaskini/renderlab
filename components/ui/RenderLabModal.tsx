"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface RenderLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function RenderLabModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: RenderLabModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="rl-modal-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1]
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "rl-modal relative mx-4 max-h-[90vh] overflow-y-auto",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header with Close Button */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between mb-6">
                {title && (
                  <h2 id="modal-title" className="rl-heading-2">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      "text-[var(--rl-text-tertiary)] hover:text-[var(--rl-text-primary)]",
                      "hover:bg-[var(--rl-bg-surface)]",
                      !title && "ml-auto"
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
