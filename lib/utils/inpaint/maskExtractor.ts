import type { MaskBounds } from '@/lib/constants/inpaint';

/**
 * Extract bounding box from canvas mask data
 * Finds the smallest rectangle that contains all non-transparent pixels
 * 
 * @param canvas - HTML Canvas element with mask drawn
 * @returns MaskBounds object with x, y, width, height, imageWidth, imageHeight
 */
export async function extractMaskBounds(canvas: HTMLCanvasElement): Promise<MaskBounds | null> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get canvas context');
    }

    // Utility — маленький sleep
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // 1) Ждём, пока React реально отрисует маску
    await delay(120);

    let bounds = computeBounds(canvas);

    // 2) Если маска пуста → повторяем один раз
    if (!bounds) {
        await delay(120);
        bounds = computeBounds(canvas);
    }

    // 3) Если всё ещё пусто → возвращаем null (не бросаем ошибку)
    return bounds;
}

/**
 * Compute bounds from canvas mask data
 * @param canvas - HTML Canvas element
 * @returns MaskBounds or null if no colored pixels found
 */
function computeBounds(canvas: HTMLCanvasElement): MaskBounds | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasContent = false;

    console.log('🔍 Scanning mask canvas:', width, 'x', height);
    let pixelCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // MORE LENIENT: Any red-ish pixel with some opacity
            const isColored = (
                a > 5 &&                    // Has some opacity (not fully transparent)
                r > 100 &&                  // Has red channel
                (r > g + 50 || r > b + 50)  // Red is dominant
            );

            if (isColored) {
                hasContent = true;
                pixelCount++;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    console.log('✅ Found', pixelCount, 'colored pixels');
    console.log('Bounds:', { minX, minY, maxX, maxY });

    if (!hasContent) {
        console.log('⚠️ No colored pixels found in mask canvas (returning null)');
        return null;
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        imageWidth: width,
        imageHeight: height
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
