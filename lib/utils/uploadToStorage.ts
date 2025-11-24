import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

type UploadContext = 'workspace' | 'batch' | 'inpaint' | 'history';

/**
 * Upload image to Supabase Storage with structured paths and MIME validation
 * 
 * @param source - Image source (URL string, Blob, or File)
 * @param userId - User ID for folder structure
 * @param context - Upload context: 'workspace' | 'batch' | 'inpaint' | 'history'
 * @param fileName - Optional custom filename (will use UUID if not provided)
 * @returns Public URL of uploaded image, or null on error
 */
export async function uploadImageToStorage(
  source: string | URL | Blob | File,
  userId: string,
  context: UploadContext,
  fileName?: string
): Promise<string | null> {
  try {
    let blob: Blob;
    let extension = 'png';

    // Handle different input types
    if (source instanceof Blob) {
      // ✅ Already a Blob or File
      blob = source;

      // Strict MIME validation
      if (!["image/png", "image/jpeg", "image/webp"].includes(blob.type)) {
        throw new Error(`Unsupported file type: ${blob.type}. Only PNG, JPEG, and WebP are allowed.`);
      }

      // Determine extension from MIME type
      if (blob.type === 'image/jpeg') extension = 'jpg';
      else if (blob.type === 'image/webp') extension = 'webp';
      else extension = 'png';

    } else if (typeof source === 'string' || source instanceof URL) {
      // ✅ URL - download first
      const urlString = source instanceof URL ? source.href : source;

      console.log('🔵 [STORAGE] Downloading from:', urlString);

      const response = await fetch(urlString);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      blob = await response.blob();

      // Strict MIME validation for downloaded content
      if (!["image/png", "image/jpeg", "image/webp"].includes(blob.type)) {
        throw new Error(`Unsupported file type: ${blob.type}. Only PNG, JPEG, and WebP are allowed.`);
      }

      // Determine extension from MIME type
      if (blob.type === 'image/jpeg') extension = 'jpg';
      else if (blob.type === 'image/webp') extension = 'webp';
      else extension = 'png';

    } else {
      console.error('Invalid source type for uploadImageToStorage');
      return null;
    }

    // 2. Generate unique filename with UUID
    const uuid = randomUUID();
    const finalFileName = fileName || `${uuid}.${extension}`;

    // 3. Create structured file path: {userId}/{context}/{fileName}
    const filePath = `${userId}/${context}/${finalFileName}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('renderlab-images')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('renderlab-images')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Failed to upload image to storage:', error);
    return null;
  }
}

/**
 * Delete image from Supabase Storage
 * @param url - Supabase Storage URL
 * @returns Success boolean
 */
export async function deleteImageFromStorage(url: string): Promise<boolean> {
  try {
    // Extract file path from Supabase URL
    const urlParts = url.split('/storage/v1/object/public/renderlab-images/');
    if (urlParts.length < 2) {
      console.warn('Not a valid storage URL, skipping deletion:', url);
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('renderlab-images')
      .remove([filePath]);

    if (error) throw error;

    console.log('Image deleted successfully:', filePath);
    return true;

  } catch (error) {
    console.error('Failed to delete image from storage:', error);
    return false;
  }
}
