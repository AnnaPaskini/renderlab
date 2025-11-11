'use client'

import Image from 'next/image'
import { useHistory } from '@/lib/context/HistoryContext'
import { SkeletonGrid } from '@/components/ui/SkeletonGrid'

export default function ImagesHistory() {
  const { groups, loading } = useHistory();
  
  // Flatten groups into images array for this widget with deduplication
  const recentImages = groups
    .flatMap(group => group.images)
    .filter((img, index, self) => 
      index === self.findIndex(i => i.id === img.id)
    ) // Deduplicate by id
    .slice(0, 10); // Show only 10 most recent in widget

  if (loading && recentImages.length === 0) {
    return <SkeletonGrid count={10} />;
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
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
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