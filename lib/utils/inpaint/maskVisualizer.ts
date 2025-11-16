// lib/utils/inpaint/maskVisualizer.ts
/**
 * Creates mask visualization for Gemini API
 * Instead of cropping, we send full image + red mask overlay
 */

import { MaskBounds } from '@/lib/constants/inpaint';
import sharp from 'sharp';

/**
 * Create a mask visualization image
 * White canvas with RED rectangle showing edit area
 * 
 * @param bounds - Mask bounds
 * @returns PNG buffer with mask visualization
 */
export async function createMaskVisualization(
    bounds: MaskBounds
): Promise<Buffer> {
    const { x, y, width, height, imageWidth, imageHeight } = bounds;

    console.log('🎨 Creating mask visualization:', {
        canvas: `${imageWidth}x${imageHeight}`,
        redArea: `${width}x${height} at (${x}, ${y})`
    });

    // Create SVG with white background and red rectangle
    const svg = `
    <svg width="${imageWidth}" height="${imageHeight}">
      <!-- White background -->
      <rect width="${imageWidth}" height="${imageHeight}" fill="white"/>
      
      <!-- Red mask area -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="red"/>
    </svg>
  `;

    // Convert SVG to PNG using Sharp
    const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();

    console.log('✅ Mask visualization created:', Math.round(buffer.length / 1024), 'KB');

    return buffer;
}

/**
 * Build prompt for mask-based editing
 * Explains the multi-image structure to Gemini
 */
export function buildMaskBasedPrompt(
    userPrompt: string,
    maskBounds: MaskBounds,
    referenceCount: number = 0
): string {
    const { width, height, imageWidth, imageHeight } = maskBounds;

    // Calculate area percentage for context
    const areaPercent = Math.round(
        ((width * height) / (imageWidth * imageHeight)) * 100
    );

    let prompt = `You are editing an architectural visualization image.\n\n`;

    // Explain image structure
    prompt += `IMAGES PROVIDED:\n`;
    prompt += `1. First image: The original scene to edit (${imageWidth}×${imageHeight}px)\n`;
    prompt += `2. Second image: A mask showing the edit area in RED\n`;

    if (referenceCount > 0) {
        prompt += `3. Additional image(s): Reference materials for style/objects\n`;
    }

    prompt += `\n`;

    // User's task
    prompt += `YOUR TASK:\n${userPrompt}\n\n`;

    // Critical instructions
    prompt += `CRITICAL RULES:\n`;
    prompt += `1. Edit ONLY the RED area shown in the mask (second image)\n`;
    prompt += `2. The red area is ${width}×${height}px, representing ${areaPercent}% of the image\n`;
    prompt += `3. Keep EVERYTHING outside the red area EXACTLY as it is - DO NOT modify\n`;
    prompt += `4. Match the artistic style, lighting, colors, and atmosphere of the original image\n`;

    if (referenceCount > 0) {
        prompt += `5. Use the reference image(s) as guides for style, texture, or objects to add\n`;
        prompt += `6. Adapt reference elements to match the scene's lighting and perspective\n`;
    } else {
        prompt += `5. Generate photorealistic content that fits naturally in the scene\n`;
    }

    prompt += `7. Ensure the edited area blends seamlessly at the boundaries\n`;
    prompt += `8. Maintain consistent scale - objects should be appropriately sized for the space\n`;
    prompt += `9. Preserve architectural details and spatial relationships\n`;

    prompt += `\nThe RED area in the mask image shows the EXACT location and size where changes should occur.`;
    prompt += `\nThink carefully about scale, perspective, and integration before generating.`;

    return prompt;
}

/**
 * Build simple debug prompt for testing
 */
export function buildSimpleMaskPrompt(
    userPrompt: string
): string {
    return `Edit the first image.

The second image shows a RED mask - edit ONLY the red area.

Task: ${userPrompt}

Rules:
- Edit only the red area
- Keep everything else unchanged
- Match the style of the original image
- Blend seamlessly`;
}

/**
 * Convert URL to base64
 */
export async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

/**
 * Convert buffer to base64
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}
