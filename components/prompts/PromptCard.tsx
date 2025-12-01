'use client';

import { useWorkspace } from '@/lib/context/WorkspaceContext';
import type { Prompt } from '@/lib/types/prompts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface PromptCardProps {
  prompt: Prompt;
  onLikeToggle?: () => void;
  initialLiked?: boolean;
}

export function PromptCard({ prompt, onLikeToggle, initialLiked = false }: PromptCardProps) {
  const router = useRouter();
  const { loadTemporary } = useWorkspace();
  const [isFlipped, setIsFlipped] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(prompt.likes_count);
  const [liking, setLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    loadTemporary(prompt.prompt, null);
    router.push('/workspace');
    toast.success('Opening Workspace...');
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
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
      className="relative w-full aspect-[3/4] cursor-pointer overflow-hidden bg-[#262626] rounded-lg border border-white/8 shadow-[0_4px_12px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.4)]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`w-full h-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}>

        {/* Front - Image with overlay */}
        <div className="absolute inset-0 [backface-visibility:hidden] p-3">
          {/* Image container with elevated shadow */}
          <div className="relative w-full h-[65%] rounded-lg overflow-hidden mb-4 shadow-lg shadow-black/40">
            <img
              src={prompt.image_url}
              alt={prompt.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />

            {/* Gradient overlay - positioned to cover image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges ON the image */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
              {/* Category badge - left */}
              <span className="bg-white/90 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                {prompt.category.toUpperCase()}
              </span>

              {/* Badge - right */}
              {badgeLabel && (
                <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {badgeLabel}
                </span>
              )}
            </div>
          </div>

          {/* Bottom info - below image */}
          <div className="px-1">
            <h3 className="text-white font-bold text-base mb-1.5 line-clamp-2">{prompt.title}</h3>
            <p className="text-white/90 text-xs mb-2 line-clamp-2">
              {truncateText(prompt.prompt, 100)}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs">by {prompt.author_name}</span>

              <button
                onClick={handleLike}
                disabled={liking}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : 'fill-none text-white'}`}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-white text-xs font-medium">{likesCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back - Full prompt text */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col p-4 bg-[#262626] rounded-lg">
          {/* Header with title and three dots menu */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/6">
            <h3 className="text-base font-semibold text-white uppercase truncate flex-1 pr-2">
              {prompt.title}
            </h3>

            {/* Three dots menu */}
            <div className="relative">
              <button
                onClick={toggleMenu}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-xl z-10">
                  <button
                    onClick={handleCopy}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition-colors rounded-t-lg"
                  >
                    Copy Prompt
                  </button>
                  <button
                    onClick={handleAddToTemplate}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition-colors rounded-b-lg border-t border-white/5"
                  >
                    Send to Workspace
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content section - RECESSED text area with inset depth */}
          <div className="flex-1 overflow-y-auto 
            bg-black/30 rounded-lg p-3 border border-white/5
            shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]
            scrollbar-thin">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {prompt.prompt}
            </p>

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={`${prompt.id}-tag-${index}`}
                    className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] rounded-full border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
