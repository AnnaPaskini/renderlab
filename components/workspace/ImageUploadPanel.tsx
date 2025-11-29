"use client";

import { defaultToastStyle } from "@/lib/toast-config";
import clsx from "clsx";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ImageUploadPanelProps {
  onImageChange: (image: string | null) => void;
  image: string | null;
  onClearImage?: () => void;
  onFileChange?: (file: File) => void;
}

export function ImageUploadPanel({ image, onImageChange, onClearImage, onFileChange }: ImageUploadPanelProps) {
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
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size should be less than 100MB", { style: defaultToastStyle });
        return;
      }

      onFileChange?.(file);
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
      
      // Check if it's a URL from History drag
      const droppedUrl = e.dataTransfer.getData("text/plain");
      if (droppedUrl && (droppedUrl.startsWith("http://") || droppedUrl.startsWith("https://"))) {
        onImageChange(droppedUrl);
        toast.success("Image loaded from History", { style: defaultToastStyle });
        return;
      }
      
      // Otherwise handle as file
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile, onImageChange]
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
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 p-16 sm:max-h-[65vh] lg:max-h-[70vh] cursor-pointer border !border-dashed",
            isDragActive
              ? "bg-black/40 border-white/40 shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_0_30px_rgba(139,92,246,0.03)]"
              : "bg-black/30 border-white/30 hover:bg-black/40 hover:border-white/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.10)]"
          )}
        >
          <label className="relative z-20 flex flex-col items-center justify-center cursor-pointer text-center w-full">
            <div className="mb-3">
              <svg className="w-10 h-10 mx-auto text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-white/80 mb-2">
              Drag & Drop your image
            </p>
            <p className="text-sm text-white/40">
              or click to upload
            </p>
            <p className="mt-2 text-xs text-white/30">
              JPG, PNG, WebP • Max 50 MB
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
            "relative mx-auto flex min-h-[360px] max-h-[60vh] w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 p-6 sm:max-h-[65vh] lg:max-h-[70vh] cursor-pointer border !border-dashed",
            isDragActive
              ? "bg-black/20 border-white/40 shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_0_30px_rgba(139,92,246,0.03)]"
              : "bg-transparent border-white/30 hover:border-white/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.10)]"
          )}
        >
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
                bg-rl-surface px-4 py-2 text-sm font-medium text-rl-text shadow-lg ring-1 ring-white/40  rounded-lg pointer-events-none dark:bg-rl-surface text-rl-text"
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
          <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
          <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
          <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
          <span className="text-sm">Loading image...</span>
        </motion.div>
      )}
    </div>
  );
}
