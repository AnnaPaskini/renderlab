"use client";

import {
  ReactNode,
  ReactElement,
  isValidElement,
  cloneElement,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Toaster } from "react-hot-toast";

import { CollectionsPanel } from "./CollectionPanel";
import { PromptTemplates } from "./PromptTemplates";
import ImagePreviewModal from "./ImagePreviewModal";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import UserMenu from "@/components/navbar/UserMenu";
import { Z } from "@/lib/z-layer-guide";
import ImagesHistory from "./ImagesHistory";


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
  <main className="relative z-0 flex min-h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(244,114,182,0.06),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(250,204,21,0.05),transparent_45%),radial-gradient(circle_at_50%_88%,rgba(129,140,248,0.06),transparent_50%)] bg-white/40 text-neutral-900 dark:bg-neutral-950 dark:text-white">
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

        <div className={`relative z-[${Z.LOW}] flex min-h-full flex-col gap-6 px-4 pb-10 pt-16 md:px-8 md:pt-20`}>
          <div className="relative z-10 flex w-full items-center justify-between rounded-2xl border border-white/40 bg-white/85 px-4 py-3 text-sm font-semibold tracking-tight text-white backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)] md:px-8 md:text-base">
            <h1 className="font-semibold text-white">
              Hey, {greetingName} — keep crafting!
            </h1>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-sm font-medium text-neutral-900 shadow-[inset_0_0_6px_rgba(0,0,0,0.04),0_12px_24px_-12px_rgba(12,12,24,0.45)] dark:border-white/20 dark:bg-white/10 dark:text-white sm:flex">
                <img
                  src={avatarUrl || "/default-avatar.png"}
                  alt="User avatar"
                  className="h-7 w-7 flex-shrink-0 rounded-full border border-white/40 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="max-w-[160px] truncate text-neutral-900 dark:text-white">{displayName}</span>
              </div>
              <UserMenu />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Welcome back</h2>
              <p className="text-sm font-medium text-white">Keep crafting stunning visuals with RenderLab.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("builder")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 ${
                activeTab === "builder"
                  ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400"
                  : "border border-white/20 bg-white/15 text-neutral-900 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] hover:bg-white/20 dark:border-white/15 dark:bg-[#141414]/60 dark:text-white"
              }`}
            >
              🧩 Builder
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 ${
                activeTab === "custom"
                  ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400"
                  : "border border-white/20 bg-white/15 text-neutral-900 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] hover:bg-white/20 dark:border-white/15 dark:bg-[#141414]/60 dark:text-white"
              }`}
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
              <div className="grid w-full max-w-[1400px] mx-auto grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
                <div className="flex flex-col gap-6">
                  <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] md:p-8">
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

                  <div className="rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] md:p-8">
                    <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Images History</h3>
                    <div className="h-[20vh] overflow-hidden rounded-xl border border-white/40 bg-white/65 p-4 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:border-white/24 dark:bg-[#111111]/70 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]">
                      {uploadedImage || previews.length > 0 ? (
                        <div className="flex h-full gap-4 overflow-x-auto">
                          <AnimatePresence initial={false}>
                            {reversedPreviews.map((preview, idx) => {
                              const timestampIso = previewTimestampsRef.current.get(preview ?? "");
                              const formattedTimestamp = timestampIso
                                ? format(new Date(timestampIso), "MMM d, yy")
                                : null;

                              return (
                                <motion.div
                                  key={`${preview}-${idx}`}
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.3 }}
                                  className="group relative flex h-full w-32 cursor-pointer flex-shrink-0 overflow-hidden rounded-lg transition-transform hover:scale-105"
                                  onClick={() => setSelectedImage(preview)}
                                >
                                  <img
                                    src={preview}
                                    alt={`Preview ${previews.length - idx}`}
                                    className="h-full w-full rounded-lg object-cover"
                                  />
                                  {formattedTimestamp && (
                                    <div className="absolute top-2 right-2 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white">
                                      {formattedTimestamp}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                            {uploadedImage && (
                              <motion.div
                                key="uploaded-image"
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="group relative flex h-full w-32 cursor-pointer flex-shrink-0 overflow-hidden rounded-lg transition-transform hover:scale-105"
                                onClick={() => setSelectedImage(uploadedImage)}
                              >
                                <img
                                  src={uploadedImage}
                                  alt="Uploaded"
                                  className="h-full w-full rounded-lg object-cover"
                                />
                                <div className="absolute top-2 right-2 rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                                  Original
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-neutral-600 dark:text-white">
                          No images yet. Upload an image to start!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-3xl border border-white/40 bg-white/85 p-6 backdrop-blur-[24px] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:shadow-[inset_-2px_0_4px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)] lg:p-8">
                  {enhancedRightPanel}
                </div>
              </div>
            ) : (
              <div className="grid w-full max-w-[1400px] mx-auto grid-cols-1 gap-6 px-4 py-6 sm:px-6 md:grid-cols-2 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] md:p-8">
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
                <div className="rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]">
                  <PromptTemplates activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] md:p-8">
                  <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                    Images History
                  </h3>
                </div>
                <div className="rounded-3xl border border-white/40 bg-white/65 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]">
                  <CollectionsPanel />
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
