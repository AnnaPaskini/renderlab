'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Prompt } from '@/lib/types/prompts';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'prompts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Prompts {stats.total > 0 && `(${stats.total})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              {profile?.full_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">{profile.full_name}</p>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Settings coming soon...
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Prompts</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-900">{stats.pending}/5</div>
                <div className="text-sm text-yellow-700">Pending Review</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                <div className="text-sm text-red-700">Rejected</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setPromptFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      promptFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && ` (${stats[filter]})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompts List */}
            {filteredPrompts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No prompts yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start sharing your best prompts with the community
                </p>
                <button
                  onClick={() => router.push('/prompts/submit')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Submit Your First Prompt
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrompts.map(prompt => {
                  const isExpanded = expandedPrompts.has(prompt.id);
                  
                  return (
                    <div
                      key={prompt.id}
                      className="bg-white rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4 p-4">
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
                            <h3 className="font-semibold text-gray-900">
                              {prompt.title}
                            </h3>

                            {/* Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                prompt.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : prompt.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                            </span>
                          </div>

                          {/* Prompt text - expandable */}
                          <p className={`text-sm text-gray-600 mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {prompt.prompt}
                          </p>
                          
                          {prompt.prompt.length > 100 && (
                            <button
                              onClick={() => toggleExpanded(prompt.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 mb-2"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="px-2 py-1 bg-gray-100 rounded">{prompt.category}</span>
                            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                            {prompt.status === 'approved' && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {prompt.likes_count}
                              </span>
                            )}
                            {prompt.badge && (
                              <span className={`px-2 py-0.5 rounded font-medium ${
                                prompt.badge === 'featured' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : prompt.badge === 'trending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
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
                                <span key={`${prompt.id}-tag-${tagIndex}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
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
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                View in Library
                              </button>
                            )}
                            {prompt.status === 'pending' && (
                              <button
                                onClick={() => handleDeletePrompt(prompt.id)}
                                className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
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
          </div>
        )}
      </div>
    </div>
  );
}
