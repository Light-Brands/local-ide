'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { getWorkflow as getWorkflowDefinition } from '@/lib/ide/tooling';
import { useIDEStore } from '../../stores/ideStore';

export interface ContextItem {
  id: string;
  type: 'workflow' | 'agent' | 'command' | 'skill' | 'file' | 'element';
  name: string;
  displayName?: string;
  description: string;
  content: string;
  isEdited: boolean;
  originalContent: string;
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  persisted?: boolean;
}

export type ContextFilterType = 'file' | 'agent' | 'command' | 'skill' | 'workflow' | 'element' | null;

export interface ContextState {
  items: ContextItem[];
  isDrawerOpen: boolean;
  activeFilter: ContextFilterType;
  addContext: (item: Omit<ContextItem, 'id' | 'isEdited' | 'originalContent'>) => void;
  removeContext: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  resetContent: (id: string) => void;
  togglePersist: (id: string) => void;
  clearAll: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  setActiveFilter: (filter: ContextFilterType) => void;
  buildPrompt: (userMessage: string) => string;
  getWorkflow: () => ContextItem | undefined;
  getFilteredItems: () => ContextItem[];
  hasContext: boolean;
}

const ContextStateContext = createContext<ContextState | null>(null);

const PERSISTED_CONTEXT_KEY = 'ide-persisted-context';

let contextIdCounter = 0;

function generateContextId(): string {
  return `ctx-${Date.now()}-${++contextIdCounter}`;
}

// Load persisted items from localStorage
function loadPersistedItems(): ContextItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PERSISTED_CONTEXT_KEY);
    if (stored) {
      const items = JSON.parse(stored) as ContextItem[];
      // Regenerate IDs to avoid conflicts
      return items.map(item => ({
        ...item,
        id: generateContextId(),
        persisted: true,
      }));
    }
  } catch (error) {
    console.warn('Failed to load persisted context:', error);
  }
  return [];
}

// Save persisted items to localStorage
function savePersistedItems(items: ContextItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const toSave = items.filter(item => item.persisted);
    localStorage.setItem(PERSISTED_CONTEXT_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('Failed to save persisted context:', error);
  }
}

export function ContextProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilterState] = useState<ContextFilterType>(null);
  const [hasLoadedPersisted, setHasLoadedPersisted] = useState(false);

  // Load persisted items on mount
  useEffect(() => {
    if (!hasLoadedPersisted) {
      const persistedItems = loadPersistedItems();
      if (persistedItems.length > 0) {
        console.log(`⛽ [ContextProvider] Loaded ${persistedItems.length} persisted items`);
        setItems(persistedItems);
      }
      setHasLoadedPersisted(true);
    }
  }, [hasLoadedPersisted]);

  // Save persisted items whenever items change
  useEffect(() => {
    if (hasLoadedPersisted) {
      savePersistedItems(items);
    }
  }, [items, hasLoadedPersisted]);

  // Listen for element-selected events from PreviewPane
  useEffect(() => {
    const handleElementSelected = (event: CustomEvent) => {
      const { enhancementRequest, ...item } = event.detail;
      if (item && item.type === 'element') {
        console.log(`⛽ [ContextProvider] Received element from preview: ${item.name}`);

        // Build content with enhancement request if present
        let content = item.content;
        if (enhancementRequest) {
          content += `\n\n---\n**Enhancement Request:**\n${enhancementRequest}`;
          console.log(`   ✨ Enhancement request: ${enhancementRequest.slice(0, 50)}...`);
        }

        // Use the addContext logic inline to avoid stale closure
        setItems((prev) => {
          // Check for duplicates by name and type
          const exists = prev.some(
            (i) => i.type === item.type && i.name === item.name
          );
          if (exists) {
            console.log(`   ⚠️ Duplicate element "${item.name}" - skipping`);
            return prev;
          }

          console.log(`   📦 Added element to context (now ${prev.length + 1} items)`);
          return [
            ...prev,
            {
              ...item,
              content, // Use the enhanced content
              id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              isEdited: false,
              originalContent: content,
            },
          ];
        });

        // Auto-load quick-fix workflow and prime chat input when enhancement request is present
        if (enhancementRequest) {
          const workflow = getWorkflowDefinition('quick-fix');
          if (workflow) {
            console.log(`   🚀 Auto-loading quick-fix workflow`);
            // Add workflow to context (workflows replace existing)
            setItems((prev) => {
              const filtered = prev.filter((i) => i.type !== 'workflow');
              return [
                ...filtered,
                {
                  type: 'workflow' as const,
                  name: workflow.name,
                  displayName: workflow.displayName,
                  description: workflow.description,
                  content: workflow.strategyPrompt,
                  color: workflow.color,
                  id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  isEdited: false,
                  originalContent: workflow.strategyPrompt,
                },
              ];
            });
          }

          // Prime the active input (chat or terminal based on current drawer tab)
          // Access store directly since we can't use hooks in event handlers
          const activeTab = useIDEStore.getState().drawer.tab;
          const eventName = activeTab === 'terminal' ? 'ide:prime-terminal-input' : 'ide:prime-chat-input';
          console.log(`   💬 Priming ${activeTab} input (${eventName})`);
          window.dispatchEvent(new CustomEvent(eventName, {
            detail: {
              message: "I've selected a component and described what I'd like to change. Can you run the quick-fix workflow to update this component for me?",
              focusInput: true,
              pulseSubmit: true,
            }
          }));
        }
      }
    };

    window.addEventListener('ide:element-selected', handleElementSelected as EventListener);
    return () => window.removeEventListener('ide:element-selected', handleElementSelected as EventListener);
  }, []);

  const addContext = useCallback(
    (item: Omit<ContextItem, 'id' | 'isEdited' | 'originalContent'>) => {
      console.log(`⛽ [ContextProvider] Adding ${item.type}: ${item.name}`);
      console.log(`   Content length: ${item.content?.length || 0} chars`);
      console.log(`   Content preview: ${item.content?.slice(0, 100)}...`);

      setItems((prev) => {
        // Workflows are exclusive - adding a new one replaces existing
        if (item.type === 'workflow') {
          const filtered = prev.filter((i) => i.type !== 'workflow');
          console.log(`   📦 Workflow added (replaced ${prev.length - filtered.length} existing)`);
          return [
            ...filtered,
            {
              ...item,
              id: generateContextId(),
              isEdited: false,
              originalContent: item.content,
            },
          ];
        }

        // For other types, check for duplicates by name and type
        const exists = prev.some(
          (i) => i.type === item.type && i.name === item.name
        );
        if (exists) {
          console.log(`   ⚠️ Duplicate ${item.type} "${item.name}" - skipping`);
          return prev;
        }

        // Agents/commands/skills/files can stack
        console.log(`   📦 Added to context (now ${prev.length + 1} items)`);
        return [
          ...prev,
          {
            ...item,
            id: generateContextId(),
            isEdited: false,
            originalContent: item.content,
          },
        ];
      });
    },
    []
  );

  const removeContext = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, content, isEdited: content !== item.originalContent }
          : item
      )
    );
  }, []);

  const resetContent = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, content: item.originalContent, isEdited: false }
          : item
      )
    );
  }, []);

  const togglePersist = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, persisted: !item.persisted }
          : item
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setActiveFilterState(null);
    }
  }, []);

  const setActiveFilter = useCallback((filter: ContextFilterType) => {
    setActiveFilterState(filter);
  }, []);

  const getWorkflow = useCallback(() => {
    return items.find((item) => item.type === 'workflow');
  }, [items]);

  const getFilteredItems = useCallback(() => {
    if (!activeFilter) return items;
    // Group elements with files for the "Elements" category
    if (activeFilter === 'file') {
      return items.filter((item) => item.type === 'file' || item.type === 'element');
    }
    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  const buildPrompt = useCallback(
    (userMessage: string) => {
      if (items.length === 0) {
        return userMessage;
      }

      const contextParts: string[] = [];
      const workflow = items.find((item) => item.type === 'workflow');
      const agents = items.filter((item) => item.type === 'agent');
      const commands = items.filter((item) => item.type === 'command');
      const skills = items.filter((item) => item.type === 'skill');
      const files = items.filter((item) => item.type === 'file');
      const elements = items.filter((item) => item.type === 'element');

      // Add workflow context first (primary orchestration)
      if (workflow) {
        contextParts.push(`**${workflow.displayName || workflow.name} Workflow**\n\n${workflow.content}`);

        // Add loaded context summary
        const loadedContext: string[] = [];
        if (agents.length > 0) {
          loadedContext.push(`- Agents: ${agents.map((a) => `@${a.name}`).join(' ')}`);
        }
        if (commands.length > 0) {
          loadedContext.push(`- Commands: ${commands.map((c) => `/${c.name}`).join(' ')}`);
        }
        if (skills.length > 0) {
          loadedContext.push(`- Skills: ${skills.map((s) => `*${s.name}`).join(' ')}`);
        }
        if (loadedContext.length > 0) {
          contextParts.push(`---\n**Loaded Context:**\n${loadedContext.join('\n')}`);
        }
      }

      // Add agent context
      if (agents.length > 0 && !workflow) {
        const agentDocs = agents
          .map((a) => `## @${a.name}\n${a.description}\n\n${a.content.slice(0, 1000)}${a.content.length > 1000 ? '...' : ''}`)
          .join('\n\n');
        contextParts.push(`[Active Agents]\n${agentDocs}`);
      }

      // Add command context
      if (commands.length > 0 && !workflow) {
        const commandDocs = commands
          .map((c) => `## /${c.name}\n${c.description}\n\n${c.content.slice(0, 500)}${c.content.length > 500 ? '...' : ''}`)
          .join('\n\n');
        contextParts.push(`[Active Commands]\n${commandDocs}`);
      }

      // Add skill context
      if (skills.length > 0 && !workflow) {
        const skillDocs = skills
          .map((s) => `## *${s.name}\n${s.description}\n\n${s.content.slice(0, 500)}${s.content.length > 500 ? '...' : ''}`)
          .join('\n\n');
        contextParts.push(`[Active Skills]\n${skillDocs}`);
      }

      // Add file context
      if (files.length > 0) {
        const fileDocs = files
          .map((f) => `[Current File: ${f.name}]\n\`\`\`\n${f.content.slice(0, 2000)}${f.content.length > 2000 ? '...' : ''}\n\`\`\``)
          .join('\n\n');
        contextParts.push(fileDocs);
      }

      // Add element context (selected UI components from preview)
      if (elements.length > 0) {
        const elementDocs = elements
          .map((e) => `[Selected Element: ${e.name}]\n${e.content}`)
          .join('\n\n');
        contextParts.push(`[UI Elements to Modify]\n${elementDocs}`);
      }

      // Combine all context with user message
      if (contextParts.length > 0) {
        return `${contextParts.join('\n\n')}\n\n[User Message]\n${userMessage}`;
      }

      return userMessage;
    },
    [items]
  );

  const hasContext = items.length > 0;

  const value = useMemo(
    () => ({
      items,
      isDrawerOpen,
      activeFilter,
      addContext,
      removeContext,
      updateContent,
      resetContent,
      togglePersist,
      clearAll,
      toggleDrawer,
      setDrawerOpen,
      setActiveFilter,
      buildPrompt,
      getWorkflow,
      getFilteredItems,
      hasContext,
    }),
    [
      items,
      isDrawerOpen,
      activeFilter,
      addContext,
      removeContext,
      updateContent,
      resetContent,
      togglePersist,
      clearAll,
      toggleDrawer,
      setDrawerOpen,
      setActiveFilter,
      buildPrompt,
      getWorkflow,
      getFilteredItems,
      hasContext,
    ]
  );

  return (
    <ContextStateContext.Provider value={value}>
      {children}
    </ContextStateContext.Provider>
  );
}

export function useContextState(): ContextState {
  const context = useContext(ContextStateContext);
  if (!context) {
    throw new Error('useContextState must be used within a ContextProvider');
  }
  return context;
}

export function useContextStateOptional(): ContextState | null {
  return useContext(ContextStateContext);
}
