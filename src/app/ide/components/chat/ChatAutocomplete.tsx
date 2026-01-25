'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTooling } from '../../contexts/ToolingContext';
import { useContextStateOptional, type ContextItem } from '../context';
import type { AutocompleteItem, Pillar } from '@/lib/ide/tooling';
import {
  commandDictionary,
  filterDictionary,
  filterByType,
  groupByPillar,
  type DictionaryItem,
  AGENT_HEX_COLORS,
  PILLAR_COLORS,
  workflowDefinitions,
  searchWorkflows,
  groupWorkflowsByComplexity,
  COMPLEXITY_LABELS,
  COMPLEXITY_COLORS,
  type WorkflowDefinition,
  type WorkflowComplexity,
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
  Workflow,
  Zap,
  Rocket,
  Layers,
  Database,
  Shield,
  Lightbulb,
  Package,
  Building,
  ChevronDown,
  Check,
} from 'lucide-react';

export type AutocompleteMode = 'none' | 'command' | 'mention' | 'browse' | 'workflow';
export type AutocompleteTab = 'agent' | 'command' | 'skill' | 'workflow';

interface ChatAutocompleteProps {
  input: string;
  cursorPosition: number;
  onSelect: (item: AutocompleteItem, mode: AutocompleteMode, startIndex: number) => void;
  onClose: () => void;
  /** Called when user clicks the collapse button - keeps selections but hides panel */
  onCollapse?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isFocused?: boolean;
  /** When true, show the browse panel regardless of focus/input state */
  showBrowsePanel?: boolean;
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

  // Check for `~` workflow trigger at the start of input or after newline/space
  const workflowMatch = beforeCursor.match(/(?:^|[\s\n])~([a-z0-9-]*)$/i);
  if (workflowMatch) {
    return {
      mode: 'workflow',
      query: workflowMatch[1],
      startIndex: cursorPosition - workflowMatch[1].length - 1,
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

// Complexity section header for workflows
function ComplexityHeader({ complexity }: { complexity: WorkflowComplexity }) {
  const { label, description } = COMPLEXITY_LABELS[complexity];
  const color = COMPLEXITY_COLORS[complexity];
  return (
    <div
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-l-2 flex items-center justify-between"
      style={{
        color,
        backgroundColor: `${color}08`,
        borderColor: color
      }}
    >
      <span>{label}</span>
      <span className="font-normal normal-case opacity-70">{description}</span>
    </div>
  );
}

// Workflow icon mapping
const WORKFLOW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Rocket,
  Layers,
  Database,
  Shield,
  Lightbulb,
  Package,
  Building,
};

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

// Convert WorkflowDefinition to AutocompleteItem
function workflowToAutocompleteItem(workflow: WorkflowDefinition): AutocompleteItem {
  return {
    type: 'workflow',
    id: workflow.id,
    name: workflow.name,
    displayName: workflow.displayName,
    description: workflow.description,
    color: workflow.color,
    complexity: workflow.complexity,
    estimatedTime: workflow.estimatedTime,
    agents: workflow.agents,
    commands: workflow.commands,
    skills: workflow.skills,
    strategyPrompt: workflow.strategyPrompt,
  };
}

export function ChatAutocomplete({
  input,
  cursorPosition,
  onSelect,
  onClose,
  onCollapse,
  isOpen,
  setIsOpen,
  anchorRef,
  isFocused = false,
  showBrowsePanel = false,
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
  // Only show browse mode when showBrowsePanel is true OR when triggered by / @ ~
  const effectiveMode = useMemo(() => {
    if (mode !== 'none') return mode;
    // Show browse panel when explicitly requested via Rocket Fuel button
    if (showBrowsePanel) return 'browse';
    return 'none';
  }, [mode, showBrowsePanel]);

  // Auto-switch tab based on trigger
  useEffect(() => {
    if (mode === 'command') {
      setActiveTab('command');
    } else if (mode === 'mention') {
      setActiveTab('agent');
    } else if (mode === 'workflow') {
      setActiveTab('workflow');
    }
  }, [mode]);

  // Get filtered items based on active tab, grouped by pillar or complexity
  const { items, planningItems, developmentItems, workflowsByComplexity } = useMemo(() => {
    // Handle workflow tab separately
    if (activeTab === 'workflow') {
      const filtered = query ? searchWorkflows(query) : workflowDefinitions;
      const byComplexity = {
        quick: filtered.filter((w) => w.complexity === 'quick'),
        sprint: filtered.filter((w) => w.complexity === 'sprint'),
        project: filtered.filter((w) => w.complexity === 'project'),
        platform: filtered.filter((w) => w.complexity === 'platform'),
      };
      // Flatten for keyboard navigation
      const allItems = [
        ...byComplexity.quick,
        ...byComplexity.sprint,
        ...byComplexity.project,
        ...byComplexity.platform,
      ];
      return {
        items: allItems,
        planningItems: [],
        developmentItems: [],
        workflowsByComplexity: byComplexity,
      };
    }

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
      workflowsByComplexity: null,
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
  const getPrefix = (type: DictionaryItem['type'] | 'workflow') => {
    switch (type) {
      case 'command': return '/';
      case 'agent': return '@';
      case 'skill': return '*';
      case 'workflow': return '~';
      default: return '';
    }
  };

  // Get mode for item type
  const getModeForType = (type: DictionaryItem['type'] | 'workflow'): AutocompleteMode => {
    switch (type) {
      case 'command': return 'command';
      case 'agent': return 'mention';
      case 'skill': return 'command'; // Skills use / prefix
      case 'workflow': return 'workflow';
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
          setActiveTab((t) => {
            const order: AutocompleteTab[] = ['agent', 'command', 'skill', 'workflow'];
            const idx = order.indexOf(t);
            return order[(idx - 1 + order.length) % order.length];
          });
          setSelectedIndex(0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveTab((t) => {
            const order: AutocompleteTab[] = ['agent', 'command', 'skill', 'workflow'];
            const idx = order.indexOf(t);
            return order[(idx + 1) % order.length];
          });
          setSelectedIndex(0);
          break;
        case 'Tab':
        case 'Enter':
          if (items[selectedIndex]) {
            e.preventDefault();
            const insertIndex = mode !== 'none' ? startIndex : cursorPosition;
            if (activeTab === 'workflow') {
              // Workflow items are WorkflowDefinition type
              const workflow = items[selectedIndex] as WorkflowDefinition;
              onSelect(workflowToAutocompleteItem(workflow), 'workflow', insertIndex);
            } else {
              // Other items are DictionaryItem type
              const item = items[selectedIndex] as DictionaryItem;
              const itemMode = getModeForType(item.type);
              onSelect(toAutocompleteItem(item), itemMode, insertIndex);
            }
            // Don't close in browse mode - allow multiple selections
            if (!showBrowsePanel) {
              setIsOpen(false);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, items, selectedIndex, mode, startIndex, cursorPosition, onSelect, onClose, setIsOpen, activeTab, showBrowsePanel]
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
          // Don't close in browse mode - allow multiple selections
          if (!showBrowsePanel) {
            setIsOpen(false);
          }
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

  // Render a workflow item
  const renderWorkflowItem = (workflow: WorkflowDefinition, flatIndex: number) => {
    const isSelected = flatIndex === selectedIndex;
    const hexColor = AGENT_HEX_COLORS[workflow.color] || AGENT_HEX_COLORS.violet;
    const IconComponent = WORKFLOW_ICONS[workflow.icon] || Workflow;
    const complexityColor = COMPLEXITY_COLORS[workflow.complexity];

    return (
      <button
        key={workflow.id}
        data-selected={isSelected}
        onClick={() => {
          onSelect(workflowToAutocompleteItem(workflow), 'workflow', mode !== 'none' ? startIndex : cursorPosition);
          // Don't close in browse mode - allow multiple selections
          if (!showBrowsePanel) {
            setIsOpen(false);
          }
        }}
        onMouseEnter={() => setSelectedIndex(flatIndex)}
        className={cn(
          'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
          isSelected ? 'bg-primary-500/20' : 'hover:bg-neutral-800'
        )}
      >
        {/* Workflow Icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${hexColor}, ${hexColor}cc)`,
          }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {workflow.displayName}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${complexityColor}20`,
                color: complexityColor,
              }}
            >
              {workflow.estimatedTime}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
            {workflow.description}
          </p>
          {/* Agent count badge */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-neutral-500 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {workflow.agents.length} agents
            </span>
            <span className="text-[9px] text-neutral-500 flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              {workflow.commands.length} commands
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Get flat index for workflow items
  const getWorkflowFlatIndex = (complexity: WorkflowComplexity, index: number) => {
    if (!workflowsByComplexity) return index;
    let offset = 0;
    const complexityOrder: WorkflowComplexity[] = ['quick', 'sprint', 'project', 'platform'];
    for (const c of complexityOrder) {
      if (c === complexity) break;
      offset += workflowsByComplexity[c].length;
    }
    return offset + index;
  };

  if (!isOpen) return null;

  const tabs: { id: AutocompleteTab; label: string; icon: React.ReactNode; prefix: string }[] = [
    { id: 'agent', label: 'Agents', icon: <Bot className="w-3.5 h-3.5" />, prefix: '@' },
    { id: 'command', label: 'Commands', icon: <Terminal className="w-3.5 h-3.5" />, prefix: '/' },
    { id: 'skill', label: 'Skills', icon: <Sparkles className="w-3.5 h-3.5" />, prefix: '*' },
    { id: 'workflow', label: 'Orchestration', icon: <Workflow className="w-3.5 h-3.5" />, prefix: '~' },
  ];

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 flex flex-col"
      style={{ maxHeight: 'min(70vh, 500px)' }}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 flex-shrink-0">
        <span className="text-xs font-medium text-neutral-400">Add Context</span>
        <button
          onClick={onCollapse}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        >
          <Check className="w-3 h-3" />
          Done
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 flex-shrink-0">
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
                    : tab.id === 'skill'
                      ? 'text-amber-400 bg-amber-500/10 border-b-2 border-amber-500'
                      : 'text-orange-400 bg-orange-500/10 border-b-2 border-orange-500'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
            )}
          >
            <span className="font-mono font-bold">{tab.prefix}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Navigation hints - sticky */}
      <div className="px-3 py-1.5 border-b border-neutral-800/50 flex items-center justify-end gap-3 text-[10px] text-neutral-500 bg-neutral-900/50 flex-shrink-0">
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

      {/* Item list with pillar or complexity grouping - scrollable */}
      <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-500 text-sm">
            No {activeTab === 'workflow' ? 'workflows' : `${activeTab}s`} found
          </div>
        ) : activeTab === 'workflow' && workflowsByComplexity ? (
          <>
            {/* Quick workflows */}
            {workflowsByComplexity.quick.length > 0 && (
              <>
                <ComplexityHeader complexity="quick" />
                {workflowsByComplexity.quick.map((workflow, index) =>
                  renderWorkflowItem(workflow, getWorkflowFlatIndex('quick', index))
                )}
              </>
            )}

            {/* Sprint workflows */}
            {workflowsByComplexity.sprint.length > 0 && (
              <>
                <ComplexityHeader complexity="sprint" />
                {workflowsByComplexity.sprint.map((workflow, index) =>
                  renderWorkflowItem(workflow, getWorkflowFlatIndex('sprint', index))
                )}
              </>
            )}

            {/* Project workflows */}
            {workflowsByComplexity.project.length > 0 && (
              <>
                <ComplexityHeader complexity="project" />
                {workflowsByComplexity.project.map((workflow, index) =>
                  renderWorkflowItem(workflow, getWorkflowFlatIndex('project', index))
                )}
              </>
            )}

            {/* Platform workflows */}
            {workflowsByComplexity.platform.length > 0 && (
              <>
                <ComplexityHeader complexity="platform" />
                {workflowsByComplexity.platform.map((workflow, index) =>
                  renderWorkflowItem(workflow, getWorkflowFlatIndex('platform', index))
                )}
              </>
            )}
          </>
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
  const contextState = useContextStateOptional();

  const handleSelect = useCallback(
    (
      input: string,
      setInput: (value: string) => void,
      item: AutocompleteItem,
      mode: AutocompleteMode,
      startIndex: number
    ) => {
      // If context system is available, add items to context instead of inserting text
      if (contextState) {
        // Handle workflow selection - add to context
        if (item.type === 'workflow' && item.strategyPrompt) {
          contextState.addContext({
            type: 'workflow',
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            content: item.strategyPrompt,
            color: item.color ? AGENT_HEX_COLORS[item.color] : undefined,
            icon: (item as any).icon,
            metadata: {
              complexity: item.complexity,
              estimatedTime: item.estimatedTime,
              agents: item.agents,
              commands: item.commands,
              skills: item.skills,
            },
          });

          // Clear the trigger from input
          if (mode === 'workflow') {
            const before = input.slice(0, startIndex);
            const after = input.slice(cursorPosition);
            setInput(before + after);
            return before.length;
          }
          setInput('');
          return 0;
        }

        // Handle agent selection - add to context
        if (item.type === 'agent') {
          // Get full agent content from tooling if available
          const tooling = (window as any).__toolingContext;
          const agent = tooling?.getAgent?.(item.name);

          contextState.addContext({
            type: 'agent',
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            content: agent?.content || item.description,
            color: item.color ? AGENT_HEX_COLORS[item.color] : undefined,
            metadata: {
              category: item.category,
              pillar: item.pillar,
            },
          });

          // Clear the trigger from input
          if (mode === 'mention') {
            const before = input.slice(0, startIndex);
            const after = input.slice(cursorPosition);
            setInput(before + after);
            return before.length;
          }
          setInput('');
          return 0;
        }

        // Handle command selection - add to context
        if (item.type === 'command') {
          const tooling = (window as any).__toolingContext;
          const command = tooling?.getCommand?.(item.name);

          contextState.addContext({
            type: 'command',
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            content: command?.content || item.description,
            metadata: {
              category: item.category,
              pillar: item.pillar,
            },
          });

          // Clear the trigger from input
          if (mode === 'command') {
            const before = input.slice(0, startIndex);
            const after = input.slice(cursorPosition);
            setInput(before + after);
            return before.length;
          }
          setInput('');
          return 0;
        }

        // Handle skill selection - add to context
        if (item.type === 'skill') {
          const tooling = (window as any).__toolingContext;
          const skill = tooling?.getSkill?.(item.name);

          contextState.addContext({
            type: 'skill',
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            content: skill?.content || item.description,
            metadata: {
              category: item.category,
            },
          });

          // Clear the trigger from input
          if (mode === 'command') {
            const before = input.slice(0, startIndex);
            const after = input.slice(cursorPosition);
            setInput(before + after);
            return before.length;
          }
          setInput('');
          return 0;
        }
      }

      // FALLBACK: If no context system, use original behavior
      // Handle workflow selection - insert the full strategy prompt with agents/commands
      if (item.type === 'workflow' && item.strategyPrompt) {
        // Build the workflow prompt with all the loaded context
        const agentMentions = item.agents?.map((a) => `@${a}`).join(' ') || '';
        const commandMentions = item.commands?.map((c) => `/${c}`).join(' ') || '';
        const skillMentions = item.skills?.map((s) => `*${s}`).join(' ') || '';

        const workflowPrompt = `**${item.displayName} Workflow**

${item.strategyPrompt}

---
**Loaded Context:**
- Agents: ${agentMentions || 'None'}
- Commands: ${commandMentions || 'None'}
- Skills: ${skillMentions || 'None'}

**Ready to begin. What would you like to build?**
`;
        setInput(workflowPrompt);
        return workflowPrompt.length;
      }

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
    [cursorPosition, contextState]
  );

  return {
    isOpen,
    setIsOpen,
    cursorPosition,
    setCursorPosition,
    handleSelect,
  };
}
