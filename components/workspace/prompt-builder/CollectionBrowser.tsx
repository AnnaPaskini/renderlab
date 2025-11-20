"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <>
      {collectionOptions.length > 0 ? (
        <>
          <Select
            value={activeCollectionId ?? undefined}
            onValueChange={onCollectionIdChange}
          >
            <SelectTrigger className={cn(selectTriggerClass, "flex-[7]")}>
              <SelectValue placeholder="Select collection" />
            </SelectTrigger>
            <SelectContent>
              {collectionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="text-sm text-gray-500 py-2">
          No saved collections yet.
        </div>
      )}
    </>
  );
}
