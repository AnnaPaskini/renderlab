'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DatabaseError } from '@/lib/types/database';
import { toast } from 'sonner';

const GROUPS_PER_PAGE = 1; // Show 5 days of history per page

export function useHistory() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<DatabaseError | null>(null);

  const loadHistory = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // ✅ Load 100 images from DB (lazy loading prevents downloading all at once)
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('id, name, url, reference_url, collection_id, prompt, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      // Group images by date on the client
      const grouped = (images || []).reduce((acc: any, img: any) => {
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
          image_url: img.url // map url → image_url
        });
        return acc;
      }, {});

      const allGroups = Object.values(grouped).sort((a: any, b: any) => 
        new Date(b.date_group).getTime() - new Date(a.date_group).getTime()
      );

      // ✅ Paginate GROUPS (show 5 days at a time)
      const startIdx = pageNum * GROUPS_PER_PAGE;
      const endIdx = startIdx + GROUPS_PER_PAGE;
      const paginatedData = allGroups.slice(startIdx, endIdx);

      if (pageNum === 0) {
        setGroups(paginatedData);
      } else {
        setGroups(prev => [...prev, ...paginatedData]);
      }

      // ✅ Check if there are more groups to load
      setHasMore(endIdx < allGroups.length);
      setPage(pageNum);

    } catch (err) {
      console.error('History load error:', err);
      const dbError: DatabaseError = {
        message: err instanceof Error ? err.message : 'Failed to load history',
      };
      setError(dbError);
      toast.error(dbError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(page + 1);
    }
  }, [loading, hasMore, page, loadHistory]);

  useEffect(() => {
    loadHistory(0);
  }, [loadHistory]);

  return {
    groups,
    loading,
    hasMore,
    error,
    loadMore,
    refresh: () => loadHistory(0)
  };
}