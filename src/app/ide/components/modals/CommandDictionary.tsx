'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  commandDictionary,
  filterDictionary,
  filterByPillar,
  groupByType,
  groupByCategory,
  getTypeIcon,
  type DictionaryItem,
  AGENT_HEX_COLORS,
  PILLAR_COLORS,
  PLANNING_CATEGORIES,
  DEVELOPMENT_CATEGORIES,
} from '@/lib/ide/tooling';
import type { Pillar } from '@/lib/ide/tooling';
import {
  X,
  Search,
  ChevronDown,
  Terminal,
  Bot,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface CommandDictionaryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: DictionaryItem) => void;
  initialPillar?: Pillar;
}

// Section component for collapsible groups
function DictionarySection({
  title,
  icon: Icon,
  items,
  categoryOrder,
  expandedItem,
  onItemClick,
  onInsert,
  typeColor,
}: {
  title: string;
  icon: React.ElementType;
  items: DictionaryItem[];
  categoryOrder: string[];
  expandedItem: string | null;
  onItemClick: (id: string) => void;
  onInsert?: (item: DictionaryItem) => void;
  typeColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const grouped = groupByCategory(items);

  // Sort categories by order
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: typeColor }}>
          <Icon className="w-4 h-4" />
          {title}
          <span className="text-xs text-neutral-500 font-normal">({items.length})</span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-500 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 pl-2">
          {sortedCategories.map((category) => (
            <div key={category} className="mb-3">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {category}
              </div>
              <div className="space-y-1">
                {grouped[category].map((item) => (
                  <DictionaryItemCard
                    key={item.id}
                    item={item}
                    isExpanded={expandedItem === item.id}
                    onClick={() => onItemClick(item.id)}
                    onInsert={onInsert}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Individual item card
function DictionaryItemCard({
  item,
  isExpanded,
  onClick,
  onInsert,
}: {
  item: DictionaryItem;
  isExpanded: boolean;
  onClick: () => void;
  onInsert?: (item: DictionaryItem) => void;
}) {
  const hexColor = item.color ? AGENT_HEX_COLORS[item.color] : undefined;
  const isPlanningAgent = item.pillar === 'planning' && item.type === 'agent';

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInsert?.(item);
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col gap-1 px-3 py-2 rounded-lg text-left transition-all cursor-pointer',
        'border border-transparent',
        isExpanded
          ? 'bg-neutral-800 border-neutral-700'
          : 'hover:bg-neutral-800/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Icon/Avatar - clickable to insert */}
        <button
          onClick={handleInsert}
          className="flex-shrink-0 hover:scale-110 transition-transform"
          title={`Insert ${getTypeIcon(item.type)}${item.name}`}
        >
          {isPlanningAgent && item.displayName ? (
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]"
              style={{
                background: hexColor
                  ? `linear-gradient(135deg, ${hexColor}, ${hexColor}dd)`
                  : 'linear-gradient(135deg, #8b5cf6, #8b5cf6dd)',
              }}
            >
              {item.displayName[0]}
            </div>
          ) : (
            <span
              className="text-sm font-mono font-bold"
              style={{ color: hexColor || '#a855f7' }}
            >
              {getTypeIcon(item.type)}
            </span>
          )}
        </button>

        {/* Name - clickable to insert */}
        <button
          onClick={handleInsert}
          className="text-sm font-medium text-white font-mono hover:text-violet-300 transition-colors"
          title={`Insert ${getTypeIcon(item.type)}${item.name}`}
        >
          {item.name}
        </button>

        {/* Display name for planning agents */}
        {isPlanningAgent && item.displayName && (
          <span className="text-xs text-neutral-400">({item.displayName})</span>
        )}

        {/* Color dot for development agents */}
        {item.type === 'agent' && hexColor && !isPlanningAgent && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: hexColor }}
          />
        )}

        {/* Insert button (always visible) */}
        <button
          onClick={handleInsert}
          className="ml-auto px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
        >
          Insert
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-400 pl-0">{item.description}</p>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-neutral-700 space-y-2">
          {item.usage && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Usage:</span>
              <code className="px-2 py-0.5 bg-neutral-900 rounded text-violet-300 font-mono text-[11px]">
                {item.usage}
              </code>
            </div>
          )}
          {item.systemPrompt && (
            <div className="text-xs">
              <span className="text-neutral-500">Persona:</span>
              <p className="mt-1 text-neutral-400 bg-neutral-900/50 rounded p-2 text-[11px] line-clamp-3">
                {item.systemPrompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommandDictionary({
  isOpen,
  onClose,
  onSelect,
  initialPillar = 'planning',
}: CommandDictionaryProps) {
  const [activePillar, setActivePillar] = useState<Pillar>(initialPillar);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter items based on active pillar and search
  const filteredItems = useMemo(() => {
    const pillarItems = filterByPillar(commandDictionary, activePillar);
    return filterDictionary(pillarItems, searchTerm);
  }, [activePillar, searchTerm]);

  // Group by type
  const byType = useMemo(() => groupByType(filteredItems), [filteredItems]);

  // Get category order for current pillar
  const categoryOrder = useMemo(() => {
    const categories = activePillar === 'planning' ? PLANNING_CATEGORIES : DEVELOPMENT_CATEGORIES;
    return {
      agent: categories.agents,
      command: categories.commands,
      skill: categories.skills,
    };
  }, [activePillar]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setExpandedItem(null);
    }
  }, [isOpen]);

  // Reset to initial pillar when opening
  useEffect(() => {
    if (isOpen) {
      setActivePillar(initialPillar);
    }
  }, [isOpen, initialPillar]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle item click
  const handleItemClick = useCallback((id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  }, []);

  if (!isOpen) return null;

  const pillarColor = PILLAR_COLORS[activePillar];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          animation: 'slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-white">Command Dictionary</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pillar tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => setActivePillar('planning')}
            className={cn(
              'flex-1 px-5 py-3 text-sm font-semibold transition-all border-b-2',
              activePillar === 'planning'
                ? 'text-violet-400 border-violet-500 bg-violet-500/5'
                : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/50'
            )}
          >
            Planning
          </button>
          <button
            onClick={() => setActivePillar('development')}
            className={cn(
              'flex-1 px-5 py-3 text-sm font-semibold transition-all border-b-2',
              activePillar === 'development'
                ? 'text-green-400 border-green-500 bg-green-500/5'
                : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/50'
            )}
          >
            Development
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activePillar} commands, agents, skills...`}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Search className="w-8 h-8 mb-3 opacity-50" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <>
              {/* Agents */}
              {byType.agent && byType.agent.length > 0 && (
                <DictionarySection
                  title="Agents"
                  icon={Bot}
                  items={byType.agent}
                  categoryOrder={categoryOrder.agent}
                  expandedItem={expandedItem}
                  onItemClick={handleItemClick}
                  onInsert={onSelect}
                  typeColor={activePillar === 'planning' ? '#8b5cf6' : '#a855f7'}
                />
              )}

              {/* Commands */}
              {byType.command && byType.command.length > 0 && (
                <DictionarySection
                  title="Commands"
                  icon={Terminal}
                  items={byType.command}
                  categoryOrder={categoryOrder.command}
                  expandedItem={expandedItem}
                  onItemClick={handleItemClick}
                  onInsert={onSelect}
                  typeColor="#3b82f6"
                />
              )}

              {/* Skills */}
              {byType.skill && byType.skill.length > 0 && (
                <DictionarySection
                  title="Skills"
                  icon={Sparkles}
                  items={byType.skill}
                  categoryOrder={categoryOrder.skill}
                  expandedItem={expandedItem}
                  onItemClick={handleItemClick}
                  onInsert={onSelect}
                  typeColor="#f59e0b"
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Type <kbd className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">/</kbd> in chat for commands,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">@</kbd> for agents
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">Esc</kbd> to close
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
