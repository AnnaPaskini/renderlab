// lib/utils/inpaint/inpaintProcessor.ts
/**
 * Memory-efficient inpaint processing with Sharp
 * Handles image cropping, expansion, and compositing without excessive memory usage
 */

import { MaskBounds } from '@/lib/constants/inpaint';
import sharp from 'sharp';

interface ProcessedImage {
    buffer: Buffer;
    width: number;
    height: number;
}

/**
 * Expand mask bounds by a percentage to include context
 * @param bounds - Original mask bounds
 * @param expansionRatio - How much to expand (0.25 = 25% expansion)
 * @returns Expanded bounds that stay within image dimensions
 */
export function expandMaskBounds(
    bounds: MaskBounds,
    expansionRatio: number = 0.25
): MaskBounds {
    const expansionX = Math.round(bounds.width * expansionRatio);
    const expansionY = Math.round(bounds.height * expansionRatio);

    // Calculate expanded bounds
    const newX = Math.max(0, bounds.x - expansionX);
    const newY = Math.max(0, bounds.y - expansionY);
    const newWidth = Math.min(
        bounds.imageWidth - newX,
        bounds.width + expansionX * 2
    );
    const newHeight = Math.min(
        bounds.imageHeight - newY,
        bounds.height + expansionY * 2
    );

    return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        imageWidth: bounds.imageWidth,
        imageHeight: bounds.imageHeight
    };
}

/**
 * Crop image to specified bounds using Sharp (memory efficient)
 * @param imageUrl - Supabase URL or local path
 * @param bounds - Area to crop
 * @returns JPEG buffer of cropped area
 */
export async function cropImageWithContext(
    imageUrl: string,
    bounds: MaskBounds
): Promise<ProcessedImage> {
    try {
        // Fetch image as stream
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Crop using Sharp (efficient!)
        const croppedBuffer = await sharp(buffer)
            .extract({
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height
            })
            .jpeg({ quality: 92, mozjpeg: true })
            .toBuffer();

        return {
            buffer: croppedBuffer,
            width: bounds.width,
            height: bounds.height
        };
    } catch (error: any) {
        console.error('❌ Crop error:', error);
        throw new Error(`Failed to crop image: ${error.message}`);
    }
}

/**
 * Composite generated image back onto original with smooth blending
 * @param originalUrl - Original full image URL
 * @param generatedBuffer - Generated image buffer from Gemini
 * @param maskBounds - Original tight mask bounds (where to place result)
 * @returns Final composited image buffer
 */
export async function compositeGeneratedImage(
    originalUrl: string,
    generatedBuffer: Buffer,
    maskBounds: MaskBounds
): Promise<Buffer> {
    try {
        // Fetch original image
        const response = await fetch(originalUrl);
        const arrayBuffer = await response.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // Get metadata to ensure correct placement
        const originalMeta = await sharp(originalBuffer).metadata();
        const generatedMeta = await sharp(generatedBuffer).metadata();

        console.log('🎨 Compositing:', {
            original: `${originalMeta.width}x${originalMeta.height}`,
            generated: `${generatedMeta.width}x${generatedMeta.height}`,
            placement: `(${maskBounds.x}, ${maskBounds.y})`
        });

        // Resize generated to match mask bounds if needed
        let resizedGenerated = generatedBuffer;
        if (
            generatedMeta.width !== maskBounds.width ||
            generatedMeta.height !== maskBounds.height
        ) {
            resizedGenerated = await sharp(generatedBuffer)
                .resize(maskBounds.width, maskBounds.height, {
                    fit: 'fill',
                    kernel: 'lanczos3'
                })
                .toBuffer();
        }

        // Create feathered mask for smooth blending
        const featherSize = 20;
        const maskBuffer = await createFeatheredMask(
            maskBounds.width,
            maskBounds.height,
            featherSize
        );

        // Apply mask to generated image
        const maskedGenerated = await sharp(resizedGenerated)
            .composite([{
                input: maskBuffer,
                blend: 'dest-in'
            }])
            .toBuffer();

        // Composite onto original
        const finalBuffer = await sharp(originalBuffer)
            .composite([{
                input: maskedGenerated,
                top: maskBounds.y,
                left: maskBounds.x,
                blend: 'over'
            }])
            .jpeg({ quality: 95, mozjpeg: true })
            .toBuffer();

        console.log('✅ Composite complete:', finalBuffer.length, 'bytes');

        return finalBuffer;

    } catch (error: any) {
        console.error('❌ Composite error:', error);
        throw new Error(`Failed to composite images: ${error.message}`);
    }
}

/**
 * Create a feathered alpha mask for smooth blending
 * @param width - Mask width
 * @param height - Mask height  
 * @param featherSize - Size of feather edge in pixels
 * @returns PNG buffer with alpha channel
 */
async function createFeatheredMask(
    width: number,
    height: number,
    featherSize: number
): Promise<Buffer> {
    // Create SVG with radial gradient for smooth edges
    const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <radialGradient id="fadeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:white;stop-opacity:1" />
          <stop offset="80%" style="stop-color:white;stop-opacity:1" />
          <stop offset="100%" style="stop-color:white;stop-opacity:0" />
        </radialGradient>
        <linearGradient id="edgeFade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0" />
          <stop offset="${(featherSize / width) * 100}%" style="stop-color:white;stop-opacity:1" />
          <stop offset="${100 - (featherSize / width) * 100}%" style="stop-color:white;stop-opacity:1" />
          <stop offset="100%" style="stop-color:white;stop-opacity:0" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#fadeGrad)" />
    </svg>
  `;

    return sharp(Buffer.from(svg))
        .png()
        .toBuffer();
}

/**
 * Convert URL to base64 for Gemini API
 * @param url - Image URL
 * @returns Base64 string (without data URI prefix)
 */
export async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

/**
 * Convert buffer to base64 for Gemini API
 * @param buffer - Image buffer
 * @returns Base64 string (without data URI prefix)
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
 * Build smart prompt for Gemini with natural language
 * @param userPrompt - What user wants to do
 * @param maskBounds - Original mask bounds
 * @param referenceCount - Number of reference images (0-3)
 * @returns Optimized prompt for Gemini
 */
export function buildNaturalPrompt(
    userPrompt: string,
    maskBounds: MaskBounds,
    referenceCount: number = 0
): string {
    // Calculate semantic position
    const centerX = maskBounds.x + maskBounds.width / 2;
    const centerY = maskBounds.y + maskBounds.height / 2;

    const leftPercent = (centerX / maskBounds.imageWidth) * 100;
    const topPercent = (centerY / maskBounds.imageHeight) * 100;

    let horizontal = leftPercent < 33 ? 'left' :
        leftPercent > 66 ? 'right' : 'center';
    let vertical = topPercent < 33 ? 'top' :
        topPercent > 66 ? 'bottom' : 'middle';

    // Size description
    const areaPercent = ((maskBounds.width * maskBounds.height) /
        (maskBounds.imageWidth * maskBounds.imageHeight)) * 100;
    let sizeDesc = areaPercent < 15 ? 'small area' :
        areaPercent < 40 ? 'area' : 'large area';

    let prompt = `Edit this architectural visualization image:\n\n${userPrompt}\n\n`;

    if (referenceCount === 0) {
        prompt += `Apply this change to the ${sizeDesc} in the ${vertical} ${horizontal} of the image.`;
    } else if (referenceCount === 1) {
        prompt += `Apply this change to the ${sizeDesc} in the ${vertical} ${horizontal} of the first image.
Use the style, colors, textures, or object from the second reference image.`;
    } else {
        prompt += `Apply this change to the ${sizeDesc} in the ${vertical} ${horizontal} of the first image.
Use elements from the additional reference images as style/object guides.`;
    }

    prompt += `\n\nCRITICAL REQUIREMENTS:
- Edit ONLY the specified area, keep everything else completely unchanged
- Match the lighting, shadows, and perspective of the surrounding original render
- Blend the edited area seamlessly at the boundaries
- Maintain photorealistic architectural quality throughout
- Preserve all architectural details outside the edit area`;

    return prompt;
}

/**
 * Calculate memory usage estimate for debugging
 */
export function estimateMemoryUsage(
    originalSize: number,
    maskBounds: MaskBounds
): {
    cropSize: number;
    base64Size: number;
    compositeSize: number;
    totalPeak: number;
} {
    const cropPixels = maskBounds.width * maskBounds.height;
    const cropSize = Math.round(cropPixels * 3 * 1.2); // RGB + JPEG overhead
    const base64Size = Math.round(cropSize * 1.37); // Base64 expansion
    const compositeSize = originalSize; // Full image for compositing

    return {
        cropSize: Math.round(cropSize / 1024 / 1024), // MB
        base64Size: Math.round(base64Size / 1024 / 1024), // MB
        compositeSize: Math.round(compositeSize / 1024 / 1024), // MB
        totalPeak: Math.round((cropSize + base64Size + compositeSize) / 1024 / 1024) // MB
    };
}
