// lib/types/database.ts

// ============================================
// Base Database Types
// ============================================

export interface Template {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionTemplate {
  id: string;
  collection_id: string;
  template_id: string;
  order_index: number;
  created_at: string;
}

// ============================================
// Extended Types (для RPC responses)
// ============================================

export interface CollectionWithTemplates extends Collection {
  templates: (Template & { order_index: number })[];
  template_count: number;
}

export interface HistoryGroup {
  date_group: string; // DATE format: "2025-11-09"
  images: GeneratedImage[];
  count: number;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  reference_url: string | null;
  created_at: string;
}

// ============================================
// UI State Types
// ============================================

export type ActiveItem = 
  | { type: 'template'; data: Template }
  | { type: 'collection'; data: CollectionWithTemplates }
  | { type: 'temporary'; data: { prompt: string; reference_url: string | null } }
  | { type: null; data: null };

// ============================================
// Error Handling Types
// ============================================

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: DatabaseError;
}