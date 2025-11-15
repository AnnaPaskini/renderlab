import type { MaskBounds } from '@/lib/constants/inpaint';
import { getSpatialDescription } from './maskExtractor';

/**
 * Build smart prompt for Gemini API
 * Converts mask coordinates to natural language description
 * 
 * @param userPrompt - User's editing instruction (max 2000 chars)
 * @param maskBounds - Extracted mask boundaries
 * @param referenceUrls - Array of reference image URLs (0-2)
 * @returns Complete prompt for Gemini API
 */
export function buildSmartPrompt(
    userPrompt: string,
    maskBounds: MaskBounds,
    referenceUrls: string[] = []
): string {

    const { x, y, width, height, imageWidth, imageHeight } = maskBounds;

    // Calculate relative positions as percentages
    const leftPercent = Math.round((x / imageWidth) * 100);
    const topPercent = Math.round((y / imageHeight) * 100);
    const widthPercent = Math.round((width / imageWidth) * 100);
    const heightPercent = Math.round((height / imageHeight) * 100);
    const rightPercent = leftPercent + widthPercent;
    const bottomPercent = topPercent + heightPercent;

    // Get spatial description (e.g., "center-top", "left-middle")
    const position = getSpatialDescription(maskBounds);

    // System instruction
    const systemInstruction =
        `You are editing an architectural visualization render. ` +
        `The user wants to modify a specific area of the image while preserving all other elements.`;

    // Spatial context with precise coordinates
    const spatialContext =
        `Focus on the ${position} portion of the image. ` +
        `The edit area spans approximately ${leftPercent}-${rightPercent}% horizontally (from left edge) ` +
        `and ${topPercent}-${bottomPercent}% vertically (from top edge), ` +
        `covering about ${widthPercent}×${heightPercent}% of the total image area.`;

    // User's edit instruction
    const editInstruction = userPrompt.trim();

    // Reference images note (if provided)
    const referenceNote = referenceUrls.length > 0
        ? `Use the ${referenceUrls.length} reference image${referenceUrls.length > 1 ? 's' : ''} provided to match style, materials, colors, and design language.`
        : '';

    // Preservation instructions
    const preservationNote =
        `IMPORTANT: Only modify the specified area. ` +
        `Preserve all other architectural elements, lighting, shadows, perspective, and photorealistic quality. ` +
        `Maintain consistency with the original render's style and atmosphere. ` +
        `Ensure seamless blending at the edges of the edited area.`;

    // Combine all parts
    return [
        systemInstruction,
        spatialContext,
        editInstruction,
        referenceNote,
        preservationNote
    ]
        .filter(part => part.length > 0)
        .join('\n\n');
}

/**
 * Validate user prompt length
 * @param prompt - User's prompt text
 * @param maxLength - Maximum allowed length (default: 2000)
 * @returns Validation result
 */
export function validatePrompt(
    prompt: string,
    maxLength: number = 2000
): { valid: boolean; message?: string; length: number } {

    const length = prompt.trim().length;

    if (length === 0) {
        return {
            valid: false,
            message: 'Prompt cannot be empty',
            length: 0
        };
    }

    if (length > maxLength) {
        return {
            valid: false,
            message: `Prompt exceeds maximum length of ${maxLength} characters (currently ${length})`,
            length
        };
    }

    return {
        valid: true,
        length
    };
}
