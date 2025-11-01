"use client";

import { useState, useCallback } from "react";
import { Upload, Check } from "lucide-react";
import { motion } from "framer-motion";

interface ImageUploadPanelProps {
  onImageChange: (image: string | null) => void;
  image: string | null;
}

export function ImageUploadPanel({ image, onImageChange }: ImageUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Drag handler
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  // Convert file to base64
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
      const files = [...e.dataTransfer.files];
      if (files && files[0]) processFile(files[0]);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
        Upload Image
      </h2>

      {!image ? (
        // Drop zone - increased height by 25%
        <motion.div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          className={`flex-1 min-h-[350px] border-2 border-dashed rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-900/50"
          }`}
        >
          <label className="w-full h-full flex items-center justify-center cursor-pointer p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Upload
                  size={24}
                  className="text-neutral-500 dark:text-neutral-400"
                />
              </div>
              <p className="text-neutral-900 dark:text-neutral-100 font-semibold text-base mb-2">
                Drag and drop your image here
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                or click to browse
              </p>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-2">
                JPG, PNG • Max 50MB
              </p>
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
      ) : (
        // Preview section
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="flex-1 min-h-[350px] relative rounded-xl overflow-hidden group"
        >
          <div className={`flex items-center justify-center w-full h-full min-h-[350px] bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden border-2 transition-all ${
            isDragActive
              ? "border-blue-500 border-dashed"
              : "border-neutral-200 dark:border-neutral-700"
          }`}>
            <img
              src={image}
              alt="Uploaded"
              className="object-contain w-auto h-auto max-h-full max-w-full"
            />
          </div>

          {/* Drag overlay indicator */}
          {isDragActive && (
            <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none rounded-xl">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                Drop to replace image
              </div>
            </div>
          )}

          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

          {/* Click to replace overlay */}
          <label className="absolute inset-0 cursor-pointer group/replace">
            <div className="absolute inset-0 bg-black/0 group-hover/replace:bg-black/5 transition-colors duration-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/replace:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-neutral-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg pointer-events-none">
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

          {/* Ready badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg"
          >
            <Check size={12} strokeWidth={3} /> Ready
          </motion.div>

          {/* Remove button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onImageChange(null)}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-lg backdrop-blur-sm"
            title="Remove image"
          >
            Clear
          </motion.button>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400"
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
