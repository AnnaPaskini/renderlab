'use client';

import { useRouter } from 'next/navigation';
import { SubmitPromptForm } from '@/components/prompts/SubmitPromptForm';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseBrowser';

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
  <div className="min-h-screen bg-[var(--rl-bg)] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
  <div className="min-h-screen bg-[var(--rl-bg)]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            href="/prompts"
            className="text-sm text-[#ff6b35] hover:text-[#ff8555] mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Prompts Library
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Submit Your Prompt</h1>
          <p className="text-gray-600 mt-2">
            Share your best prompts with the RenderLab community. 
            Your submission will be reviewed before going live.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
          <SubmitPromptForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Guidelines Box */}
        <div className="mt-6 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#ff6b35] mb-2">
            Submission Guidelines
          </h3>
          <ul className="text-sm text-[#ff6b35] space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-[#ff6b35] mt-0.5">•</span>
              <span>Maximum 5 pending submissions at a time per user</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff6b35] mt-0.5">•</span>
              <span>Images must be architectural visualization renders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff6b35] mt-0.5">•</span>
              <span>Prompts should be clear and descriptive (50-2000 characters)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff6b35] mt-0.5">•</span>
              <span>Approved prompts appear in the community library</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff6b35] mt-0.5">•</span>
              <span>Track your submissions in <Link href="/account" className="underline hover:text-[#ff8555]">Account Settings</Link></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
