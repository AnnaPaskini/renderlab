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
      aiModel: "google/nano-banana",
      style: "Photorealistic",
      customPrompt: "",
    },
    createdAt: new Date().toISOString(),
  },
];
