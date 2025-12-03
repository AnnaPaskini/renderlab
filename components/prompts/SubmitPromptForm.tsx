'use client';

import type { PromptCategory } from '@/lib/types/prompts';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';

interface SubmitPromptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialImage?: string;
  initialPrompt?: string;
}

export function SubmitPromptForm({ onSuccess, onCancel, initialImage, initialPrompt }: SubmitPromptFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    prompt: initialPrompt || '',
    image_url: initialImage || '',
    category: '' as PromptCategory | '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    title: '',
    prompt: '',
    category: '',
    image_url: '',
  });

  const validateForm = () => {
    const newErrors = {
      title: '',
      prompt: '',
      category: '',
      image_url: '',
    };

    if (!formData.image_url) {
      newErrors.image_url = 'Please upload an image';
    }

    if (!formData.title) {
      newErrors.title = 'Please fill out this field';
    } else if (formData.title.length < 10) {
      newErrors.title = `Please lengthen this text to 10 characters or more (you are currently using ${formData.title.length} characters)`;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.prompt) {
      newErrors.prompt = 'Please fill out this field';
    } else if (formData.prompt.length < 50) {
      newErrors.prompt = `Please lengthen this text to 50 characters or more (you are currently using ${formData.prompt.length} characters)`;
    } else if (formData.prompt.length > 2000) {
      newErrors.prompt = 'Prompt must be 2000 characters or less';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Reference Image *
        </label>
        <ImageUpload
          onUploadComplete={(url) => {
            setFormData(prev => ({ ...prev, image_url: url }));
            setErrors(prev => ({ ...prev, image_url: '' }));
          }}
          currentImage={formData.image_url}
        />
        {errors.image_url && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-400">{errors.image_url}</p>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Title * <span className="text-xs text-gray-400">(10-100 characters)</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            setErrors(prev => ({ ...prev, title: '' }));
          }}
          placeholder="Modern exterior with glass facade"
          className={`w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none placeholder:text-gray-500 transition-all ${errors.title
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10'
            }`}
        />
        {errors.title ? (
          <div className="mt-2 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-400">{errors.title}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {formData.title.length}/100 characters
          </p>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Prompt * <span className="text-xs text-gray-400">(50-2000 characters)</span>
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, prompt: e.target.value }));
            setErrors(prev => ({ ...prev, prompt: '' }));
          }}
          placeholder="Transform the building facade into a modern glass structure with reflective panels. Add warm evening lighting and contemporary landscaping..."
          rows={6}
          className={`w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none resize-none placeholder:text-gray-500 transition-all ${errors.prompt
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10'
            }`}
        />
        {errors.prompt ? (
          <div className="mt-2 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-400">{errors.prompt}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {formData.prompt.length}/2000 characters
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, category: e.target.value as PromptCategory }));
            setErrors(prev => ({ ...prev, category: '' }));
          }}
          className={`w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none transition-colors ${errors.category
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10'
            }`}
        >
          <option value="" className="bg-[#1a1a1a]">Select category</option>
          <option value="exterior" className="bg-[#1a1a1a]">Exterior</option>
          <option value="interior" className="bg-[#1a1a1a]">Interior</option>
          <option value="lighting" className="bg-[#1a1a1a]">Lighting</option>
          <option value="materials" className="bg-[#1a1a1a]">Materials</option>
          <option value="atmosphere" className="bg-[#1a1a1a]">Atmosphere</option>
        </select>
        {errors.category && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-400">{errors.category}</p>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tags <span className="text-xs text-gray-400">(optional, comma-separated, max 10)</span>
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="modern, glass, evening, landscape"
          className="w-full bg-black/30 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder:text-gray-500"
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
          className={`premium-generate-button flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed ${submitting ? 'opacity-70' : ''}`}
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl border border-white/8 hover:bg-[#202020] hover:border-white/12 disabled:opacity-50 transition-all duration-200"
        >
          Cancel
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-400 text-center">
        Your prompt will be reviewed by our team before being published.
        Maximum 5 pending prompts at a time.
      </p>
    </form>
  );
}
