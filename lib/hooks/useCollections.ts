// lib/hooks/useCollections.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Collection, CollectionWithTemplates, DatabaseError } from '@/lib/types/database';
import { toast } from 'sonner';

export function useCollections() {
  const [collections, setCollections] = useState<CollectionWithTemplates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);

  // Load collections with templates (ONE RPC call instead of N+1)
  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // ✅ ОДИН RPC запрос вместо множества
      const { data, error: rpcError } = await supabase
        .rpc('get_user_collections_with_templates', {
          user_uuid: user.id
        });

      if (rpcError) throw rpcError;
      
      setCollections(data || []);
    } catch (err) {
      const dbError: DatabaseError = {
        message: err instanceof Error ? err.message : 'Failed to load collections',
        code: (err as any)?.code,
        details: (err as any)?.details
      };
      setError(dbError);
      toast.error(dbError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new collection
  const createCollection = useCallback(async (name: string): Promise<Collection | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: name.trim()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Optimistic update - добавляем пустую коллекцию
      const newCollection: CollectionWithTemplates = {
        ...data,
        templates: [],
        template_count: 0
      };
      setCollections(prev => [newCollection, ...prev]);
      
      toast.success('Collection created', {
        style: {
          background: '#7C3AED',
          color: 'white',
          border: 'none'
        }
      });
      
      return data;
    } catch (err) {
      toast.error('Failed to create collection');
      return null;
    }
  }, []);

  // Update collection name
  const updateCollection = useCallback(async (
    id: string,
    name: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('collections')
        .update({ name: name.trim() })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Optimistic update
      setCollections(prev =>
        prev.map(c => c.id === id ? { ...c, name: name.trim(), updated_at: new Date().toISOString() } : c)
      );
      
      toast.success('Collection updated', {
        style: {
          background: '#7C3AED',
          color: 'white',
          border: 'none'
        }
      });
      
      return true;
    } catch (err) {
      toast.error('Failed to update collection');
      return false;
    }
  }, []);

  // Add template to collection
  const addTemplateToCollection = useCallback(async (
    collectionId: string, 
    templateId: string
  ): Promise<boolean> => {
    try {
      // Get current max order_index
      const { data: existing } = await supabase
        .from('collection_templates')
        .select('order_index')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 
        ? existing[0].order_index + 1 
        : 0;

      const { error: insertError } = await supabase
        .from('collection_templates')
        .insert({
          collection_id: collectionId,
          template_id: templateId,
          order_index: nextOrder
        });

      if (insertError) {
        // Check for duplicate (PostgreSQL error code 23505)
        if (insertError.code === '23505') {
          toast.error('Template already in this collection');
          return false;
        }
        throw insertError;
      }
      
      // Refresh to get updated data
      await loadCollections();
      
      toast.success('Template added to collection', {
        style: {
          background: '#7C3AED',
          color: 'white',
          border: 'none'
        }
      });
      
      return true;
    } catch (err) {
      toast.error('Failed to add template');
      return false;
    }
  }, [loadCollections]);

  // Remove template from collection
  const removeTemplateFromCollection = useCallback(async (
    collectionId: string,
    templateId: string
  ): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('collection_templates')
        .delete()
        .eq('collection_id', collectionId)
        .eq('template_id', templateId);

      if (deleteError) throw deleteError;
      
      // Refresh to get updated data
      await loadCollections();
      
      toast.success('Template removed from collection', {
        style: {
          background: '#7C3AED',
          color: 'white',
          border: 'none'
        }
      });
      
      return true;
    } catch (err) {
      toast.error('Failed to remove template');
      return false;
    }
  }, [loadCollections]);

  // Delete collection (cascade deletes collection_templates automatically)
  const deleteCollection = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Optimistic update
      setCollections(prev => prev.filter(c => c.id !== id));
      
      toast.success('Collection deleted', {
        style: {
          background: '#7C3AED',
          color: 'white',
          border: 'none'
        }
      });
      
      return true;
    } catch (err) {
      toast.error('Failed to delete collection');
      return false;
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    addTemplateToCollection,
    removeTemplateFromCollection,
    deleteCollection,
    refresh: loadCollections
  };
}