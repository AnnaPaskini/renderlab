"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      // Reset closing state after animation completes if needed
      setIsClosing(false);
    }, 200); // Match animation duration
  }, [onClose]);

  useEffect(() => {
    if (!imageUrl) return;

    // Reset states when modal opens
    setIsClosing(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });

    // Lock body scroll when modal is open
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [imageUrl, handleClose]);

  // Mouse wheel zoom
  useEffect(() => {
    if (!imageUrl) return;

    const handleWheel = (e: WheelEvent) => {
      if (!imageRef.current?.contains(e.target as Node)) return;

      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => {
        const newScale = prev + delta;
        return Math.max(0.5, Math.min(3, newScale));
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [imageUrl]);

  if (!imageUrl) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          {/* Fixed overlay backdrop - prevents flickering */}
          <div
            className="absolute inset-0 bg-black/90 "
            style={{ zIndex: 1 }}
            onClick={handleClose}
          />

          {/* Controls layer */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
            {/* Zoom controls - top left */}
            <div className="absolute top-4 left-4 flex gap-2 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={scale >= 3}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              <div className="px-3 py-2 bg-white/10 rounded-full text-white text-sm font-medium">
                {Math.round(scale * 100)}%
              </div>
            </div>

            {/* Helper text */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center pointer-events-none">
              Scroll to zoom • Double-click to reset • ESC or click outside to close
            </div>
          </div>

          {/* Image container - centered layer */}
          <motion.div
            ref={imageRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: isClosing ? 0.95 : 1, opacity: isClosing ? 0 : 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-center justify-center"
            style={{ zIndex: 2 }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              }}
              draggable={false}
            />

            {/* Close button - top right, offset outside image */}
            <button
              onClick={handleClose}
              className="absolute top-2 -right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Download button - bottom right, offset outside image */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `renderlab-image-${Date.now()}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Download failed:', error);
                }
              }}
              className="absolute bottom-2 -right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
              title="Download"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
