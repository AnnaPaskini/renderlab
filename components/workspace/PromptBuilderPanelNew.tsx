"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections } from "@/lib/useCollections";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
import { IconDotsVertical, IconChevronDown } from "@tabler/icons-react";
import { ContextIndicator } from './ContextIndicator';
import { useWorkspace } from '@/lib/context/WorkspaceContext';

export interface PromptBuilderPanelProps {
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (model: string) => Promise<void>;
  isGenerating?: boolean;
  activeTab?: "builder" | "custom";
  onTabChange?: (tab: "builder" | "custom") => void;
  onPreviewAdd?: (url: string) => void;
  uploadedImage?: string | null;
  onHistoryRefresh?: () => Promise<void>;
  initialAdditionalDetails?: string | null;
}

type TemplateRecord = {
  template: any;
  displayLabel: string;
  templateName: string;
};

export function PromptBuilderPanel({
  onPromptChange,
  onGenerate,
  isGenerating: controlledIsGenerating,
  activeTab,
  onTabChange,
  onPreviewAdd,
  uploadedImage,
  onHistoryRefresh,
  initialAdditionalDetails,
}: PromptBuilderPanelProps) {
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<"builder" | "custom">(
    activeTab ?? "builder"
  );
  const [aiModel, setAiModel] = useState("google/nano-banana");
  const [style, setStyle] = useState("");
  const [details, setDetails] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const shouldUseInternalGenerating = controlledIsGenerating === undefined;
  const isGenerating = controlledIsGenerating ?? internalIsGenerating;

  // Load additional details from URL parameter (from Prompts Library)
  useEffect(() => {
    if (initialAdditionalDetails) {
      setDetails(initialAdditionalDetails);
    }
  }, [initialAdditionalDetails]);

  const setGeneratingState = (value: boolean) => {
    if (shouldUseInternalGenerating) {
      setInternalIsGenerating(value);
    }
  };

  // WorkspaceContext integration
  const { activeItem, loadTemplate, loadCollection, clear } = useWorkspace();

  // Dynamic page title based on activeItem
  const getPageTitle = () => {
    if (activeItem.type === 'template') {
      return `Editing: ${activeItem.data.name}`;
    }
    if (activeItem.type === 'collection') {
      return `Editing Collection: ${activeItem.data.name}`;
    }
    if (activeItem.type === 'temporary') {
      return 'Editing from History';
    }
    return 'Welcome back';
  };

  const getPageSubtitle = () => {
    if (activeItem.type === null) {
      return 'Keep crafting stunning visuals with RenderLab.';
    }
    return 'Make your changes and generate new variations.';
  };

  // Collection and template state
  const { collections } = useCollections();
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"template" | "collection">("template");
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const collectionPreviewSetRef = useRef<Set<string>>(new Set());
  const getInitialProgressState = () => ({ total: 0, succeeded: 0, failed: 0, active: false });
  const [collectionProgress, setCollectionProgress] = useState(getInitialProgressState);
  const [isCollectionRun, setIsCollectionRun] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Template management state
  const [renameTemplateTarget, setRenameTemplateTarget] = useState<any | null>(null);
  const [renameTemplateName, setRenameTemplateName] = useState('');
  const [isRenameTemplateOpen, setIsRenameTemplateOpen] = useState(false);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<any | null>(null);
  const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  const selectTriggerClass =
    "h-12 w-full rounded-xl border border-white/40 bg-white/65 px-3 text-left text-sm font-medium text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]";
  const inputSurfaceClass =
    "w-full rounded-xl border border-white/40 bg-white/65 px-3 py-2 text-sm font-medium text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)] placeholder:text-neutral-500 dark:placeholder:text-neutral-300";

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

    // Filter function to exclude collection-generated templates
    const isOriginalTemplate = (template: any) => {
      const name = template?.name || template?.title || '';
      
      // Exclude collection-generated templates
      if (name.includes(' • ')) return false;  // "Winter day • 3"
      if (name.includes(' - Copy')) return false;  // "autumn scene - Copy"
      if (/^\d+$/.test(name)) return false;  // Pure numbers like "999"
      if (/^\d+ • \d+$/.test(name)) return false;  // "9 • 56"
      
      return true;
    };

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

    // Only register original templates (not collection-generated ones)
    templates
      .filter(isOriginalTemplate)
      .forEach((template, index) =>
        registerTemplate(template, { fallbackIndex: index }),
      );

    // Collections are handled separately in Load Collection mode
    // So we don't register collection templates here anymore

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
    if (!activeCollectionId) {
      setSelectedCollection(null);
      return;
    }

    const match = collections.find((collection) => collection.id === activeCollectionId);

    if (!match) {
      setActiveCollectionId(null);
      setSelectedCollection(null);
      return;
    }

    if (selectedCollection?.id !== match.id) {
      setSelectedCollection(match);
    }
  }, [activeCollectionId, collections, selectedCollection?.id]);

  const currentTab = activeTab ?? internalActiveTab;
  const isTabControlled = typeof activeTab !== "undefined";
  const hasCollectionSelection = Boolean(activeCollectionId || selectedCollection);
  const processedCount = collectionProgress.succeeded + collectionProgress.failed;
  const showCollectionProgress = isCollectionRun && collectionProgress.active;
  const progressMessage = showCollectionProgress
    ? `Processing ${processedCount} / ${collectionProgress.total}…`
    : isCollectionRun
      ? "Preparing collection..."
      : "Processing...";

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
    if (currentTab === "builder" || currentTab === "custom") {
      const savedTemplates = JSON.parse(
        localStorage.getItem("RenderAI_customTemplates") || "[]"
      );
      const templatesWithIds = savedTemplates.map((t: any, idx: number) => ({
        ...t,
        id: t.id || `${t.name}-${idx}`,
      }));
      setTemplates(templatesWithIds);
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === "builder") {
      setSelectedCollection(null);
      setActiveCollectionId(null);
      setDetails("");
      collectionPreviewSetRef.current.clear();
      setCollectionProgress(getInitialProgressState());
      setIsCollectionRun(false);
      abortControllerRef.current?.abort();
    }
  }, [currentTab]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleModeChange = (value: string) => {
    if (value === "template" || value === "collection") {
      // Clear WorkspaceContext when switching tabs
      clear();
      
      setActiveMode(value);
      if (value === "template") {
        setActiveCollectionId(null);
        setSelectedCollection(null);
        collectionPreviewSetRef.current.clear();
        setCollectionProgress(getInitialProgressState());
        setIsCollectionRun(false);
        abortControllerRef.current?.abort();
      } else {
        setActiveTemplateId(null);
      }
    }
  };

  // Handler for collection change
  const handleCollectionChange = (id: string) => {
    setActiveCollectionId(id);
    const collection = collections.find((item) => item.id === id) ?? null;
    setSelectedCollection(collection);
    
    // Update WorkspaceContext
    if (collection) {
      // Transform localStorage Collection to match DB CollectionWithTemplates format
      const collectionWithCount = {
        id: collection.id,
        user_id: '', // localStorage collections don't have user_id
        name: collection.title || 'Unnamed Collection', // title -> name
        created_at: collection.createdAt || new Date().toISOString(), // createdAt -> created_at
        updated_at: collection.createdAt || new Date().toISOString(),
        templates: collection.templates || [],
        template_count: (collection.templates || []).length
      };
      
      loadCollection(collectionWithCount as any);
    }
    
    collectionPreviewSetRef.current.clear();
    setCollectionProgress(getInitialProgressState());
  };

  // Handler for template change
  const handleTemplateChange = (id: string) => {
    const record = templateLookup.get(id);
    if (!record) {
      return;
    }

    const templateData = record.template ?? {};

    // Update WorkspaceContext
    loadTemplate(templateData);

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
    if (typeof activeTab !== "undefined") {
      setInternalActiveTab(activeTab);
    }
  }, [activeTab]);

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
    if (onPromptChange) {
      onPromptChange(details);
    }
  }, [details, onPromptChange]);

  // Sync form with WorkspaceContext when temporary item is loaded
  useEffect(() => {
    if (activeItem.type === 'temporary' && activeItem.data) {
      // Update prompt field
      if (activeItem.data.prompt) {
        setDetails(activeItem.data.prompt);
        console.log('✅ [PromptBuilder] Loaded temporary prompt:', activeItem.data.prompt);
      }
      
      // Note: Reference image (uploadedImage) is managed by parent component (workspace/page.tsx)
      // The parent needs to handle activeItem.data.reference_url
      if (activeItem.data.reference_url) {
        console.log('📸 [PromptBuilder] Reference image URL available:', activeItem.data.reference_url);
        console.log('⚠️ [PromptBuilder] Parent component should update uploadedImage prop');
      }
    }
  }, [activeItem]);

  const handleSaveTemplate = () => {
    const finalTemplateName = templateName?.trim() || "Untitled Template";

    const stored = JSON.parse(
      localStorage.getItem("RenderAI_customTemplates") || "[]"
    );

    // Check for duplicate names (case-insensitive, name only)
    const nameExists = stored.some(
      (t: any) => (t.name || t.title || '').toLowerCase() === finalTemplateName.toLowerCase()
    );

    if (nameExists) {
      toast.error(`A template named '${finalTemplateName}' already exists. Please choose a different name.`, {
        duration: 2500,
        style: { fontSize: "14px" },
      });
      return;
    }

    const template = {
      name: finalTemplateName,
      aiModel,
      style,
      details,
      createdAt: new Date().toISOString(),
    };

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

  const handleGenerateTemplate = async () => {
    const prompt = details.trim();
    if (!prompt) {
      toast.error("Please enter a prompt or load a template first.");
      return;
    }

    console.log("[stream] generating template", {
      tab: currentTab,
      model: aiModel,
    });

    try {
      setGeneratingState(true);
      if (onGenerate) {
        await onGenerate(aiModel);
      }
    } catch (error) {
      console.error("Template generation failed", error);
      toast.error("Template generation failed. Check console for details.");
    } finally {
      setGeneratingState(false);
    }
  };

  const handleCancelCollection = () => {
    abortControllerRef.current?.abort();
  };

  const handleGenerateCollection = async () => {
    const collection =
      selectedCollection ||
      (activeCollectionId
        ? collections.find((c) => c.id === activeCollectionId)
        : null);

    if (!collection) {
      toast.error("No collection selected.");
      return;
    }

    // ✅ ДОБАВЬ ЭТО:
    console.log("Collection structure:", JSON.stringify(collection, null, 2));
    console.log("First template:", JSON.stringify(collection.templates?.[0], null, 2));

    const templatesPayload = Array.isArray(collection.templates)
      ? collection.templates.map((template: any) => ({
          id: template.id || `template-${Date.now()}`,
          prompt: template.details || template.name || "",
          model: template.aiModel || "google/nano-banana",
        }))
      : [];

    if (!templatesPayload.length) {
      toast.error("Selected collection has no templates.");
      return;
    }

    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let totalItems = templatesPayload.length;
    let succeededCount = 0;
    let failedCount = 0;
    let sawAuthError = false;
    let sawErrorToast = false;

    try {
      setGeneratingState(true);
      setIsCollectionRun(true);
      setCollectionProgress({
        total: totalItems,
        succeeded: 0,
        failed: 0,
        active: true,
      });
      collectionPreviewSetRef.current.clear();

      console.log("[stream] starting collection generation", {
        collectionId: collection.id,
        total: totalItems,
      });

      // Конвертируем uploadedImage (data URI) в public URL
      let publicImageUrl = null;
      if (uploadedImage && uploadedImage.startsWith('data:')) {
        const blob = await fetch(uploadedImage).then(r => r.blob());
        const formData = new FormData();
        formData.append('file', blob, 'reference.png');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        publicImageUrl = uploadData.output?.publicUrl || null;
        console.log('✅ Uploaded reference image:', publicImageUrl);
      }

      const response = await fetch("/api/generate/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templates: templatesPayload,
          collectionName: collection.name || "Untitled Collection",
          baseImage: publicImageUrl || uploadedImage || null, // ✅ Используем public URL
        }),
        signal: abortController.signal,
      });

      const contentType = response.headers.get("content-type") ?? "unknown";
      console.log("Collection response status:", response.status, "Content-Type:", contentType);

      if (!response.ok) {
        toast.error(`Collection generation failed: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let finalEvent: Record<string, any> | null = null;

      if (!reader) {
        console.error("Collection response body did not provide a reader");
        toast.error("Server did not provide a readable stream.");
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            buffer += decoder.decode();
            break;
          }

          if (!value) {
            continue;
          }

          console.log(`[stream] chunk: ${value.length} bytes`);
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n");

          for (let i = 0; i < parts.length - 1; i++) {
            const line = parts[i].trim();
            if (!line) continue;

            try {
              const event = JSON.parse(line);
              console.log("[stream] event:", event);

              if (event.type === "start") {
                totalItems = typeof event.total === "number" ? event.total : totalItems;
                succeededCount = 0;
                failedCount = 0;
                setCollectionProgress({
                  total: totalItems,
                  succeeded: 0,
                  failed: 0,
                  active: true,
                });
                collectionPreviewSetRef.current.clear();
                continue;
              }

              if (event.type === "progress") {
                if (event.status === "ok") {
                  succeededCount += 1;
                  setCollectionProgress((prev) => ({
                    ...prev,
                    succeeded: prev.succeeded + 1,
                  }));

                  if (typeof event.url === "string" && event.url) {
                    console.log("✅ [PREVIEW] Adding image to UI:", event.url);
                    if (!collectionPreviewSetRef.current.has(event.url)) {
                      collectionPreviewSetRef.current.add(event.url);
                      if (onPreviewAdd) {
                        onPreviewAdd(event.url);
                        console.log("✅ [PREVIEW] Called onPreviewAdd with:", event.url);
                      } else {
                        console.warn("⚠️ [PREVIEW] onPreviewAdd is not defined");
                      }
                    } else {
                      console.log("⚠️ [PREVIEW] Image already in set, skipping");
                    }
                  } else {
                    console.warn("⚠️ [PREVIEW] No URL in event:", event);
                  }
                } else if (event.status === "error") {
                  failedCount += 1;
                  setCollectionProgress((prev) => ({
                    ...prev,
                    failed: prev.failed + 1,
                  }));

                  if (!sawAuthError && event.httpStatus === 401) {
                    sawAuthError = true;
                    toast.error("Missing Replicate API token. Please configure REPLICATE_API_TOKEN.");
                  } else if (!sawErrorToast) {
                    sawErrorToast = true;
                    toast.error("One or more templates failed to generate.");
                  }

                  if (event.error) {
                    console.warn("Collection item failed:", event.error);
                  }
                }

                if (typeof event.index === "number") {
                  console.log(`[stream] progress: item ${event.index + 1} of ${totalItems}`);
                }
              }

              if (event.type === "done") {
                finalEvent = event;
              }
            } catch (parseError) {
              console.warn("Skipping malformed line:", line);
            }
          }

          buffer = parts[parts.length - 1];
        }

        const trailing = buffer.trim();
        if (trailing) {
          try {
            const event = JSON.parse(trailing);
            console.log("[stream] event (trailing):", event);

            if (event.type === "start") {
              totalItems = typeof event.total === "number" ? event.total : totalItems;
              succeededCount = 0;
              failedCount = 0;
              setCollectionProgress({
                total: totalItems,
                succeeded: 0,
                failed: 0,
                active: true,
              });
              collectionPreviewSetRef.current.clear();
            } else if (event.type === "progress") {
              if (event.status === "ok") {
                succeededCount += 1;
                setCollectionProgress((prev) => ({
                  ...prev,
                  succeeded: prev.succeeded + 1,
                }));
                if (typeof event.url === "string" && event.url) {
                  console.log("✅ [PREVIEW/TRAILING] Adding image to UI:", event.url);
                  if (!collectionPreviewSetRef.current.has(event.url)) {
                    collectionPreviewSetRef.current.add(event.url);
                    if (onPreviewAdd) {
                      onPreviewAdd(event.url);
                      console.log("✅ [PREVIEW/TRAILING] Called onPreviewAdd with:", event.url);
                    }
                  }
                }
              } else if (event.status === "error") {
                failedCount += 1;
                setCollectionProgress((prev) => ({
                  ...prev,
                  failed: prev.failed + 1,
                }));
                if (!sawAuthError && event.httpStatus === 401) {
                  sawAuthError = true;
                  toast.error("Missing Replicate API token. Please configure REPLICATE_API_TOKEN.");
                } else if (!sawErrorToast) {
                  sawErrorToast = true;
                  toast.error("One or more templates failed to generate.");
                }
                if (event.error) {
                  console.warn("Collection item failed:", event.error);
                }
              }
            } else if (event.type === "done") {
              finalEvent = event;
            }
          } catch (parseError) {
            console.warn("Skipping malformed trailing line:", trailing);
          }
        }
      } catch (streamError) {
        if (streamError instanceof DOMException && streamError.name === "AbortError") {
          console.log("Collection stream aborted by user");
          toast("Generation canceled by user.", { icon: "⚠️" });
        } else {
          console.error("Stream reading failed:", streamError);
          toast.error("Collection generation failed during stream read.");
        }
        return;
      } finally {
        reader.releaseLock();
      }

      if (finalEvent) {
        const succeeded =
          typeof finalEvent.succeeded === "number"
            ? finalEvent.succeeded
            : typeof finalEvent.completed === "number"
              ? finalEvent.completed
              : succeededCount;
        const failed =
          typeof finalEvent.failed === "number"
            ? finalEvent.failed
            : typeof finalEvent.errors === "number"
              ? finalEvent.errors
              : failedCount;

        console.log(`[stream] done: ${succeeded} succeeded, ${failed} failed`);

        // ✅ Refresh history after collection completion
        if (onHistoryRefresh && succeeded > 0) {
          await onHistoryRefresh();
        }

        if (failed > 0) {
          toast(`Collection completed with ${failed} failure${failed === 1 ? "" : "s"}.`, {
            icon: "⚠️",
          });
        } else {
          toast.success(`✅ Collection completed: ${succeeded} succeeded, 0 failed.`);
        }
      } else {
        console.log("Collection stream completed without a terminal event.");
        toast("Collection generation finalized.", { icon: "ℹ️" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Collection fetch aborted by user");
        toast("Generation canceled by user.", { icon: "⚠️" });
      } else {
        console.error("Collection generation failed", error);
        toast.error("Collection generation failed. Check console for details.");
      }
    } finally {
      abortControllerRef.current = null;
      collectionPreviewSetRef.current.clear();
      setCollectionProgress(getInitialProgressState());
      setIsCollectionRun(false);
      setGeneratingState(false);
    }
  };

  // Template management handlers
  const CUSTOM_TEMPLATES_STORAGE = "RenderAI_customTemplates";

  const readTemplatesFromStorage = () => {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to read templates from storage", error);
      return [];
    }
  };

  const saveTemplatesToStorage = (templates: any[]) => {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE, JSON.stringify(templates));
    // Refresh the templates list
    setTemplates(templates);
  };

  const handleDuplicateTemplate = (template: any) => {
    const duplicated = {
      ...template,
      id: `${template.id || 'template'}-copy-${Date.now()}`,
      name: `${template.name || template.title || 'Template'} - Copy`,
      createdAt: new Date().toISOString(),
    };
    
    const existingTemplates = readTemplatesFromStorage();
    const updatedTemplates = [...existingTemplates, duplicated];
    saveTemplatesToStorage(updatedTemplates);
    
    toast.success(`Template duplicated: ${duplicated.name}`);
  };

  const handleRenameTemplate = (template: any) => {
    setRenameTemplateTarget(template);
    setRenameTemplateName(template.name || template.title || '');
    setIsRenameTemplateOpen(true);
  };

  const handleRenameTemplateSubmit = () => {
    if (!renameTemplateTarget || !renameTemplateName.trim()) return;

    const existingTemplates = readTemplatesFromStorage();
    const updatedTemplates = existingTemplates.map((t: any) =>
      t.id === renameTemplateTarget.id || t.createdAt === renameTemplateTarget.createdAt
        ? { ...t, name: renameTemplateName.trim() }
        : t
    );
    
    saveTemplatesToStorage(updatedTemplates);
    
    toast.success(`Template renamed to: ${renameTemplateName.trim()}`);
    
    setIsRenameTemplateOpen(false);
    setRenameTemplateTarget(null);
    setRenameTemplateName('');
  };

  const handleDeleteTemplate = (template: any) => {
    setDeleteTemplateTarget(template);
    setIsDeleteTemplateOpen(true);
  };

  const handleDeleteTemplateConfirm = () => {
    if (!deleteTemplateTarget) return;

    const existingTemplates = readTemplatesFromStorage();
    const updatedTemplates = existingTemplates.filter((t: any) =>
      t.id !== deleteTemplateTarget.id && t.createdAt !== deleteTemplateTarget.createdAt
    );
    
    saveTemplatesToStorage(updatedTemplates);
    
    // If this was the active template, clear it
    if (activeTemplateId === deleteTemplateTarget.id || activeTemplateId === deleteTemplateTarget.createdAt) {
      setActiveTemplateId(null);
    }
    
    toast.success("Template deleted!");
    
    setIsDeleteTemplateOpen(false);
    setDeleteTemplateTarget(null);
  };

  return (
  <section className="flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/40 bg-white/85 p-6 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)]">
      <div className="flex-1 overflow-y-auto">
  {currentTab === "builder" && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{getPageTitle()}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{getPageSubtitle()}</p>
            </div>

            {/* Context Indicator */}
            <div className="mb-6">
              <ContextIndicator uploadedImage={uploadedImage} />
            </div>

            <motion.div
              layout
              className="rounded-2xl border border-white/40 bg-white/65 p-4 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]"
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
                        <DropdownMenu open={isTemplateDropdownOpen} onOpenChange={setIsTemplateDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <button className={cn(selectTriggerClass, "flex items-center justify-between")}>
                              <span className="truncate">
                                {activeTemplateId 
                                  ? templateOptions.find(opt => opt.id === activeTemplateId)?.label || "Select a saved template"
                                  : "Select a saved template"
                                }
                              </span>
                              <IconChevronDown size={16} className="ml-2 flex-shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            className="w-[400px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                            align="start"
                          >
                            {templateOptions.map((option) => {
                              const template = templateLookup.get(option.id)?.template;
                              return (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between w-full group hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 cursor-pointer"
                                >
                                  <div 
                                    className="flex-1 min-w-0"
                                    onClick={() => {
                                      handleTemplateChange(option.id);
                                      setIsTemplateDropdownOpen(false);
                                    }}
                                  >
                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {template?.name || template?.title || "Untitled template"}
                                    </div>
                                    {(template?.style || template?.scenario) && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                        {template.style || template.scenario}
                                      </div>
                                    )}
                                  </div>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        aria-label="Template options"
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <IconDotsVertical size={16} stroke={1.5} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDuplicateTemplate(template);
                                        }}
                                      >
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRenameTemplate(template);
                                        }}
                                      >
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteTemplate(template);
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/40 bg-white/65 p-4 text-sm font-medium text-neutral-600 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]">
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
                          <SelectTrigger className={selectTriggerClass}>
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
                        <div className="rounded-xl border border-dashed border-white/40 bg-white/65 p-4 text-sm font-medium text-neutral-600 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]">
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
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  AI Model
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className={inputSurfaceClass}
                >
                  <option>google/nano-banana</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className={inputSurfaceClass}
                >
                  <option value="">Select style</option>
                  <option>Photorealistic</option>
                  <option>Watercolor</option>
                  <option>Minimalist</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Additional Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className={cn(inputSurfaceClass, "min-h-[96px] resize-none")}
                  placeholder="Describe scene details..."
                  rows={3}
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 transition-all duration-300">
                <div className="flex w-full gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-all duration-300 hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Save as Template
                  </Button>
                  {isCollectionRun && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl border border-amber-400 bg-amber-50/95 text-sm font-semibold text-amber-700 transition-all duration-200 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200"
                      onClick={handleCancelCollection}
                    >
                        Cancel
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {(isGenerating || isCollectionRun) && (
                    <motion.div
                      key="collection-progress"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-white"
                    >
                      <span className="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-neutral-900 animate-pulse" />
                      <span>{progressMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={hasCollectionSelection ? "collection-generate" : "template-generate"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-all duration-300 hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0",
                        (isGenerating || isCollectionRun) &&
                          "from-purple-300 via-fuchsia-300 to-indigo-300 text-white opacity-80 hover:from-purple-300 hover:via-fuchsia-300 hover:to-indigo-300",
                      )}
                      onClick={hasCollectionSelection ? handleGenerateCollection : handleGenerateTemplate}
                      disabled={isGenerating || isCollectionRun}
                    >
                      {hasCollectionSelection
                        ? isCollectionRun
                          ? "Generating Collection..."
                          : "Generate Collection"
                        : isGenerating
                          ? "Generating..."
                          : "Generate"}
                    </Button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

  {currentTab === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-neutral-600 dark:text-white">
              Browse and manage your saved templates in the Custom panel below.
            </p>
          </motion.div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="rounded-3xl border border-white/40 bg-white/85 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
              Save Template
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Enter template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className={cn("mt-4", inputSurfaceClass)}
          />

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-2xl border border-white/40 bg-white/65 px-4 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 px-4 py-2 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-all duration-300 hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
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

      {/* Rename Template Dialog */}
      <Dialog open={isRenameTemplateOpen} onOpenChange={setIsRenameTemplateOpen}>
        <DialogContent className="rounded-3xl border border-white/40 bg-white/85 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
              Rename Template
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Enter new name..."
            value={renameTemplateName}
            onChange={(e) => setRenameTemplateName(e.target.value)}
            className={cn("mt-4", inputSurfaceClass)}
            autoFocus
          />

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-2xl border border-white/40 bg-white/65 px-4 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]"
              onClick={() => setIsRenameTemplateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 px-4 py-2 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-all duration-300 hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
              onClick={handleRenameTemplateSubmit}
              disabled={!renameTemplateName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
        <DialogContent className="rounded-3xl border border-white/40 bg-white/85 text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_40px_-10px_rgba(0,0,0,0.25)] dark:border-white/24 dark:bg-[#0c0c12]/78 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_18px_48px_-18px_rgba(0,0,0,0.6)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-4">
            Are you sure you want to delete "{deleteTemplateTarget?.name || deleteTemplateTarget?.title || 'this template'}"? This action cannot be undone.
          </p>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-2xl border border-white/40 bg-white/65 px-4 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-[24px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.05),inset_0_0_8px_rgba(0,0,0,0.04),0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 dark:border-white/24 dark:bg-[#111111]/70 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.45),inset_0_0_10px_rgba(0,0,0,0.26),0_12px_36px_-14px_rgba(0,0,0,0.55)]"
              onClick={() => setIsDeleteTemplateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:from-red-700 hover:to-red-800 focus-visible:ring-red-300 focus-visible:ring-offset-0"
              onClick={handleDeleteTemplateConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
