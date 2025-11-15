/**
 * Download image from URL and convert to base64
 * Uses Node.js Buffer (Next.js API Routes runtime)
 * 
 * @param url - Public URL to image (Supabase Storage URL)
 * @returns Base64-encoded string (without data URI prefix)
 */
export async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return base64;
    } catch (error) {
        console.error('Error converting URL to base64:', error);
        throw new Error(`Failed to convert URL to base64: ${url}`);
    }
}

/**
 * Convert base64 string to Blob
 * Used for uploading Gemini API results to Supabase
 * 
 * @param base64 - Base64-encoded string
 * @param mimeType - Image MIME type (default: image/png)
 * @returns Blob object
 */
export function base64ToBlob(
    base64: string,
    mimeType: string = 'image/png'
): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
