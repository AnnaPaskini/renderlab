"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { createClient } from "@/lib/supabaseBrowser";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ContextIndicator } from './ContextIndicator';
import { TemplateBuilder } from './prompt-builder/TemplateBuilder';

export interface PromptBuilderPanelProps {
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (model: string, prompt: string) => Promise<void>;
  isGenerating?: boolean;
  activeTab?: "builder" | "custom";
  onTabChange?: (tab: "builder" | "custom") => void;
  onPreviewAdd?: (url: string) => void;
  uploadedImage?: string | null;
  initialAdditionalDetails?: string | null;
  onRefetchPreviewImages?: () => void;
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
  onRefetchPreviewImages,
}: PromptBuilderPanelProps) {

  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<"builder" | "custom">(
    activeTab ?? "builder"
  );
  const [aiModel, setAiModel] = useState("nano-banana");
  const [style, setStyle] = useState("");
  const [details, setDetails] = useState(""); // Raw pills only: "golden hour, bird's-eye view"
  const [customPrompt, setCustomPrompt] = useState(""); // User's manual edits to assembled prompt
  const [editablePrompt, setEditablePrompt] = useState(""); // Editable prompt for generation
  const [avoidElements, setAvoidElements] = useState("");
  const [avoidItems, setAvoidItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const isLoadingTemplateRef = useRef(false);

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
  const { activeItem, loadTemplate, clear } = useWorkspace();

  // Dynamic page title based on activeItem
  const getPageTitle = () => {
    if (activeItem.type === 'template') {
      return `Editing: ${activeItem.data.name}`;
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

  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateRenderKey, setTemplateRenderKey] = useState(0);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Template management state
  const [renameTemplateTarget, setRenameTemplateTarget] = useState<any | null>(null);
  const [renameTemplateName, setRenameTemplateName] = useState('');
  const [isRenameTemplateOpen, setIsRenameTemplateOpen] = useState(false);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<any | null>(null);
  const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

    const isOriginalTemplate = (template: any) => {
      return true;
    };

    const registerTemplate = (
      template: any,
      context: { fallbackIndex: number },
    ) => {
      if (!template) return;

      const rawName =
        template?.name ||
        template?.title ||
        template?.formData?.name ||
        template?.metadata?.title ||
        `Template ${options.length + 1}`;
      const displayLabel = rawName;
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

    // Register all templates
    templates
      .filter(isOriginalTemplate)
      .forEach((template, index) => {
        registerTemplate(template, { fallbackIndex: index });
      });

    return { options, lookup: map };
  }, [templates]);

  useEffect(() => {
    if (activeTemplateId && !templateOptions.some((option) => option.id === activeTemplateId)) {
      setActiveTemplateId(null);
    }
  }, [activeTemplateId, templateOptions]);

  const currentTab = activeTab ?? internalActiveTab;
  const isTabControlled = typeof activeTab !== "undefined";

  const handleTabChange = (tab: "builder" | "custom") => {
    if (!isTabControlled) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };

  // Load templates from Supabase
  const loadTemplatesFromSupabase = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setTemplates([]);
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load templates:', error);
        throw error;
      }

      setTemplates(data || []);
      setTemplateRenderKey(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  useEffect(() => {
    loadTemplatesFromSupabase();
  }, []);

  // Reload templates when returning to builder tab or when custom tab is active
  useEffect(() => {
    if (currentTab === "builder" || currentTab === "custom") {
      loadTemplatesFromSupabase();
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === "builder") {
      setDetails("");
      setCustomPrompt(""); // Clear manual edits when switching tabs
      abortControllerRef.current?.abort();
    }
  }, [currentTab]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handler for template change
  const handleTemplateChange = (id: string) => {
    const record = templateLookup.get(id);
    if (!record) {
      return;
    }

    const templateData = record.template ?? {};

    // Update WorkspaceContext
    loadTemplate(templateData);

    // For simple templates saved to Supabase, just use the prompt field directly
    const templatePrompt = templateData.prompt || '';

    // Set loading flag BEFORE any state updates to prevent clearing customPrompt
    isLoadingTemplateRef.current = true;

    setActiveTemplateId(id);
    setAiModel(templateData.aiModel || "nano-banana");
    setStyle(templateData.style || "");
    setDetails(""); // Clear details for simple templates
    setAvoidElements("");
    setAvoidItems([]); // Clear avoid items when loading template

    // Load the prompt into both customPrompt and editablePrompt
    setCustomPrompt(templatePrompt);
    setEditablePrompt(templatePrompt); // Load template prompt into editable textarea

    // Reset flag after all updates
    setTimeout(() => {
      isLoadingTemplateRef.current = false;
    }, 50);

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
        setDetails(template.details || ""); // Only use raw details, never finalPrompt (assembled)
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

        isLoadingTemplateRef.current = true;

        // Simple load - just set the prompt text
        if (template?.prompt) {
          setCustomPrompt(template.prompt);
          setEditablePrompt(template.prompt); // Also load into editable textarea
        }

        // Reset flag after a short delay to allow state updates
        setTimeout(() => {
          isLoadingTemplateRef.current = false;
        }, 100);

        localStorage.removeItem("RenderAI_activeTemplate");
      } catch (error) {
        console.error("❌ Error loading template:", error);
        isLoadingTemplateRef.current = false;
      }
    }
  }, []);

  // Initial prompt logic - only set when editablePrompt is empty
  useEffect(() => {
    // Don't override if loading template
    if (isLoadingTemplateRef.current) {
      return;
    }

    // Системные фразы, которые можно безопасно перезаписать
    const isSystemPrompt = (text: string) =>
      text.trim() === "" ||
      text.trim() === "Create a new image." ||
      text.trim() === "Transform the reference image.";

    // Если текущий editablePrompt НЕ системный — не трогаем
    if (!isSystemPrompt(editablePrompt)) {
      return;
    }

    // Если системный — обновляем в зависимости от картинки
    if (uploadedImage) {
      setEditablePrompt("Transform the reference image.");
    } else {
      setEditablePrompt("Create a new image.");
    }
  }, [uploadedImage]);

  const assemblePrompt = () => {
    // 1. Base context - IMPROVED PHRASING
    let prompt = uploadedImage
      ? "Transform the reference image"
      : "Create a new image";

    // 2. Process details with smart category context
    if (details && details.trim()) {
      const options = details.split(',').map(opt => opt.trim()).filter(Boolean);

      if (options.length > 0) {
        // Map each option to include descriptive context
        const descriptiveOptions = options.map(option => {
          const lowerOption = option.toLowerCase();

          // Lighting Setup category
          if (['golden hour', 'overcast soft light', 'noon light', 'blue hour dusk',
            'night ambient', 'interior daylight', 'artificial balanced lighting',
            'studio controlled lighting'].includes(lowerOption)) {
            return `a ${lowerOption} lighting setup`;
          }

          // Camera Angle category
          if (["eye-level", "bird's-eye view", "worm's-eye view", 'street-level',
            'corner view', 'centered view', 'diagonal view', 'symmetrical centered'].includes(lowerOption)) {
            return `a ${lowerOption} camera angle`;
          }

          // Interior Style category
          if (['minimalist', 'scandinavian', 'mid-century modern', 'industrial',
            'bohemian', 'japandi', 'art deco', 'contemporary'].includes(lowerOption)) {
            return `a ${lowerOption} interior style`;
          }

          // Color Palette category
          if (['warm neutrals', 'cool neutrals', 'earth tones', 'monochrome',
            'pastel accents', 'bold contrast'].includes(lowerOption)) {
            return `${lowerOption} color palette`;
          }

          // If not in any category, return as-is (user custom input)
          return lowerOption;
        });

        // Join with proper grammar
        if (descriptiveOptions.length === 1) {
          prompt += ` with ${descriptiveOptions[0]}`;
        } else if (descriptiveOptions.length === 2) {
          prompt += ` with ${descriptiveOptions[0]} and ${descriptiveOptions[1]}`;
        } else {
          // Multiple options: "X, Y, and Z"
          const lastOption = descriptiveOptions.pop();
          prompt += ` with ${descriptiveOptions.join(', ')}, and ${lastOption}`;
        }
      }
    }

    // 3. Add avoid elements at the end
    if (avoidElements && avoidElements.trim()) {
      const avoidList = avoidElements.split(',').map(item => item.trim()).filter(Boolean);

      if (avoidList.length > 0) {
        if (avoidList.length === 1) {
          prompt += `. Please avoid ${avoidList[0]}`;
        } else if (avoidList.length === 2) {
          prompt += `. Please avoid ${avoidList[0]} and ${avoidList[1]}`;
        } else {
          const lastItem = avoidList.pop();
          prompt += `. Please avoid ${avoidList.join(', ')}, and ${lastItem}`;
        }
      }
    }

    // 4. End with period
    if (!prompt.endsWith('.')) {
      prompt += '.';
    }

    return prompt;
  };

  // Handle avoid element clicks
  const handleAvoidClick = (item: string) => {
    setAvoidItems(prev => {
      if (prev.includes(item)) return prev;
      return [...prev, item];
    });

    // After updating avoidItems, update editablePrompt:
    updatePromptWithAvoid();
  };

  // Update editable prompt with avoid elements
  const updatePromptWithAvoid = () => {
    const base = editablePrompt
      .replace(/Do not use:[\s\S]*/i, '')  // remove old avoid line
      .trim();

    if (avoidItems.length === 0) {
      setEditablePrompt(base);
      return;
    }

    const last = avoidItems[avoidItems.length - 1];
    const others = avoidItems.slice(0, -1);

    let avoidLine = '';
    if (others.length === 0) {
      avoidLine = `Do not use: ${last}.`;
    } else {
      avoidLine = `Do not use: ${others.join(', ')}, and ${last}.`;
    }

    setEditablePrompt(`${base}\n${avoidLine}`);
  };

  // Sync assembled prompt to editable textarea when bookmarks change
  // REMOVED: This was causing bookmark clicks to reset the prompt instead of appending
  // useEffect(() => {
  //   if (details || avoidElements) {
  //     const assembled = assemblePrompt();
  //     setEditablePrompt(assembled);
  //   }
  // }, [details, avoidElements, uploadedImage]);

  // Send prompt updates to parent
  useEffect(() => {
    if (onPromptChange) {
      // Use customPrompt if user manually edited, otherwise use assembled prompt
      const prompt = customPrompt || assemblePrompt();
      onPromptChange(prompt);
    }
  }, [details, avoidElements, uploadedImage, customPrompt, onPromptChange]);

  // Sync editablePrompt with assembled prompt when not manually edited
  useEffect(() => {
    // Don't override if loading template
    if (isLoadingTemplateRef.current) {
      return;
    }

    const assembled = assemblePrompt();
    if (!editablePrompt.trim() && assembled.trim()) {
      setEditablePrompt(assembled);
    }
  }, [details, avoidElements, uploadedImage]);

  // Sync form with WorkspaceContext when temporary item is loaded
  useEffect(() => {
    if (activeItem.type === 'temporary' && activeItem.data) {
      // DON'T load activeItem.data.prompt into details - it contains assembled prompt!
      // History stores full assembled prompts like "Please create a new image with..."
      // Loading that into details causes infinite duplication

      // Load assembled prompt into customPrompt instead of details
      if (activeItem.data.prompt) {
        setCustomPrompt(activeItem.data.prompt);
      }

      // Note: Reference image (uploadedImage) is managed by parent component (workspace/page.tsx)
      // The parent needs to handle activeItem.data.reference_url
      if (activeItem.data.reference_url) {
      }
    }
  }, [activeItem]);

  // Load template prompt into editor when coming from Template Page
  useEffect(() => {
    if (activeItem.type === 'template' && activeItem.data?.prompt) {
      setCustomPrompt(activeItem.data.prompt);
      setEditablePrompt(activeItem.data.prompt);
    }
  }, [activeItem]);

  const handleSaveTemplate = async () => {
    try {
      const supabase = createClient();

      // 1. Берём текст именно из editablePrompt
      const fullPrompt = editablePrompt.trim();

      if (!fullPrompt) {
        toast.error('Prompt is empty. Please enter or load a prompt before saving.', {
          duration: 2500,
          style: { fontSize: "14px" },
        });
        return;
      }

      // 2. Имя темплейта
      const finalTemplateName = (templateName || '').trim() || 'Untitled template';

      // 3. Получаем юзера
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while saving template:', authError);
        toast.error('Please sign in to save templates', {
          duration: 2500,
          style: { fontSize: "14px" },
        });
        return;
      }

      // 4. Проверяем дубликат имени
      const { data: existingTemplates, error: checkError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', finalTemplateName);

      if (checkError) {
        console.error('Error checking existing templates:', checkError);
        throw checkError;
      }

      if (existingTemplates && existingTemplates.length > 0) {
        toast.error(`A template named '${finalTemplateName}' already exists. Please choose a different name.`, {
          duration: 2500,
          style: { fontSize: "14px" },
        });
        return;
      }

      // 5. Сохраняем в таблицу templates
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: finalTemplateName,
          prompt: fullPrompt,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      // 6. Обновляем локальный список шаблонов
      await loadTemplatesFromSupabase();
      if (data?.id) {
        setActiveTemplateId(data.id);
      }

      toast.success(`Template "${finalTemplateName}" saved`, {
        duration: 1500,
        style: { fontSize: "14px" },
      });

      // 7. Закрываем диалог
      setIsDialogOpen(false);
      setTemplateName('');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template. Please try again.', {
        duration: 2500,
        style: { fontSize: "14px" },
      });
    }
  };

  const handleGenerateTemplate = async () => {
    const userPrompt = editablePrompt.trim() || assemblePrompt();
    if (!userPrompt) {
      toast.error("Please enter a prompt or load a template first.");
      return;
    }

    try {
      setGeneratingState(true);
      if (onGenerate) {
        await onGenerate(aiModel, userPrompt);
      }
    } catch (error) {
      console.error("Template generation failed", error);
      toast.error("Template generation failed. Check console for details.");
    } finally {
      setGeneratingState(false);
    }
  };

  // Template management handlers
  const readTemplatesFromStorage = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to read templates from storage", error);
      return [];
    }
  };

  const saveTemplatesToStorage = async (templates: any[]) => {
    await loadTemplatesFromSupabase();
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to duplicate templates');
        return;
      }

      const duplicated = {
        user_id: user.id,
        name: `${template.name || 'Template'} - Copy`,
        prompt: template.prompt,
      };

      const { error } = await supabase
        .from('templates')
        .insert(duplicated);

      if (error) throw error;

      await loadTemplatesFromSupabase();
      toast.success(`Template duplicated: ${duplicated.name}`);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleRenameTemplate = (template: any) => {
    setRenameTemplateTarget(template);
    setRenameTemplateName(template.name || template.title || '');
    setIsRenameTemplateOpen(true);
  };

  const handleRenameTemplateSubmit = async () => {
    if (!renameTemplateTarget || !renameTemplateName.trim()) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('templates')
        .update({ name: renameTemplateName.trim() })
        .eq('id', renameTemplateTarget.id);

      if (error) throw error;

      await loadTemplatesFromSupabase();
      toast.success(`Template renamed to: ${renameTemplateName.trim()}`);

      setIsRenameTemplateOpen(false);
      setRenameTemplateTarget(null);
      setRenameTemplateName('');
    } catch (error) {
      console.error('Failed to rename template:', error);
      toast.error('Failed to rename template');
    }
  };

  const handleDeleteTemplate = (template: any) => {
    setDeleteTemplateTarget(template);
    setIsDeleteTemplateOpen(true);
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!deleteTemplateTarget) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteTemplateTarget.id);

      if (error) throw error;

      // If this was the active template, clear it
      if (activeTemplateId === deleteTemplateTarget.id) {
        setActiveTemplateId(null);
      }

      await loadTemplatesFromSupabase();
      toast.success("Template deleted!");

      setIsDeleteTemplateOpen(false);
      setDeleteTemplateTarget(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
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
                <p className="text-sm text-purple-400/70 mt-1">{getPageSubtitle()}</p>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-purple-400/70 hover:text-purple-300 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Context Indicator */}
            <div>
              <ContextIndicator uploadedImage={uploadedImage} />
            </div>

            {/* Main Generate Button */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key="template-btn"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "rl-btn-primary w-full py-4 text-base font-semibold",
                    isGenerating && "opacity-60 cursor-not-allowed",
                  )}
                  onClick={handleGenerateTemplate}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate"}
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
              <h3 className="text-xs font-semibold text-purple-400/70 uppercase tracking-wide mb-4">
                Quick Load
              </h3>

              {/* Unified Dropdown + Load Button */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <>
                    {(() => {
                      return null;
                    })()}
                    {templateOptions.length > 0 ? (
                      <>
                        <DropdownMenu
                          key={`template-dropdown-${templateRenderKey}`}
                          open={isTemplateDropdownOpen}
                          onOpenChange={(open) => {
                            setIsTemplateDropdownOpen(open);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(selectTriggerClass, "flex-[7] flex items-center justify-between")}
                            >
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
                            className="w-[400px] max-h-[400px] overflow-y-auto bg-[var(--rl-panel)] text-[var(--rl-text)] border-[var(--rl-border)] rounded-lg shadow-lg"
                            align="start"
                          >
                            {(() => {
                              return null;
                            })()}
                            {templateOptions.map((option) => {
                              const template = templateLookup.get(option.id)?.template;
                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center justify-between w-full group hover:bg-[var(--rl-panel-hover)] px-3 py-2 cursor-pointer ${option.id === activeTemplateId ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''
                                    }`}
                                >
                                  <div
                                    className="flex-1 min-w-0"
                                    onClick={() => {
                                      setActiveTemplateId(option.id);
                                      setIsTemplateDropdownOpen(false);
                                    }}
                                  >
                                    <div className="font-medium text-neutral-900 dark:text-white truncate">
                                      {template?.name || template?.title || "Untitled template"}
                                    </div>
                                    {(template?.style || template?.scenario) && (
                                      <div className="text-sm text-purple-400/70 truncate mt-0.5">
                                        {template.style || template.scenario}
                                      </div>
                                    )}
                                  </div>
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
                      <div className="text-sm text-purple-400/70 py-2">
                        {(() => {
                          return "No saved templates found.";
                        })()}
                      </div>
                    )}
                  </>

                </div>

                {/* Loaded Status Display */}
                {activeTemplateId && templateLookup.get(activeTemplateId) && (
                  <div className="text-sm text-purple-400 flex items-center gap-1">
                    <span>✓</span>
                    <span>Loaded: "{templateLookup.get(activeTemplateId)?.templateName}"</span>
                  </div>
                )}
              </div>


            </div>



            {/* Advanced Settings Section - Standalone Panel */}
            <div className="space-y-4">
              {/* Editable Prompt Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white">
                  Prompt (Editable)
                </label>
                <textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  placeholder="Your prompt will appear here. You can edit it freely before generating."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none text-sm min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              {/* Existing TemplateBuilder */}
              <TemplateBuilder
                aiModel={aiModel}
                onAiModelChange={setAiModel}
                details={details}
                onDetailsChange={(value) => {
                  setDetails(value);
                  if (!isLoadingTemplateRef.current) {
                    setCustomPrompt(''); // Clear manual edits when pills are clicked
                  }
                }}
                onBookmarkClick={(text) => {
                  const current = editablePrompt.trim();
                  if (!current) {
                    setEditablePrompt(text);
                  } else {
                    setEditablePrompt(`${current}, ${text}`);
                  }
                }}
                avoidElements={avoidElements}
                onAvoidElementsChange={(value) => {
                  setAvoidElements(value);
                  if (!isLoadingTemplateRef.current) {
                    setCustomPrompt(''); // Clear manual edits when avoid elements change
                  }
                }}
                onAvoidClick={handleAvoidClick}
                uploadedImage={uploadedImage}
                onSaveTemplate={() => setIsDialogOpen(true)}
                isGenerating={isGenerating}
              />
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
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-md border border-white/[0.08]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
              Save Template
            </DialogTitle>
            <DialogDescription>
              Enter a name for your template to save it for future use.
            </DialogDescription>
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
              onClick={handleSaveTemplate}
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
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
              Rename Template
            </DialogTitle>
            <DialogDescription>
              Enter a new name for your template.
            </DialogDescription>
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
          className="max-w-md w-full rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-8"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold text-white">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-purple-400/70">
              Are you sure you want to delete "<strong className="text-white">{deleteTemplateTarget?.name || deleteTemplateTarget?.title || 'this template'}</strong>"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="mt-8 flex justify-end gap-3">
            <button
              className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
              onClick={() => setIsDeleteTemplateOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
              onClick={handleDeleteTemplateConfirm}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirm Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-md border border-white/[0.08]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rl-text">
              Clear all settings?
            </DialogTitle>
            <DialogDescription>
              This will reset the prompt builder to its default state. All current settings will be lost.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="rl-btn bg-red-600 hover:bg-red-700 text-white px-6 transition-all"
              onClick={() => {
                setAiModel("nano-banana");
                setDetails('');
                setCustomPrompt(''); // Clear manual edits
                setStyle('');
                setAvoidElements('');
                setAvoidItems([]); // Clear avoid items
                setActiveTemplateId(null);
                abortControllerRef.current?.abort();
                abortControllerRef.current = null;
                clear();
                setEditablePrompt("");  // Clear editable prompt
                setShowClearConfirm(false);
                toast.success('All cleared');
              }}
            >
              Clear All
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
