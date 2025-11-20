"use client";

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
    onSave: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    canGenerate: boolean; // true if there's prompt/selections to generate
    saveLabel?: string;
    generateLabel?: string;
}

export function ActionButtons({
    onSave,
    onGenerate,
    isGenerating,
    canGenerate,
    saveLabel = "Save as Template",
    generateLabel = "Generate",
}: ActionButtonsProps) {
    return (
        <div className="flex gap-3 pt-2">
            <Button
                variant="outline"
                className="flex-1"
                onClick={onSave}
                disabled={isGenerating}
            >
                {saveLabel}
            </Button>
            <Button
                variant="default"
                className="flex-1"
                onClick={onGenerate}
                disabled={isGenerating || !canGenerate}
            >
                {isGenerating ? "Generating..." : generateLabel}
            </Button>
        </div>
    );
}
