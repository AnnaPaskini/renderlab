"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseBrowser";

export interface Collection {
  id: string;
  title: string;
  templates: any[];
  createdAt: string;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);

  // === LOAD COLLECTIONS FROM SUPABASE ===
  const loadCollectionsFromSupabase = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('⚠️ No user logged in, skipping collections load');
        setCollections([]);
        return;
      }

      console.log('📥 Loading collections from Supabase for user:', user.id);

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load collections:', error);
        throw error;
      }

      console.log('✅ Loaded collections from Supabase:', data?.length || 0);
      setCollections(data || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
      setCollections([]);
    }
  };

  // Load collections on mount
  useEffect(() => {
    loadCollectionsFromSupabase();
  }, []);

  // === CREATE COLLECTION ===
  const createCollection = async (title: string) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while creating collection:', authError);
        return null;
      }

      const newCollection: Collection = {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled Collection",
        templates: [],
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          id: newCollection.id,
          title: newCollection.title,
          templates: newCollection.templates,
          created_at: newCollection.createdAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Collection created in Supabase:', data);

      // Reload collections
      await loadCollectionsFromSupabase();

      return newCollection.id;
    } catch (error) {
      console.error('Failed to create collection:', error);
      return null;
    }
  };

  // === DELETE COLLECTION ===
  const deleteCollection = async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while deleting collection:', authError);
        return;
      }

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Collection deleted from Supabase');

      // Reload collections
      await loadCollectionsFromSupabase();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  // === ADD TEMPLATE TO COLLECTION ===
  const addTemplate = async (collectionId: string, template: any) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while adding template:', authError);
        return;
      }

      // Find the collection
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        console.error('Collection not found:', collectionId);
        return;
      }

      const existing = collection.templates || [];
      const alreadyExists = template?.id && existing.some((t) => t.id === template.id);
      if (alreadyExists) return;

      const updatedTemplates = [...existing, template];

      const { error } = await supabase
        .from('collections')
        .update({ templates: updatedTemplates })
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Template added to collection in Supabase');

      // Reload collections
      await loadCollectionsFromSupabase();
    } catch (error) {
      console.error('Failed to add template to collection:', error);
    }
  };

  // === REMOVE TEMPLATE FROM COLLECTION ===
  const removeTemplate = async (collectionId: string, templateId: string) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while removing template:', authError);
        return;
      }

      // Find the collection
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        console.error('Collection not found:', collectionId);
        return;
      }

      const updatedTemplates = (collection.templates || []).filter((t) => t.id !== templateId);

      const { error } = await supabase
        .from('collections')
        .update({ templates: updatedTemplates })
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Template removed from collection in Supabase');

      // Reload collections
      await loadCollectionsFromSupabase();
    } catch (error) {
      console.error('Failed to remove template from collection:', error);
    }
  };

  // === DUPLICATE COLLECTION ===
  const duplicateCollection = async (id: string, customTitle?: string) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while duplicating collection:', authError);
        return null;
      }

      const original = collections.find((c) => c.id === id);
      if (!original) return null;

      const baseTitle = original.title || "Untitled Collection";
      const newTitle = customTitle?.trim() || `${baseTitle} - Copy`;

      const uniqueId = crypto.randomUUID();

      const clonedTemplates = (original.templates || []).map((template) => ({
        ...template,
        id:
          template.id ||
          template.createdAt ||
          `${template.name || "template"}-${Math.random().toString(36).slice(2, 8)}`,
        duplicatedFrom: template.id ?? template.createdAt ?? null,
      }));

      const newCollection: Collection = {
        id: uniqueId,
        title: newTitle,
        templates: clonedTemplates,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          id: newCollection.id,
          title: newCollection.title,
          templates: newCollection.templates,
          created_at: newCollection.createdAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Collection duplicated in Supabase:', data);

      // Reload collections
      await loadCollectionsFromSupabase();

      return newCollection.id;
    } catch (error) {
      console.error('Failed to duplicate collection:', error);
      return null;
    }
  };

  // === RENAME COLLECTION ===
  const renameCollection = async (id: string, newTitle: string) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error while renaming collection:', authError);
        return;
      }

      const { error } = await supabase
        .from('collections')
        .update({ title: newTitle.trim() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Collection renamed in Supabase');

      // Reload collections
      await loadCollectionsFromSupabase();
    } catch (error) {
      console.error('Failed to rename collection:', error);
    }
  };

  // === GET COLLECTION BY ID ===
  const getCollection = (id: string) => collections.find((c) => c.id === id);

  return {
    collections,
    createCollection,
    deleteCollection,
    addTemplate,
    removeTemplate,
    duplicateCollection,
    renameCollection,
    getCollection,
  };
}