"use client"

import {
  ReactNode,
  ReactElement,
  isValidElement,
  cloneElement,
  useState,
  useEffect,
} from "react"
import { motion } from "framer-motion"
import { CollectionsPanel } from "./CollectionPanel"
import { PromptTemplates } from "./PromptTemplates"
import { Z } from "@/lib/z-layer-guide"

interface WorkspaceLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  bottomPanel?: ReactNode
  uploadedImage?: string | null
  previews?: string[]
}

export function WorkspaceLayout({
  leftPanel,
  rightPanel,
  bottomPanel,
  uploadedImage,
  previews = [],
}: WorkspaceLayoutProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "custom">("builder")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // ESC и блокировка скролла на модалке
  useEffect(() => {
    if (!selectedImage) return
    document.body.style.overflow = "hidden"
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null)
    }
    window.addEventListener("keydown", handleEscape)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleEscape)
    }
  }, [selectedImage])

  const enhancedRightPanel = isValidElement(rightPanel)
    ? cloneElement(rightPanel as ReactElement<any>, {
        activeTab,
        onTabChange: setActiveTab,
      })
    : rightPanel

  return (
    <div
  className="relative w-full min-h-screen bg-background text-foreground dot-grid"
  style={
    {
      ["--dot-size" as any]: "20px",   // расстояние между точками
      ["--dot-radius" as any]: "1.2px", // толщина точки
      ["--dot-alpha" as any]: 0.32,    // контраст точек
    } as React.CSSProperties
  }
>
   
      {/* MAIN GRID */}
      <div className={`pt-20 md:pt-24 px-4 md:px-8 pb-8 min-h-screen flex flex-col relative z-[${Z.LOW}]`}>
        {/* Tabs */}
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
          className={
            activeTab === "custom"
              ? "grid grid-cols-2 grid-rows-2 gap-6 flex-1 overflow-hidden min-h-[70vh]"
              : "grid grid-cols-[520px_1fr] gap-6 flex-1 overflow-hidden min-h-[70vh]"
          }
        >
          {activeTab === "builder" ? (
            <>
              {/* LEFT COLUMN */}
              <div className="flex flex-col justify-between h-full gap-6">
                <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                  {leftPanel}
                </div>

                {/* Images History */}
                <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
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
                            <img src={preview} alt={`Preview ${previews.length - idx}`} className="w-full h-full object-cover rounded-lg" />
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
                            <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">Original</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-neutral-500 dark:text-neutral-400">
                        No images yet. Upload an image to start!
                      </div>
                    )}

                    {selectedImage && (
                      <div
                        className={`fixed inset-0 z-[${Z.MODAL}] flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity duration-300`}
                        onClick={() => setSelectedImage(null)}
                      >
                        <div className="relative max-w-[90vw] max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
                          <img src={selectedImage} alt="Enlarged view" className="w-full h-full object-contain rounded-lg shadow-2xl" />
                          <button
                            className="absolute -top-2 -right-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-lg transition-colors"
                            onClick={() => setSelectedImage(null)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col h-full overflow-hidden">{enhancedRightPanel}</div>
            </>
          ) : (
            <>
              {/* CUSTOM TAB */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                {leftPanel}
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                <PromptTemplates activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-4">Images History</h3>
                {/* тот же блок истории как выше — оставляю без дублирования кода */}
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-auto shadow-sm hover:shadow-md transition-shadow">
                <CollectionsPanel />
              </div>
            </>
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
  )
}
