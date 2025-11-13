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

import UserMenu from "@/components/navbar/UserMenu";
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
    <main className="rl-ambient-bg flex flex-col min-h-screen w-full bg-rl-bg transition-colors duration-300">
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
          <div className="relative z-10 flex w-full items-center justify-between rounded-2xl bg-rl-panel px-8 py-4 text-sm font-semibold tracking-tight border border-rl-glass-border shadow-[0_2px_10px_rgba(0,0,0,0.05)] md:px-10 md:text-base">
            <div>
              <h1 className="text-2xl font-semibold text-rl-text md:text-3xl">
                Hey, {greetingName} — keep crafting!
              </h1>
              <p className="text-sm font-medium text-rl-text-secondary mt-1">Create stunning architectural visualizations with AI</p>
            </div>
            <div className="flex items-center gap-2">
              <UserMenu />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-rl-md">
            <button
              onClick={() => setActiveTab("builder")}
              className={`rl-btn-${activeTab === "builder" ? "primary" : "secondary"} text-sm`}
            >
              🧩 Builder
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`rl-btn-${activeTab === "custom" ? "primary" : "secondary"} text-sm`}
            >
              📁 Custom
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full max-w-7xl mx-auto"
          >
            {activeTab === "builder" ? (
              <div className="flex flex-col lg:flex-row gap-12 w-full">
                <div className="flex flex-col gap-10 lg:flex-[1.4]">
                  <PanelWrapper>
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
                  </PanelWrapper>

                  <PanelWrapper>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-rl-text">Images History</h3>
                      <Link
                        href="/history"
                        className="text-sm text-rl-accent hover:text-rl-accent-hover font-medium transition-colors hover:underline"
                      >
                        View all →
                      </Link>
                    </div>
                    <div className="h-[20vh] overflow-hidden rounded-xl bg-rl-surface p-4">
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
                                  className="group relative flex h-full w-32 cursor-pointer flex-shrink-0 overflow-hidden rounded-lg transition-transform hover:scale-105"
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
                  </PanelWrapper>
                </div>

                <div className="lg:flex-1">
                  <PanelWrapper>
                    {enhancedRightPanel}
                  </PanelWrapper>
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
