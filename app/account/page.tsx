'use client';

import { createClient } from '@/lib/supabaseBrowser';
import type { Prompt } from '@/lib/types/prompts';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TabType = 'profile' | 'prompts';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'prompts' ? 'prompts' : 'profile';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [promptFilter, setPromptFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Load user's prompts
  useEffect(() => {
    if (!user) return;

    const loadMyPrompts = async () => {
      try {
        const response = await fetch(`/api/prompts/user/${user.id}`);
        const result = await response.json();

        if (result.success) {
          setMyPrompts(result.data);
        }
      } catch (error) {
        console.error('Error loading prompts:', error);
      }
    };

    if (activeTab === 'prompts') {
      loadMyPrompts();
    }
  }, [user, activeTab]);

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Delete this prompt? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      toast.success('Prompt deleted');
      setMyPrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const toggleExpanded = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const filteredPrompts = myPrompts.filter(prompt => {
    if (promptFilter === 'all') return true;
    return prompt.status === promptFilter;
  });

  const stats = {
    total: myPrompts.length,
    pending: myPrompts.filter(p => p.status === 'pending').length,
    approved: myPrompts.filter(p => p.status === 'approved').length,
    rejected: myPrompts.filter(p => p.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen rl-bg-app flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rl-ambient-bg min-h-screen pt-20">
      {/* Tabs */}
      <div className="rl-bg-elevated border-b rl-border-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`rl-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`rl-tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
            >
              My Prompts {stats.total > 0 && `(${stats.total})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {activeTab === 'profile' && (
          <>
            {/* Profile Header */}
            <div className="pt-10 pb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Account Settings
              </h1>

              <p className="text-neutral-300 max-w-2xl mb-8">
                Manage your account and preferences
              </p>

              <div className="w-full h-px bg-white/5 mb-10" />
            </div>

            <div className="rl-card p-10">
              <h2 className="text-xl font-bold text-white mb-8">Profile Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Email
                  </label>
                  <p className="text-gray-300">{user?.email}</p>
                </div>

                {profile?.full_name && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Name
                    </label>
                    <p className="text-gray-300">{profile.full_name}</p>
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-sm text-gray-400">
                    Settings coming soon...
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'prompts' && (
          <>
            {/* My Prompts Header */}
            <div className="pt-10 pb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                My Prompts
              </h1>

              <p className="text-neutral-300 max-w-2xl mb-8">
                Discover and manage all prompts you've submitted to the RenderLab community.
              </p>

              <div className="w-full h-px bg-white/5 mb-10" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="rl-card p-6">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Prompts</div>
              </div>
              <div className="rl-card p-6">
                <div className="text-2xl font-bold text-white">{stats.pending}/5</div>
                <div className="text-sm text-gray-400">Pending Review</div>
              </div>
              <div className="rl-card p-6">
                <div className="text-2xl font-bold text-white">{stats.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
              <div className="rl-card p-6">
                <div className="text-2xl font-bold text-white">{stats.rejected}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </div>
            </div>

            {/* Filters */}
            <div className="rl-card p-6 mb-8">
              <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setPromptFilter(filter)}
                    className={`rl-filter-btn ${promptFilter === filter ? 'active' : ''}`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && ` (${stats[filter]})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompts List */}
            {filteredPrompts.length === 0 ? (
              <div className="rl-card text-center p-16">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No prompts yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Start sharing your best prompts with the community
                </p>
                <button
                  onClick={() => router.push('/prompts/submit')}
                  className="rl-btn rl-btn-primary"
                >
                  Submit Your First Prompt
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPrompts.map(prompt => {
                  const isExpanded = expandedPrompts.has(prompt.id);

                  return (
                    <div
                      key={prompt.id}
                      className="rl-card p-6"
                    >
                      <div className="flex gap-6">
                        {/* Thumbnail */}
                        <img
                          src={prompt.image_url}
                          alt={prompt.title}
                          className="w-32 h-32 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                          onClick={() => toggleExpanded(prompt.id)}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="font-semibold text-white">
                              {prompt.title}
                            </h3>

                            {/* Status Badge */}
                            <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-white/5 text-gray-300 border border-white/10">
                              {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                            </span>
                          </div>

                          {/* Prompt text - expandable */}
                          <p className={`text-sm text-gray-300 mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {prompt.prompt}
                          </p>

                          {prompt.prompt.length > 100 && (
                            <button
                              onClick={() => toggleExpanded(prompt.id)}
                              className="text-xs rl-link-accent mb-2"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                            <span className="rl-badge rl-badge-neutral">{prompt.category}</span>
                            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                            {prompt.status === 'approved' && (
                              <span className="flex items-center gap-1 rl-text-accent">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {prompt.likes_count}
                              </span>
                            )}
                            {prompt.badge && (
                              <span className="rl-badge rl-badge-accent">
                                {prompt.badge === 'featured' ? 'Featured' :
                                  prompt.badge === 'trending' ? 'Trending' :
                                    "Editor's Choice"}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {prompt.tags.map((tag, tagIndex) => (
                                <span key={`${prompt.id}-tag-${tagIndex}`} className="rl-badge rl-badge-accent text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {prompt.status === 'approved' && (
                              <button
                                onClick={() => window.open(`/prompts?highlight=${prompt.id}`, '_blank')}
                                className="rl-btn rl-btn-secondary text-sm"
                              >
                                View in Library
                              </button>
                            )}
                            {prompt.status === 'pending' && (
                              <button
                                onClick={() => handleDeletePrompt(prompt.id)}
                                className="px-3 py-1.5 text-sm text-red-500 bg-red-600/10 border border-red-500/30 rounded-lg hover:bg-red-600/20 hover:border-red-500/50 font-semibold transition-all duration-200"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
