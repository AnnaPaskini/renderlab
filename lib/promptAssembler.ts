/**
 * Pill Category Templates
 * Converts pill values into natural language phrases for prompts
 */

export const PILL_CATEGORY_TEMPLATES: Record<string, (value: string) => string> = {
    lighting: (value) => `with ${value} lighting`,
    camera: (value) => `from ${value} view`,
    interior: (value) => `in ${value} style`,
    color: (value) => `with ${value} tones`,
    imageStyle: (value) => `in ${value} style`,
};

/**
 * Get template for a category
 * @param category - The pill category (lighting, camera, etc.)
 * @param value - The pill value
 * @returns Formatted string or original value if no template exists
 */
export const formatPillValue = (category: string, value: string): string => {
    const template = PILL_CATEGORY_TEMPLATES[category];
    if (!template) return value; // fallback to original value

    return template(value);
};

/**
 * Assemble a complete prompt from various parts
 * @param basePrompt - The main prompt text
 * @param pills - Object containing selected pill values by category
 * @returns Complete assembled prompt
 */
export const assemblePrompt = (
    basePrompt: string,
    pills: {
        lighting?: string;
        camera?: string;
        interior?: string;
        color?: string;
        imageStyle?: string;
    }
): string => {
    const parts = [basePrompt];

    if (pills.lighting) {
        parts.push(PILL_CATEGORY_TEMPLATES.lighting(pills.lighting));
    }
    if (pills.camera) {
        parts.push(PILL_CATEGORY_TEMPLATES.camera(pills.camera));
    }
    if (pills.interior) {
        parts.push(PILL_CATEGORY_TEMPLATES.interior(pills.interior));
    }
    if (pills.color) {
        parts.push(PILL_CATEGORY_TEMPLATES.color(pills.color));
    }
    if (pills.imageStyle) {
        parts.push(PILL_CATEGORY_TEMPLATES.imageStyle(pills.imageStyle));
    }

    return parts.filter(Boolean).join(' ');
};
