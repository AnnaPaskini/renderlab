"use client";

import { ImageUploadPanel } from "@/components/workspace/ImageUploadPanel";
import { WorkspaceLayoutV2 } from "@/components/workspace/WorkspaceLayoutV2";
import { createClientThumbnail } from "@/core/thumbnail/createClientThumbnail";
import { useWorkspace } from "@/lib/context/WorkspaceContext";
import { createClient } from "@/lib/supabaseBrowser";
import { defaultToastStyle } from "@/lib/toast-config";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Link as LinkIcon, Loader2, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
  model?: string;
}

interface WorkspaceClientV2Props {
  initialHistoryImages: PreviewImage[];
}

interface PillItem {
  label: string;
  value: string;
}

interface PillCategory {
  id: string;
  label: string;
  template: (value: string) => string;
  pills: PillItem[];
}

interface Template {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
}

// ============================================================================
// AI MODELS
// ============================================================================

const AI_MODELS = [
  { id: "nano-banana", label: "Nano Banana", description: "Fast, high quality" },
  { id: "nano-banana-pro", label: "Nano Banana Pro", description: "Enhanced creative output" },
  { id: "seedream4", label: "Seedream 4", description: "High fidelity rendering" },
  { id: "flux-pro-kontext", label: "Flux Pro Kontext", description: "Context-aware generation" },
];

// ============================================================================
// PILL CATEGORIES WITH SMART SEMANTICS
// ============================================================================

const PILL_CATEGORIES: PillCategory[] = [
  {
    id: "lighting",
    label: "Lighting Setup",
    template: (value) => `with ${value} lighting`,
    pills: [
      { label: "Golden Hour", value: "soft golden hour" },
      { label: "Blue Hour", value: "soft blue hour" },
      { label: "Midday Sun", value: "bright midday" },
      { label: "Overcast", value: "soft overcast" },
      { label: "Night", value: "dramatic night" },
      { label: "Studio", value: "professional studio" },
      { label: "Natural", value: "natural soft window" },
      { label: "Dramatic", value: "dramatic contrast" },
    ],
  },
  {
    id: "camera",
    label: "Camera Angle",
    template: (value) => `from ${value} view`,
    pills: [
      { label: "Bird's Eye", value: "a bird's-eye" },
      { label: "Eye Level", value: "an eye level" },
      { label: "Low Angle", value: "a low angle" },
      { label: "High Angle", value: "a high angle" },
      { label: "Dutch Angle", value: "a tilted dutch" },
      { label: "Wide Shot", value: "a wide" },
      { label: "Close Up", value: "a close-up" },
    ],
  },
  {
    id: "interior",
    label: "Interior Style",
    template: (value) => `in ${value} style`,
    pills: [
      { label: "Modern", value: "a modern minimalist" },
      { label: "Scandinavian", value: "a clean Scandinavian" },
      { label: "Industrial", value: "an industrial loft" },
      { label: "Traditional", value: "a classic traditional" },
      { label: "Bohemian", value: "a cozy bohemian" },
      { label: "Japanese", value: "a Japanese zen" },
      { label: "Art Deco", value: "an Art Deco" },
    ],
  },
  {
    id: "color",
    label: "Color Palette",
    template: (value) => `with ${value} tones`,
    pills: [
      { label: "Earth Tones", value: "warm earth" },
      { label: "Monochrome", value: "monochromatic" },
      { label: "Vibrant", value: "vibrant bold" },
      { label: "Pastel", value: "soft pastel" },
      { label: "Neutral", value: "neutral muted" },
      { label: "Warm", value: "warm cozy" },
      { label: "Cool", value: "cool blue-green" },
    ],
  },
  {
    id: "imageStyle",
    label: "Image Styles",
    template: (value) => `in ${value} style`,
    pills: [
      { label: "Photorealistic", value: "photorealistic" },
      { label: "Sketch", value: "architectural sketch" },
      { label: "Watercolor", value: "watercolor painting" },
      { label: "Oil Painting", value: "oil painting" },
      { label: "3D Render", value: "3D render" },
      { label: "Illustration", value: "stylized illustration" },
      { label: "Storybook", value: "children's storybook" },
    ],
  },
];

// ============================================================================
// AVOID ELEMENTS
// ============================================================================

const AVOID_ELEMENTS: PillItem[] = [
  { label: "People", value: "people" },
  { label: "Cars", value: "cars" },
  { label: "Text", value: "text and letters" },
  { label: "Animals", value: "animals" },
  { label: "Clutter", value: "clutter and mess" },
];

// Consistency prompt for architectural visualization
const CONSISTENCY_PROMPT = "Maintain the exact architectural composition, perspective, materials, and proportions of the original image. Preserve all structural elements, lighting direction, and spatial relationships. Only modify what is explicitly requested.";

// ============================================================================
// COMPONENTS
// ============================================================================

// Apple-style Spinner
function AppleSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin", className)}
      size={18}
      strokeWidth={2.5}
    />
  );
}

// Category Pill Header (top row navigation)
function CategoryPillHeader({
  label,
  isOpen,
  hasSelection,
  onClick,
}: {
  label: string;
  isOpen: boolean;
  hasSelection: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[28px] px-3 text-sm font-medium rounded-full border transition-all duration-200",
        "flex items-center gap-1.5",
        hasSelection
          ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
          : "bg-transparent border-white/[0.15] text-white/80 hover:border-white/30"
      )}
    >
      {label}
      {hasSelection && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
    </button>
  );
}

// Dropdown Option Pill (inside expanded category)
function DropdownPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[28px] px-3 text-sm font-medium rounded-full transition-all duration-200",
        active
          ? "bg-violet-500/15 border border-violet-500/20 text-white"
          : "bg-white/[0.08] border-none text-white/85 hover:bg-white/[0.12]",
        "active:scale-[0.98] active:bg-white/[0.06]"
      )}
    >
      {label}
    </button>
  );
}

// Selected Pill (shows current selection with remove option)
function SelectedPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="h-[28px] px-3 text-sm font-medium rounded-full bg-violet-500/10 border border-violet-500/15 text-white flex items-center gap-2">
      {label}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={10} className="text-white/70 hover:text-white" />
      </button>
    </span>
  );
}

// Avoid Pill
function AvoidPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[28px] px-3 text-sm font-medium rounded-full transition-all duration-200",
        active
          ? "bg-red-500/15 border border-red-500/20 text-red-300"
          : "bg-white/[0.08] border-none text-white/85 hover:bg-white/[0.12]",
        "active:scale-[0.98]"
      )}
    >
      {label}
    </button>
  );
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function WorkspaceClientV2({ initialHistoryImages }: WorkspaceClientV2Props) {
  const searchParams = useSearchParams();
  const { activeItem } = useWorkspace();
  const hasLoadedFromUrlRef = useRef(false);
  const advancedRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  // Prompt state - THE SINGLE SOURCE OF TRUTH
  const [promptText, setPromptText] = useState("");

  // Selected pills per category (for tracking, one per category)
  const [selectedPills, setSelectedPills] = useState<Record<string, PillItem | null>>({});

  // Avoid elements
  const [selectedAvoid, setSelectedAvoid] = useState<Set<string>>(new Set());

  // Consistency mode for architectural projects
  const [keepConsistent, setKeepConsistent] = useState(false);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiModel, setAiModel] = useState("nano-banana");

  // History
  const [historyImages, setHistoryImages] = useState<PreviewImage[]>(initialHistoryImages);

  // UI states
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // DEFAULT PROMPT TEXT
  // ─────────────────────────────────────────────────────────────────────────

  const getDefaultPrompt = useCallback(() => {
    return uploadedImage
      ? "Transform the reference image."
      : "Create an image in the style you prefer.";
  }, [uploadedImage]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // Set default prompt on mount and when image changes
  useEffect(() => {
    if (!promptText || promptText === "Create an image in the style you prefer." || promptText === "Transform the reference image.") {
      setPromptText(getDefaultPrompt());
    }
  }, [uploadedImage]);

  // Load prompt from URL (from Prompts Library)
  useEffect(() => {
    if (hasLoadedFromUrlRef.current) return;

    const promptFromUrl = searchParams.get("prompt");
    if (promptFromUrl) {
      setPromptText(decodeURIComponent(promptFromUrl));
      toast.info("Prompt loaded from library", { style: defaultToastStyle });
      hasLoadedFromUrlRef.current = true;
    }
  }, [searchParams]);

  // Sync with WorkspaceContext
  useEffect(() => {
    if (activeItem.type === "temporary" && activeItem.data?.reference_url) {
      setUploadedImage(activeItem.data.reference_url);
    }
  }, [activeItem]);

  // Load templates from Supabase
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("templates")
          .select("id, name, prompt, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setTemplates(data);
      } catch (error) {
        console.error("Failed to load templates:", error);
      }
    };

    loadTemplates();
  }, []);

  // Realtime subscription for new images
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("workspace-v2-images")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "images",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newImage = payload.new as PreviewImage;
            setHistoryImages((prev) => {
              if (prev.some(img => img.id === newImage.id || img.url === newImage.url)) return prev;
              return [newImage, ...prev];
            });
            toast.success("New image generated!", {
              style: { background: "#10b981", color: "white", border: "none" },
              duration: 3000,
            });
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Smooth scroll when Advanced opens
  useEffect(() => {
    if (showAdvanced && advancedRef.current) {
      setTimeout(() => {
        advancedRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [showAdvanced]);

  // Auto-resize textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = "auto";
      const newHeight = Math.min(Math.max(promptRef.current.scrollHeight, 140), 320);
      promptRef.current.style.height = `${newHeight}px`;
    }
  }, [promptText]);

  // ─────────────────────────────────────────────────────────────────────────
  // PILL LOGIC - Adds semantic phrase to prompt
  // ─────────────────────────────────────────────────────────────────────────

  const addPillToPrompt = (category: PillCategory, pill: PillItem) => {
    const semanticPhrase = category.template(pill.value);
    const currentPill = selectedPills[category.id];

    setPromptText((prev) => {
      let newText = prev;

      // Remove old pill phrase if exists
      if (currentPill) {
        const oldPhrase = category.template(currentPill.value);
        newText = newText.replace(`, ${oldPhrase}`, "").replace(oldPhrase, "");
      }

      // Add new phrase
      if (newText.endsWith(".")) {
        newText = newText.slice(0, -1) + `, ${semanticPhrase}.`;
      } else if (newText.trim()) {
        newText = newText.trim() + `, ${semanticPhrase}`;
      } else {
        newText = semanticPhrase;
      }

      return newText;
    });

    // Track selection
    setSelectedPills((prev) => ({
      ...prev,
      [category.id]: pill,
    }));
  };

  const removePillFromPrompt = (category: PillCategory) => {
    const currentPill = selectedPills[category.id];
    if (!currentPill) return;

    const phrase = category.template(currentPill.value);

    setPromptText((prev) => {
      return prev.replace(`, ${phrase}`, "").replace(phrase, "").trim();
    });

    setSelectedPills((prev) => ({
      ...prev,
      [category.id]: null,
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AVOID LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  const toggleAvoid = (item: PillItem) => {
    setSelectedAvoid((prev) => {
      const next = new Set(prev);
      const isRemoving = next.has(item.label);

      if (isRemoving) {
        next.delete(item.label);
      } else {
        next.add(item.label);
      }

      // Rebuild avoid sentence and update prompt
      const avoidValues = AVOID_ELEMENTS
        .filter((a) => next.has(a.label))
        .map((a) => a.value);

      const newAvoidSentence = avoidValues.length > 0
        ? `Please avoid ${avoidValues.join(", ")}.`
        : "";

      // Update prompt text - remove old avoid sentence and add new one
      setPromptText((currentPrompt) => {
        // Remove any existing "Please avoid..." sentence
        let cleanedPrompt = currentPrompt.replace(/\s*Please avoid[^.]*\./gi, "").trim();

        // Add new avoid sentence if there are selections
        if (newAvoidSentence) {
          return cleanedPrompt + " " + newAvoidSentence;
        }
        return cleanedPrompt;
      });

      return next;
    });
  };

  const buildAvoidSentence = () => {
    if (selectedAvoid.size === 0) return "";
    const avoidValues = AVOID_ELEMENTS
      .filter((a) => selectedAvoid.has(a.label))
      .map((a) => a.value);
    return `Please avoid ${avoidValues.join(", ")}.`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const refetchHistory = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("images")
        .select("id, thumbnail_url, url, created_at, model")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) setHistoryImages(data);
    } catch (error) {
      console.error("Failed to refetch history:", error);
    }
  };

  const handleClearReference = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    toast.info("Reference cleared", { style: defaultToastStyle });
  };

  const handleRemoveFromHistory = (imageId: string) => {
    setHistoryImages((prev) => prev.filter((img) => img.id !== imageId));
    toast.info("Removed from view", { style: defaultToastStyle });
  };

  const handleClearAll = () => {
    setPromptText(getDefaultPrompt());
    setSelectedPills({});
    setSelectedAvoid(new Set());
    setExpandedCategory(null);
    setLoadedTemplateName(null);
    toast.info("All cleared", { style: defaultToastStyle });
  };

  // URL validation
  const validateAndLoadImageUrl = async (url: string) => {
    if (!url.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setIsValidatingUrl(true);

    try {
      const imageExtensions = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;
      if (imageExtensions.test(url)) {
        setUploadedImage(url);
        toast.success("Image loaded from URL");
        setImageUrl("");
        return;
      }

      const pagePatterns = ["pinterest.com/pin/", "instagram.com/p/", "facebook.com", "twitter.com", "x.com"];
      if (pagePatterns.some((p) => url.includes(p))) {
        toast.error('Not a direct image link. Right-click → "Copy image address"');
        return;
      }

      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");

      if (contentType?.startsWith("image/")) {
        setUploadedImage(url);
        toast.success("Image loaded from URL");
        setImageUrl("");
      } else {
        toast.error("This URL does not point to an image");
      }
    } catch {
      toast.error("Failed to load image from URL");
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Template handlers
  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template first");
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setPromptText(template.prompt);
      setLoadedTemplateName(template.name);
      setSelectedPills({}); // Clear pill tracking since we replaced text
      toast.success(`Loaded: "${template.name}"`, { style: defaultToastStyle });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: templateTitle.trim(),
          prompt: promptText,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates((prev) => [data, ...prev]);
      setShowSaveDialog(false);
      setTemplateTitle("");
      toast.success(`Saved: "${data.name}"`, { style: defaultToastStyle });
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    }
  };

  // Generate handler
  const handleGenerate = async () => {
    const basePrompt = promptText.trim();
    if (!basePrompt || basePrompt === getDefaultPrompt()) {
      toast.error("Please add some details to your prompt");
      return;
    }

    setIsGenerating(true);

    try {
      // Prompt already contains consistency instruction (added via useEffect)
      const finalPrompt = basePrompt;

      console.log("📝 Final prompt:", finalPrompt);

      // Create thumbnail if file uploaded
      let thumbBlob: Blob | null = null;
      if (uploadedFile) {
        try {
          thumbBlob = await createClientThumbnail(uploadedFile);
        } catch (err) {
          console.error("Thumbnail generation failed:", err);
        }
      }

      // Upload thumbnail if exists
      if (uploadedFile && thumbBlob) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const fileName = `thumb_${Date.now()}.webp`;
            const filePath = `${user.id}/workspace/${fileName}`;
            await supabase.storage
              .from("renderlab-images-v2")
              .upload(filePath, thumbBlob, { contentType: "image/webp", upsert: false });
          }
        } catch (err) {
          console.error("Thumbnail upload error:", err);
        }
      }

      // Call API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: aiModel,
          imageUrl: uploadedImage || null,
          thumbnailUrl: null,
        }),
      });

      const rawBody = await response.text();

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = rawBody ? JSON.parse(rawBody) : null;

      if (data?.status === "succeeded" && data?.output?.imageUrl) {
        // Сразу добавляем в начало History (не ждём Realtime)
        const newImage: PreviewImage = {
          id: `temp-${Date.now()}`,
          url: data.output.imageUrl,
          thumbnail_url: data.output.imageUrl,
          created_at: new Date().toISOString(),
          model: aiModel,
        };

        setHistoryImages((prev) => [newImage, ...prev]);

        // Smooth scroll to top to see the new image
        window.scrollTo({ top: 0, behavior: 'smooth' });

        toast.success(
          uploadedImage ? "Generated from reference" : "Generated from prompt",
          { style: defaultToastStyle }
        );
      } else {
        toast.error("Generation failed: " + (data?.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const hasAnySelection = Object.values(selectedPills).some(p => p !== null) ||
    selectedAvoid.size > 0 ||
    (promptText.trim() && promptText !== getDefaultPrompt());

  return (
    <WorkspaceLayoutV2
      historyImages={historyImages}
      onRemoveFromHistory={handleRemoveFromHistory}
      onRefetchHistory={refetchHistory}
    >
      <div className="flex flex-col">
        {/* ================================================================ */}
        {/* 1. UPLOAD PANEL — gap-7 (28px) after */}
        {/* ================================================================ */}
        <div className="mb-7">
          <ImageUploadPanel
            image={uploadedImage}
            onImageChange={setUploadedImage}
            onClearImage={handleClearReference}
            onFileChange={setUploadedFile}
          />
        </div>

        {/* ================================================================ */}
        {/* 2. URL INPUT — gap-6 (24px) after */}
        {/* ================================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border-t border-white/20" />
            <span className="text-xs text-gray-500 font-medium">OR</span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <LinkIcon size={14} />
            <span>Paste image URL</span>
            <span className="text-xs text-gray-600">— direct jpg/png/webp only</span>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && imageUrl.trim()) {
                  validateAndLoadImageUrl(imageUrl);
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-2.5 text-sm border border-white/10 rounded-xl bg-[#0a0a0a] text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35] outline-none transition-all"
              disabled={isValidatingUrl}
            />
            <button
              onClick={() => validateAndLoadImageUrl(imageUrl)}
              disabled={!imageUrl.trim() || isValidatingUrl}
              className="px-4 py-2.5 bg-white/[0.08] text-white text-sm font-medium rounded-xl border border-white/10 hover:bg-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isValidatingUrl ? "..." : "Load"}
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. PROMPT BOX — gap-7 (28px) after */}
        {/* ================================================================ */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/90">Prompt</span>
            {hasAnySelection && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              ref={promptRef}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={getDefaultPrompt()}
              maxLength={2000}
              className={cn(
                "w-full px-5 py-4 text-sm border border-white/10 rounded-2xl",
                "bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]",
                "text-white placeholder:text-gray-500",
                "focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35]",
                "outline-none transition-all resize-none",
                "min-h-[140px] max-h-[320px]"
              )}
              disabled={isGenerating}
            />
            {/* Subtle top gradient overlay (Apple Notes style) */}
            <div className="absolute inset-x-0 top-0 h-8 rounded-t-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          </div>

          {/* Character counter */}
          <div className="flex justify-between mt-1 px-1">
            <span className="text-xs text-gray-500">Max 2000 characters</span>
            <span className={cn("text-xs", promptText.length > 1800 ? "text-orange-400" : "text-gray-500")}>
              {promptText.length}/2000
            </span>
          </div>

          {loadedTemplateName && (
            <p className="mt-2 text-xs text-violet-400">
              Loaded: "{loadedTemplateName}"
            </p>
          )}
        </div>

        {/* ================================================================ */}
        {/* 4. GENERATE BUTTON — gap-6 (24px) after */}
        {/* ================================================================ */}
        <div className="mb-6">
          {/* Consistency Toggle - for architectural projects */}
          {uploadedImage && (
            <label className="flex items-center gap-3 px-1 mb-4 cursor-pointer group">
              <div
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-200",
                  keepConsistent ? "bg-[#ff6b35]" : "bg-white/10"
                )}
                onClick={() => setKeepConsistent(!keepConsistent)}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                    keepConsistent ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90">Keep Consistent</span>
                <span className="text-xs text-gray-500">Preserve architectural composition & style</span>
              </div>
            </label>
          )}
          <button
            onClick={handleGenerate}
            disabled={!hasAnySelection || isGenerating}
            className={cn(
              "w-full py-3.5 text-base premium-generate-button",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGenerating ? (
              <>
                <AppleSpinner />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate
              </>
            )}
          </button>
        </div>

        {/* ================================================================ */}
        {/* 5. PILL CATEGORIES — gap-8 (32px) after */}
        {/* ================================================================ */}
        <div className="mb-8">
          {/* Category headers row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PILL_CATEGORIES.map((category) => (
              <CategoryPillHeader
                key={category.id}
                label={category.label}
                isOpen={expandedCategory === category.id}
                hasSelection={selectedPills[category.id] !== null && selectedPills[category.id] !== undefined}
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )
                }
              />
            ))}
          </div>

          {/* Expanded category dropdown */}
          {expandedCategory && (
            <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.08] mb-3">
              <div className="flex flex-wrap gap-2">
                {PILL_CATEGORIES.find(c => c.id === expandedCategory)?.pills.map((pill) => {
                  const category = PILL_CATEGORIES.find(c => c.id === expandedCategory)!;
                  const isActive = selectedPills[expandedCategory]?.label === pill.label;

                  return (
                    <DropdownPill
                      key={pill.label}
                      label={pill.label}
                      active={isActive}
                      onClick={() => {
                        if (isActive) {
                          removePillFromPrompt(category);
                        } else {
                          addPillToPrompt(category, pill);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected pills display */}
          {Object.entries(selectedPills).some(([_, pill]) => pill !== null) && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedPills).map(([categoryId, pill]) => {
                if (!pill) return null;
                const category = PILL_CATEGORIES.find(c => c.id === categoryId);
                if (!category) return null;

                return (
                  <SelectedPill
                    key={categoryId}
                    label={pill.label}
                    onRemove={() => removePillFromPrompt(category)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* 6. ADVANCED TOOLS — gap-8 to gap-10 (32-40px) */}
        {/* ================================================================ */}
        <div ref={advancedRef}>
          {/* Accordion header */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full h-[40px] flex items-center justify-between text-white/85 hover:text-white transition-colors border-b border-white/[0.08]"
          >
            <span className="text-sm font-medium">Advanced Tools</span>
            {showAdvanced ? (
              <IconChevronDown size={16} className="opacity-60" />
            ) : (
              <IconChevronRight size={16} className="opacity-60" />
            )}
          </button>

          {/* Accordion content */}
          {showAdvanced && (
            <div
              className="pt-5 pb-2 space-y-5"
              style={{
                animation: "fadeIn 0.25s ease-out",
              }}
            >
              {/* AI Model Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">AI Model</label>
                <div className="relative">
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    disabled={isGenerating}
                    className={cn(
                      "w-full h-[44px] px-4 text-sm font-medium rounded-xl appearance-none cursor-pointer",
                      "bg-white/[0.06] border border-white/[0.15] text-white/90",
                      "focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all"
                    )}
                  >
                    {AI_MODELS.map((model) => (
                      <option key={model.id} value={model.id} className="bg-[#1a1a1a]">
                        {model.label} — {model.description}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
                  />
                </div>
              </div>

              {/* Templates Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">Templates</label>

                {/* Template dropdown + Load button row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedTemplateId || ""}
                      onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                      className={cn(
                        "w-full h-[44px] px-4 text-sm font-medium rounded-xl appearance-none cursor-pointer",
                        "bg-white/[0.06] border border-white/[0.15] text-white/90",
                        "focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35]",
                        "transition-all"
                      )}
                    >
                      <option value="" className="bg-[#1a1a1a]">Choose a template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id} className="bg-[#1a1a1a]">
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
                    />
                  </div>

                  <button
                    onClick={handleLoadTemplate}
                    disabled={!selectedTemplateId}
                    className={cn(
                      "h-[44px] px-4 text-sm font-medium rounded-xl",
                      "bg-transparent border border-white/20 text-white",
                      "hover:bg-white/[0.08] hover:border-white/30",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all"
                    )}
                  >
                    Load
                  </button>
                </div>

                {/* Save as Template button */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className={cn(
                    "w-full h-[44px] px-4 text-sm font-medium rounded-xl",
                    "bg-transparent border border-white/[0.22] text-white/95",
                    "hover:bg-white/[0.08] hover:border-white/30",
                    "transition-all"
                  )}
                >
                  Save as Template
                </button>
              </div>

              {/* Avoid Elements */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">Avoid Elements</label>
                <div className="flex flex-wrap gap-2">
                  {AVOID_ELEMENTS.map((item) => (
                    <AvoidPill
                      key={item.label}
                      label={item.label}
                      active={selectedAvoid.has(item.label)}
                      onClick={() => toggleAvoid(item)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Template Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Save as Template</h3>
              <input
                type="text"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Template name..."
                className="w-full px-4 py-3 text-sm border border-white/10 rounded-xl bg-[#0a0a0a] text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#ff6b35]/50 outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateTitle("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateTitle.trim()}
                  className="px-4 py-2 text-sm font-medium bg-[#ff6b35] text-white rounded-lg hover:bg-[#ff7b45] disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </WorkspaceLayoutV2>
  );
}

export default WorkspaceClientV2;
