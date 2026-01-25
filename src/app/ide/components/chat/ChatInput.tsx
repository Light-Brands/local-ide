'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Send, Loader2, Rocket, FileCode, Bot, Terminal, Sparkles, Layers } from 'lucide-react';
import { ChatAutocomplete, useAutocomplete, type AutocompleteMode } from './ChatAutocomplete';
import { useToolingOptional } from '../../contexts/ToolingContext';
import { useContextStateOptional, ContextDrawer } from '../context';
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
  const activeFilter = contextState?.activeFilter ?? null;
  const setActiveFilter = contextState?.setActiveFilter ?? (() => {});

  // Count items by category (elements are grouped with files)
  const counts = {
    file: contextItems.filter(item => item.type === 'file' || item.type === 'element').length,
    agent: contextItems.filter(item => item.type === 'agent').length,
    command: contextItems.filter(item => item.type === 'command').length,
    skill: contextItems.filter(item => item.type === 'skill').length,
    workflow: contextItems.filter(item => item.type === 'workflow').length,
  };
  const totalCount = contextItems.length;

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

  // Handle Rocket Fuel button click - opens browse panel to add context
  const handleRocketFuelClick = useCallback(() => {
    const newState = !showBrowsePanel && !isOpen;
    setShowBrowsePanel(newState);
    if (!newState) {
      setIsOpen(false);
    }
    // Close drawer when opening browse panel
    if (newState && isDrawerOpen) {
      contextState?.setDrawerOpen(false);
    }
  }, [showBrowsePanel, isOpen, setIsOpen, isDrawerOpen, contextState]);

  // Handle category button click - opens drawer filtered to that category
  const handleCategoryClick = useCallback((category: 'file' | 'agent' | 'command' | 'skill' | 'workflow' | null) => {
    // If clicking the same active filter while drawer is open, close it
    if (isDrawerOpen && activeFilter === category) {
      contextState?.setDrawerOpen(false);
      setActiveFilter(null);
    } else {
      // Open drawer with this filter
      setActiveFilter(category);
      contextState?.setDrawerOpen(true);
      setShowBrowsePanel(false);
      setIsOpen(false);
    }
  }, [isDrawerOpen, activeFilter, setActiveFilter, contextState, setIsOpen]);

  // Category button config with vibrant colors matching the selectors
  const categories = [
    { key: 'file' as const, label: 'Elements', icon: FileCode, color: 'cyan', count: counts.file },
    { key: 'agent' as const, label: 'Agents', icon: Bot, color: 'purple', count: counts.agent },
    { key: 'command' as const, label: 'Commands', icon: Terminal, color: 'slate', count: counts.command },
    { key: 'skill' as const, label: 'Skills', icon: Sparkles, color: 'amber', count: counts.skill },
    { key: 'workflow' as const, label: 'Orchestration', icon: Layers, color: 'orange', count: counts.workflow },
  ];

  const getButtonStyles = (color: string, count: number, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string; hover: string }> = {
      cyan: {
        active: 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/30',
        inactive: 'bg-neutral-800/80 text-cyan-400/70 border border-cyan-500/30',
        hover: 'hover:bg-neutral-700 hover:text-cyan-400',
      },
      purple: {
        active: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white shadow-lg shadow-violet-500/30',
        inactive: 'bg-neutral-800/80 text-violet-400/70 border border-violet-500/30',
        hover: 'hover:bg-neutral-700 hover:text-violet-400',
      },
      slate: {
        active: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/30',
        inactive: 'bg-neutral-800/80 text-slate-400/70 border border-slate-500/30',
        hover: 'hover:bg-neutral-700 hover:text-slate-300',
      },
      amber: {
        active: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/30',
        inactive: 'bg-neutral-800/80 text-amber-400/70 border border-amber-500/30',
        hover: 'hover:bg-neutral-700 hover:text-amber-400',
      },
      orange: {
        active: 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30',
        inactive: 'bg-neutral-800/80 text-orange-400/70 border border-orange-500/30',
        hover: 'hover:bg-neutral-700 hover:text-orange-400',
      },
      red: {
        active: 'bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-lg shadow-red-500/30',
        inactive: 'bg-neutral-800/80 text-red-400/70 border border-red-500/30',
        hover: 'hover:bg-neutral-700 hover:text-red-400',
      },
    };
    const c = colors[color] || colors.orange;
    if (count > 0 || isActive) return c.active;
    return `${c.inactive} ${c.hover}`;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Category bar: Elements | Agents | Commands | Skills | Orchestration | Rocket Fuel */}
      {hasTooling && (
        <div className="flex items-center justify-end gap-1.5 mb-1.5 overflow-x-auto">
          {categories.map(({ key, label, icon: Icon, color, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryClick(key)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
                getButtonStyles(color, count, isDrawerOpen && activeFilter === key)
              )}
            >
              <Icon className={cn(
                'w-3 h-3 transition-transform duration-200',
                count > 0 && 'animate-pulse'
              )} />
              <span>{label}</span>
              {count > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-white/20 text-[9px] font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-600 mx-0.5" />

          {/* Rocket Fuel button - add more context */}
          <button
            type="button"
            onClick={handleRocketFuelClick}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
              (showBrowsePanel || isOpen || totalCount > 0)
                ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-lg shadow-red-500/30'
                : 'bg-neutral-800/80 text-red-400/70 hover:bg-neutral-700 hover:text-red-400 border border-red-500/30'
            )}
          >
            <Rocket className={cn(
              'w-3 h-3 transition-transform duration-200',
              (showBrowsePanel || isOpen) && 'animate-pulse'
            )} />
            <span>Rocket Fuel</span>
            {totalCount > 0 && (
              <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-white/20 text-[9px] font-bold">
                {totalCount}
              </span>
            )}
          </button>
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
            // Don't close panel - allow multiple selections
          }}
          onCollapse={() => {
            setIsOpen(false);
            setShowBrowsePanel(false);
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
          onFocus={() => {
            setIsFocused(true);
            // Collapse browse panel when focusing input
            if (showBrowsePanel) {
              setShowBrowsePanel(false);
              setIsOpen(false);
            }
          }}
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
