'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useIDEStore } from '../stores/ideStore';
import { PANE_CONFIG, type PaneNumber } from '../contexts/PanePortalContext';
import { cn } from '@/lib/utils';
import {
  Search,
  Command,
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
  Settings,
  Moon,
  Sun,
  Save,
  FileText,
  FolderOpen,
  X,
  type LucideIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  category: 'panes' | 'editor' | 'settings' | 'actions';
}

const PANE_ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
};

export function CommandPalette() {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOpen = useIDEStore((state) => state.commandPaletteOpen);
  const setOpen = useIDEStore((state) => state.setCommandPaletteOpen);
  const togglePane = useIDEStore((state) => state.togglePane);
  const paneVisibility = useIDEStore((state) => state.paneVisibility);
  const settings = useIDEStore((state) => state.settings);
  const updateSettings = useIDEStore((state) => state.updateSettings);
  const setShowSettings = useIDEStore((state) => state.setShowSettings);

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Pane toggle commands (skip pane 3/Terminal - it's now part of Developer pane)
    Object.entries(PANE_CONFIG).forEach(([id, config]) => {
      const paneId = parseInt(id);
      if (paneId === 3) return; // Skip Terminal pane

      const Icon = PANE_ICONS[config.icon] || Code;
      const isVisible = paneVisibility[paneId];

      items.push({
        id: `toggle-pane-${paneId}`,
        label: `${isVisible ? 'Hide' : 'Show'} ${config.name}`,
        description: `Toggle ${config.name.toLowerCase()} pane visibility`,
        icon: Icon,
        shortcut: `⌘${paneId}`,
        action: () => togglePane(paneId),
        category: 'panes',
      });
    });

    // Settings commands
    items.push({
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Configure IDE preferences',
      icon: Settings,
      shortcut: '⌘,',
      action: () => {
        setShowSettings(true);
        setOpen(false);
      },
      category: 'settings',
    });

    items.push({
      id: 'toggle-theme',
      label: `Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle between light and dark theme',
      icon: settings.theme === 'dark' ? Sun : Moon,
      action: () => {
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
      },
      category: 'settings',
    });

    // Editor commands
    items.push({
      id: 'save-file',
      label: 'Save File',
      description: 'Save the current file',
      icon: Save,
      shortcut: '⌘S',
      action: () => {
        // Trigger save - would connect to editor
        setOpen(false);
      },
      category: 'editor',
    });

    items.push({
      id: 'open-file',
      label: 'Open File',
      description: 'Open a file from the file tree',
      icon: FileText,
      shortcut: '⌘O',
      action: () => {
        // Show file tree - would connect to editor
        setOpen(false);
      },
      category: 'editor',
    });

    return items;
  }, [paneVisibility, togglePane, settings, updateSettings, setShowSettings, setOpen]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [filteredCommands, selectedIndex, setOpen]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  const categoryLabels: Record<string, string> = {
    panes: 'Panes',
    editor: 'Editor',
    settings: 'Settings',
    actions: 'Actions',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-sm">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {categoryLabels[category] || category}
                </div>
                {items.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = cmd.icon;

                  return (
                    <button
                      key={cmd.id}
                      data-selected={isSelected}
                      onClick={() => {
                        cmd.action();
                        setOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-neutral-400')} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div
                            className={cn(
                              'text-xs truncate',
                              isSelected ? 'text-white/70' : 'text-neutral-400'
                            )}
                          >
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd
                          className={cn(
                            'px-1.5 py-0.5 text-[10px] font-medium rounded',
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                          )}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">↑</kbd>
            <kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">↵</kbd>
            to select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
