// /core/thumbnail/createReferenceImage.ts
// Creates a compressed reference image (1536px max) for API uploads
// to avoid 413 errors with Vercel's 4.5MB body limit

export async function createReferenceImage(file: File): Promise<Blob> {
    // Decode image first (avoid white canvas bug)
    const img = await decodeFileToImage(file);

    // Max reference image size (larger than thumbnails for quality)
    const MAX_SIZE = 1536;
    const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);

    const targetW = Math.round(img.width * scale);
    const targetH = Math.round(img.height * scale);

    // Prefer OffscreenCanvas for performance
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

    if (!ctx) throw new Error("Reference image canvas context missing");

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, "image/webp", 0.9);

    // Cleanup memory for safety (only works for HTMLCanvasElement)
    if (!(canvas instanceof OffscreenCanvas)) {
        (canvas as HTMLCanvasElement).width = 0;
        (canvas as HTMLCanvasElement).height = 0;
    }

    return blob;
}

async function decodeFileToImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
    const url = URL.createObjectURL(file);

    try {
        if ("createImageBitmap" in window) {
            const bmp = await createImageBitmap(file);
            URL.revokeObjectURL(url);
            return bmp;
        }

        // fallback
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    type: string,
    quality = 0.9
): Promise<Blob> {
    if ("convertToBlob" in canvas) {
        // OffscreenCanvas case
        return await (canvas as OffscreenCanvas).convertToBlob({
            type,
            quality,
        });
    }

    return new Promise((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => {
            if (!blob) return reject(new Error("Blob creation failed"));
            resolve(blob);
        }, type, quality);
    });
}
