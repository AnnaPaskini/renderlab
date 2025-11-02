"use client";

import {
  ReactNode,
  ReactElement,
  isValidElement,
  cloneElement,
  useState,
  useEffect,
} from "react";
import { motion } from "framer-motion";
import { CollectionsPanel } from "./CollectionPanel";
import { PromptTemplates } from "./PromptTemplates";
import { Z } from "@/lib/z-layer-guide";
import { Toaster } from "react-hot-toast";

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

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedImage]);

  const enhancedRightPanel = isValidElement(rightPanel)
    ? cloneElement(rightPanel as ReactElement<any>, {
        activeTab,
        onTabChange: setActiveTab,
      })
    : rightPanel;

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground dot-grid">
      {/* GRID BACKGROUND */}
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

      {/* MAIN CONTENT */}
      <div className={`pt-20 md:pt-24 px-4 md:px-8 pb-8 min-h-screen flex flex-col relative z-[${Z.LOW}]`}>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "builder"
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            🧩 Builder
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "custom"
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            📁 Custom
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 w-full"
        >
          {activeTab === "builder" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col gap-6">
                <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                  {leftPanel}
                  <div className={`pointer-events-none absolute inset-0 z-[${Z.TOAST}]`}>
                    <Toaster
                      position="bottom-right"
                      reverseOrder={false}
                      gutter={8}
                      containerStyle={{ position: "absolute" }}
                      toastOptions={{
                        duration: 1800,
                        className:
                          "pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg",
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
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-4">Images History</h3>
                  <div className="h-[20vh] bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 overflow-hidden">
                    {uploadedImage || previews.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto h-full">
                        {[...previews].reverse().map((preview, idx) => (
                          <div
                            key={idx}
                            className="relative flex-shrink-0 w-32 h-full cursor-pointer rounded-lg overflow-hidden group transition-transform hover:scale-105"
                            onClick={() => setSelectedImage(preview)}
                          >
                            <img
                              src={preview}
                              alt={`Preview ${previews.length - idx}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              #{previews.length - idx}
                            </div>
                          </div>
                        ))}
                        {uploadedImage && (
                          <div
                            className="relative flex-shrink-0 w-32 h-full cursor-pointer rounded-lg overflow-hidden group transition-transform hover:scale-105"
                            onClick={() => setSelectedImage(uploadedImage)}
                          >
                            <img
                              src={uploadedImage}
                              alt="Uploaded"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Original
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-neutral-500 dark:text-neutral-400">
                        No images yet. Upload an image to start!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col h-full">
                {enhancedRightPanel}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                {leftPanel}
                <div className={`pointer-events-none absolute inset-0 z-[${Z.TOAST}]`}>
                  <Toaster
                    position="bottom-right"
                    reverseOrder={false}
                    gutter={8}
                    containerStyle={{ position: "absolute" }}
                    toastOptions={{
                      duration: 1800,
                      className:
                        "pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg",
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
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                <PromptTemplates activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-4">Images History</h3>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-auto shadow-sm hover:shadow-md transition-shadow">
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
            className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4"
          >
            {bottomPanel}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default WorkspaceLayout;
