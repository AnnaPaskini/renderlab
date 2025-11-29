'use client';

import { CollectionsPanel } from '@/components/workspace/CollectionPanel';
import { PromptTemplates } from '@/components/workspace/PromptTemplates';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CustomPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'templates');

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="min-h-screen">

      <div className="max-w-7xl mx-auto px-8 pt-32 pb-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Custom Assets
          </h1>
          <p className="text-neutral-400">
            Manage your templates and collections
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'templates'
                ? 'premium-generate-button'
                : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
              }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'collections'
                ? 'premium-generate-button'
                : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
              }`}
          >
            Collections
          </button>
        </div>

        {activeTab === 'templates' && (
          <div className="rl-panel-wrapper">
            <PromptTemplates />
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="rl-panel-wrapper">
            <CollectionsPanel />
          </div>
        )}
      </div>
    </div>
  );
}