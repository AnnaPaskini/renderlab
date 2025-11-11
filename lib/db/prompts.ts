import { createClient } from '@/lib/supabaseServer';
import type { 
  Prompt, 
  PromptFilters, 
  CreatePromptInput,
  PromptCategory,
  PromptBadge 
} from '@/lib/types/prompts';

/**
 * Get approved prompts with filters
 */
export async function getPrompts(filters?: PromptFilters) {
  const supabase = await createClient();
  
  let query = supabase
    .from('prompts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.badge) {
    query = query.eq('badge', filters.badge);
  }

  if (filters?.search) {
    // Escape special SQL characters to prevent injection
    const escapedSearch = filters.search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    
    // Search in title, prompt, and tags
    query = query.or(
      `title.ilike.%${escapedSearch}%,` +
      `prompt.ilike.%${escapedSearch}%,` +
      `tags.cs.{${escapedSearch}}`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Prompt[];
}

/**
 * Get user's own prompts (any status)
 */
export async function getUserPrompts(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Prompt[];
}

/**
 * Get single prompt by ID
 * Checks authorization for non-approved prompts
 */
export async function getPromptById(id: string, userId?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  const prompt = data as Prompt;
  
  // Check if user has permission to view
  if (prompt.status !== 'approved') {
    // Only owner or admin can view non-approved prompts
    if (!userId || prompt.user_id !== userId) {
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profile?.role !== 'admin') {
        throw new Error('You do not have permission to view this prompt');
      }
    }
  }
  
  return prompt;
}

/**
 * Create new prompt (auth required)
 * Uses RPC for atomic limit checking
 */
export async function createPrompt(input: CreatePromptInput, userId: string) {
  const supabase = await createClient();

  // Get user's name and avatar
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error('Unable to fetch user profile. Please complete your profile first.');
  }

  if (!profile?.full_name) {
    throw new Error('Please set your name in profile settings before submitting prompts.');
  }

  // Use RPC to create with atomic limit check
  const { data, error } = await supabase.rpc('create_prompt_with_limit', {
    p_user_id: userId,
    p_author_name: profile.full_name,
    p_author_avatar_url: profile.avatar_url,
    p_title: input.title,
    p_prompt: input.prompt,
    p_image_url: input.image_url,
    p_category: input.category,
    p_tags: input.tags
  });

  if (error) {
    if (error.message.includes('5 pending prompts')) {
      throw new Error('You already have 5 pending prompts. Please wait for approval.');
    }
    throw error;
  }

  // Fetch the created prompt
  const { data: prompt, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) throw fetchError;
  return prompt as Prompt;
}

/**
 * Check if user liked a prompt
 */
export async function hasUserLikedPrompt(promptId: string, userId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('prompt_likes')
    .select('id')
    .eq('prompt_id', promptId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

/**
 * Toggle like on prompt
 * Uses RPC to handle race conditions atomically
 */
export async function togglePromptLike(promptId: string, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('toggle_prompt_like', {
    p_prompt_id: promptId,
    p_user_id: userId
  });

  if (error) throw error;
  return data as { liked: boolean };
}

/**
 * Admin: Get all prompts with any status
 */
export async function getAllPromptsAdmin(status?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Prompt[];
}

/**
 * Admin: Approve prompt with optional badge
 * Uses atomic RPC to handle approval + badge in one transaction
 */
export async function approvePrompt(promptId: string, badge?: PromptBadge) {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('approve_prompt_with_badge', {
    p_prompt_id: promptId,
    p_badge: badge || null
  });

  if (error) {
    console.error('Error approving prompt:', error);
    throw new Error(`Failed to approve prompt: ${error.message}`);
  }
}

/**
 * Admin: Reject prompt
 */
export async function rejectPrompt(promptId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('reject_prompt', {
    prompt_id: promptId
  });

  if (error) {
    console.error('Error rejecting prompt:', error);
    throw new Error(`Failed to reject prompt: ${error.message}`);
  }
}

/**
 * Admin: Set badge on approved prompt
 */
export async function setPromptBadge(promptId: string, badge: PromptBadge) {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('set_prompt_badge', {
    prompt_id: promptId,
    badge_type: badge
  });

  if (error) {
    console.error('Error setting badge:', error);
    throw new Error(`Failed to set badge: ${error.message}`);
  }
}
