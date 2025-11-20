"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkSelector } from "./BookmarkSelector";
import { ModelSelector } from "./ModelSelector";

interface TemplateBuilderProps {
    // Model
    aiModel: string;
    onAiModelChange: (value: string) => void;

    // Style
    style: string;
    onStyleChange: (value: string) => void;

    // Details
    details: string;
    onDetailsChange: (value: string) => void;

    // Actions
    onSaveTemplate: () => void;
    onCancelCollection?: () => void;

    // State
    isGenerating: boolean;
    isCollectionRun: boolean;
    progressMessage?: string;

    // Styling
    inputSurfaceClass: string;
}

export function TemplateBuilder({
    aiModel,
    onAiModelChange,
    style,
    onStyleChange,
    details,
    onDetailsChange,
    onSaveTemplate,
    onCancelCollection,
    isGenerating,
    isCollectionRun,
    progressMessage,
    inputSurfaceClass,
}: TemplateBuilderProps) {
    const handlePillSelect = (pillText: string) => {
        // Add pill text to details field
        const newDetails = details
            ? `${details}, ${pillText}`
            : pillText;

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
                {/* NEW: Bookmark Selector */}
                <BookmarkSelector
                    onPillSelect={handlePillSelect}
                    disabled={isGenerating}
                />

                {/* Divider */}
                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

                {/* Model Selector */}
                <ModelSelector
                    value={aiModel}
                    onChange={onAiModelChange}
                    disabled={isGenerating}
                />

                {/* Style Dropdown */}
                <div>
                    <label className="text-sm font-medium text-rl-text mb-2 block">
                        Style
                    </label>
                    <select
                        value={style}
                        onChange={(e) => onStyleChange(e.target.value)}
                        className={inputSurfaceClass}
                    >
                        <option value="">Select style</option>
                        <option>Photorealistic</option>
                        <option>Watercolor</option>
                        <option>Minimalist</option>
                    </select>
                </div>

                {/* Additional Details Textarea */}
                <div>
                    <label className="text-sm font-medium text-rl-text mb-2 block">
                        Additional Details
                    </label>
                    <textarea
                        value={details}
                        onChange={(e) => onDetailsChange(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] resize-none min-h-[96px]"
                        placeholder="Describe scene details..."
                        rows={4}
                    />
                </div>

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
