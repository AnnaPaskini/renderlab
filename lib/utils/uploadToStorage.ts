import { supabase } from '@/lib/supabase';

/**
 * Upload image to Supabase Storage
 * UPDATED: Now supports URL, Blob, and File inputs
 * 
 * @param source - Image source (URL string, Blob, or File)
 * @param userId - User ID for folder structure
 * @param fileName - Optional custom filename
 * @returns Public URL of uploaded image, or null on error
 */
export async function uploadImageToStorage(
  source: string | URL | Blob | File,
  userId: string,
  fileName?: string
): Promise<string | null> {
  try {
    let blob: Blob;
    let extension = 'png';

    // Handle different input types
    if (source instanceof Blob) {
      // ✅ Already a Blob or File
      blob = source;
      // Try to determine extension from MIME type
      if (blob.type) {
        extension = blob.type.split('/')[1] || 'png';
      }
    } else if (typeof source === 'string' || source instanceof URL) {
      // ✅ URL - download first
      const urlString = source instanceof URL ? source.href : source;

      console.log('🔵 [STORAGE] Downloading from:', urlString);

      const response = await fetch(urlString);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      blob = await response.blob();
      // Extract extension from URL
      extension = urlString.split('.').pop()?.split('?')[0] || 'png';
    } else {
      console.error('Invalid source type for uploadImageToStorage');
      return null;
    }

    // 2. Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const finalFileName = fileName || `${timestamp}_${randomId}.${extension}`;

    // 3. Upload to Supabase Storage
    // Folder structure: userId/filename.png
    const filePath = `${userId}/${finalFileName}`;

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

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('renderlab-images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully:', publicUrl);
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
