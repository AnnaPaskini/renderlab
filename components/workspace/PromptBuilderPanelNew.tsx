"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCollections } from "@/lib/useCollections";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface PromptBuilderPanelProps {
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (model: string) => Promise<void>;
  isGenerating?: boolean;
  activeTab?: "builder" | "custom";
  onTabChange?: (tab: "builder" | "custom") => void;
}

type TemplateRecord = {
  template: any;
  displayLabel: string;
  templateName: string;
};

export function PromptBuilderPanel({
  onPromptChange,
  onGenerate,
  isGenerating = false,
  activeTab: controlledActiveTab,
  onTabChange,
}: PromptBuilderPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<"builder" | "custom">(
    controlledActiveTab ?? "builder"
  );
  const [aiModel, setAiModel] = useState("google/nano-banana");
  const [style, setStyle] = useState("");
  const [details, setDetails] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Collection and template state
  const { collections } = useCollections();
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"template" | "collection">("template");

  const resolveString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
    return "";
  };

  const { options: templateOptions, lookup: templateLookup } = useMemo(() => {
    const map = new Map<string, TemplateRecord>();
    const options: { id: string; label: string }[] = [];

    const normalizeId = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "template";

    const registerTemplate = (
      template: any,
      context: { collectionTitle?: string; fallbackIndex: number },
    ) => {
      if (!template) return;

      const rawName =
        template?.name ||
        template?.title ||
        template?.formData?.name ||
        template?.metadata?.title ||
        `Template ${options.length + 1}`;
      const displayLabel = context.collectionTitle
        ? `${rawName} • ${context.collectionTitle}`
        : rawName;
      const baseId =
        template?.id ||
        template?.createdAt ||
        `${normalizeId(rawName)}-${context.fallbackIndex}`;

      let uniqueId = baseId;
      let counter = 1;
      while (map.has(uniqueId)) {
        uniqueId = `${baseId}-${counter++}`;
      }

      map.set(uniqueId, {
        template,
        displayLabel,
        templateName: rawName,
      });
      options.push({ id: uniqueId, label: displayLabel });
    };

    templates.forEach((template, index) =>
      registerTemplate(template, { fallbackIndex: index }),
    );

    collections.forEach((collection, collectionIndex) => {
      (collection.templates || []).forEach((template, index) =>
        registerTemplate(template, {
          collectionTitle: collection.title,
          fallbackIndex: collectionIndex * 100 + index,
        }),
      );
    });

    return { options, lookup: map };
  }, [collections, templates]);

  const collectionOptions = useMemo(
    () =>
      collections.map((collection) => ({
        id: collection.id,
        label: collection.title?.trim() || "Untitled Collection",
      })),
    [collections],
  );

  useEffect(() => {
    if (activeTemplateId && !templateOptions.some((option) => option.id === activeTemplateId)) {
      setActiveTemplateId(null);
    }
  }, [activeTemplateId, templateOptions]);

  useEffect(() => {
    if (activeCollectionId && !collections.some((collection) => collection.id === activeCollectionId)) {
      setActiveCollectionId(null);
    }
  }, [activeCollectionId, collections]);

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const isTabControlled =
    controlledActiveTab !== undefined || typeof onTabChange === "function";

  const handleTabChange = (tab: "builder" | "custom") => {
    if (!isTabControlled) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = JSON.parse(
      localStorage.getItem("RenderAI_customTemplates") || "[]"
    );
    // Add IDs if they don't exist
    const templatesWithIds = savedTemplates.map((t: any, idx: number) => ({
      ...t,
      id: t.id || `${t.name}-${idx}`,
    }));
    setTemplates(templatesWithIds);
  }, []);

  // Reload templates when returning to builder tab or when custom tab is active
  useEffect(() => {
    if (activeTab === "builder" || activeTab === "custom") {
      const savedTemplates = JSON.parse(
        localStorage.getItem("RenderAI_customTemplates") || "[]"
      );
      const templatesWithIds = savedTemplates.map((t: any, idx: number) => ({
        ...t,
        id: t.id || `${t.name}-${idx}`,
      }));
      setTemplates(templatesWithIds);
    }
  }, [activeTab]);

  const handleModeChange = (value: string) => {
    if (value === "template" || value === "collection") {
      setActiveMode(value);
      if (value === "template") {
        setActiveCollectionId(null);
      } else {
        setActiveTemplateId(null);
      }
    }
  };

  // Handler for collection change
  const handleCollectionChange = (id: string) => {
    setActiveCollectionId(id);
  };

  // Handler for template change
  const handleTemplateChange = (id: string) => {
    const record = templateLookup.get(id);
    if (!record) {
      return;
    }

    const templateData = record.template ?? {};

    const resolvedAiModel =
      resolveString(templateData.aiModel, templateData.formData?.aiModel) ||
      "google/nano-banana";
    const resolvedStyle = resolveString(
      templateData.style,
      templateData.formData?.style,
    );
    const resolvedDetails = resolveString(
      templateData.details,
      templateData.formData?.customPrompt,
      templateData.formData?.prompt,
      templateData.finalPrompt,
    );

    setActiveTemplateId(id);
    setAiModel(resolvedAiModel);
    setStyle(resolvedStyle);
    setDetails(resolvedDetails);

    toast.success(`Template "${record.templateName}" loaded`, {
      duration: 1500,
      style: { fontSize: "14px" },
    });
  };

  useEffect(() => {
    if (controlledActiveTab) {
      setInternalActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);

  useEffect(() => {
    const loadFromStorage = () => {
      const stored = localStorage.getItem("RenderAI_activeTemplate");
      if (stored) {
        const template = JSON.parse(stored);
        setAiModel(template.aiModel || "");
        setStyle(template.style || "");
        setDetails(template.details || template.finalPrompt || "");
        console.log("🔄 Builder updated from storage:", template);
      }
    };

    loadFromStorage();
    window.addEventListener("storage", loadFromStorage);
    return () => window.removeEventListener("storage", loadFromStorage);
  }, []);

  useEffect(() => {
    const activeTemplate = localStorage.getItem("RenderAI_activeTemplate");
    if (activeTemplate) {
      try {
        const template = JSON.parse(activeTemplate);
        setAiModel(template?.formData?.aiModel ?? template?.aiModel ?? "");
        setStyle(template?.formData?.style ?? template?.style ?? "");
        setDetails(template?.formData?.customPrompt ?? template?.details ?? "");
        console.log("✅ Template loaded into builder:", template);
        localStorage.removeItem("RenderAI_activeTemplate");
      } catch (error) {
        console.error("❌ Error loading template:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (onPromptChange && details) {
      onPromptChange(details);
    }
  }, [details, onPromptChange]);

  const handleSaveTemplate = () => {
    const finalTemplateName = templateName?.trim() || "Untitled Template";

    const template = {
      name: finalTemplateName,
      aiModel,
      style,
      details,
      createdAt: new Date().toISOString(),
    };

    const stored = JSON.parse(
      localStorage.getItem("RenderAI_customTemplates") || "[]"
    );

    const isDuplicate =
      stored.length > 0 &&
      stored.some(
        (t: any) =>
          t.aiModel === aiModel &&
          t.style === style &&
          t.details === details &&
          t.name === finalTemplateName
      );

    if (isDuplicate) {
      toast.error(`Template "${finalTemplateName}" already exists`, {
        duration: 2000,
        style: { fontSize: "14px" },
      });
      return;
    }

    stored.push(template);
    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(stored));

    toast.success(`Template "${finalTemplateName}" saved`, {
      duration: 1500,
      style: { fontSize: "14px" },
    });

    setTimeout(() => {
      handleTabChange("custom");
    }, 500);
  };

  const handleGenerateCollection = async () => {
    console.log("Starting collection generation...");

    const selectedCollection = collections.find((collection) => collection.id === activeCollectionId);

    if (!selectedCollection) {
      console.error("No collection selected!");
      alert("Please select a collection before generating.");
      return;
    }

    console.log("Payload sent to API:", {
      collectionId: selectedCollection.id,
      templates: selectedCollection.templates,
    });

    try {
      const response = await fetch("/api/generate/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: selectedCollection.id,
          templates: selectedCollection.templates,
        }),
      });

      if (!response.ok) {
        console.error("Failed to generate collection", response.status, response.statusText);
        alert("Failed to generate the collection. Please try again.");
        return;
      }

      if (!response.body) {
        console.error("No response body received from collection generation");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            console.log("Event:", event);
          } catch (error) {
            console.error("Failed to parse event", error, line);
          }
        }
      }
    } catch (error) {
      console.error("Error during collection generation", error);
    }
  };

  return (
    <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full overflow-auto">
      <div className="flex-1 overflow-y-auto">
        {activeTab === "builder" && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">Edit Image</h2>

            <motion.div
              layout
              className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 shadow-sm transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              <div className="flex flex-col gap-4">
                <ToggleGroup.Root
                  type="single"
                  value={activeMode}
                  onValueChange={handleModeChange}
                  className="grid w-full grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1 shadow-inner transition-all duration-300 dark:bg-neutral-800/60"
                >
                  <ToggleGroup.Item
                    value="template"
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition-all duration-300",
                      "hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200",
                      "data-[state=on]:bg-white data-[state=on]:text-neutral-900 data-[state=on]:shadow-sm dark:data-[state=on]:bg-neutral-900 dark:data-[state=on]:text-neutral-100",
                    )}
                  >
                    Load Template
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    value="collection"
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition-all duration-300",
                      "hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200",
                      "data-[state=on]:bg-white data-[state=on]:text-neutral-900 data-[state=on]:shadow-sm dark:data-[state=on]:bg-neutral-900 dark:data-[state=on]:text-neutral-100",
                    )}
                  >
                    Load Collection
                  </ToggleGroup.Item>
                </ToggleGroup.Root>

                <AnimatePresence mode="wait">
                  {activeMode === "template" ? (
                    <motion.div
                      key="template-select"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="transition-all duration-300"
                    >
                      {templateOptions.length > 0 ? (
                        <Select
                          value={activeTemplateId ?? undefined}
                          onValueChange={handleTemplateChange}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl border border-neutral-200 bg-white/90 px-3 text-left text-sm font-medium text-neutral-700 shadow-sm transition-all duration-300 hover:border-neutral-300 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-100">
                            <SelectValue placeholder="Select a saved template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templateOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-4 text-sm text-neutral-500 transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
                          No saved templates found.
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collection-select"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="transition-all duration-300"
                    >
                      {collectionOptions.length > 0 ? (
                        <Select
                          value={activeCollectionId ?? undefined}
                          onValueChange={handleCollectionChange}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl border border-neutral-200 bg-white/90 px-3 text-left text-sm font-medium text-neutral-700 shadow-sm transition-all duration-300 hover:border-neutral-300 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-100">
                            <SelectValue placeholder="Select a collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collectionOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-xl border border-dashed border-neutral-200 bg-white/80 p-4 text-sm text-neutral-500 transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
                          No saved collections yet.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  AI Model
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-transparent rounded-md px-3 py-2 text-sm"
                >
                  <option>google/nano-banana</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-transparent rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select style</option>
                  <option>Photorealistic</option>
                  <option>Watercolor</option>
                  <option>Minimalist</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  Additional Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-transparent rounded-md px-3 py-2 text-sm"
                  placeholder="Describe scene details..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2 mt-4 transition-all duration-300">
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="w-1/2 border border-neutral-300 bg-white text-neutral-900 font-medium hover:bg-neutral-100 transition-all rounded-xl"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Save as Template
                  </Button>
                  <div className="w-1/2">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeCollectionId ? "collection-generate" : "template-generate"}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          className={cn(
                            "w-full bg-gradient-to-r from-neutral-900 to-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl",
                            isGenerating &&
                              "from-neutral-500 to-neutral-500 text-neutral-200 hover:shadow-lg",
                          )}
                          onClick={() =>
                            activeCollectionId
                              ? handleGenerateCollection()
                              : onGenerate?.(aiModel)
                          }
                          disabled={isGenerating}
                        >
                          {isGenerating
                            ? activeCollectionId
                              ? "Generating Collection..."
                              : "Generating..."
                            : activeCollectionId
                              ? "Generate Collection"
                              : "Generate"}
                        </Button>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Browse and manage your saved templates in the Custom panel below.
            </p>
          </motion.div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Save Template
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Enter template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="mt-4"
          />

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSaveTemplate();
                setTemplateName("");
                setIsDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
