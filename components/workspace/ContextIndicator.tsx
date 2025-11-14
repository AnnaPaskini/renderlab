// components/workspace/ContextIndicator.tsx
'use client';

import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { Clock, FileText, FolderOpen, X } from 'lucide-react';

interface ContextIndicatorProps {
  uploadedImage?: string | null;
}

export function ContextIndicator({ uploadedImage }: ContextIndicatorProps = {}) {
  const { activeItem, clear } = useWorkspace();

  // Don't show anything if nothing is loaded
  if (activeItem.type === null) {
    return null;
  }

  // Определяем иконку и цвет по типу
  const getIcon = () => {
    switch (activeItem.type) {
      case 'template':
        return <FileText size={16} />;
      case 'collection':
        return <FolderOpen size={16} />;
      case 'temporary':
        return <Clock size={16} />;
    }
  };

  const getLabel = () => {
    // Check if we have prompt but no reference (prompt-only mode)
    if (activeItem.type === 'temporary') {
      const hasPrompt = activeItem.data?.prompt;
      const hasReference = uploadedImage || activeItem.data?.reference_url;

      if (hasPrompt && !hasReference) {
        return 'Prompt active (no reference)';
      }
      return 'Loaded from History (not saved)';
    }

    // Existing cases
    switch (activeItem.type) {
      case 'template':
        return `Template: ${activeItem.data.name}`;
      case 'collection':
        return `Collection: ${activeItem.data.name} (${activeItem.data.template_count} templates)`;
    }
  };

  const getBadgeColor = () => {
    // Check if we have prompt but no reference (prompt-only mode)
    if (activeItem.type === 'temporary') {
      const hasPrompt = activeItem.data?.prompt;
      const hasReference = uploadedImage || activeItem.data?.reference_url;

      // Prompt-only mode: orange
      if (hasPrompt && !hasReference) {
        return 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20';
      }
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }

    // Existing colors
    switch (activeItem.type) {
      case 'template':
        return 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20';
      case 'collection':
        return 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getBadgeColor()}`}>
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
      <button
        onClick={clear}
        className="ml-2 hover:opacity-70 transition-opacity"
        title="Clear workspace"
      >
        <X size={16} />
      </button>
    </div>
  );
}