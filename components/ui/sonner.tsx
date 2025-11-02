"use client";

import type { CSSProperties } from "react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";

type ExtendedToasterProps = ToasterProps & {
  /**
   * Alias for react-hot-toast compatibility; ignored by Sonner but accepted by our wrapper.
   */
  reverseOrder?: boolean;
  /**
   * Alias for react-hot-toast compatibility; maps to Sonner's `gap` prop.
   */
  gutter?: number;
  /**
    * Allows container level styling similar to react-hot-toast.
    */
  containerStyle?: CSSProperties;
};

const defaultToastOptions: ToasterProps["toastOptions"] = {
  duration: 1800,
  classNames: {
    toast:
      "rounded-2xl backdrop-blur-md bg-white/10 dark:bg-neutral-900/60 text-white text-sm shadow-md border border-white/10",
  },
};

export function Toaster({
  reverseOrder,
  gutter,
  containerStyle,
  toastOptions,
  gap,
  style,
  position = "bottom-right",
  ...props
}: ExtendedToasterProps) {
  const mergedToastOptions = {
    ...defaultToastOptions,
    ...toastOptions,
    classNames: {
      ...defaultToastOptions?.classNames,
      ...toastOptions?.classNames,
      toast: [
        defaultToastOptions?.classNames?.toast,
        toastOptions?.classNames?.toast,
      ]
        .filter(Boolean)
        .join(" "),
    },
  };

  return (
    <SonnerToaster
      {...props}
      position={position}
      gap={gutter ?? gap}
      toastOptions={mergedToastOptions}
      style={{ ...style, ...containerStyle }}
      data-sonner-reverse={reverseOrder ? "" : undefined}
    />
  );
}

export { toast };
