'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTooling } from '../../contexts/ToolingContext';
import type { AutocompleteItem, Pillar } from '@/lib/ide/tooling';
import {
  commandDictionary,
  filterDictionary,
  filterByType,
  groupByPillar,
  type DictionaryItem,
  AGENT_HEX_COLORS,
  PILLAR_COLORS,
} from '@/lib/ide/tooling';
import {
  Terminal,
  Bot,
  Sparkles,
  User,
  FileText,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';

export type AutocompleteMode = 'none' | 'command' | 'mention' | 'browse';
export type AutocompleteTab = 'agent' | 'command' | 'skill';

interface ChatAutocompleteProps {
  input: string;
  cursorPosition: number;
  onSelect: (item: AutocompleteItem, mode: AutocompleteMode, startIndex: number) => void;
  onClose: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isFocused?: boolean;
}

// Parse the current autocomplete context from input
function parseAutocompleteContext(input: string, cursorPosition: number): {
  mode: AutocompleteMode;
  query: string;
  startIndex: number;
} {
  // Look for the trigger character before cursor
  const beforeCursor = input.slice(0, cursorPosition);

  // Check for `/` command at the start of input or after newline/space
  const commandMatch = beforeCursor.match(/(?:^|[\s\n])\/([a-z0-9-]*)$/i);
  if (commandMatch) {
    return {
      mode: 'command',
      query: commandMatch[1],
      startIndex: cursorPosition - commandMatch[1].length - 1,
    };
  }

  // Check for `@` mention anywhere
  const mentionMatch = beforeCursor.match(/@([a-z0-9-]*)$/i);
  if (mentionMatch) {
    return {
      mode: 'mention',
      query: mentionMatch[1],
      startIndex: cursorPosition - mentionMatch[1].length - 1,
    };
  }

  return { mode: 'none', query: '', startIndex: -1 };
}

// Icon component based on type
function ItemIcon({ type, className }: { type: AutocompleteItem['type']; className?: string }) {
  switch (type) {
    case 'command':
      return <Terminal className={className} />;
    case 'agent':
      return <Bot className={className} />;
    case 'skill':
      return <Sparkles className={className} />;
    case 'personality':
      return <User className={className} />;
    case 'rule':
      return <FileText className={className} />;
    default:
      return <Terminal className={className} />;
  }
}

// Type label
function TypeLabel({ type }: { type: AutocompleteItem['type'] }) {
  const labels: Record<string, string> = {
    command: 'Command',
    agent: 'Agent',
    skill: 'Skill',
    personality: 'Personality',
    rule: 'Rule',
  };

  const colors: Record<string, string> = {
    command: 'text-blue-400 bg-blue-500/10',
    agent: 'text-purple-400 bg-purple-500/10',
    skill: 'text-amber-400 bg-amber-500/10',
    personality: 'text-pink-400 bg-pink-500/10',
    rule: 'text-green-400 bg-green-500/10',
  };

  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase', colors[type])}>
      {labels[type]}
    </span>
  );
}

// Pillar section header
function PillarHeader({ pillar }: { pillar: Pillar }) {
  const config = PILLAR_COLORS[pillar];
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-l-2',
        pillar === 'planning'
          ? 'text-violet-400 bg-violet-500/5 border-violet-500'
          : 'text-green-400 bg-green-500/5 border-green-500'
      )}
    >
      {pillar}
    </div>
  );
}

// Planning agent avatar with initial
function PlanningAgentAvatar({
  displayName,
  color,
}: {
  displayName?: string;
  color?: string;
}) {
  const initial = displayName?.[0] ?? '?';
  const hexColor = color ? AGENT_HEX_COLORS[color] ?? AGENT_HEX_COLORS.violet : AGENT_HEX_COLORS.violet;

  return (
    <div
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
      style={{
        background: `linear-gradient(135deg, ${hexColor}, ${hexColor}dd)`,
      }}
    >
      {initial}
    </div>
  );
}

// Convert DictionaryItem to AutocompleteItem
function toAutocompleteItem(item: DictionaryItem): AutocompleteItem {
  return {
    type: item.type,
    id: item.id,
    name: item.name,
    displayName: item.displayName,
    description: item.description,
    pillar: item.pillar,
    category: item.category,
    color: item.color,
  };
}

export function ChatAutocomplete({
  input,
  cursorPosition,
  onSelect,
  onClose,
  isOpen,
  setIsOpen,
  anchorRef,
  isFocused = false,
}: ChatAutocompleteProps) {
  const { config } = useTooling();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<AutocompleteTab>('agent');
  const listRef = useRef<HTMLDivElement>(null);

  // Parse autocomplete context
  const { mode, query, startIndex } = useMemo(
    () => parseAutocompleteContext(input, cursorPosition),
    [input, cursorPosition]
  );

  // Determine effective mode
  // Only show browse mode when input is empty/whitespace only
  // Close immediately when user starts typing regular text
  const effectiveMode = useMemo(() => {
    if (mode !== 'none') return mode;
    // Only show browse panel if focused AND input is empty or whitespace
    if (isFocused && input.trim() === '') return 'browse';
    return 'none';
  }, [mode, isFocused, input]);

  // Auto-switch tab based on trigger
  useEffect(() => {
    if (mode === 'command') {
      setActiveTab('command');
    } else if (mode === 'mention') {
      setActiveTab('agent');
    }
  }, [mode]);

  // Get filtered items based on active tab, grouped by pillar
  const { items, planningItems, developmentItems } = useMemo(() => {
    // Filter by active tab type
    const byType = commandDictionary.filter((item) => item.type === activeTab);

    // Apply search query if present
    const filtered = query ? filterDictionary(byType, query) : byType;

    // Group by pillar
    const grouped = groupByPillar(filtered);

    // Get items for each pillar
    const planningItems = grouped.planning;
    const developmentItems = grouped.development;

    // Flatten for keyboard navigation
    const allItems = [...planningItems, ...developmentItems];

    return {
      items: allItems,
      planningItems,
      developmentItems,
    };
  }, [activeTab, query]);

  // Update open state based on mode and focus
  useEffect(() => {
    if (effectiveMode !== 'none' && items.length > 0) {
      setIsOpen(true);
    } else if (effectiveMode === 'none') {
      setIsOpen(false);
    }
  }, [effectiveMode, items.length, setIsOpen]);

  // Reset selection when items or tab change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, mode, query, activeTab]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  // Find the flat index for a pillar item
  const getFlatIndex = (pillar: Pillar, index: number) => {
    if (pillar === 'planning') {
      return index;
    }
    return planningItems.length + index;
  };

  // Get prefix for item type
  const getPrefix = (type: DictionaryItem['type']) => {
    switch (type) {
      case 'command': return '/';
      case 'agent': return '@';
      case 'skill': return '*';
      default: return '';
    }
  };

  // Get mode for item type
  const getModeForType = (type: DictionaryItem['type']): AutocompleteMode => {
    switch (type) {
      case 'command': return 'command';
      case 'agent': return 'mention';
      case 'skill': return 'command'; // Skills use / prefix
      default: return 'browse';
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveTab((t) => t === 'agent' ? 'skill' : t === 'command' ? 'agent' : 'command');
          setSelectedIndex(0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveTab((t) => t === 'agent' ? 'command' : t === 'command' ? 'skill' : 'agent');
          setSelectedIndex(0);
          break;
        case 'Tab':
        case 'Enter':
          if (items[selectedIndex]) {
            e.preventDefault();
            const item = items[selectedIndex];
            const itemMode = getModeForType(item.type);
            const insertIndex = mode !== 'none' ? startIndex : cursorPosition;
            onSelect(toAutocompleteItem(item), itemMode, insertIndex);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, items, selectedIndex, mode, startIndex, cursorPosition, onSelect, onClose, setIsOpen]
  );

  // Attach keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, handleKeyDown]);

  // Render a single item
  const renderItem = (item: DictionaryItem, flatIndex: number) => {
    const isSelected = flatIndex === selectedIndex;
    const isPlanningAgent = item.pillar === 'planning' && item.type === 'agent';
    const hexColor = item.color ? AGENT_HEX_COLORS[item.color] : undefined;
    const prefix = getPrefix(item.type);

    return (
      <button
        key={item.id}
        data-selected={isSelected}
        onClick={() => {
          const itemMode = getModeForType(item.type);
          const insertIndex = mode !== 'none' ? startIndex : cursorPosition;
          onSelect(toAutocompleteItem(item), itemMode, insertIndex);
          setIsOpen(false);
        }}
        onMouseEnter={() => setSelectedIndex(flatIndex)}
        className={cn(
          'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
          isSelected ? 'bg-primary-500/20' : 'hover:bg-neutral-800'
        )}
      >
        {/* Icon/Avatar */}
        {isPlanningAgent ? (
          <PlanningAgentAvatar displayName={item.displayName} color={item.color} />
        ) : (
          <div
            className={cn(
              'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
              item.type === 'command' && 'bg-blue-500/20 text-blue-400',
              item.type === 'agent' && 'bg-purple-500/20 text-purple-400',
              item.type === 'skill' && 'bg-amber-500/20 text-amber-400'
            )}
            style={
              item.type === 'agent' && hexColor
                ? { backgroundColor: `${hexColor}20`, color: hexColor }
                : undefined
            }
          >
            <ItemIcon type={item.type} className="w-4 h-4" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white font-mono">
              {prefix}{item.name}
            </span>
            {isPlanningAgent && item.displayName && (
              <span className="text-xs text-neutral-400">({item.displayName})</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{item.description}</p>
        </div>

        {/* Category badge */}
        {item.category && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide flex-shrink-0"
            style={
              hexColor
                ? { backgroundColor: `${hexColor}15`, color: hexColor }
                : item.type === 'command'
                  ? { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }
                  : item.type === 'skill'
                    ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }
                    : { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }
            }
          >
            {item.category}
          </span>
        )}
      </button>
    );
  };

  if (!isOpen) return null;

  const tabs: { id: AutocompleteTab; label: string; icon: React.ReactNode; prefix: string }[] = [
    { id: 'agent', label: 'Agents', icon: <Bot className="w-3.5 h-3.5" />, prefix: '@' },
    { id: 'command', label: 'Commands', icon: <Terminal className="w-3.5 h-3.5" />, prefix: '/' },
    { id: 'skill', label: 'Skills', icon: <Sparkles className="w-3.5 h-3.5" />, prefix: '*' },
  ];

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50"
      style={{ maxHeight: '400px' }}
    >
      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? tab.id === 'agent'
                  ? 'text-purple-400 bg-purple-500/10 border-b-2 border-purple-500'
                  : tab.id === 'command'
                    ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500'
                    : 'text-amber-400 bg-amber-500/10 border-b-2 border-amber-500'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
            )}
          >
            <span className="font-mono font-bold">{tab.prefix}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Navigation hints */}
      <div className="px-3 py-1.5 border-b border-neutral-800/50 flex items-center justify-end gap-3 text-[10px] text-neutral-500 bg-neutral-900/50">
        <span className="flex items-center gap-0.5">
          <ArrowUp className="w-3 h-3" />
          <ArrowDown className="w-3 h-3" />
          navigate
        </span>
        <span className="flex items-center gap-0.5">
          <CornerDownLeft className="w-3 h-3" />
          select
        </span>
      </div>

      {/* Item list with pillar grouping */}
      <div ref={listRef} className="overflow-y-auto max-h-[280px]">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-500 text-sm">
            No {activeTab}s found
          </div>
        ) : (
          <>
            {/* Planning section */}
            {planningItems.length > 0 && (
              <>
                <PillarHeader pillar="planning" />
                {planningItems.map((item, index) => renderItem(item, getFlatIndex('planning', index)))}
              </>
            )}

            {/* Development section */}
            {developmentItems.length > 0 && (
              <>
                <PillarHeader pillar="development" />
                {developmentItems.map((item, index) =>
                  renderItem(item, getFlatIndex('development', index))
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Type to filter</span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono text-[9px]">
            Cmd+/
          </kbd>{' '}
          open dictionary
        </span>
      </div>
    </div>
  );
}

// Hook for managing autocomplete state
export function useAutocomplete() {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSelect = useCallback(
    (
      input: string,
      setInput: (value: string) => void,
      item: AutocompleteItem,
      mode: AutocompleteMode,
      startIndex: number
    ) => {
      // Determine the correct prefix based on item type
      const prefix = item.type === 'agent' ? '@' : item.type === 'skill' ? '*' : '/';
      const replacement = `${prefix}${item.name} `;

      // If browse mode (clicking on input), insert at cursor
      // If trigger mode (/ or @), replace the trigger + query
      const isBrowseMode = startIndex === cursorPosition;

      let newInput: string;
      let newCursorPos: number;

      if (isBrowseMode) {
        // Insert at cursor position
        const before = input.slice(0, cursorPosition);
        const after = input.slice(cursorPosition);
        newInput = before + replacement + after;
        newCursorPos = cursorPosition + replacement.length;
      } else {
        // Replace trigger + query
        const before = input.slice(0, startIndex);
        const after = input.slice(cursorPosition);
        newInput = before + replacement + after;
        newCursorPos = before.length + replacement.length;
      }

      setInput(newInput);

      // Return new cursor position after the inserted text
      return newCursorPos;
    },
    [cursorPosition]
  );

  return {
    isOpen,
    setIsOpen,
    cursorPosition,
    setCursorPosition,
    handleSelect,
  };
}
