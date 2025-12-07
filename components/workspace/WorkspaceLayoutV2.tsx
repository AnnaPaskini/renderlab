"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Edit, Maximize, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";

import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImagePreviewModal from "@/components/workspace/ImagePreviewModal";
import { SkeletonCard } from "@/components/workspace/SkeletonCard";

// ============================================================================
// TYPES
// ============================================================================

interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
  model?: string;
  type?: string;
}

interface WorkspaceLayoutV2Props {
  /** Left column content: Upload, URL input, Prompt, Generate, Pills, Advanced */
  children: ReactNode;
  /** History images for right column */
  historyImages: PreviewImage[];
  /** Callback when image is removed from history view */
  onRemoveFromHistory?: (id: string) => void;
  /** Callback to refetch history */
  onRefetchHistory?: () => void;
  /** Whether generation is in progress */
  isGenerating?: boolean;
}

// ============================================================================
// HISTORY CARD COMPONENT
// ============================================================================

function HistoryCard({
  image,
  onRemove,
  onView,
}: {
  image: PreviewImage;
  onRemove?: (id: string) => void;
  onView?: () => void;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleViewInEdit = () => {
    const fullUrl = image.url;
    const safeUrl = fullUrl + (fullUrl.includes("?") ? "&download=1" : "?download=1");
    router.push(`/inpaint?image=${encodeURIComponent(safeUrl)}`);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const contentType = response.headers.get('content-type') || 'image/png';
      const originalBlob = await response.blob();
      // Recreate blob with explicit type to preserve metadata for macOS Finder
      const blob = new Blob([originalBlob], { type: contentType });

      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renderlab-${image.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${hours}:${minutes}`;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", image.url);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleUpscale = () => {
    router.push(`/upscale?image=${encodeURIComponent(image.url)}`);
  };

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-[#141414] cursor-pointer group"
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDropdownOpen) setIsHovered(false);
      }}
      onClick={onView}
    >
      {/* Image */}
      <img
        src={image.thumbnail_url || image.url}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Date Badge - bottom left */}
      <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
        {formatDateTime(image.created_at)}
      </div>

      {/* Model Badge - top left (orange for generation, purple for upscale) */}
      {image.model && (
        <div
          className="absolute top-1.5 left-1.5 text-white text-[9px] font-medium px-2 py-0.5 rounded-md"
          style={{
            background: image.type === 'upscale'
              ? 'rgba(168, 85, 247, 0.3)'
              : 'rgba(255, 107, 53, 0.6)',
            border: image.type === 'upscale'
              ? '1px solid rgba(168, 85, 247, 0.3)'
              : '1px solid rgba(255, 107, 53, 0.3)',
          }}
        >
          {image.model}
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/40 transition-opacity" />
      )}

      {/* 3-dot Menu Button with Radix Dropdown */}
      {(isHovered || isDropdownOpen) && (
        <DropdownMenu open={isDropdownOpen} onOpenChange={(open) => {
          setIsDropdownOpen(open);
          if (!open) setIsHovered(false);
        }}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/70 border border-white/20 rounded flex items-center justify-center hover:bg-black/90 transition-colors z-10"
            >
              <MoreVertical size={12} className="text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto p-0.5" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleDownload} className="text-[11px] py-1 px-2 gap-1.5 flex-row">
              <Download className="w-3 h-3" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewInEdit} className="text-[11px] py-1 px-2 gap-1.5 flex-row">
              <Edit className="w-3 h-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpscale} className="text-[11px] py-1 px-2 gap-1.5 flex-row">
              <Maximize className="w-3 h-3" />
              Upscale
            </DropdownMenuItem>
            {onRemove && (
              <>
                <DropdownMenuSeparator className="my-0.5" />
                <DropdownMenuItem variant="danger" onClick={() => onRemove(image.id)} className="text-[11px] py-1 px-2 gap-1.5 flex-row">
                  <Trash2 className="w-3 h-3" />
                  Remove from view
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

export function WorkspaceLayoutV2({
  children,
  historyImages,
  onRemoveFromHistory,
  onRefetchHistory,
  isGenerating = false,
}: WorkspaceLayoutV2Props) {
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);

  // Greeting name
  const greetingName = useMemo(() => {
    const displayName = user?.user_metadata?.full_name?.trim() || user?.email || "Creator";
    if (!displayName) return "Creator";
    const trimmed = displayName.trim();
    if (!trimmed) return "Creator";
    const base = trimmed.includes(" ") ? trimmed.split(" ")[0] : trimmed;
    const nameFromEmail = base.includes("@") ? base.split("@")[0] : base;
    if (!nameFromEmail) return "Creator";
    return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
  }, [user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedImageIndex === null) return;
    document.body.style.overflow = "hidden";
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImageIndex(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedImageIndex]);

  // Sync History height with Left column
  useEffect(() => {
    const updateHeight = () => {
      if (leftColumnRef.current) {
        setLeftColumnHeight(leftColumnRef.current.offsetHeight);
      }
    };

    updateHeight();

    // Use ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(updateHeight);
    if (leftColumnRef.current) {
      resizeObserver.observe(leftColumnRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <main className="flex flex-col min-h-screen w-full">
      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      <div className="flex-1 px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Hey, {greetingName} — keep crafting!
          </h1>
          <p className="text-sm text-gray-400 mb-4">
            Create stunning architectural visualizations with AI
          </p>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Link href="/batch">
              <RenderLabButton variant="gradient" size="sm">
                Batch Studio
              </RenderLabButton>
            </Link>
            <Link href="/inpaint">
              <RenderLabButton variant="outline" size="sm" className="border-white/[0.12]">
                Edit / Inpaint
              </RenderLabButton>
            </Link>
          </div>
        </div>

        {/* Main Grid: 65% Left / 35% Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6 max-w-[1600px] mx-auto items-start"
        >
          {/* ============================================================== */}
          {/* LEFT COLUMN: Work Area */}
          {/* ============================================================== */}
          <div
            ref={leftColumnRef}
            className="rl-panel-wrapper"
          >
            {children}
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: History — height matches left column */}
          {/* ============================================================== */}
          <div
            className="rl-panel-wrapper-compact flex flex-col"
            style={{
              height: leftColumnHeight ? `${leftColumnHeight}px` : "auto",
              minHeight: "400px",
            }}
          >
            {/* History Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">History</h2>
              <Link
                href="/history"
                className="text-sm text-[#ff6b35] hover:text-[#ff8555] font-medium transition-colors"
              >
                View all →
              </Link>
            </div>

            {/* History Grid - Scrollable */}
            <div
              className="flex-1 overflow-y-auto rounded-xl p-3"
              style={{
                background: "rgba(15, 15, 15, 0.6)",
                boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
              }}
            >
              {historyImages.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                  <div className="aspect-[4/3] bg-white/[0.015] rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {isGenerating && <SkeletonCard isGenerating={isGenerating} />}
                  {historyImages.map((img, index) => (
                    <HistoryCard
                      key={img.id}
                      image={img}
                      onRemove={onRemoveFromHistory}
                      onView={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && historyImages[selectedImageIndex] && (
          <ImagePreviewModal
            key={historyImages[selectedImageIndex].id}
            src={historyImages[selectedImageIndex].url}
            onClose={() => setSelectedImageIndex(null)}
            images={historyImages.map((img) => ({ id: img.id, url: img.url }))}
            currentIndex={selectedImageIndex}
            onNavigate={setSelectedImageIndex}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default WorkspaceLayoutV2;
