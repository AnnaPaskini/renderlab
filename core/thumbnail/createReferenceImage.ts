// /core/thumbnail/createReferenceImage.ts

const MAX_SIZE = 1536;

export async function createReferenceImage(file: File): Promise<Blob> {
    const img = await decodeFileToImage(file);

    const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);

    const targetW = Math.round(img.width * scale);
    const targetH = Math.round(img.height * scale);

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

    const blob = await canvasToBlob(canvas, "image/webp", 0.9);

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
        return await (canvas as OffscreenCanvas).convertToBlob({ type, quality });
    }
    return new Promise((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => {
            if (!blob) return reject(new Error("Blob creation failed"));
            resolve(blob);
        }, type, quality);
    });
}
