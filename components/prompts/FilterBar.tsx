'use client';

import type { PromptBadge, PromptCategory } from '@/lib/types/prompts';
import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: {
    category?: PromptCategory;
    badge?: PromptBadge;
    search?: string;
  }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'all'>('all');
  const [activeBadge, setActiveBadge] = useState<PromptBadge | 'all'>('all');
  const [search, setSearch] = useState('');

  const categories: Array<{ value: PromptCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'exterior', label: 'Exterior' },
    { value: 'interior', label: 'Interior' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'materials', label: 'Materials' },
    { value: 'atmosphere', label: 'Atmosphere' },
  ];

  const badges: Array<{ value: PromptBadge | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'editors_choice', label: "Editor's Choice" },
    { value: 'featured', label: 'Featured' },
    { value: 'trending', label: 'Trending' },
  ];

  const handleCategoryChange = (category: PromptCategory | 'all') => {
    setActiveCategory(category);
    onFilterChange({
      category: category === 'all' ? undefined : category,
      badge: activeBadge === 'all' ? undefined : activeBadge,
      search: search || undefined,
    });
  };

  const handleBadgeChange = (badge: PromptBadge | 'all') => {
    setActiveBadge(badge);
    onFilterChange({
      category: activeCategory === 'all' ? undefined : activeCategory,
      badge: badge === 'all' ? undefined : badge,
      search: search || undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      category: activeCategory === 'all' ? undefined : activeCategory,
      badge: activeBadge === 'all' ? undefined : activeBadge,
      search: value || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search prompts by title, text, or tags..."
          className="w-full px-4 py-3 pl-12 bg-[#1a1a1a] border border-white/8 text-white rounded-lg focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-200 placeholder:text-gray-500"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleCategoryChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === value
                  ? 'bg-[#ff6b35] text-white shadow-md shadow-orange-500/25'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-white/8 hover:border-white/12'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Collections</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleBadgeChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeBadge === value
                  ? 'bg-[#ff6b35] text-white shadow-md shadow-orange-500/25'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-white/8 hover:border-white/12'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
