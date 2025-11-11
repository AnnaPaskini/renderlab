'use client';

import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';
import type { PromptCategory } from '@/lib/types/prompts';

interface SubmitPromptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubmitPromptForm({ onSuccess, onCancel }: SubmitPromptFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    image_url: '',
    category: '' as PromptCategory | '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      toast.error('Please upload an image');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setSubmitting(true);

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/prompts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          prompt: formData.prompt,
          image_url: formData.image_url,
          category: formData.category,
          tags,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(result.message || 'Prompt submitted successfully!');
      onSuccess();

    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit prompt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Reference Image *
        </label>
        <ImageUpload
          onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
          currentImage={formData.image_url}
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Title * <span className="text-xs text-gray-400">(10-100 characters)</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Modern exterior with glass facade"
          minLength={10}
          maxLength={100}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Prompt * <span className="text-xs text-gray-400">(50-2000 characters)</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Transform the building facade into a modern glass structure with reflective panels. Add warm evening lighting and contemporary landscaping..."
          minLength={50}
          maxLength={2000}
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.prompt.length}/2000 characters
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as PromptCategory }))}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select category</option>
          <option value="exterior">Exterior</option>
          <option value="interior">Interior</option>
          <option value="lighting">Lighting</option>
          <option value="materials">Materials</option>
          <option value="atmosphere">Atmosphere</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tags <span className="text-xs text-gray-400">(optional, comma-separated, max 10)</span>
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="modern, glass, evening, landscape"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Separate tags with commas. Only lowercase letters, numbers, and hyphens allowed.
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !formData.image_url}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Your prompt will be reviewed by our team before being published.
        Maximum 5 pending prompts at a time.
      </p>
    </form>
  );
}
