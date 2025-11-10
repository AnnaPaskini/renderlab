import { supabase } from '@/lib/supabase';

/**
 * Upload image from URL to Supabase Storage
 * @param imageUrl - Remote image URL (e.g., from Replicate)
 * @param userId - User ID for folder organization
 * @param fileName - Optional custom filename
 * @returns Permanent Supabase Storage URL or null on error
 */
export async function uploadImageToStorage(
  imageUrl: string | URL,
  userId: string,
  fileName?: string
): Promise<string | null> {
  try {
    // Convert URL object to string if needed
    const urlString = imageUrl instanceof URL ? imageUrl.href : imageUrl;
    
    console.log('🔵 [STORAGE] Downloading from:', urlString);
    
    // 1. Download image from URL
    const response = await fetch(urlString);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // 2. Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = urlString.split('.').pop()?.split('?')[0] || 'png';
    const finalFileName = fileName || `${timestamp}_${randomId}.${extension}`;
    
    // 3. Upload to Supabase Storage
    // Folder structure: userId/filename.png
    const filePath = `${userId}/${finalFileName}`;
    
    const { data, error } = await supabase.storage
      .from('renderlab-images')
      .upload(filePath, blob, {
        contentType: blob.type,
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
