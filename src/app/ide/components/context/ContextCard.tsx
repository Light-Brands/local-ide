'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  X,
  Bot,
  Terminal,
  Sparkles,
  FileCode,
  Rocket,
  Zap,
  Layers,
  Database,
  Shield,
  Lightbulb,
  Package,
  Building,
  RotateCcw,
  Pencil,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContextItem } from './ContextProvider';

// Complexity colors from tooling system
const COMPLEXITY_COLORS: Record<string, string> = {
  quick: '#10b981',
  sprint: '#0ea5e9',
  project: '#8b5cf6',
  platform: '#f97316',
};

// Icon mapping for workflows
const WORKFLOW_ICONS: Record<string, React.ElementType> = {
  Zap,
  Rocket,
  Layers,
  Database,
  Shield,
  Lightbulb,
  Package,
  Building,
};

interface ContextCardProps {
  item: ContextItem;
  onRemove: (id: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onResetContent: (id: string) => void;
}

export const ContextCard = memo(function ContextCard({
  item,
  onRemove,
  onUpdateContent,
  onResetContent,
}: ContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    if (isEditing) {
      setIsEditing(false);
      setEditContent(item.content);
    }
  }, [isEditing, item.content]);

  const handleStartEdit = useCallback(() => {
    setEditContent(item.content);
    setIsEditing(true);
  }, [item.content]);

  const handleSaveEdit = useCallback(() => {
    onUpdateContent(item.id, editContent);
    setIsEditing(false);
  }, [item.id, editContent, onUpdateContent]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(item.content);
    setIsEditing(false);
  }, [item.content]);

  const handleReset = useCallback(() => {
    onResetContent(item.id);
    setEditContent(item.originalContent);
    setIsEditing(false);
  }, [item.id, item.originalContent, onResetContent]);

  const getTypeIcon = () => {
    switch (item.type) {
      case 'workflow':
        const IconComponent = item.icon ? WORKFLOW_ICONS[item.icon] || Rocket : Rocket;
        return <IconComponent className="w-4 h-4 text-white" />;
      case 'agent':
        return <Bot className="w-4 h-4 text-purple-400" />;
      case 'command':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'skill':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'file':
        return <FileCode className="w-4 h-4 text-green-400" />;
      default:
        return <FileCode className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getTypeColor = () => {
    if (item.type === 'workflow' && item.metadata?.complexity) {
      return COMPLEXITY_COLORS[item.metadata.complexity as string] || '#f97316';
    }
    switch (item.type) {
      case 'workflow':
        return item.color || '#f97316';
      case 'agent':
        return item.color || '#a855f7';
      case 'command':
        return '#3b82f6';
      case 'skill':
        return '#f59e0b';
      case 'file':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getTypeBadge = (): string => {
    switch (item.type) {
      case 'workflow':
        return String(item.metadata?.estimatedTime || 'Workflow');
      case 'agent':
        return String(item.metadata?.category || 'Agent');
      case 'command':
        return 'Command';
      case 'skill':
        return 'Skill';
      case 'file':
        return `${item.metadata?.lineCount || '?'} lines`;
      default:
        return item.type;
    }
  };

  const typeColor = getTypeColor();

  return (
    <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-700/30 transition-colors"
        onClick={handleToggleExpand}
      >
        {/* Expand/collapse chevron */}
        <button
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-neutral-500"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Type icon with gradient background for workflows */}
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
            item.type !== 'workflow' && 'bg-opacity-20'
          )}
          style={{
            background:
              item.type === 'workflow'
                ? `linear-gradient(135deg, ${typeColor}, ${typeColor}cc)`
                : `${typeColor}20`,
          }}
        >
          {getTypeIcon()}
        </div>

        {/* Name and description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {item.displayName || item.name}
            </span>
            {item.isEdited && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                Edited
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 truncate mt-0.5">
            {item.description.slice(0, 60)}
            {item.description.length > 60 ? '...' : ''}
          </p>
        </div>

        {/* Type badge */}
        <span
          className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium"
          style={{
            backgroundColor: `${typeColor}20`,
            color: typeColor,
          }}
        >
          {getTypeBadge()}
        </span>

        {/* Remove button */}
        <button
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-600 text-neutral-500 hover:text-neutral-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-neutral-700/50">
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[300px] max-h-[500px] p-3 text-xs font-mono bg-neutral-900 text-neutral-300 rounded-lg border border-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 focus:outline-none resize-y"
                placeholder="Edit context content..."
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500">
                  {editContent.length} characters
                </span>
                <div className="flex items-center gap-2">
                  {item.isEdited && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <div className="max-h-32 overflow-y-auto">
                <pre className="text-[10px] text-neutral-400 font-mono whitespace-pre-wrap break-words">
                  {item.content.slice(0, 500)}
                  {item.content.length > 500 ? '...' : ''}
                </pre>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                {item.isEdited && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
