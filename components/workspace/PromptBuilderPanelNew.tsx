"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useCollections } from "@/lib/useCollections";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconDotsVertical } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ContextIndicator } from './ContextIndicator';
import { ModelSelector } from './prompt-builder/ModelSelector';
import { ModeToggle } from './prompt-builder/ModeToggle';

export interface PromptBuilderPanelProps {
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (model: string) => Promise<void>;
  isGenerating?: boolean;
  activeTab?: "builder" | "custom";
  onTabChange?: (tab: "builder" | "custom") => void;
  onPreviewAdd?: (url: string) => void;
  uploadedImage?: string | null;
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
  initialAdditionalDetails,
}: PromptBuilderPanelProps) {
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<"builder" | "custom">(
    activeTab ?? "builder"
  );
  const [aiModel, setAiModel] = useState("nano-banana");
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
      return '';
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
    "h-12 w-full rounded-xl border border-rl-glass-border bg-rl-panel px-3 text-left text-sm font-medium text-rl-text  shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]";
  const inputSurfaceClass =
    "w-full rounded-xl border border-rl-glass-border bg-rl-panel px-3 py-2 text-sm font-medium text-rl-text  shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] placeholder:text-rl-text-secondary";

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
      "nano-banana";
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
        model: template.aiModel || "nano-banana",
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
    <div className="flex h-full flex-col overflow-hidden text-rl-text">
      <div className="flex-1 overflow-y-auto px-2">
        {currentTab === "builder" && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header with Clear All button - No container */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-rl-text">{getPageTitle()}</h2>
                <p className="text-sm text-gray-400 mt-1">{getPageSubtitle()}</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Clear all settings and reset prompt builder?')) {
                    setDetails('');
                    setStyle('');
                    setActiveTemplateId(null);
                    setActiveCollectionId(null);
                    setSelectedCollection(null);
                    clear();
                    toast.success('All cleared');
                  }
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Context Indicator */}
            <div>
              <ContextIndicator uploadedImage={uploadedImage} />
            </div>

            {/* Current Prompt Display - Now Editable - Standalone Panel */}
            <div
              className="rounded-xl p-4 border border-white/[0.06]"
              style={{
                background: '#1a1a1a',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Current Prompt Preview
              </h3>
              <div
                className="rounded-lg p-3"
                style={{
                  background: '#0f0f0f',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(0, 0, 0, 0.3)'
                }}
              >
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter your prompt here or load a template..."
                  className="w-full bg-transparent border-0 min-h-[80px] max-h-[120px] overflow-y-auto resize-none text-sm text-gray-300 leading-relaxed focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Main Generate Button */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={hasCollectionSelection ? "collection-btn" : "template-btn"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "rl-btn-primary w-full py-4 text-base font-semibold",
                    ((isGenerating || isCollectionRun) || (hasCollectionSelection && !uploadedImage)) && "opacity-60 cursor-not-allowed",
                  )}
                  onClick={hasCollectionSelection ? handleGenerateCollection : handleGenerateTemplate}
                  disabled={(isGenerating || isCollectionRun) || (hasCollectionSelection && !uploadedImage)}
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

            {/* Quick Load Section - Standalone Panel */}
            <div
              className="rounded-xl p-4 border border-white/[0.06]"
              style={{
                background: '#1a1a1a',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Quick Load
              </h3>

              {/* Mode Toggle */}
              <div className="mb-4">
                <ModeToggle
                  mode={activeMode}
                  onChange={handleModeChange}
                  disabled={isGenerating}
                />
              </div>

              {/* Unified Dropdown + Load Button */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {activeMode === "template" ? (
                    <>
                      {templateOptions.length > 0 ? (
                        <>
                          <DropdownMenu open={isTemplateDropdownOpen} onOpenChange={setIsTemplateDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                              <button className={cn(selectTriggerClass, "flex-[7] flex items-center justify-between")}>
                                <span className="truncate">
                                  {activeTemplateId
                                    ? templateOptions.find(opt => opt.id === activeTemplateId)?.label || "Select template"
                                    : "Select template"
                                  }
                                </span>
                                <IconChevronDown size={16} className="ml-2 flex-shrink-0" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="w-[400px] max-h-[400px] overflow-y-auto bg-[var(--rl-surface)] border border-[var(--rl-border)] rounded-lg shadow-lg"
                              align="start"
                            >
                              {templateOptions.map((option) => {
                                const template = templateLookup.get(option.id)?.template;
                                return (
                                  <div
                                    key={option.id}
                                    className="flex items-center justify-between w-full group hover:bg-[var(--rl-surface-hover)] px-3 py-2 cursor-pointer"
                                  >
                                    <div
                                      className="flex-1 min-w-0"
                                      onClick={() => {
                                        setActiveTemplateId(option.id);
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
                                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--rl-muted)] hover:text-[var(--rl-foreground)] transition-opacity rounded-full hover:bg-[var(--rl-surface-hover)] ml-2"
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
                          <button
                            onClick={() => {
                              if (activeTemplateId) {
                                handleTemplateChange(activeTemplateId);
                              }
                            }}
                            disabled={!activeTemplateId}
                            className="flex-[3] rl-btn rl-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Load
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 py-2">
                          No saved templates found.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {collectionOptions.length > 0 ? (
                        <>
                          <Select
                            value={activeCollectionId ?? undefined}
                            onValueChange={setActiveCollectionId}
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
                                handleCollectionChange(activeCollectionId);
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
                  )}
                </div>

                {/* Collection Warning */}
                {activeMode === "collection" && !uploadedImage && (
                  <p className="text-xs text-orange-400 flex items-center gap-1">
                    <span>⚠</span> Upload reference image first
                  </p>
                )}

                {/* Loaded Status Display */}
                {activeMode === "template" && activeTemplateId && templateLookup.get(activeTemplateId) && (
                  <div className="text-sm text-green-400 flex items-center gap-1">
                    <span>✓</span>
                    <span>Loaded: "{templateLookup.get(activeTemplateId)?.templateName}"</span>
                  </div>
                )}

                {activeMode === "collection" && selectedCollection && (
                  <div className="text-sm text-green-400 flex items-center gap-1">
                    <span>✓</span>
                    <span>Loaded: "{selectedCollection.title}" ({(selectedCollection.templates || []).length} prompts)</span>
                  </div>
                )}
              </div>
            </div>



            {/* Advanced Settings Section - Standalone Panel */}
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
                <ModelSelector
                  value={aiModel}
                  onChange={setAiModel}
                  disabled={isGenerating}
                />

                <div>
                  <label className="text-sm font-medium text-rl-text mb-2 block">
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
                  <label className="text-sm font-medium text-rl-text mb-2 block">
                    Additional Details
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] resize-none min-h-[96px]"
                    placeholder="Describe scene details..."
                    rows={4}
                  />
                </div>

                <div className="flex w-full gap-3">
                  <Button
                    variant="ghost"
                    className="rl-btn-primary flex-1"
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
                      <span className="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-[var(--rl-accent)] animate-pulse" />
                      <span>{progressMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </details>
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
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-md border border-white/[0.08]"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.8), 0 32px 96px rgba(0, 0, 0, 0.5)'
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
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
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rl-btn rl-btn-primary px-6"
              onClick={() => {
                handleSaveTemplate();
                setTemplateName("");
                setIsDialogOpen(false);
              }}
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Template Dialog */}
      <Dialog open={isRenameTemplateOpen} onOpenChange={setIsRenameTemplateOpen}>
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-md border border-white/[0.08]"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.8), 0 32px 96px rgba(0, 0, 0, 0.5)'
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
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
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => setIsRenameTemplateOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rl-btn rl-btn-primary px-6"
              onClick={handleRenameTemplateSubmit}
              disabled={!renameTemplateName.trim()}
            >
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-md border border-white/[0.08]"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.8), 0 32px 96px rgba(0, 0, 0, 0.5)'
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-neutral-400 mt-4">
            Are you sure you want to delete "{deleteTemplateTarget?.name || deleteTemplateTarget?.title || 'this template'}"? This action cannot be undone.
          </p>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => setIsDeleteTemplateOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rl-btn bg-red-600 hover:bg-red-700 text-white px-6 transition-all"
              onClick={handleDeleteTemplateConfirm}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
