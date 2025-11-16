// lib/utils/inpaint/maskConverter.ts
/**
 * Convert user's red mask to BLACK/WHITE format for Gemini
 * 
 * Input: Red contour on transparent/white background
 * Output: Black contour on white background
 * 
 * BLACK = edit here
 * WHITE = keep unchanged
 */

import sharp from 'sharp';

/**
 * Convert red mask to black/white mask
 * @param maskUrl - URL of the red mask PNG
 * @returns Base64 string of black/white mask
 */
export async function convertRedMaskToBlackWhite(
    maskUrl: string
): Promise<string> {
    try {
        // Fetch mask image
        const response = await fetch(maskUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch mask: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Get raw pixel data
        const { data, info } = await sharp(inputBuffer)
            .ensureAlpha() // Make sure we have alpha channel
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Create new buffer for black/white mask
        const outputData = Buffer.alloc(info.width * info.height * 4);

        let redPixelCount = 0;
        let whitePixelCount = 0;

        // Convert each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Check if this is a red pixel (part of mask)
            // Red channel high, green/blue low, alpha visible
            const isRedMask = (
                r > 100 &&           // Red channel present
                r > g + 50 &&        // Red dominant over green
                r > b + 50 &&        // Red dominant over blue
                a > 50               // Not transparent
            );

            if (isRedMask) {
                // Make it BLACK (edit area)
                outputData[i] = 0;       // R = 0
                outputData[i + 1] = 0;   // G = 0
                outputData[i + 2] = 0;   // B = 0
                outputData[i + 3] = 255; // A = opaque
                redPixelCount++;
            } else {
                // Make it WHITE (keep unchanged)
                outputData[i] = 255;     // R = 255
                outputData[i + 1] = 255; // G = 255
                outputData[i + 2] = 255; // B = 255
                outputData[i + 3] = 255; // A = opaque
                whitePixelCount++;
            }
        }

        // Convert to PNG
        const pngBuffer = await sharp(outputData, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toBuffer();

        const coverage = Math.round((redPixelCount / (redPixelCount + whitePixelCount)) * 100);
        console.log(`✅ Mask converted: ${coverage}% coverage, ${Math.round(pngBuffer.length / 1024)}KB`);

        if (redPixelCount === 0) {
            console.warn('⚠️  WARNING: No red pixels found in mask!');
        }

        // Return as base64
        return pngBuffer.toString('base64');

    } catch (error: any) {
        console.error('❌ Mask conversion error:', error);
        throw new Error(`Failed to convert mask: ${error.message}`);
    }
}

/**
 * Build prompt for black/white mask
 */
export function buildBlackWhiteMaskPrompt(
    userPrompt: string,
    referenceCount: number = 0
): string {
    let prompt = `You are editing an architectural visualization image.\n\n`;

    prompt += `IMAGES PROVIDED:\n`;
    prompt += `1. First image: The original scene to edit\n`;
    prompt += `2. Second image: A mask showing WHERE to edit\n`;
    prompt += `   - BLACK pixels = EDIT THIS AREA\n`;
    prompt += `   - WHITE pixels = KEEP UNCHANGED\n`;

    if (referenceCount > 0) {
        prompt += `3. Additional image(s): Reference for style/objects\n`;
    }

    prompt += `\nYOUR TASK:\n${userPrompt}\n\n`;

    prompt += `CRITICAL RULES:\n`;
    prompt += `1. Edit ONLY the BLACK areas in the mask (second image)\n`;
    prompt += `2. Keep ALL WHITE areas EXACTLY as they are - DO NOT modify them\n`;
    prompt += `3. The black shape shows the EXACT area and shape to edit\n`;
    prompt += `4. Match the artistic style, lighting, and atmosphere of the original\n`;

    if (referenceCount > 0) {
        prompt += `5. Use reference image(s) as guides for objects or styles to add\n`;
        prompt += `6. Adapt reference elements to match scene lighting and perspective\n`;
    }

    prompt += `7. Fill the black area completely - don't make objects smaller than the mask\n`;
    prompt += `8. Blend seamlessly at the edges where black meets white\n`;
    prompt += `9. Maintain photorealistic quality and proper scale\n`;

    prompt += `\nThe BLACK shape in the mask is your canvas - fill it appropriately with the requested content.`;

    return prompt;
}
