'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Send, Loader2, Rocket } from 'lucide-react';
import { ChatAutocomplete, useAutocomplete, type AutocompleteMode } from './ChatAutocomplete';
import { useToolingOptional } from '../../contexts/ToolingContext';
import { useContextStateOptional } from '../context';
import { ContextBadge, ContextDrawer } from '../context';
import type { AutocompleteItem } from '@/lib/ide/tooling';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  disabled = false,
  isLoading = false,
  className,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooling = useToolingOptional();
  const contextState = useContextStateOptional();
  const hasTooling = !!tooling;
  const [isFocused, setIsFocused] = useState(false);
  const [showBrowsePanel, setShowBrowsePanel] = useState(false);

  const { isOpen, setIsOpen, cursorPosition, setCursorPosition, handleSelect } = useAutocomplete();

  // Context drawer state
  const hasContext = contextState?.hasContext ?? false;
  const contextItems = contextState?.items ?? [];
  const isDrawerOpen = contextState?.isDrawerOpen ?? false;
  const toggleDrawer = contextState?.toggleDrawer ?? (() => {});

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Listen for external trigger to update cursor position (from CMDs/AGNTs buttons)
  useEffect(() => {
    const handleTriggerAutocomplete = () => {
      if (inputRef.current) {
        const pos = inputRef.current.selectionStart || inputRef.current.value.length;
        setCursorPosition(pos);
      }
    };

    window.addEventListener('chat:trigger-autocomplete', handleTriggerAutocomplete);
    return () => window.removeEventListener('chat:trigger-autocomplete', handleTriggerAutocomplete);
  }, [setCursorPosition]);

  // Update cursor position on selection change
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  }, [setCursorPosition]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback(
    (item: AutocompleteItem, mode: AutocompleteMode, startIndex: number) => {
      if (!inputRef.current) return;

      const newCursorPos = handleSelect(value, onChange, item, mode, startIndex);

      // Focus input and set cursor position after React updates
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }
      });
    },
    [value, onChange, handleSelect, setCursorPosition]
  );

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Let autocomplete handle events when open
    if (isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Tab', 'Escape'].includes(e.key)) {
        return; // Autocomplete will handle these
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        return; // Autocomplete will handle selection
      }
    }

    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Rocket Fuel row: button (pump) + badge (tank preview) */}
      {hasTooling && (
        <div className="flex items-center justify-between mb-1.5">
          {/* Left: Rocket Fuel button to add context */}
          <button
            type="button"
            onClick={() => {
              const newState = !showBrowsePanel && !isOpen;
              setShowBrowsePanel(newState);
              if (!newState) {
                setIsOpen(false);
              }
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              (showBrowsePanel || isOpen)
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
            )}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Rocket Fuel</span>
          </button>

          {/* Right: Context badge showing what's loaded */}
          {hasContext && contextState && (
            <ContextBadge
              items={contextItems}
              isOpen={isDrawerOpen}
              onClick={toggleDrawer}
            />
          )}
        </div>
      )}

      {/* Context drawer (the "tank" - shows all loaded context) */}
      {contextState && isDrawerOpen && (
        <div className="mb-2">
          <ContextDrawer />
        </div>
      )}

      {/* Autocomplete popup */}
      {hasTooling && (
        <ChatAutocomplete
          input={value}
          cursorPosition={cursorPosition}
          onSelect={(item, mode, startIndex) => {
            handleAutocompleteSelect(item, mode, startIndex);
            setShowBrowsePanel(false); // Close panel after selection
          }}
          onClose={() => {
            setIsOpen(false);
            setIsFocused(false);
            setShowBrowsePanel(false);
          }}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          anchorRef={containerRef}
          isFocused={isFocused}
          showBrowsePanel={showBrowsePanel}
        />
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <textarea
          ref={inputRef}
          data-chat-input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            // Delay blur to allow clicking on autocomplete items
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setIsFocused(false);
              }
            }, 150);
          }}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'flex-1 max-h-[150px] p-2 bg-neutral-800 text-neutral-200 rounded-lg',
            'text-sm resize-none outline-none',
            'focus:ring-1 focus:ring-primary-500',
            'placeholder:text-neutral-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          rows={1}
        />

        {/* Submit button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim()}
          className={cn(
            'flex-shrink-0 p-2 bg-primary-500 text-white rounded-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-primary-600 transition-colors'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
