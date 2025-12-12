// lib/constants.tsx

export const STORAGE_KEYS = {
  ACTIVE_TEMPLATE: "RenderAI_activeTemplate",
  TEMPLATES: "RenderAI_templates",
  COLLECTIONS: "RenderAI_collections",
} as const;

export const DEFAULT_TEMPLATES = [
  {
    id: "default_photorealistic",
    title: "Photorealistic Exterior",
    branch: "CREATE",
    scenario: "Photorealistic Exterior",
    formData: {
      aiModel: "nano-banana",
      style: "Photorealistic",
      customPrompt: "",
    },
    createdAt: new Date().toISOString(),
  },
];

// === GENERATION MODELS ===
export const AI_MODELS = [
  { id: "nano-banana", label: "Nano Banana", description: "Fast, high quality" },
  { id: "nano-banana-pro", label: "Nano Banana Pro", description: "4K enhanced output" },
  { id: "seedream4", label: "Seedream 4", description: "High fidelity rendering" },
  { id: "seedream-4.5", label: "Seedream 4.5", description: "Cinematic quality" },
  { id: "flux-2-pro", label: "Flux 2 Pro", description: "Premium quality" },
] as const;

// === UPSCALER MODELS ===
export const UPSCALER_MODELS = [
  { id: "google-upscaler", name: "Google Upscaler", description: "Google Official AI 4x upscaling" },
  { id: "real-esrgan", name: "Real-ESRGAN 4x", description: "Classic 4x enlargement" },
  { id: "recraft-crisp", name: "Recraft Crisp", description: "AI-enhanced sharpness" },
] as const;

// === TYPES ===
export type AIModelId = typeof AI_MODELS[number]["id"];
export type UpscalerModelId = typeof UPSCALER_MODELS[number]["id"];