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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-start gap-4 mb-8 bg-transparent p-0 h-auto border-0">
            <TabsTrigger
              value="templates"
              className="bg-[#262626] text-white px-8 py-3.5 rounded-xl font-medium border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-[#2d2d2d] hover:border-white/15 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] data-[state=active]:bg-[#333] data-[state=active]:border-white/20 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="bg-[#262626] text-white px-8 py-3.5 rounded-xl font-medium border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-[#2d2d2d] hover:border-white/15 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] data-[state=active]:bg-[#333] data-[state=active]:border-white/20 data-[state=active]:text-white data-[state=active]:shadow-md"
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