'use client';

import { SubmitPromptForm } from '@/components/prompts/SubmitPromptForm';
import { createClient } from '@/lib/supabaseBrowser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubmitPromptPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        console.log('[Submit Page] Auth check:', { user: user?.email, error });

        if (!user) {
          console.log('[Submit Page] No user, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('[Submit Page] User authenticated, showing form');
        setIsAuthenticated(true);
        setLoading(false);
      } catch (err) {
        console.error('[Submit Page] Auth check error:', err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSuccess = () => {
    router.push('/prompts');
  };

  const handleCancel = () => {
    router.push('/prompts');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen relative"
    >
      {/* Content - z-index above grid */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="border-b border-white/[0.08]" style={{ background: '#161616' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/prompts"
              className="text-sm text-[#ff6b35] hover:text-[#ff8555] mb-4 inline-flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Prompts Library
            </Link>
            <h1 className="text-3xl font-bold text-white mt-2">Submit Your Prompt</h1>
            <p className="text-gray-400 mt-2">
              Share your best prompts with the RenderLab community.
              Your submission will be reviewed before going live.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="rounded-3xl p-8"
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 20px 64px rgba(0, 0, 0, 0.4)'
            }}
          >
            <SubmitPromptForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>

          {/* Guidelines Box - Subdued brown tint, not orange */}
          <div
            className="mt-6 rounded-xl p-5"
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              border: '1px solid rgba(139, 69, 19, 0.3)'
            }}
          >
            <h3 className="text-sm font-semibold text-amber-200 mb-3">
              Submission Guidelines
            </h3>
            <ul className="text-sm text-amber-100/90 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">•</span>
                <span>Images must be architectural visualization renders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">•</span>
                <span>Prompts should be clear and descriptive (50-2000 characters)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">•</span>
                <span>Approved prompts appear in the community library</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">•</span>
                <span>Track your submissions in <Link href="/account" className="underline hover:text-amber-200 transition-colors">Account Settings</Link></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
