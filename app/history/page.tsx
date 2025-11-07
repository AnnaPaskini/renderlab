// app/history/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ImageRecord {
  id: string
  user_id: string
  name: string
  url: string
  created_at: string
}

export default function HistoryPage() {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/images')
        if (!response.ok) throw new Error('Failed to fetch images')
        
        const data = await response.json()
        console.log('Loaded images:', data.images)
        setImages(data.images || [])
      } catch (error) {
        console.error('Error loading images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Generation History
          </h1>
          <p className="text-gray-600">
            All your previous generations in one place
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading history...
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No generations yet</p>
            <Link 
              href="/workspace"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Creating
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.name}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                    {new Date(img.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}