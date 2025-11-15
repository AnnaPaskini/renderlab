import type { MaskBounds } from '@/lib/constants/inpaint';

/**
 * Extract bounding box from canvas mask data
 * Finds the smallest rectangle that contains all non-transparent pixels
 * 
 * @param canvas - HTML Canvas element with mask drawn
 * @returns MaskBounds object with x, y, width, height, imageWidth, imageHeight
 */
export function extractMaskBounds(canvas: HTMLCanvasElement): MaskBounds {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Scan all pixels to find bounds of non-transparent areas
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixels[index + 3];

            // If pixel is not transparent (alpha > 0)
            if (alpha > 0) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // If no mask drawn, return full canvas bounds
    if (minX === canvas.width) {
        return {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            imageWidth: canvas.width,
            imageHeight: canvas.height
        };
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        imageWidth: canvas.width,
        imageHeight: canvas.height
    };
}

/**
 * Get spatial description of mask position
 * Used in smart prompt generation
 * 
 * @param bounds - MaskBounds object
 * @returns Human-readable position description (e.g., "center-top")
 */
export function getSpatialDescription(bounds: MaskBounds): string {
    const { x, width, imageWidth, y, height, imageHeight } = bounds;

    // Calculate center point percentages
    const centerX = (x + width / 2) / imageWidth;
    const centerY = (y + height / 2) / imageHeight;

    let horizontal = '';
    if (centerX < 0.33) horizontal = 'left';
    else if (centerX > 0.66) horizontal = 'right';
    else horizontal = 'center';

    let vertical = '';
    if (centerY < 0.33) vertical = 'top';
    else if (centerY > 0.66) vertical = 'bottom';
    else vertical = 'middle';

    return `${horizontal}-${vertical}`;
}
