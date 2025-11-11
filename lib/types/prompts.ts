// Category types
export type PromptCategory = 
  | 'exterior' 
  | 'interior' 
  | 'lighting' 
  | 'materials' 
  | 'atmosphere';

// Status types
export type PromptStatus = 'pending' | 'approved' | 'rejected';

// Badge types
export type PromptBadge = 'featured' | 'editors_choice' | 'trending' | null;

// Main Prompt type
export interface Prompt {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  title: string;
  prompt: string;
  image_url: string;
  category: PromptCategory;
  tags: string[];
  status: PromptStatus;
  badge: PromptBadge;
  likes_count: number;
  uses_count: number;
  created_at: string;
  updated_at: string;
}

// Prompt Like type
export interface PromptLike {
  id: string;
  prompt_id: string;
  user_id: string;
  created_at: string;
}

// Form data for creating prompt
export interface CreatePromptInput {
  title: string;
  prompt: string;
  image_url: string;
  category: PromptCategory;
  tags: string[];
}

// Admin moderation actions
export interface ModeratePromptInput {
  prompt_id: string;
  action: 'approve' | 'reject';
  badge?: PromptBadge;
}

// Filter options
export interface PromptFilters {
  category?: PromptCategory;
  badge?: PromptBadge;
  user_id?: string;
  search?: string;
  status?: PromptStatus; // only for admins
}
