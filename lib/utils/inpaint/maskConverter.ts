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
        console.log('[Mask] Fetching from URL:', maskUrl);
        
        // Fetch mask image
        const response = await fetch(maskUrl);
        console.log('[Mask] Fetch response status:', response.status);
        console.log('[Mask] Content-Type:', response.headers.get('content-type'));
        console.log('[Mask] Content-Length:', response.headers.get('content-length'));
        
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

        // Debug: log first few pixels to see what colors we're getting
        console.log('[Mask Debug] First 10 pixels (RGBA):');
        for (let i = 0; i < Math.min(40, data.length); i += 4) {
            console.log(`  Pixel ${i/4}: R=${data[i]}, G=${data[i+1]}, B=${data[i+2]}, A=${data[i+3]}`);
        }

        // Also log a pixel from the middle of the image
        const middlePixel = Math.floor(data.length / 2 / 4) * 4;
        console.log(`[Mask Debug] Middle pixel: R=${data[middlePixel]}, G=${data[middlePixel+1]}, B=${data[middlePixel+2]}, A=${data[middlePixel+3]}`);

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
    referenceCount: number = 0,
    maskBounds?: { x: number; y: number; width: number; height: number },
    imageSize?: { width: number; height: number }
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

    // Add mask location information if available
    if (maskBounds && imageSize) {
        const leftPercent = (maskBounds.x / imageSize.width) * 100;
        const topPercent = (maskBounds.y / imageSize.height) * 100;
        const widthPercent = (maskBounds.width / imageSize.width) * 100;
        const heightPercent = (maskBounds.height / imageSize.height) * 100;

        // Determine semantic location
        const horizontal = leftPercent < 33 ? 'left' : leftPercent > 66 ? 'right' : 'center';
        const vertical = topPercent < 33 ? 'upper' : topPercent > 66 ? 'lower' : 'middle';
        const semanticLocation = `${vertical}-${horizontal}`;

        prompt += `\nMASK LOCATION (where to place new content):\n`;
        prompt += `- POSITION: ${semanticLocation} area of the image\n`;
        prompt += `- COORDINATES: x=${Math.round(maskBounds.x)}, y=${Math.round(maskBounds.y)}\n`;
        prompt += `- SIZE: ${Math.round(maskBounds.width)}x${Math.round(maskBounds.height)} pixels (${Math.round(widthPercent)}% x ${Math.round(heightPercent)}% of image)\n`;
        prompt += `- IMPORTANT: Place the new content EXACTLY in the ${semanticLocation} region, matching the white mask area\n`;
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
