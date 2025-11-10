'use client'

import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { useHistory } from '@/lib/context/HistoryContext'

export default function ImagesHistory() {
  const { groups, loading } = useHistory();
  
  // Flatten groups into images array for this widget
  const recentImages = groups
    .flatMap(group => group.images)
    .slice(0, 10); // Show only 10 most recent in widget

  if (loading && recentImages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (recentImages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No images yet. Upload or generate your first image!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 justify-items-center">
      {recentImages.map((img: any) => {
        const date = new Date(img.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: '2-digit' 
        });
        
        return (
          <div 
            key={img.id} 
            className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer group"
          >
            <Image
              src={img.thumb_url || img.image_url}
              alt={img.name || 'Generated image'}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            
            {/* Date overlay - always visible */}
            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
              {formattedDate}
            </div>
            
            {/* Hover overlay with name */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {img.name || img.prompt?.slice(0, 50) || 'Generated image'}
            </div>
          </div>
        );
      })}
    </div>
  )
}