import type { MaskBounds } from '@/lib/constants/inpaint';

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

    // Calculate end coordinates
    const x2 = x + width;
    const y2 = y + height;

    // Calculate percentages (for semantic understanding)
    const leftPercent = Math.round((x / imageWidth) * 100);
    const topPercent = Math.round((y / imageHeight) * 100);
    const widthPercent = Math.round((width / imageWidth) * 100);
    const heightPercent = Math.round((height / imageHeight) * 100);

    // Semantic position (for context)
    let horizontal = leftPercent < 33 ? 'left' : leftPercent > 66 ? 'right' : 'center';
    let vertical = topPercent < 33 ? 'upper' : topPercent > 66 ? 'lower' : 'middle';

    return `You are editing an architectural visualization image.

CRITICAL - EXACT EDIT AREA SPECIFICATION:

The image is ${imageWidth}×${imageHeight} pixels. You MUST edit ONLY the following rectangular area:

PIXEL-PERFECT BOUNDARIES:
- Starting point (top-left corner): pixel (${x}, ${y})
- Ending point (bottom-right corner): pixel (${x2}, ${y2})
- Width: ${width} pixels (columns ${x} through ${x2})
- Height: ${height} pixels (rows ${y} through ${y2})
- Area percentage: ${widthPercent}% × ${heightPercent}% of total image
- Semantic location: ${vertical}-${horizontal} portion

COORDINATE SYSTEM:
- Origin (0,0) is at the TOP-LEFT corner of the image
- X-axis increases from left to right (0 to ${imageWidth})
- Y-axis increases from top to bottom (0 to ${imageHeight})
- Your edit area starts at column ${x}, row ${y}
- Your edit area ends at column ${x2}, row ${y2}

USER'S REQUEST:
${userPrompt}

CRITICAL REQUIREMENTS:
1. Edit ONLY pixels within x=[${x},${x2}] and y=[${y},${y2}]
2. DO NOT modify ANY pixels outside these exact boundaries
3. Preserve everything outside the edit area EXACTLY as it is
4. The rectangular edit area is ${width} pixels wide and ${height} pixels tall
5. Maintain seamless blending at the boundaries (pixels at x=${x}, x=${x2}, y=${y}, y=${y2})
6. Keep original lighting, shadows, perspective, and architectural style
7. Ensure photorealistic quality matching the original render

${referenceUrls.length > 0 ? `Use the ${referenceUrls.length} reference image${referenceUrls.length > 1 ? 's' : ''} provided to match style, materials, colors, and design language.` : ''}

Execute the user's request ONLY within the specified pixel boundaries. Think of it as editing a ${width}×${height} rectangle that starts at position (${x},${y}) in the ${imageWidth}×${imageHeight} image.`;
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
