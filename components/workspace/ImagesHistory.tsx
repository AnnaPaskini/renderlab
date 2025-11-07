'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ImageRecord {
  id: string
  user_id: string
  name: string
  url: string
  created_at: string
}

export default function ImagesHistory() {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/images')
        if (!response.ok) throw new Error('Failed to fetch images')
        
        const data = await response.json()
        console.log('📸 Loaded images:', data.images)
        setImages(data.images || [])
      } catch (error) {
        console.error('Error loading images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading history...
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No images yet. Upload or generate your first image!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {images.map((img) => (
        <div 
          key={img.id} 
          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer group"
        >
          <Image
            src={img.url}
            alt={img.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
            {img.name}
          </div>
        </div>
      ))}
    </div>
  )
}