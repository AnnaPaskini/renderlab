"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster } from "react-hot-toast";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { useHistory } from "@/lib/context/HistoryContext";
import { Z } from "@/lib/z-layer-guide";
import { CollectionsPanel } from "./CollectionPanel";
import ImagePreviewModal from "./ImagePreviewModal";
import { PanelWrapper } from "./PanelWrapper";
import { PromptTemplates } from "./PromptTemplates";


interface WorkspaceLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  bottomPanel?: ReactNode;
  uploadedImage?: string | null;
  previews?: string[];
}

export function WorkspaceLayout({
  leftPanel,
  rightPanel,
  bottomPanel,
  uploadedImage,
  previews = [],
}: WorkspaceLayoutProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "custom">("builder");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const previewTimestampsRef = useRef<Map<string, string>>(new Map());

  const { user } = useAuth();
  const { groups, loading: historyLoading, refresh } = useHistory();

  // Get last 5 generations from user history with deduplication
  const recentGenerations = useMemo(() => {
    return groups
      .flatMap(group => group.images)
      .filter((img, index, self) =>
        index === self.findIndex(i => i.id === img.id)
      ) // Deduplicate by id
      .slice(0, 5);
  }, [groups]);

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
    if (!selectedImage) {
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedImage]);

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

  const enhancedRightPanel = isValidElement(rightPanel)
    ? cloneElement(rightPanel as ReactElement<any>, {
      activeTab,
      onTabChange: setActiveTab,
    })
    : rightPanel;

  return (
    <main
      className="flex flex-col min-h-screen w-full transition-colors duration-300"
      style={{
        background: `
          radial-gradient(circle, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          radial-gradient(circle at 30% 40%, rgba(255, 107, 53, 0.02) 0%, transparent 60%),
          radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.02) 0%, transparent 60%),
          #0a0a0a
        `,
        backgroundSize: '32px 32px, 100% 100%, 100% 100%, 100% 100%',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0'
      }}
    >
      <div className="relative flex-1">
        <div className="dot-grid absolute inset-0" aria-hidden="true" />
        <div
          className={`absolute inset-0 z-[${Z.BASE}] opacity-40 dark:opacity-20`}
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(120,120,255,0.05) 25%, rgba(120,120,255,0.05) 26%, transparent 27%, transparent 74%, rgba(120,120,255,0.05) 75%, rgba(120,120,255,0.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(120,120,255,0.05) 25%, rgba(120,120,255,0.05) 26%, transparent 27%, transparent 74%, rgba(120,120,255,0.05) 75%, rgba(120,120,255,0.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className={`relative z-[${Z.LOW}] flex min-h-full flex-col gap-rl-xl px-rl-lg pb-10 pt-16 md:px-rl-xl md:pt-20`}>
          {/* Header - Clean text without panel background */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-rl-text mb-1">
              Hey, {greetingName} — keep crafting!
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Create stunning architectural visualizations with AI
            </p>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("builder")}
                className={`rl-btn-${activeTab === "builder" ? "primary" : "secondary"} text-base font-semibold px-6 py-2.5 min-w-[110px]`}
              >
                Builder
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`rl-btn-${activeTab === "custom" ? "primary" : "secondary"} text-base font-semibold px-6 py-2.5 min-w-[110px]`}
              >
                Edit
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full max-w-[1600px] mx-auto px-8"
          >
            {activeTab === "builder" ? (
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
                      className="rounded-xl p-5 flex items-center justify-center"
                      style={{
                        background: '#0f0f0f',
                        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(0, 0, 0, 0.5)',
                        minHeight: '16vh'
                      }}
                    >
                      {historyLoading ? (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-rl-text-secondary">
                          Loading history...
                        </div>
                      ) : recentGenerations.length > 0 ? (
                        <div className="flex h-full gap-4 overflow-x-auto">
                          <AnimatePresence initial={false}>
                            {recentGenerations.map((img, idx) => {
                              const formattedTimestamp = format(new Date(img.created_at), "MMM d, yy");

                              const handleDownload = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!img.image_url) return;
                                try {
                                  const response = await fetch(img.image_url);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `renderlab-${img.id}.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Download failed:', error);
                                }
                              };

                              const handleRemoveFromView = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                try {
                                  const response = await fetch(`/api/images/${img.id}/hide`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ hidden: true })
                                  });

                                  const result = await response.json();
                                  if (!result.success) throw new Error(result.error);

                                  // Show success toast
                                  toast.success('Removed from preview strip', {
                                    description: 'Image is still available in History',
                                    duration: 3000,
                                  });

                                  // Smooth refresh - AnimatePresence will handle the exit animation
                                  await refresh();
                                } catch (error: any) {
                                  console.error('Remove failed:', error);
                                  toast.error('Failed to remove image');
                                }
                              };

                              return (
                                <motion.div
                                  key={`history-${img.id}-${img.created_at}-${idx}`}
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.3 }}
                                  className="group relative flex h-full w-44 cursor-pointer flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.06] transition-all duration-200"
                                  style={{
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onClick={() => setSelectedImage(img.image_url || null)}
                                >
                                  <img
                                    src={img.thumb_url || img.image_url || ''}
                                    alt={`Generation ${idx + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full rounded-lg object-cover transition-opacity duration-300"
                                  />

                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100">
                                    {/* X button - Top-right (hover only) */}
                                    <button
                                      onClick={handleRemoveFromView}
                                      className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full shadow-lg transition-colors"
                                      title="Remove from preview strip"
                                    >
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>

                                    {/* Download button - Bottom-right (hover only) */}
                                    <button
                                      onClick={handleDownload}
                                      className="absolute bottom-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full shadow-lg transition-colors"
                                      title="Download"
                                    >
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Date label - Bottom-left (always visible) */}
                                  <div className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white pointer-events-none">
                                    {formattedTimestamp}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-rl-text-secondary">
                          No generations yet.
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
            ) : (
              <div className="flex flex-col md:flex-row gap-10 w-full">
                <div className="md:flex-1">
                  <PanelWrapper>
                    <PromptTemplates activeTab={activeTab} setActiveTab={setActiveTab} />
                  </PanelWrapper>
                </div>
                <div className="md:flex-1">
                  <PanelWrapper>
                    <CollectionsPanel />
                  </PanelWrapper>
                </div>
              </div>
            )}
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
        {selectedImage && (
          <ImagePreviewModal
            key={selectedImage}
            src={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default WorkspaceLayout;
