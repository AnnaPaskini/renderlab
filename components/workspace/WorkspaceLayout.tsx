"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Toaster } from "react-hot-toast";

import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { Z } from "@/lib/z-layer-guide";
import { Download, Eye, MoreVertical, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ImagePreviewModal from "./ImagePreviewModal";


interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
}

interface PreviewThumbnailProps {
  image: PreviewImage;
  onRemove?: (id: string) => void;
  onView?: (url: string) => void;
}

function PreviewThumbnail({ image, onRemove, onView }: PreviewThumbnailProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleViewInEdit = () => {
    // Take full URL, NOT thumbnail
    const fullUrl = image.url;
    // Add safe flag: if url contains ? → add &download=1, if not → ?download=1
    const safeUrl = fullUrl + (fullUrl.includes('?') ? '&download=1' : '?download=1');
    // Redirect: /inpaint?image=<encodeURIComponent(fullUrl)>
    router.push(`/inpaint?image=${encodeURIComponent(safeUrl)}`);
  };

  const handleView = () => {
    if (onView) {
      onView(image.url);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
    setShowMenu(false);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(image.id);
    }
    setShowMenu(false);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}${month} ${hours}:${minutes}`;
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#1a1a1a',
        cursor: 'pointer',
      }}
    >
      <img
        src={image.thumbnail_url || image.url}
        alt="Preview"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Date/Time tag - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '6px',
          right: '6px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '9px',
          fontWeight: '500',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 10,
        }}
      >
        {formatDateTime(image.created_at)}
      </div>

      {/* 3-dot menu button - top right */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreVertical size={12} color="white" />
        </button>
      )}

      {/* Dropdown menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '6px',
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '4px',
            zIndex: 30,
            minWidth: '100px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '11px',
              background: 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Download size={10} />
            Download
          </button>
          <button
            onClick={handleViewInEdit}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '11px',
              background: 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Eye size={10} />
            Edit (Inpaint)
          </button>
          {onRemove && (
            <button
              onClick={handleRemove}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '11px',
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '4px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={10} />
              Remove from view
            </button>
          )}
        </div>
      )}

      {/* Hover overlay with View icon */}
      {isHovered && !showMenu && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <button
            onClick={handleView}
            style={{
              padding: '8px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <Eye size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

interface WorkspaceLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  bottomPanel?: ReactNode;
  uploadedImage?: string | null;
  previews?: string[];
  previewImages?: PreviewImage[];
  onRemovePreview?: (id: string) => void;
}

export function WorkspaceLayout({
  leftPanel,
  rightPanel,
  bottomPanel,
  uploadedImage,
  previews = [],
  previewImages = [],
  onRemovePreview,
}: WorkspaceLayoutProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const previewTimestampsRef = useRef<Map<string, string>>(new Map());

  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name?.trim() || user?.email || "Creator";
  const avatarUrl = user?.user_metadata?.avatar_url || "/default-avatar.png";


  const greetingName = useMemo(() => {
    if (!displayName) {
      return "Creator";
    }

    const trimmed = displayName.trim();
    if (!trimmed) {
      return "Creator";
    }

    const base = trimmed.includes(" ") ? trimmed.split(" ")[0] : trimmed;
    const nameFromEmail = base.includes("@") ? base.split("@")[0] : base;

    if (!nameFromEmail) {
      return "Creator";
    }

    return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
  }, [displayName]);

  useEffect(() => {
    if (selectedImageIndex === null) {
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedImageIndex]);

  useEffect(() => {
    const map = previewTimestampsRef.current;

    previews.forEach((url) => {
      if (typeof url === "string" && url.trim().length > 0 && !map.has(url)) {
        map.set(url, new Date().toISOString());
      }
    });

    const activeUrls = new Set(previews);
    Array.from(map.keys()).forEach((key) => {
      if (!activeUrls.has(key)) {
        map.delete(key);
      }
    });
  }, [previews]);

  const reversedPreviews = useMemo(() => {
    return [...previews].reverse();
  }, [previews]);

  const enhancedRightPanel = rightPanel;

  return (
    <main
      className="flex flex-col min-h-screen w-full transition-colors duration-300"
    >
      <div className="relative flex-1">
        <div className={`relative z-[${Z.LOW}] flex min-h-full flex-col gap-rl-xl px-rl-lg pb-10 pt-24 md:px-rl-xl md:pt-28`}>
          {/* Header - Clean text without panel background */}
          <div className="py-8 mb-2">
            <h1 className="text-2xl font-bold text-rl-text mb-1">
              Hey, {greetingName} — keep crafting!
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Create stunning architectural visualizations with AI
            </p>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-6">
              <Link
                href="/inpaint"
                className="rl-btn-secondary text-base font-semibold px-6 py-2.5 min-w-[110px] inline-flex items-center justify-center"
              >
                Edit in Inpaint
              </Link>
              <Link
                href="/custom"
                className="rl-btn-secondary text-base font-semibold px-6 py-2.5 min-w-[110px] inline-flex items-center justify-center"
              >
                Manage Templates
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full max-w-[1600px] mx-auto px-8 mt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] lg:grid-cols-[65fr_35fr] gap-8 w-full">
              <div className="flex flex-col gap-10">
                <div
                  className="rounded-3xl p-6 border border-white/[0.06] flex-[2]"
                  style={{
                    background: '#1a1a1a',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {leftPanel}
                  <div className={`pointer-events-none absolute inset-0 z-[${Z.TOASTER}]`}>
                    <Toaster
                      position="bottom-right"
                      reverseOrder={false}
                      gutter={8}
                      containerStyle={{ position: "absolute" }}
                      toastOptions={{
                        duration: 1800,
                        className: "pointer-events-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-lg",
                        style: {
                          backgroundColor: "rgba(var(--background-end-rgb), 0.92)",
                          color: "rgb(var(--foreground-rgb))",
                          border: "1px solid rgba(var(--foreground-rgb), 0.12)",
                          boxShadow: "0 16px 32px rgba(15, 15, 35, 0.18)",
                          backdropFilter: "blur(8px)",
                        },
                      }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-3xl p-6 border border-white/[0.06] flex-[1]"
                  style={{
                    background: '#1a1a1a',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-rl-text">Images History</h3>
                    <Link
                      href="/history"
                      className="text-sm text-rl-accent hover:text-rl-accent-hover font-medium transition-colors hover:underline"
                    >
                      View all →
                    </Link>
                  </div>
                  {/* Inset preview strip container */}
                  <div
                    className="rounded-xl p-3 flex items-center justify-center"
                    style={{
                      background: '#0f0f0f',
                      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(0, 0, 0, 0.5)',
                      minHeight: '20vh'
                    }}
                  >
                    {previewImages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm font-medium text-rl-text-secondary">
                        <Link href="/history" className="text-rl-accent hover:text-rl-accent-hover transition-colors">
                          View your generated images →
                        </Link>
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-5 gap-2">
                        {previewImages.slice(0, 5).map((img, index) => (
                          <PreviewThumbnail
                            key={img.id}
                            image={img}
                            onRemove={onRemovePreview}
                            onView={() => setSelectedImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-full">
                <div
                  className="h-full rounded-3xl p-6 border border-white/[0.06] flex flex-col"
                  style={{
                    background: '#1a1a1a',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {enhancedRightPanel}
                </div>
              </div>
            </div>
          </motion.div>

          {bottomPanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-2 border-t border-white/10 pt-4"
            >
              {bottomPanel}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedImageIndex !== null && (
          <ImagePreviewModal
            key={previewImages[selectedImageIndex]?.id}
            src={previewImages[selectedImageIndex]?.url}
            onClose={() => setSelectedImageIndex(null)}
            images={previewImages.map(img => ({ id: img.id, url: img.url }))}
            currentIndex={selectedImageIndex}
            onNavigate={setSelectedImageIndex}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default WorkspaceLayout;
