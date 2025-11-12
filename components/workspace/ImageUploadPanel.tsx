"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import { defaultToastStyle } from "@/lib/toast-config";

interface ImageUploadPanelProps {
  onImageChange: (image: string | null) => void;
  image: string | null;
  onClearImage?: () => void;
}

export function ImageUploadPanel({ image, onImageChange, onClearImage }: ImageUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
        toast.error("Please upload a JPG, PNG, or WebP image", { style: defaultToastStyle });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size should be less than 50MB", { style: defaultToastStyle });
        return;
      }

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target?.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        toast.error("Error reading file", { style: defaultToastStyle });
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
  <h2 className="text-lg font-semibold tracking-tight text-rl-text">
          Upload Image
        </h2>
        {image && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1.2, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (onClearImage) {
                onClearImage();
              } else {
                onImageChange(null);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rl-glass-border bg-rl-panel px-3 py-1.5 text-sm font-semibold text-rl-text shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-colors hover:bg-rl-panel-hover"
          >
            <X size={8} strokeWidth={2} />
            Clear
          </motion.button>
        )}
      </div>

      {/* --- DROP ZONE --- */}
      {!image ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-rl-glass-border bg-rl-panel p-6 backdrop-blur-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-200 sm:max-h-[65vh] lg:max-h-[70vh]",
            isDragActive && "ring-2 ring-fuchsia-300/60"
          )}
        >
          <div
            className={`pointer-events-none absolute inset-4 rounded-[20px] border-2 border-dashed transition-colors ${
              isDragActive ? "border-blue-400/80" : "border-white/55 dark:border-white/25"
            }`}
          />
          <label className="relative z-20 flex flex-col items-center justify-center cursor-pointer text-center">
            <div className="mb-3 w-14 h-14 flex items-center justify-center rounded-full bg-rl-surface">
              <Upload size={26} className="text-rl-text-secondary" />
            </div>
            <p className="text-base font-semibold text-rl-text">
              Drag and drop your image here
            </p>
            <p className="text-sm font-medium text-rl-text-secondary">
              or click to browse
            </p>
            <p className="mt-2 text-xs font-medium text-rl-text-secondary">
              JPG, PNG, WebP • Max 50 MB
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </motion.div>
      ) : (
        /* --- PREVIEW ZONE --- */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-rl-glass-border bg-rl-panel p-6 backdrop-blur-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-200 sm:max-h-[65vh] lg:max-h-[70vh]",
            isDragActive && "ring-2 ring-fuchsia-300/60"
          )}
        >
          <div
            className={`pointer-events-none absolute inset-4 rounded-[20px] border-2 border-dashed transition-colors ${
              isDragActive ? "border-blue-400/80" : "border-white/55 dark:border-white/25"
            }`}
          />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <div className="relative w-full max-h-[60vh] sm:max-h-[65vh] lg:max-h-[70vh] flex items-center justify-center">
              <img
                src={image}
                alt="Uploaded"
                className="object-contain w-auto h-full max-w-full max-h-full rounded-[10px]"
              />
            </div>
          </div>

          {/* Overlay hint */}
          <label className="absolute inset-0 z-30 cursor-pointer group">
            <div className="absolute inset-0 bg-transparent transition-colors group-hover:bg-black/5" />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                opacity-0 group-hover:opacity-100 transition-opacity 
                bg-rl-surface px-4 py-2 text-sm font-medium text-rl-text shadow-lg ring-1 ring-white/40 backdrop-blur-sm rounded-lg pointer-events-none dark:bg-rl-surface text-rl-text"
            >
              Click to replace
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-rl-text-secondary"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
          <span className="text-sm">Loading image...</span>
        </motion.div>
      )}
    </div>
  );
}
