export const INPAINT_CONSTANTS = {
    // User limits
    USER_PROMPT_MAX_LENGTH: 2000,
    USER_PROMPT_WARNING_AT: 1800,

    // API limits
    GEMINI_TOKEN_LIMIT: 32768,
    GEMINI_MAX_PAYLOAD_MB: 20,

    // Pricing
    NANO_BANANA_COST: 0.039,
    RENDERLAB_PRICE: 0.3,
    FREE_QUOTA_DAILY: 500,

    // Image specs
    MAX_REFERENCE_IMAGES: 2,
    DEFAULT_IMAGE_SIZE: 1024,

    // Token estimates (approximate)
    TOKENS_PER_IMAGE_1024: 1032,
    TOKENS_PER_REFERENCE: 1032,
    TOKENS_OUTPUT_IMAGE: 1290,
    TOKENS_PROMPT_OVERHEAD: 350,

    // Model info
    MODEL_PROVIDER: 'gemini',
    MODEL_NAME: 'gemini-2.5-flash-image',
    MODEL_DISPLAY_NAME: 'Nano Banana'
} as const;

export interface MaskBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
}

export interface InpaintRequest {
    imageUrl: string;
    maskUrl: string;
    maskBounds: MaskBounds;
    userPrompt: string;
    referenceUrls: string[];
    baseImageUrl?: string;
}

export interface InpaintResponse {
    success: boolean;
    output: string;
    edit_id: string;
    image_id: string;
    cost: number;
    tokens_used: {
        input: number;
        output: number;
        total: number;
    };
}
