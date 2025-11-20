"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkSelector } from "./BookmarkSelector";
import { ModelSelector } from "./ModelSelector";

interface TemplateBuilderProps {
    // Model
    aiModel: string;
    onAiModelChange: (value: string) => void;

    // Details
    details: string;
    onDetailsChange: (value: string) => void;

    // Avoid Elements
    avoidElements: string;
    onAvoidElementsChange: (value: string) => void;

    // Uploaded Image
    uploadedImage?: string | null;

    // Actions
    onSaveTemplate: () => void;
    onCancelCollection?: () => void;

    // State
    isGenerating: boolean;
    isCollectionRun: boolean;
    progressMessage?: string;
}

export function TemplateBuilder({
    aiModel,
    onAiModelChange,
    details,
    onDetailsChange,
    avoidElements,
    onAvoidElementsChange,
    uploadedImage,
    onSaveTemplate,
    onCancelCollection,
    isGenerating,
    isCollectionRun,
    progressMessage,
}: TemplateBuilderProps) {
    const handlePillSelect = (pillText: string) => {
        console.log('🟢 TemplateBuilder received:', pillText);
        console.log('🟢 Current details before:', details);

        // Just add the pill text without any prefix - assemblePrompt handles context
        let newDetails = "";

        if (!details || details.trim() === "") {
            // First selection
            newDetails = pillText;
        } else {
            // Subsequent selections - just append
            newDetails = `${details}, ${pillText}`;
        }

        console.log('🟢 New details after:', newDetails);
        onDetailsChange(newDetails);
    };

    return (
        <details
            className="rounded-xl p-4 border border-white/[0.06]"
            style={{
                background: '#1a1a1a',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
            }}
            open
        >
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer list-none flex items-center justify-between mb-4">
                <span>Advanced Settings</span>
                <span className="text-lg">▼</span>
            </summary>
            <div className="space-y-4">
                {/* 1. AI MODEL - AT THE TOP */}
                <ModelSelector
                    value={aiModel}
                    onChange={onAiModelChange}
                    disabled={isGenerating}
                />

                {/* Divider */}
                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

                {/* 2. BOOKMARKS (4 categories + Elements to Avoid) */}
                <BookmarkSelector
                    onPillSelect={handlePillSelect}
                    onAvoidElementsChange={onAvoidElementsChange}
                    disabled={isGenerating}
                />

                {/* Action Buttons */}
                <div className="flex w-full gap-3">
                    <Button
                        variant="ghost"
                        className="rl-btn-primary flex-1"
                        onClick={onSaveTemplate}
                    >
                        Save as Template
                    </Button>
                    {isCollectionRun && onCancelCollection && (
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl border border-amber-400 bg-amber-50/95 text-sm font-semibold text-amber-700 transition-all duration-200 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200"
                            onClick={onCancelCollection}
                        >
                            Cancel
                        </Button>
                    )}
                </div>

                {/* Progress Indicator */}
                <AnimatePresence>
                    {(isGenerating || isCollectionRun) && progressMessage && (
                        <motion.div
                            key="collection-progress"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-white"
                        >
                            <span className="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-[var(--rl-accent)] animate-pulse" />
                            <span>{progressMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </details>
    );
}
