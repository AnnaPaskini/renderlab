import { uploadImageToStorage } from '../../lib/utils/uploadToStorage';

/**
 * Uploads the reference image once and returns the uploaded URL.
 * @param referenceImage base64 string
 * @param userId string
 * @returns Promise<string | null>
 */
export async function uploadReferenceImageOnce(referenceImage: string, userId: string): Promise<string | null> {
    if (!referenceImage) return null;
    try {
        // Use a unique filename
        const fileName = `reference_${Date.now()}.png`;
        const url = await uploadImageToStorage(referenceImage, userId, fileName);
        return url;
    } catch (error) {
        console.error('Failed to upload reference image once:', error);
        return null;
    }
}
