// lib/hooks/useHistory.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HistoryGroup, DatabaseError } from '@/lib/types/database';
import { toast } from 'sonner';

const PAGE_SIZE = 20; // Загружаем по 20 групп за раз

export function useHistory() {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<DatabaseError | null>(null);

  // Load history with pagination
  const loadHistory = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // ✅ RPC с группировкой по датам
      const { data, error: rpcError } = await supabase.rpc(
        'get_user_history_grouped',
        {
          user_uuid: user.id,
          limit_count: PAGE_SIZE,
          offset_count: pageNum * PAGE_SIZE
        }
      );

      if (rpcError) throw rpcError;

      if (pageNum === 0) {
        // First load - replace
        setGroups(data || []);
      } else {
        // Load more - append
        setGroups(prev => [...prev, ...(data || [])]);
      }

      // Check if there's more data
      setHasMore((data || []).length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      const dbError: DatabaseError = {
        message: err instanceof Error ? err.message : 'Failed to load history',
      };
      setError(dbError);
      toast.error(dbError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(page + 1);
    }
  }, [loading, hasMore, page, loadHistory]);

  // Load on mount
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