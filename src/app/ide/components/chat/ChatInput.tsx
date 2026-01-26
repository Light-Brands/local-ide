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

  // Pulse animation state for send button
  const [shouldPulseSubmit, setShouldPulseSubmit] = useState(false);

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

  // Listen for chat input priming events (from component enhancement popup)
  useEffect(() => {
    const handlePrimeChatInput = (event: CustomEvent) => {
      const { message, focusInput, pulseSubmit } = event.detail;

      if (message) {
        onChange(message);
      }

      if (focusInput && inputRef.current) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }

      if (pulseSubmit) {
        setShouldPulseSubmit(true);
      }
    };

    window.addEventListener('ide:prime-chat-input', handlePrimeChatInput as EventListener);
    return () => window.removeEventListener('ide:prime-chat-input', handlePrimeChatInput as EventListener);
  }, [onChange]);

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
    // Subdued, consistent inactive state for all buttons
    const inactiveBase = 'bg-transparent text-neutral-500 border border-neutral-700 hover:border-neutral-600 hover:text-neutral-400';

    // Active/has-items state with subtle color accent
    const activeColors: Record<string, string> = {
      cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40',
      purple: 'bg-violet-500/10 text-violet-400 border border-violet-500/40',
      slate: 'bg-neutral-600/20 text-neutral-300 border border-neutral-500/40',
      amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/40',
      orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/40',
      red: 'bg-red-500/10 text-red-400 border border-red-500/40',
    };

    if (count > 0 || isActive) {
      return activeColors[color] || activeColors.orange;
    }
    return inactiveBase;
  };

  const getBadgeStyles = (color: string) => {
    const badgeColors: Record<string, string> = {
      cyan: 'bg-cyan-500/30',
      purple: 'bg-violet-500/30',
      slate: 'bg-neutral-500/30',
      amber: 'bg-amber-500/30',
      orange: 'bg-orange-500/30',
      red: 'bg-red-500/30',
    };
    return badgeColors[color] || badgeColors.orange;
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
              <Icon className="w-3 h-3" />
              <span>{label}</span>
              {count > 0 && (
                <span className={cn(
                  'flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold',
                  getBadgeStyles(color)
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-600 mx-0.5" />

          {/* Rocket Fuel button - add more context (always orange to stand out) */}
          <button
            type="button"
            onClick={handleRocketFuelClick}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
              'bg-orange-500/15 text-orange-400 border border-orange-500/50 hover:bg-orange-500/25 hover:border-orange-500/60'
            )}
          >
            <Rocket className={cn(
              'w-3 h-3 transition-transform duration-200',
              (showBrowsePanel || isOpen) && 'animate-pulse'
            )} />
            <span>Rocket Fuel</span>
            {totalCount > 0 && (
              <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500/30 text-[9px] font-bold">
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
      {(() => {
        // Calculate word count for pulse activation
        const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
        const showPulse = shouldPulseSubmit && wordCount >= 5 && !isLoading;

        // Handle submit with pulse reset
        const handleSubmitWithReset = () => {
          setShouldPulseSubmit(false);
          onSubmit();
        };

        return (
          <>
            {/* Ready to go hint */}
            {showPulse && (
              <div className="flex items-center justify-end mb-1.5">
                <span className="text-xs text-emerald-400 animate-pulse font-medium">
                  Ready to go! Hit send to run the update.
                </span>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Textarea */}
              <textarea
                ref={inputRef}
                data-chat-input
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Submit on Enter (without Shift) - with pulse reset
                  if (e.key === 'Enter' && !e.shiftKey && !isOpen) {
                    e.preventDefault();
                    if (!disabled && !isLoading && value.trim()) {
                      handleSubmitWithReset();
                    }
                    return;
                  }
                  handleKeyDown(e);
                }}
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
                onClick={handleSubmitWithReset}
                disabled={disabled || isLoading || !value.trim()}
                className={cn(
                  'flex-shrink-0 p-2 text-white rounded-lg transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  showPulse
                    ? 'bg-emerald-500 hover:bg-emerald-400 ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-900 animate-pulse'
                    : 'bg-primary-500 hover:bg-primary-600'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
