"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface ImageUploadPanelProps {
  onImageChange: (image: string | null) => void;
  image: string | null;
}

export function ImageUploadPanel({ image, onImageChange }: ImageUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        alert("Please upload a JPG or PNG image");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert("File size should be less than 50MB");
        return;
      }

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target?.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        alert("Error reading file");
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
  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          Upload Image
        </h2>
        {image && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1.2, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onImageChange(null)}
            className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/85 px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-[inset_0_1px_1px_rgба(255,255,255,0.32),0_6px_18px_-8px_rgба(12,12,24,0.3)] transition-colors hover:bg-white/90 dark:border-white/20 dark:bg-[#181818]/80 dark:text-white"
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
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/65 p-6 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-200 dark:border-white/24 dark:bg-[#111111]/70 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] sm:max-h-[65vh] lg:max-h-[70vh]",
            isDragActive && "ring-2 ring-fuchsia-300/60"
          )}
        >
          <div
            className={`pointer-events-none absolute inset-4 rounded-[20px] border-2 border-dashed transition-colors ${
              isDragActive ? "border-blue-400/80" : "border-white/55 dark:border-white/25"
            }`}
          />
          <label className="relative z-20 flex flex-col items-center justify-center cursor-pointer text-center">
            <div className="mb-3 w-14 h-14 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Upload size={26} className="text-neutral-500 dark:text-neutral-400" />
            </div>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              Drag and drop your image here
            </p>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              or click to browse
            </p>
            <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              JPG, PNG • Max 50 MB
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
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
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/65 p-6 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-200 dark:border-white/24 dark:bg-[#111111]/70 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] sm:max-h-[65vh] lg:max-h-[70vh]",
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
                bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg ring-1 ring-white/40 backdrop-blur-sm rounded-lg pointer-events-none dark:bg-neutral-900/90 dark:text-white"
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
          className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300"
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
