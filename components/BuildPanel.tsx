"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";

const templateOptions = [
  { id: "template-hero", label: "Product Hero Spotlight" },
  { id: "template-landing", label: "Landing Page Promo" },
  { id: "template-social", label: "Social Carousel Story" },
];

const collectionOptions = [
  { id: "collection-seasonal", label: "Seasonal Launch Pack" },
  { id: "collection-onboarding", label: "Onboarding Journey" },
  { id: "collection-evergreen", label: "Evergreen Campaign" },
];

type Mode = "template" | "collection";

type Option = {
  id: string;
  label: string;
};

export function BuildPanel() {
  const [mode, setMode] = useState<Mode>("template");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const options = useMemo<Option[]>(
    () => (mode === "template" ? templateOptions : collectionOptions),
    [mode],
  );

  const hasOptions = options.length > 0;

  const activeTemplateLabel = useMemo(
    () => templateOptions.find((option) => option.id === selectedTemplate)?.label,
    [selectedTemplate],
  );

  const activeCollectionLabel = useMemo(
    () => collectionOptions.find((option) => option.id === selectedCollection)?.label,
    [selectedCollection],
  );

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPendingSelection(null);
    }
  };

  const handleLoadClick = (nextMode: Mode) => {
    setMode(nextMode);
    setPendingSelection(
      nextMode === "template" ? selectedTemplate : selectedCollection,
    );
  };

  const handleConfirmSelection = () => {
    if (!pendingSelection) return;

    if (mode === "template") {
      setSelectedTemplate(pendingSelection);
    } else {
      setSelectedCollection(pendingSelection);
    }

    setIsDialogOpen(false);
    setPendingSelection(null);
  };

  const canConfirm = !!pendingSelection && hasOptions;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Build Your Generator
          </h2>
          <p className="text-sm text-purple-400/70">
            Choose whether to generate from a single template or an entire collection.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
          <DialogTrigger asChild>
            <Button
              className="w-full sm:flex-1"
              onClick={() => handleLoadClick("template")}
            >
              Load Template
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:flex-1"
              onClick={() => handleLoadClick("collection")}
            >
              Load Collection
            </Button>
          </DialogTrigger>
        </div>

        <div className="w-full rounded-xl border border-dashed border-purple-500/20 p-4 text-sm text-purple-400/70">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-200">Selected template:</span>
              <span className="ml-2 text-purple-400">
                {activeTemplateLabel ?? "—"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-200">Selected collection:</span>
              <span className="ml-2 text-purple-400">
                {activeCollectionLabel ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {mode === "template" && selectedTemplate ? (
          <Button className="w-full max-w-sm">Generate</Button>
        ) : null}
        {mode === "collection" && selectedCollection ? (
          <Button className="w-full max-w-sm">Generate Collection</Button>
        ) : null}
      </div>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "template" ? "Select Template" : "Select Collection"}
          </DialogTitle>
        </DialogHeader>

        {hasOptions ? (
          <Select
            value={pendingSelection ?? undefined}
            onValueChange={(value: string) => setPendingSelection(value)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Choose a ${mode === "template" ? "template" : "collection"}`}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-lg border border-purple-500/20 p-4 text-center text-sm text-purple-400/70">
            No saved {mode === "template" ? "templates" : "collections"} found.
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleDialogChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!canConfirm}
            className="flex-1"
          >
            {mode === "template" ? "Use Template" : "Use Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
