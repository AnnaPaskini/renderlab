'use client';

import { useState } from 'react';
import type { PromptCategory, PromptBadge } from '@/lib/types/prompts';

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
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
        <h3 className="text-sm font-medium text-gray-700 mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleCategoryChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Collections</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleBadgeChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeBadge === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
