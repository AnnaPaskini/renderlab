'use client';

import { createClient } from '@/lib/supabaseBrowser';
import { DragEvent, useRef, useState } from 'react';
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

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Image must be less than 50MB');
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
        <div className="relative w-full rounded-lg border-2 border-white/8 overflow-hidden bg-[#1a1a1a]">
          {/* Image with proper aspect ratio */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* Remove button - top right */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-black/80 hover:bg-black rounded-full shadow-lg transition-colors "
              title="Remove image"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            cursor-pointer transition-all
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            paddingTop: '56.25%',
            position: 'relative',
            background: isDragging ? '#1f1f1f' : '#1a1a1a',
            borderColor: isDragging ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isDragging
              ? 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)'
              : 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="mb-3">
                {uploading ? (
                  <svg className="w-12 h-12 mx-auto text-[#ff6b35] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isDragging ? (
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <p className="text-base font-medium text-white mb-1">
                {uploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-sm text-gray-400">
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
