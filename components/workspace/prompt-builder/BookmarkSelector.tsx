"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface BookmarkSelectorProps {
    onPillSelect: (text: string) => void;
    onAvoidElementsChange: (elements: string) => void;
    onAvoidClick: (item: string) => void;
    disabled?: boolean;
}

export function BookmarkSelector({ onPillSelect, onAvoidElementsChange, onAvoidClick, disabled }: BookmarkSelectorProps) {
    const [activeBookmark, setActiveBookmark] = useState<string | null>(null);

    const bookmarkData: Record<string, string[]> = {
        "Lighting Setup": [
            "golden hour",
            "overcast soft light",
            "noon light",
            "blue hour dusk",
            "night ambient",
            "interior daylight",
            "artificial balanced lighting",
            "studio controlled lighting",
        ],
        "Camera Angle": [
            "eye-level",
            "bird's-eye view",
            "worm's-eye view",
            "street-level",
            "corner view",
            "centered view",
            "diagonal view",
            "symmetrical centered",
        ],
        "Interior Style": [
            "minimalist",
            "scandinavian",
            "mid-century modern",
            "industrial",
            "bohemian",
            "japandi",
            "art deco",
            "contemporary",
        ],
        "Color Palette": [
            "warm neutrals",
            "cool neutrals",
            "earth tones",
            "monochrome",
            "pastel accents",
            "bold contrast",
        ],
        "Image Styles": [
            "winter day",
            "summer",
            "autum day",
            "spring day",
            "sketch",
            "photorealistic",
            "watercolor",
            "storybook style",
            "soft pastel"
        ],
        // "Elements to Avoid": [
        //     "flat lighting",
        //     "missing contact shadows",
        //     "distorted furniture scale",
        //     "cold white balance",
        //     "excessive bloom",
        //     "unrealistic materials",
        //     "incorrect perspective",
        //     "oversaturated colors",
        // ],
    };

    const handlePillClick = (pillText: string, bookmarkName: string) => {
        console.log('🔵 Pill clicked:', pillText);
        console.log('🔵 Bookmark:', bookmarkName);

        // Regular pill - add to prompt and close bookmark
        console.log('🔵 Calling onPillSelect with:', pillText);
        onPillSelect(pillText);
        setActiveBookmark(null);
    };

    return (
        <div className="space-y-3">
            {/* Bookmarks - 5 tabs */}
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
                                : "text-neutral-400 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-white"
                            }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* Pills - appear below active bookmark */}
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
                        {bookmarkData[activeBookmark].map((pillText, idx) => {
                            return (
                                <motion.button
                                    key={`${activeBookmark}-${idx}`}
                                    type="button"
                                    onClick={() => handlePillClick(pillText, activeBookmark)}
                                    initial={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`
                  px-3 py-1.5
                  bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600
                  hover:bg-neutral-200 dark:hover:bg-neutral-700
                  border
                  rounded-full
                  text-sm 
                  text-neutral-700 dark:text-white
                  transition-colors
                  cursor-pointer
                `}
                                >
                                    {pillText}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
