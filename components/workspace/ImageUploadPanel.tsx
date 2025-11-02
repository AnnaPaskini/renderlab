"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="flex flex-col gap-4 w-full h-auto max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-700 dark:text-white">
          Upload Image
        </h2>
        {image && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1.2, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onImageChange(null)}
            className="flex items-center gap-1.5 text-sm font-medium bg-black/70 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm transition-colors"
          >
            <X size={8} strokeWidth={1} />
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
          className={`relative flex flex-col items-center justify-center w-full max-w-full mx-auto min-h-[360px] max-h-[60vh] sm:max-h-[65vh] lg:max-h-[70vh]
            rounded-2xl overflow-hidden p-6 transition-all duration-200 
            before:content-[''] before:absolute before:inset-[1px] before:rounded-[12px]
            before:border-2 before:border-dashed before:pointer-events-none
            before:z-10 
            ${
              isDragActive
                ? "before:border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "before:border-neutral-400 dark:before:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40"
            }`}
        >
          <label className="relative z-20 flex flex-col items-center justify-center cursor-pointer text-center">
            <div className="mb-3 w-14 h-14 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Upload size={26} className="text-neutral-500 dark:text-neutral-400" />
            </div>
            <p className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
              Drag and drop your image here
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              or click to browse
            </p>
            <p className="text-xs mt-2 text-neutral-400 dark:text-neutral-500">
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
          className={`relative flex items-center justify-center w-full max-w-full mx-auto min-h-[360px] max-h-[60vh] sm:max-h-[65vh] lg:max-h-[70vh]
            rounded-2xl overflow-hidden p-6 transition-all duration-200 
            before:content-[''] before:absolute before:inset-[1px] before:rounded-[12px]
            before:border-2 before:border-dashed before:pointer-events-none
            before:z-20
            ${
              isDragActive
                ? "before:border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "before:border-neutral-400 dark:before:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40"
            }`}
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
            <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                opacity-0 group-hover:opacity-100 transition-opacity 
                bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-4 py-2 rounded-lg 
                text-sm font-medium shadow-lg text-neutral-900 dark:text-white pointer-events-none"
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
          className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400 mt-2"
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
