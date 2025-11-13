'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Prompt } from '@/lib/types/prompts';
import { toast } from 'sonner';

interface PromptCardProps {
  prompt: Prompt;
  onLikeToggle?: () => void;
  initialLiked?: boolean;
}

export function PromptCard({ prompt, onLikeToggle, initialLiked = false }: PromptCardProps) {
  const router = useRouter();
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt);
    toast.success('Prompt copied to clipboard');
  };

  const handleAddToTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedPrompt = encodeURIComponent(prompt.prompt);
    router.push(`/workspace?additionalPrompt=${encodedPrompt}`);
    // Toast will be shown in workspace after loading
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const badgeLabel = prompt.badge === 'editors_choice' 
    ? "Editor's Choice"
    : prompt.badge === 'featured'
    ? 'Featured'
    : prompt.badge === 'trending'
    ? 'Trending'
    : null;

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer rounded-2xl overflow-hidden group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`w-full h-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
           style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Front - Image with overlay */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <img
            src={prompt.image_url}
            alt={prompt.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Category badge - top left */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-black text-xs font-bold rounded-full uppercase tracking-wider">
              {prompt.category}
            </span>
          </div>

          {/* Badge - top right */}
          {badgeLabel && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {badgeLabel}
              </span>
            </div>
          )}
          
          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{prompt.title}</h3>
            <p className="text-white/90 text-sm mb-3 line-clamp-2">
              {truncateText(prompt.prompt, 100)}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">by {prompt.author_name}</span>
              
              <button
                onClick={handleLike}
                disabled={liking}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors"
              >
                <svg 
                  className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'fill-none text-white'}`}
                  stroke="currentColor" 
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-white text-sm font-medium">{likesCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back - Full prompt text */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#161616] border border-white/8 p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-bold text-lg mb-3 text-white">{prompt.title}</h3>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{prompt.prompt}</p>
            </div>
            
            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={`${prompt.id}-tag-${index}`}
                    className="px-2 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/8"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/8">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-2.5 bg-[#ff6b35] text-white rounded-lg hover:bg-[#ff8555] text-sm font-semibold shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200"
            >
              Copy
            </button>
            <button
              onClick={handleAddToTemplate}
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white border border-white/8 rounded-lg hover:bg-[#202020] hover:border-white/12 text-sm font-semibold transition-all duration-200"
            >
              Add to Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
