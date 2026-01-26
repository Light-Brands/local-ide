'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentData } from '@/lib/ide/componentSelector/types';

interface ComponentEnhancementPopupProps {
  isOpen: boolean;
  componentData: ComponentData | null;
  formattedContext: string;
  onSubmit: (enhancementRequest: string) => void;
  onCancel: () => void;
}

const MIN_WORDS = 5;

export function ComponentEnhancementPopup({
  isOpen,
  componentData,
  formattedContext,
  onSubmit,
  onCancel,
}: ComponentEnhancementPopupProps) {
  const [enhancementText, setEnhancementText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevComponentRef = useRef<string | null>(null);

  // Count words in the enhancement text
  const wordCount = enhancementText.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= MIN_WORDS;

  // Get component display info
  const componentName = componentData?.componentName || componentData?.elementTag || 'element';
  const componentPath = componentData?.uniqueSelector || '';

  // Reset text when component changes (new selection replaces pending)
  useEffect(() => {
    if (componentData) {
      const newSelector = componentData.uniqueSelector;
      if (prevComponentRef.current !== newSelector) {
        setEnhancementText('');
        prevComponentRef.current = newSelector;
      }
    }
  }, [componentData]);

  // Focus textarea when popup opens or component changes
  useEffect(() => {
    if (isOpen && componentData && textareaRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, componentData]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isValid) {
        onSubmit(enhancementText);
        setEnhancementText('');
      }
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [isValid, enhancementText, onSubmit, onCancel]);

  // Handle submit button click
  const handleSubmit = () => {
    if (isValid) {
      onSubmit(enhancementText);
      setEnhancementText('');
    }
  };

  if (!isOpen) return null;

  // Show waiting state when popup is open but no component selected yet
  if (!componentData) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-800/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-neutral-200">Enhance Component</span>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 text-center">
            <p className="text-neutral-400">Click on a component to enhance it...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-neutral-200">Enhance Component</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Component Info */}
        <div className="px-4 pt-4 pb-2">
          <div className="text-sm">
            <span className="text-neutral-400">Component: </span>
            <span className="text-emerald-400 font-medium">{componentName}</span>
          </div>
          {componentPath && (
            <div className="text-xs text-neutral-500 mt-1 truncate" title={componentPath}>
              Path: {componentPath}
            </div>
          )}
        </div>

        {/* Enhancement Input */}
        <div className="px-4 pb-2">
          <textarea
            ref={textareaRef}
            value={enhancementText}
            onChange={(e) => setEnhancementText(e.target.value)}
            placeholder="What would you like to change about this component?"
            className={cn(
              'w-full h-28 p-3 mt-2',
              'bg-neutral-800 border border-neutral-600 rounded-lg',
              'text-sm text-neutral-200 placeholder:text-neutral-500',
              'resize-none outline-none',
              'focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30',
              'transition-colors'
            )}
          />

          {/* Validation message */}
          <div className={cn(
            'text-xs mt-2 transition-colors',
            isValid ? 'text-emerald-400' : 'text-neutral-500'
          )}>
            {isValid
              ? `${wordCount} words - ready to submit`
              : `Please provide at least ${MIN_WORDS} words describing your change (${wordCount}/${MIN_WORDS})`
            }
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-700 bg-neutral-800/30">
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'text-neutral-400 hover:text-neutral-200',
              'hover:bg-neutral-700 transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'transition-all duration-200',
              isValid
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            )}
          >
            Submit
            <span className="ml-1 text-xs opacity-70">({navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+↵)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
