'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { ImageIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';
import { RenderLabLayout } from '@/components/layout/RenderLabLayout';
import { supabase } from '@/lib/supabase';

interface ImageData {
  id: string;
  name: string;
  url: string;
  image_url?: string;
  thumb_url?: string | null;
  reference_url?: string | null;
  collection_id?: string | null;
  prompt: string;
  created_at: string;
  user_id: string;
}

interface GroupedData {
  date_group: string;
  images_count: number;
  images: ImageData[];
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { loadTemporary } = useWorkspace();
  const router = useRouter();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  // Load history with ALL images (including hidden ones)
  const loadHistory = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        setGroups([]);
        setHasMore(false);
        return;
      }

      const PAGE_SIZE = 20;
      const start = pageNum * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      // Fetch ALL images including hidden ones for History page
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('id, name, url, thumb_url, reference_url, collection_id, prompt, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      const grouped = (images || []).reduce((acc: Record<string, GroupedData>, img: ImageData) => {
        const date = new Date(img.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date_group: date,
            images_count: 0,
            images: []
          };
        }
        acc[date].images_count++;
        acc[date].images.push({
          ...img,
          image_url: img.url
        });
        return acc;
      }, {});

      const groupsArray = Object.values(grouped).sort((a, b) => 
        new Date(b.date_group).getTime() - new Date(a.date_group).getTime()
      );

      if (pageNum === 0) {
        setGroups(groupsArray);
      } else {
        setGroups(prev => {
          const merged = [...prev];
          groupsArray.forEach(newGroup => {
            const existingIdx = merged.findIndex(g => g.date_group === newGroup.date_group);
            if (existingIdx >= 0) {
              merged[existingIdx].images.push(...newGroup.images);
              merged[existingIdx].images_count += newGroup.images_count;
            } else {
              merged.push(newGroup);
            }
          });
          return merged.sort((a, b) => 
            new Date(b.date_group).getTime() - new Date(a.date_group).getTime()
          );
        });
      }

      setHasMore(images.length === PAGE_SIZE);
      setPage(pageNum);

    } catch (err) {
      // Better error logging with type checking
      if (err === null || err === undefined || err === 0) {
        console.warn('History load: received null/undefined/0 error, skipping');
        setLoading(false);
        return;
      }
      
      console.error('History load error:', err);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(page + 1);
    }
  }, [loading, hasMore, page, loadHistory]);

  const refresh = useCallback(async () => {
    await loadHistory(0);
  }, [loadHistory]);

  useEffect(() => {
    loadHistory(0);
  }, [loadHistory]);

  const handleOpenInBuilder = (image: any) => {
    // Load the RESULT image (not reference) into builder
    loadTemporary(image.prompt, image.image_url);
    
    // Show toast feedback
    toast.success('Image and prompt loaded from History', {
      style: {
        background: '#7C3AED',
        color: 'white',
        border: 'none'
      }
    });
    
    router.push('/workspace');
  };

  const handleUsePrompt = (image: any) => {
    // Load ONLY the prompt (no image)
    loadTemporary(image.prompt, null);
    
    // Show different toast
    toast.info('Prompt loaded from History', {
      style: {
        background: '#7C3AED',
        color: 'white',
        border: 'none'
      }
    });
    
    router.push('/workspace');
  };

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, imageId: string) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renderlab-${imageId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    setImageToDelete(imageId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    
    try {
      const response = await fetch(`/api/images/${imageToDelete}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      toast.success('Image deleted');
      // Refresh history list
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setShowDeleteConfirm(false);
      setImageToDelete(null);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <RenderLabLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </RenderLabLayout>
    );
  }

  return (
    <RenderLabLayout showHeader={false} maxWidth="1400px">
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Generation History
          </h1>
          <p className="text-[var(--rl-text-secondary)]">Your creative journey, all in one place</p>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 font-medium mb-2">No generations yet</p>
            <p className="text-sm text-gray-400">
              Create your first masterpiece in Workspace!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <div key={group.date_group}>
                {/* Date Header - Improved */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <h2 className="text-lg font-semibold text-gray-700 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                    {format(new Date(group.date_group), 'MMMM d, yyyy')}
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* Images Grid - Improved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.images.map((img: any) => (
                    <div
                      key={img.id}
                      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
                    >
                      {/* Image */}
                      <div 
                        className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden cursor-pointer"
                        onClick={() => setPreviewImageUrl(img.image_url)}
                      >
                        {/* Result image - always shown */}
                        <img
                          src={img.thumb_url || img.image_url}
                          alt="Generated"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Hover overlay - same style as preview strip */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100">
                          {/* Delete button - Top-right (hover only) */}
                          <button
                            onClick={(e) => handleDeleteClick(e, img.id)}
                            className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full shadow-lg transition-colors backdrop-blur-sm"
                            title="Delete"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* Download button - Bottom-right (hover only) */}
                          <button
                            onClick={(e) => handleDownload(e, img.image_url, img.id)}
                            className="absolute bottom-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full shadow-lg transition-colors backdrop-blur-sm"
                            title="Download"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>

                        {/* VAR tag if this was based on reference */}
                        {img.reference_url && (
                          <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md pointer-events-none">
                            VAR
                          </div>
                        )}

                        {/* Date label - bottom left (always visible) */}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                          {format(new Date(img.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>

                      {/* Info Section - Improved */}
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                          {img.prompt || 'No prompt provided'}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenInBuilder(img)}
                            className="py-2 px-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-xs font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                            title="Edit this result further"
                          >
                            Open in Builder
                          </button>
                          
                          <button
                            onClick={() => handleUsePrompt(img)}
                            className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs font-semibold border border-gray-200 hover:border-gray-300 transform hover:-translate-y-0.5"
                            title="Start fresh with this prompt"
                          >
                            Use Prompt
                          </button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button - Improved */}
          {hasMore && (
            <div className="flex justify-center pt-12">
              <button
                onClick={loadMore}
                disabled={loading}
                className="group px-8 py-3.5 bg-white text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-md hover:shadow-xl border border-gray-200 hover:border-transparent font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Fullscreen Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
      
        {/* Delete confirmation dialog - Improved */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform animate-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Image?</h3>
                <p className="text-gray-600">This action cannot be undone. The image will be permanently removed from your history.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setImageToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RenderLabLayout>
  );
}