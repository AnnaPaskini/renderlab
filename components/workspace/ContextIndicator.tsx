// components/workspace/ContextIndicator.tsx
'use client';

import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { X, FileText, FolderOpen, Clock } from 'lucide-react';

export function ContextIndicator() {
  const { activeItem, clear } = useWorkspace();

  // Если ничего не загружено
  if (activeItem.type === null) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50">
        <Clock size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500 italic">
          No template loaded
        </span>
      </div>
    );
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
    switch (activeItem.type) {
      case 'template':
        return `Template: ${activeItem.data.name}`;
      case 'collection':
        return `Collection: ${activeItem.data.name} (${activeItem.data.template_count} templates)`;
      case 'temporary':
        return 'Temporary (not saved)';
    }
  };

  const getBadgeColor = () => {
    switch (activeItem.type) {
      case 'template':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'collection':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'temporary':
        return 'bg-amber-100 text-amber-700 border-amber-200';
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