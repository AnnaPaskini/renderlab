"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface BookmarkSelectorProps {
    onPillSelect: (text: string) => void;
    disabled?: boolean;
}

export function BookmarkSelector({ onPillSelect, disabled }: BookmarkSelectorProps) {
    const [activeBookmark, setActiveBookmark] = useState<string | null>(null);

    const bookmarkData: Record<string, string[]> = {
        "Season / Time": [
            "winter morning",
            "spring afternoon",
            "summer noon",
            "autumn evening",
            "golden hour sunset",
            "night scene",
        ],
        "Lighting": [
            "soft morning light",
            "harsh noon sun",
            "warm evening glow",
            "dramatic backlighting",
            "studio lighting",
            "natural overcast",
        ],
        "Style": [
            "photorealistic",
            "watercolor sketch",
            "architectural rendering",
            "blueprint style",
            "3D model wireframe",
            "oil painting",
        ],
    };

    return (
        <div className="space-y-3">
            {/* Bookmarks - 3 tiny tabs */}
            <div className="flex gap-6">
                {Object.keys(bookmarkData).map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => {
                            if (disabled) return;
                            setActiveBookmark(activeBookmark === name ? null : name);
                        }}
                        disabled={disabled}
                        className={`
              text-sm font-medium transition-all pb-1
              ${activeBookmark === name
                                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                            }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* Pills - 6 soft bubbles that appear below active bookmark */}
            <AnimatePresence mode="wait">
                {activeBookmark && !disabled && (
                    <motion.div
                        key={activeBookmark}
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex flex-wrap gap-2 overflow-hidden"
                    >
                        {bookmarkData[activeBookmark].map((pillText, idx) => (
                            <motion.button
                                key={`${activeBookmark}-${idx}`}
                                type="button"
                                onClick={() => {
                                    onPillSelect(pillText);
                                    // Pill will disappear due to re-render, creating "dissolve" effect
                                }}
                                initial={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="
                  px-3 py-1.5
                  bg-neutral-100 dark:bg-neutral-800
                  hover:bg-neutral-200 dark:hover:bg-neutral-700
                  border border-neutral-300 dark:border-neutral-600
                  rounded-full
                  text-sm text-neutral-700 dark:text-neutral-300
                  transition-colors
                  cursor-pointer
                "
                            >
                                {pillText}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
