'use client';

import { useState, useRef, DragEvent } from 'react';
import { createClient } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string;
}

export function ImageUpload({ onUploadComplete, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(data.path);

      onUploadComplete(publicUrl);
      toast.success('Image uploaded successfully');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (!preview) return;

    try {
      const response = await fetch(preview);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-full rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-100">
          {/* Image with proper aspect ratio */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              title="Download image"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
              title="Remove image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center
            w-full rounded-lg border-2 border-dashed
            cursor-pointer transition-colors
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingTop: '56.25%', position: 'relative' }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="text-5xl mb-3">
                {uploading ? '⏳' : isDragging ? '📥' : '📸'}
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                {uploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
