// AI Tooling Types for Commands, Agents, and Skills

// Two-pillar organization: Planning (ideation, requirements, design) and Development (coding, reviewing, shipping)
export type Pillar = 'planning' | 'development';

// Agent color types
export type AgentColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'magenta'
  | 'violet'
  | 'indigo'
  | 'sky'
  | 'teal'
  | 'emerald'
  | 'pink';

export interface ToolingCommand {
  id: string;
  name: string; // e.g., "autotask", "load-rules"
  description: string;
  pillar?: Pillar; // Which pillar this belongs to (optional for file-based loading)
  category?: string; // Category within the pillar (optional for file-based loading)
  version?: string;
  usage?: string; // e.g., "/autotask [task description]"
  argumentHint?: string;
  content: string; // Full markdown content
  filePath: string;
}

export interface ToolingAgent {
  id: string;
  name: string; // e.g., "security-reviewer", "analyst"
  displayName?: string; // Human name for planning agents, e.g., "Mary" for analyst
  description: string;
  pillar?: Pillar; // Which pillar this belongs to (optional for file-based loading)
  category?: string; // Category within the pillar (optional for file-based loading)
  version?: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  color?: AgentColor;
  tools?: string[];
  systemPrompt?: string; // Agent persona/instructions
  content: string; // Full markdown content
  filePath: string;
}

export interface ToolingSkill {
  id: string;
  name: string; // e.g., "systematic-debugging", "brainstorming"
  description: string;
  pillar?: Pillar; // Which pillar this belongs to (optional for file-based loading)
  category?: string; // Category within the pillar (optional for file-based loading)
  version?: string;
  triggers?: string[];
  content: string; // Full markdown content
  filePath: string;
}

export interface ToolingPersonality {
  id: string;
  name: string;
  description: string;
  content: string;
  filePath: string;
}

export interface ToolingRule {
  id: string;
  name: string;
  description?: string;
  alwaysApply?: boolean;
  globs?: string[];
  content: string;
  filePath: string;
}

export interface ToolingConfig {
  commands: ToolingCommand[];
  agents: ToolingAgent[];
  skills: ToolingSkill[];
  personalities: ToolingPersonality[];
  rules: ToolingRule[];
  loaded: boolean;
  error?: string;
}

// Workflow complexity levels
export type WorkflowComplexity = 'quick' | 'sprint' | 'project' | 'platform';

// Workflow definition - orchestrates multiple agents, commands, and skills
export interface WorkflowDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  complexity: WorkflowComplexity;
  estimatedTime: string; // e.g., "10-30 min", "2-4 hrs"
  color: AgentColor;
  icon: string; // Lucide icon name
  // Agents to load (in order of engagement)
  agents: string[]; // Agent IDs
  // Commands to make available
  commands: string[]; // Command names
  // Skills to load
  skills: string[]; // Skill names
  // Strategy prompt that orchestrates the workflow
  strategyPrompt: string;
  // Example use cases
  examples: string[];
}

// Autocomplete item types
export type AutocompleteItemType = 'command' | 'agent' | 'skill' | 'personality' | 'rule' | 'workflow';

export interface AutocompleteItem {
  type: AutocompleteItemType;
  id: string;
  name: string;
  displayName?: string; // Human name for planning agents
  description: string;
  pillar?: Pillar;
  category?: string;
  color?: string;
  icon?: string;
  // Workflow-specific fields
  complexity?: WorkflowComplexity;
  estimatedTime?: string;
  agents?: string[];
  commands?: string[];
  skills?: string[];
  strategyPrompt?: string;
}

// Agent color mapping for UI (Tailwind classes)
export const AGENT_COLORS: Record<string, string> = {
  // Development colors (warmer/action tones)
  red: 'text-red-500 bg-red-500/10',
  orange: 'text-orange-500 bg-orange-500/10',
  yellow: 'text-yellow-500 bg-yellow-500/10',
  green: 'text-green-500 bg-green-500/10',
  cyan: 'text-cyan-500 bg-cyan-500/10',
  blue: 'text-blue-500 bg-blue-500/10',
  purple: 'text-purple-500 bg-purple-500/10',
  magenta: 'text-pink-500 bg-pink-500/10',
  pink: 'text-pink-500 bg-pink-500/10',
  // Planning colors (cooler tones)
  violet: 'text-violet-500 bg-violet-500/10',
  indigo: 'text-indigo-500 bg-indigo-500/10',
  sky: 'text-sky-500 bg-sky-500/10',
  teal: 'text-teal-500 bg-teal-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
};

// Hex color mapping for inline styles
export const AGENT_HEX_COLORS: Record<string, string> = {
  // Development colors
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#a855f7',
  magenta: '#ec4899',
  pink: '#ec4899',
  // Planning colors
  violet: '#8b5cf6',
  indigo: '#6366f1',
  sky: '#0ea5e9',
  teal: '#14b8a6',
  emerald: '#10b981',
};

// Pillar accent colors
export const PILLAR_COLORS = {
  planning: {
    primary: '#8b5cf6', // Violet
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    border: 'border-violet-500',
  },
  development: {
    primary: '#22c55e', // Green
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500',
  },
};

// Default color for items without a specified color
export const DEFAULT_ITEM_COLOR = 'text-neutral-400 bg-neutral-500/10';
