'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  type ToolingConfig,
  type ToolingCommand,
  type ToolingAgent,
  type ToolingSkill,
  type ToolingPersonality,
  type AutocompleteItem,
  getDefaultTooling,
  loadTooling,
  searchTooling,
  AGENT_COLORS,
  DEFAULT_ITEM_COLOR,
} from '@/lib/ide/tooling';

interface ToolingContextType {
  config: ToolingConfig;
  loading: boolean;
  error?: string;

  // Search and filter
  searchCommands: (query: string) => ToolingCommand[];
  searchAgents: (query: string) => ToolingAgent[];
  searchSkills: (query: string) => ToolingSkill[];
  searchAll: (query: string) => AutocompleteItem[];

  // Get by ID
  getCommand: (name: string) => ToolingCommand | undefined;
  getAgent: (name: string) => ToolingAgent | undefined;
  getSkill: (name: string) => ToolingSkill | undefined;

  // Active tooling state
  activeCommand?: ToolingCommand;
  activeAgent?: ToolingAgent;
  activePersonality?: ToolingPersonality;
  setActiveCommand: (cmd?: ToolingCommand) => void;
  setActiveAgent: (agent?: ToolingAgent) => void;
  setActivePersonality: (personality?: ToolingPersonality) => void;

  // Reload tooling
  reload: () => Promise<void>;
}

const ToolingContext = createContext<ToolingContextType | null>(null);

export function ToolingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ToolingConfig>(getDefaultTooling);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Active tooling state
  const [activeCommand, setActiveCommand] = useState<ToolingCommand | undefined>();
  const [activeAgent, setActiveAgent] = useState<ToolingAgent | undefined>();
  const [activePersonality, setActivePersonality] = useState<ToolingPersonality | undefined>();

  // Load tooling on mount
  useEffect(() => {
    // Start with default tooling from manifest
    setConfig(getDefaultTooling());
  }, []);

  // Reload tooling from files
  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const newConfig = await loadTooling();
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload tooling');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search functions
  const searchCommands = useCallback(
    (query: string): ToolingCommand[] => {
      if (!query.trim()) return config.commands.slice(0, 10);
      const normalizedQuery = query.toLowerCase();
      return config.commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(normalizedQuery) ||
          cmd.description.toLowerCase().includes(normalizedQuery)
      );
    },
    [config.commands]
  );

  const searchAgents = useCallback(
    (query: string): ToolingAgent[] => {
      if (!query.trim()) return config.agents.slice(0, 10);
      const normalizedQuery = query.toLowerCase();
      return config.agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(normalizedQuery) ||
          agent.description.toLowerCase().includes(normalizedQuery)
      );
    },
    [config.agents]
  );

  const searchSkills = useCallback(
    (query: string): ToolingSkill[] => {
      if (!query.trim()) return config.skills.slice(0, 10);
      const normalizedQuery = query.toLowerCase();
      return config.skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(normalizedQuery) ||
          skill.description.toLowerCase().includes(normalizedQuery) ||
          skill.triggers?.some((t) => t.toLowerCase().includes(normalizedQuery))
      );
    },
    [config.skills]
  );

  const searchAll = useCallback(
    (query: string): AutocompleteItem[] => {
      const normalizedQuery = query.toLowerCase();
      const results: AutocompleteItem[] = [];

      // Search commands
      config.commands
        .filter(
          (cmd) =>
            !normalizedQuery ||
            cmd.name.toLowerCase().includes(normalizedQuery) ||
            cmd.description.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, 5)
        .forEach((cmd) => {
          results.push({
            type: 'command',
            id: cmd.id,
            name: cmd.name,
            description: cmd.description,
            icon: 'terminal',
          });
        });

      // Search agents
      config.agents
        .filter(
          (agent) =>
            !normalizedQuery ||
            agent.name.toLowerCase().includes(normalizedQuery) ||
            agent.description.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, 5)
        .forEach((agent) => {
          results.push({
            type: 'agent',
            id: agent.id,
            name: agent.name,
            description: agent.description,
            color: agent.color ? AGENT_COLORS[agent.color] : DEFAULT_ITEM_COLOR,
            icon: 'bot',
          });
        });

      // Search skills
      config.skills
        .filter(
          (skill) =>
            !normalizedQuery ||
            skill.name.toLowerCase().includes(normalizedQuery) ||
            skill.description.toLowerCase().includes(normalizedQuery) ||
            skill.triggers?.some((t) => t.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 5)
        .forEach((skill) => {
          results.push({
            type: 'skill',
            id: skill.id,
            name: skill.name,
            description: skill.description,
            icon: 'sparkles',
          });
        });

      return results;
    },
    [config]
  );

  // Get by name functions
  const getCommand = useCallback(
    (name: string): ToolingCommand | undefined => {
      return config.commands.find((cmd) => cmd.name === name);
    },
    [config.commands]
  );

  const getAgent = useCallback(
    (name: string): ToolingAgent | undefined => {
      return config.agents.find((agent) => agent.name === name);
    },
    [config.agents]
  );

  const getSkill = useCallback(
    (name: string): ToolingSkill | undefined => {
      return config.skills.find((skill) => skill.name === name);
    },
    [config.skills]
  );

  const value = useMemo(
    () => ({
      config,
      loading,
      error,
      searchCommands,
      searchAgents,
      searchSkills,
      searchAll,
      getCommand,
      getAgent,
      getSkill,
      activeCommand,
      activeAgent,
      activePersonality,
      setActiveCommand,
      setActiveAgent,
      setActivePersonality,
      reload,
    }),
    [
      config,
      loading,
      error,
      searchCommands,
      searchAgents,
      searchSkills,
      searchAll,
      getCommand,
      getAgent,
      getSkill,
      activeCommand,
      activeAgent,
      activePersonality,
      reload,
    ]
  );

  return <ToolingContext.Provider value={value}>{children}</ToolingContext.Provider>;
}

export function useTooling() {
  const context = useContext(ToolingContext);
  if (!context) {
    throw new Error('useTooling must be used within ToolingProvider');
  }
  return context;
}

export function useToolingOptional() {
  return useContext(ToolingContext);
}
