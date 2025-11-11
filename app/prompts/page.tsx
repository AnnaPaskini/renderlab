'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseBrowser';
import { FilterBar } from '@/components/prompts/FilterBar';
import { PromptCard } from '@/components/prompts/PromptCard';
import { SubmitPromptForm } from '@/components/prompts/SubmitPromptForm';
import { Dialog } from '@/components/ui/dialog';
import type { Prompt, PromptCategory, PromptBadge } from '@/lib/types/prompts';
import { toast } from 'sonner';

export default function PromptsLibraryPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState<{
    category?: PromptCategory;
    badge?: PromptBadge;
    search?: string;
  }>({});

  // Check authentication
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

  const handleAddPrompt = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to submit prompts');
      router.push('/login');
      return;
    }
    setShowSubmitForm(true);
  };

  const handleSubmitSuccess = () => {
    setShowSubmitForm(false);
    toast.success('Your prompt has been submitted for review!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prompts Library</h1>
              <p className="text-gray-600 mt-2">
                Discover and share AI prompts for architectural visualization
              </p>
            </div>
            <button
              onClick={handleAddPrompt}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Submit Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <FilterBar onFilterChange={setFilters} />
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-600 mb-6">
              {filters.category || filters.badge || filters.search
                ? 'Try adjusting your filters'
                : 'Be the first to submit a prompt!'}
            </p>
            {isAuthenticated && (
              <button
                onClick={handleAddPrompt}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Submit First Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onLikeToggle={fetchPrompts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit Form Dialog */}
      {showSubmitForm && (
        <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Submit Your Prompt</h2>
            <SubmitPromptForm
              onSuccess={handleSubmitSuccess}
              onCancel={() => setShowSubmitForm(false)}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
