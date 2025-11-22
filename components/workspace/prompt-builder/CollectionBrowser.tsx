"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconDotsVertical } from "@tabler/icons-react";
import { useState } from "react";

interface CollectionOption {
    id: string;
    label: string;
}

interface CollectionBrowserProps {
    // Collections data
    collectionOptions: CollectionOption[];

    // State
    activeCollectionId: string | null;
    selectedCollection: any | null;
    uploadedImage: string | null | undefined;

    // Actions
    onCollectionIdChange: (id: string) => void;
    onLoadCollection: (id: string) => void;

    // Styling
    selectTriggerClass: string;
}

export function CollectionBrowser({
    collectionOptions,
    activeCollectionId,
    selectedCollection,
    uploadedImage,
    onCollectionIdChange,
    onLoadCollection,
    selectTriggerClass,
}: CollectionBrowserProps) {
    const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);

    return (
        <>
            {selectedCollection ? (
                <div className="space-y-2">
                    {selectedCollection.templates?.map((template: any) => (
                        <div key={template.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <span>{template.name || template.title || "Untitled"}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1">
                                        <IconDotsVertical size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>Load</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {collectionOptions.length > 0 ? (
                        <>
                            <DropdownMenu open={isCollectionDropdownOpen} onOpenChange={setIsCollectionDropdownOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(selectTriggerClass, "flex-[7] flex items-center justify-between")}>
                                        <span className="truncate">
                                            {activeCollectionId
                                                ? collectionOptions.find(opt => opt.id === activeCollectionId)?.label || "Select collection"
                                                : "Select collection"
                                            }
                                        </span>
                                        <IconChevronDown size={16} className="ml-2 flex-shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[400px] max-h-[400px] overflow-y-auto bg-[var(--rl-panel)] text-[var(--rl-text)] border-[var(--rl-border)] rounded-lg shadow-lg"
                                    align="start"
                                >
                                    {collectionOptions.map((option) => {
                                        return (
                                            <div
                                                key={option.id}
                                                className="flex items-center justify-between w-full group hover:bg-[var(--rl-panel-hover)] px-3 py-2 cursor-pointer"
                                                onClick={() => {
                                                    onCollectionIdChange(option.id);
                                                    setIsCollectionDropdownOpen(false);
                                                }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-[var(--rl-text)] truncate">
                                                        {option.label}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button
                                onClick={() => {
                                    if (activeCollectionId) {
                                        onLoadCollection(activeCollectionId);
                                    }
                                }}
                                disabled={!activeCollectionId || !uploadedImage}
                                className="flex-[3] rl-btn rl-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Load
                            </button>
                        </>
                    ) : (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 py-2">
                            No saved collections yet.
                        </div>
                    )}
                </>
            )}
        </>
    );
}
