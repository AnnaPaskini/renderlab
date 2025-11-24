
'use client';

import { FilterBar } from '@/components/prompts/FilterBar';
import { PromptCard } from '@/components/prompts/PromptCard';
import { createClient } from '@/lib/supabaseBrowser';
import type { Prompt, PromptBadge, PromptCategory } from '@/lib/types/prompts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PromptsLibraryPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<{
    category?: PromptCategory;
    badge?: PromptBadge;
    search?: string;
  }>({});

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.badge) params.append('badge', filters.badge);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/prompts?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setPrompts(result.data);

    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="rl-ambient-bg min-h-screen pt-32 pb-12">
      {/* Header */}
      <div className="relative z-10 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Prompts Library</h1>
            <p className="text-gray-400 mt-2">
              Discover AI prompts shared by the RenderLab community
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        {/* Filters */}
        <div className="rl-card p-8 mb-10">
          <FilterBar onFilterChange={setFilters} />
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rl-skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              <svg className="w-24 h-24 mx-auto text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No prompts found</h3>
            <p className="text-gray-400 mb-6">
              {filters.category || filters.badge || filters.search
                ? 'Try adjusting your filters'
                : 'Be the first to submit a prompt!'}
            </p>
            {isAuthenticated === true && !filters.category && !filters.badge && !filters.search && (
              <button
                onClick={() => router.push('/prompts/submit')}
                className="rl-btn-primary"
              >
                Submit First Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onLikeToggle={fetchPrompts}
              />
            ))}
          </div>
        )}

        {/* Contribution CTA */}
        {prompts.length > 0 && (
          <div className="mt-16 text-center py-12 border-t border-white/8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Have a great prompt to share?
              </h3>
              <p className="text-gray-400 mb-6">
                Help the community by contributing your best architectural visualization prompts
              </p>
              <Link
                href="/prompts/submit"
                className="rl-btn-primary inline-flex items-center gap-2"
              >
                Submit Your Prompt
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
