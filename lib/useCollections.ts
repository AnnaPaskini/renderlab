"use client";

import { useEffect, useState } from "react";

export interface Collection {
  id: string;
  title: string;
  templates: any[];
  createdAt: string;
}

export function useCollections() {
  const STORAGE_KEY = "RenderLab_collections";
  const [collections, setCollections] = useState<Collection[]>([]);

  // === LOAD COLLECTIONS FROM LOCALSTORAGE ===
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCollections(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to parse collections from localStorage:", err);
      setCollections([]);
    }
  }, []);

  // === SAVE COLLECTIONS ===
  const saveCollections = (data: Collection[]) => {
    setCollections(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // === CREATE COLLECTION ===
  const createCollection = (title: string) => {
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled Collection",
      templates: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...collections, newCollection];
    saveCollections(updated);
    return newCollection.id;
  };

  // === DELETE COLLECTION ===
  const deleteCollection = (id: string) => {
    const updated = collections.filter((c) => c.id !== id);
    saveCollections(updated);
  };

  // === ADD TEMPLATE TO COLLECTION ===
  const addTemplate = (collectionId: string, template: any) => {
    const updated = collections.map((col) => {
      if (col.id !== collectionId) return col;

      const existing = col.templates || [];
      const alreadyExists = template?.id && existing.some((t) => t.id === template.id);
      if (alreadyExists) return col;

      return { ...col, templates: [...existing, template] };
    });

    saveCollections(updated);
  };

  // === REMOVE TEMPLATE FROM COLLECTION ===
  const removeTemplate = (collectionId: string, templateId: string) => {
    const updated = collections.map((col) =>
      col.id === collectionId
        ? { ...col, templates: (col.templates || []).filter((t) => t.id !== templateId) }
        : col
    );
    saveCollections(updated);
  };

  // === DUPLICATE COLLECTION ===
  const duplicateCollection = (id: string, customTitle?: string) => {
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

    const updated = [...collections, newCollection];
    saveCollections(updated);

    return newCollection.id;
  };

  // === RENAME COLLECTION ===
  const renameCollection = (id: string, newTitle: string) => {
    const updated = collections.map((col) =>
      col.id === id ? { ...col, title: newTitle.trim() } : col
    );
    saveCollections(updated);
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
