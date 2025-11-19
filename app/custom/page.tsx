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
          <p className="text-gray-400">
            Manage your templates and collections
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 bg-transparent border-b border-white/10 p-0 h-auto">
            <TabsTrigger
              value="templates"
              className="relative px-1 py-3 text-sm font-medium transition-colors duration-200 bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none text-neutral-400 hover:text-white data-[state=active]:hover:text-white rounded-none"
            >
              Templates
              {activeTab === "templates" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="relative px-1 py-3 text-sm font-medium transition-colors duration-200 bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none text-neutral-400 hover:text-white data-[state=active]:hover:text-white rounded-none"
            >
              Collections
              {activeTab === "collections" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
              )}
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