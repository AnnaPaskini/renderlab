'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DatabaseError } from '@/lib/types/database';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

interface ImageData {
  id: string;
  name: string;
  url: string;
  image_url?: string;
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

export function useHistory() {
  const [groups, setGroups] = useState<GroupedData[]>([]);
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

      // ПРЯМОЙ ЗАПРОС - без RPC!
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('id, name, url, reference_url, collection_id, prompt, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Группируем на клиенте по датам
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
          image_url: img.url // маппим url → image_url
        });
        return acc;
      }, {});

      const allGroups = Object.values(grouped).sort((a: GroupedData, b: GroupedData) => 
        new Date(b.date_group).getTime() - new Date(a.date_group).getTime()
      );

      // Пагинация
      const startIdx = pageNum * PAGE_SIZE;
      const endIdx = startIdx + PAGE_SIZE;
      const paginatedData = allGroups.slice(startIdx, endIdx);

      if (pageNum === 0) {
        setGroups(paginatedData);
      } else {
        setGroups(prev => [...prev, ...paginatedData]);
      }

      setHasMore(endIdx < allGroups.length);
      setPage(pageNum);

    } catch (err) {
      // Better error logging with type checking
      if (err === null || err === undefined || err === 0) {
        console.warn('History load: received null/undefined/0 error, skipping');
        setLoading(false);
        return;
      }
      
      console.error('History load error:', err);
      const dbError: DatabaseError = {
        message: err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to load history',
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