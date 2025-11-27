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
                // Make it WHITE (edit area)
                outputData[i] = 255;     // R = 255
                outputData[i + 1] = 255; // G = 255
                outputData[i + 2] = 255; // B = 255
                outputData[i + 3] = 255; // A = opaque
                redPixelCount++;
            } else {
                // Make it BLACK (keep unchanged)
                outputData[i] = 0;       // R = 0
                outputData[i + 1] = 0;   // G = 0
                outputData[i + 2] = 0;   // B = 0
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
    let prompt = `You are an expert image editor specializing in seamless inpainting.\n\n`;

    prompt += `IMAGES PROVIDED:\n`;
    prompt += `1. ORIGINAL IMAGE: The base scene you will edit\n`;
    prompt += `2. MASK IMAGE: Black and white mask showing edit area\n`;
    prompt += `   - WHITE pixels = AREA TO EDIT (fill with new content)\n`;
    prompt += `   - BLACK pixels = PROTECTED AREA (do NOT modify)\n`;

    if (referenceCount > 0) {
        prompt += `3. REFERENCE IMAGE(S): Visual examples to copy from\n`;
        prompt += `   - IMPORTANT: Extract the subject/object/style from reference image(s)\n`;
        prompt += `   - Recreate the referenced element in the white mask area\n`;
        prompt += `   - Match colors, textures, and details from the reference\n`;
    }

    prompt += `\n═══════════════════════════════════════════\n`;
    prompt += `YOUR TASK: ${userPrompt}\n`;
    prompt += `═══════════════════════════════════════════\n\n`;

    prompt += `CRITICAL RULES:\n`;
    prompt += `1. ONLY modify WHITE areas in the mask - BLACK areas must remain PIXEL-PERFECT unchanged\n`;
    prompt += `2. The WHITE shape is your canvas - fill it completely with the requested content\n`;
    prompt += `3. Match the artistic style, lighting direction, and color palette of the original image\n`;

    if (referenceCount > 0) {
        prompt += `4. REFERENCE USAGE: Copy the visual appearance from reference image(s) into the white area\n`;
        prompt += `5. Adapt the reference subject to match the original image's perspective and scale\n`;
        prompt += `6. Harmonize lighting and shadows so the added element looks native to the scene\n`;
    }

    prompt += `7. Blend edges seamlessly - no visible boundaries between edited and original areas\n`;
    prompt += `8. Maintain consistent quality and resolution throughout\n`;

    prompt += `\nOUTPUT: Return the edited image with your modifications applied ONLY to the white mask area.`;

    return prompt;
}
