"use client";
import { toast as sonnerToast, ExternalToast } from "sonner";

/**
 * Toast helper with RenderLab theme styling
 * Uses the existing Sonner setup but with theme-aware styling
 */

// Theme-aware toast style
const getToastStyle = (): ExternalToast["style"] => ({
  background: "var(--rl-surface)",
  color: "var(--rl-text)",
  border: "1px solid var(--rl-border)",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
});

// Helper functions with consistent styling
export const showToast = {
  success: (message: string, options?: ExternalToast) => 
    sonnerToast.success(message, { 
      style: getToastStyle(),
      ...options 
    }),
  
  error: (message: string, options?: ExternalToast) => 
    sonnerToast.error(message, { 
      style: getToastStyle(),
      ...options 
    }),
  
  info: (message: string, options?: ExternalToast) => 
    sonnerToast(message, { 
      style: getToastStyle(),
      ...options 
    }),
  
  warning: (message: string, options?: ExternalToast) => 
    sonnerToast.warning(message, { 
      style: getToastStyle(),
      ...options 
    }),

  // Promise toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => 
    sonnerToast.promise(promise, {
      ...messages,
      style: getToastStyle(),
    }),
};

// Re-export the original toast for advanced use cases
export { sonnerToast as toast };
