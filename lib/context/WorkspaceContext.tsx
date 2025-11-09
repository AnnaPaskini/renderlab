// lib/context/WorkspaceContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ActiveItem, Template, CollectionWithTemplates } from '@/lib/types/database';

interface WorkspaceContextType {
  activeItem: ActiveItem;
  loadTemplate: (template: Template) => void;
  loadCollection: (collection: CollectionWithTemplates) => void;
  loadTemporary: (prompt: string, reference_url: string | null) => void;
  clear: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState<ActiveItem>({ 
    type: null, 
    data: null 
  });

  const loadTemplate = useCallback((template: Template) => {
    setActiveItem({ type: 'template', data: template });
  }, []);

  const loadCollection = useCallback((collection: CollectionWithTemplates) => {
    setActiveItem({ type: 'collection', data: collection });
  }, []);

  const loadTemporary = useCallback((prompt: string, reference_url: string | null) => {
    setActiveItem({ 
      type: 'temporary', 
      data: { prompt, reference_url } 
    });
  }, []);

  const clear = useCallback(() => {
    setActiveItem({ type: null, data: null });
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      activeItem,
      loadTemplate,
      loadCollection,
      loadTemporary,
      clear
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// Hook для использования контекста
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}