'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { DatabaseError } from '@/lib/types/database';
import { toast } from 'sonner';

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

interface HistoryContextType {
  groups: GroupedData[];
  loading: boolean;
  hasMore: boolean;
  error: DatabaseError | null;
  loadMore: () => void;
  refresh: (includeHidden?: boolean) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<DatabaseError | null>(null);

  const loadHistory = useCallback(async (pageNum: number = 0, includeHidden: boolean = false, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      // Gracefully handle unauthenticated state
      if (!user) {
        console.log('User not authenticated, skipping history load');
        setLoading(false);
        setGroups([]);
        setHasMore(false);
        return;
      }

      const PAGE_SIZE = 20;
      const start = pageNum * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      let query = supabase
        .from('images')
        .select('id, name, url, thumb_url, reference_url, collection_id, prompt, created_at, user_id')
        .eq('user_id', user.id);
      
      // Only filter out hidden images if includeHidden is false
      if (!includeHidden) {
        query = query.or('hidden_from_preview.is.null,hidden_from_preview.eq.false');
      }
      
      const { data: images, error: fetchError } = await query
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

      const allGroups = Object.values(grouped).sort((a: GroupedData, b: GroupedData) => 
        new Date(b.date_group).getTime() - new Date(a.date_group).getTime()
      );

      if (pageNum === 0) {
        setGroups(allGroups);
      } else {
        setGroups(prev => {
          // Merge new groups with existing ones
          const merged = [...prev];
          allGroups.forEach(newGroup => {
            const existingGroupIndex = merged.findIndex(g => g.date_group === newGroup.date_group);
            if (existingGroupIndex >= 0) {
              // Merge images into existing group, deduplicating by ID
              const existingIds = new Set(merged[existingGroupIndex].images.map(img => img.id));
              const uniqueNewImages = newGroup.images.filter(img => !existingIds.has(img.id));
              
              merged[existingGroupIndex].images = [
                ...merged[existingGroupIndex].images,
                ...uniqueNewImages
              ];
              merged[existingGroupIndex].images_count = merged[existingGroupIndex].images.length;
            } else {
              // Add new group
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
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to load history';
      
      // Don't show toast for authentication errors (handled by redirect)
      const isAuthError = errorMessage.includes('authenticated') || errorMessage.includes('auth');
      
      const dbError: DatabaseError = {
        message: errorMessage,
      };
      setError(dbError);
      
      if (!isAuthError) {
        toast.error(dbError.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(page + 1, false); // Preview strip never shows hidden
    }
  }, [loading, hasMore, page, loadHistory]);

  const refresh = useCallback(async (includeHidden: boolean = false) => {
    // Silent refresh to prevent "Loading history..." from showing
    await loadHistory(0, includeHidden, true);
  }, [loadHistory]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadHistory(0);
  }, []);

  return (
    <HistoryContext.Provider value={{ groups, loading, hasMore, error, loadMore, refresh }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
}
