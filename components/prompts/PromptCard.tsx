'use client';

import { useState } from 'react';
import type { Prompt } from '@/lib/types/prompts';
import { toast } from 'sonner';

interface PromptCardProps {
  prompt: Prompt;
  onLikeToggle?: () => void;
  initialLiked?: boolean;
}

export function PromptCard({ prompt, onLikeToggle, initialLiked = false }: PromptCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(prompt.likes_count);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setLiking(true);
      
      const response = await fetch(`/api/prompts/${prompt.id}/like`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setLiked(result.data.liked);
      setLikesCount(prev => result.data.liked ? prev + 1 : prev - 1);
      
      if (onLikeToggle) onLikeToggle();

    } catch (error: any) {
      console.error('Like error:', error);
      toast.error(error.message || 'Failed to like prompt');
    } finally {
      setLiking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    toast.success('Prompt copied to clipboard!');
  };

  const handleAddToTemplate = () => {
    // TODO: Implement add to template functionality
    toast.success('Added to template!');
  };

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front - Image */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <img
            src={prompt.image_url}
            alt={prompt.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Badge */}
          {prompt.badge && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
              {prompt.badge === 'editors_choice' && "⭐ Editor's Choice"}
              {prompt.badge === 'featured' && '🔥 Featured'}
              {prompt.badge === 'trending' && '📈 Trending'}
            </div>
          )}
          
          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg mb-2">{prompt.title}</h3>
            <div className="flex items-center justify-between text-white/80 text-sm">
              <div className="flex items-center gap-2">
                {prompt.author_avatar_url && (
                  <img
                    src={prompt.author_avatar_url}
                    alt={prompt.author_name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{prompt.author_name}</span>
              </div>
              
              <button
                onClick={handleLike}
                disabled={liking}
                className="flex items-center gap-1 hover:scale-110 transition-transform"
              >
                <span className={liked ? 'text-red-500' : 'text-white'}>
                  {liked ? '❤️' : '🤍'}
                </span>
                <span>{likesCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back - Prompt Text */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl shadow-lg bg-white p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-bold text-lg mb-3">{prompt.title}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.prompt}</p>
            
            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {prompt.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              📋 Copy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAddToTemplate(); }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              ➕ Add to Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
