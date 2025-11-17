'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          radial-gradient(circle at 30% 40%, rgba(255, 107, 53, 0.02) 0%, transparent 60%),
          radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.02) 0%, transparent 60%),
          #0a0a0a
        `,
        backgroundSize: '32px 32px, 100% 100%, 100% 100%, 100% 100%',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0'
      }}
    >
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Custom Assets
          </h1>
          <p className="text-gray-400">
            Manage your templates and collections
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="mb-8 p-1 rounded-2xl"
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 12px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <TabsTrigger
              value="templates"
              className="px-8 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff6b35] data-[state=active]:to-[#ff7849] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(255,107,53,0.3)] transition-all text-gray-400 data-[state=active]:text-white font-semibold"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="px-8 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff6b35] data-[state=active]:to-[#ff7849] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(255,107,53,0.3)] transition-all text-gray-400 data-[state=active]:text-white font-semibold"
            >
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-0">
            <div
              className="rounded-3xl p-8"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
              }}
            >
              <PromptTemplates />
            </div>
          </TabsContent>

          <TabsContent value="collections" className="mt-0">
            <div
              className="rounded-3xl p-8"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
              }}
            >
              <CollectionsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}