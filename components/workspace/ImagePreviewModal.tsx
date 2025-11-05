"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Download, X } from "lucide-react";

interface ImagePreviewModalProps {
  src: string;
  onClose: () => void;
}

function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const messageFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxZoomCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingMaxZoomRef = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Закрытие по Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Scroll-zoom (через addEventListener, чтобы обойти passive:true)
  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setIsMessageVisible(true);

    if (messageFadeTimeoutRef.current) {
      clearTimeout(messageFadeTimeoutRef.current);
      messageFadeTimeoutRef.current = null;
    }
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    messageFadeTimeoutRef.current = setTimeout(() => {
      setIsMessageVisible(false);
      messageFadeTimeoutRef.current = null;
    }, 1200);

    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, 1500);
  }, []);

  const resetView = useCallback(() => {
    if (maxZoomCooldownRef.current) {
      clearTimeout(maxZoomCooldownRef.current);
      maxZoomCooldownRef.current = null;
    }
    hasPendingMaxZoomRef.current = false;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setScale((prev) => {
        const next = Math.min(Math.max(prev + delta, 1), 3);
        if (next === 3 && prev === 3) {
          if (!hasPendingMaxZoomRef.current) {
            showMessage("Maximum zoom reached");
            hasPendingMaxZoomRef.current = true;
            maxZoomCooldownRef.current = setTimeout(() => {
              hasPendingMaxZoomRef.current = false;
              maxZoomCooldownRef.current = null;
            }, 2000);
          }
          return prev;
        }
        if (next === 3 && prev < 3 && !hasPendingMaxZoomRef.current) {
          showMessage("Maximum zoom reached");
          hasPendingMaxZoomRef.current = true;
          maxZoomCooldownRef.current = setTimeout(() => {
            hasPendingMaxZoomRef.current = false;
            maxZoomCooldownRef.current = null;
          }, 2000);
        }
        return next;
      });
    };

    img.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      img.removeEventListener("wheel", handleWheel);
    };
  }, [showMessage]);

  useEffect(() => {
    return () => {
      if (messageFadeTimeoutRef.current) {
        clearTimeout(messageFadeTimeoutRef.current);
        messageFadeTimeoutRef.current = null;
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      if (maxZoomCooldownRef.current) {
        clearTimeout(maxZoomCooldownRef.current);
        maxZoomCooldownRef.current = null;
      }
      hasPendingMaxZoomRef.current = false;
    };
  }, []);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    resetView();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-6 right-6 z-[10000] backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 shadow-md shadow-black/40 transition-all duration-200 ease-out active:scale-95"
      >
        <X className="h-5 w-5" />
      </button>

      <a
        href={src}
        download
        aria-label="Download image"
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-6 right-6 z-[10000] backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 shadow-md shadow-black/40 transition-all duration-200 ease-out active:scale-95"
      >
        <Download className="h-5 w-5" />
      </a>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative inline-block"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Изображение */}
        <img
          ref={imageRef}
          src={src}
          alt="Preview"
          draggable={false}
          className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl select-none"
        />
      </div>

      {/* Подсказка */}
      <div className="absolute bottom-6 text-white/80 text-sm select-none">
        Scroll to zoom (×{scale.toFixed(1)}) · Drag to pan · Double-click to reset
      </div>
      {message && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] text-white/80 text-sm bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm transition-opacity duration-300 pointer-events-none ${isMessageVisible ? "opacity-100" : "opacity-0"}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}


export { ImagePreviewModal };
export default ImagePreviewModal;
