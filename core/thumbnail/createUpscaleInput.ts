// /core/thumbnail/createUpscaleInput.ts

// Max pixels for upscale models (~2M pixels)
const MAX_PIXELS = 2_000_000;

export async function createUpscaleInput(file: File): Promise<{ blob: Blob; wasResized: boolean }> {
    // Decode image first
    const img = await decodeFileToImage(file);

    const originalPixels = img.width * img.height;

    // Check if resize needed
    if (originalPixels <= MAX_PIXELS) {
        // No resize needed, return original as blob
        const blob = await fileToBlob(file);
        return { blob, wasResized: false };
    }

    // Calculate new dimensions maintaining aspect ratio
    const ratio = Math.sqrt(MAX_PIXELS / originalPixels);
    const targetW = Math.round(img.width * ratio);
    const targetH = Math.round(img.height * ratio);

    console.log(`📐 Resizing for upscale: ${img.width}x${img.height} → ${targetW}x${targetH}`);

    // Create canvas
    const canvas: HTMLCanvasElement | OffscreenCanvas =
        typeof OffscreenCanvas !== "undefined"
            ? new OffscreenCanvas(targetW, targetH)
            : (() => {
                const c = document.createElement("canvas");
                c.width = targetW;
                c.height = targetH;
                return c;
            })();

    const ctx =
        canvas instanceof OffscreenCanvas
            ? canvas.getContext("2d")
            : (canvas as HTMLCanvasElement).getContext("2d");

    if (!ctx) throw new Error("Canvas context missing");

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, "image/png", 0.95);

    // Cleanup
    if (!(canvas instanceof OffscreenCanvas)) {
        (canvas as HTMLCanvasElement).width = 0;
        (canvas as HTMLCanvasElement).height = 0;
    }

    return { blob, wasResized: true };
}

async function decodeFileToImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
    const url = URL.createObjectURL(file);
    try {
        if ("createImageBitmap" in window) {
            const bmp = await createImageBitmap(file);
            URL.revokeObjectURL(url);
            return bmp;
        }
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function fileToBlob(file: File): Promise<Blob> {
    return new Blob([await file.arrayBuffer()], { type: file.type });
}

async function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    type: string,
    quality = 0.9
): Promise<Blob> {
    if ("convertToBlob" in canvas) {
        return await (canvas as OffscreenCanvas).convertToBlob({ type, quality });
    }
    return new Promise((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => {
            if (!blob) return reject(new Error("Blob creation failed"));
            resolve(blob);
        }, type, quality);
    });
}
