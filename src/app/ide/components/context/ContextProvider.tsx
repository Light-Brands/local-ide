'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

export interface ContextItem {
  id: string;
  type: 'workflow' | 'agent' | 'command' | 'skill' | 'file';
  name: string;
  displayName?: string;
  description: string;
  content: string;
  isEdited: boolean;
  originalContent: string;
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface ContextState {
  items: ContextItem[];
  isDrawerOpen: boolean;
  addContext: (item: Omit<ContextItem, 'id' | 'isEdited' | 'originalContent'>) => void;
  removeContext: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  resetContent: (id: string) => void;
  clearAll: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  buildPrompt: (userMessage: string) => string;
  getWorkflow: () => ContextItem | undefined;
  hasContext: boolean;
}

const ContextStateContext = createContext<ContextState | null>(null);

let contextIdCounter = 0;

function generateContextId(): string {
  return `ctx-${Date.now()}-${++contextIdCounter}`;
}

export function ContextProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const addContext = useCallback(
    (item: Omit<ContextItem, 'id' | 'isEdited' | 'originalContent'>) => {
      setItems((prev) => {
        // Workflows are exclusive - adding a new one replaces existing
        if (item.type === 'workflow') {
          const filtered = prev.filter((i) => i.type !== 'workflow');
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
          return prev;
        }

        // Agents/commands/skills/files can stack
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

  const clearAll = useCallback(() => {
    setItems([]);
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
  }, []);

  const getWorkflow = useCallback(() => {
    return items.find((item) => item.type === 'workflow');
  }, [items]);

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
      addContext,
      removeContext,
      updateContent,
      resetContent,
      clearAll,
      toggleDrawer,
      setDrawerOpen,
      buildPrompt,
      getWorkflow,
      hasContext,
    }),
    [
      items,
      isDrawerOpen,
      addContext,
      removeContext,
      updateContent,
      resetContent,
      clearAll,
      toggleDrawer,
      setDrawerOpen,
      buildPrompt,
      getWorkflow,
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
