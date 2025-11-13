'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionsPanel } from '@/components/workspace/CollectionPanel';
import { PromptTemplates } from '@/components/workspace/PromptTemplates';
import { useState } from 'react';

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="min-h-screen bg-[var(--rl-bg)]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Custom Assets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your templates and collections
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10">
            <TabsTrigger
              value="templates"
              className="px-6 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white transition-colors"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="px-6 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white transition-colors"
            >
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-0">
            <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-lg border border-white/40 dark:border-white/10 p-6 shadow-lg">
              <PromptTemplates />
            </div>
          </TabsContent>

          <TabsContent value="collections" className="mt-0">
            <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-lg border border-white/40 dark:border-white/10 p-6 shadow-lg">
              <CollectionsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}