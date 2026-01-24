// AI Tooling Loader
// Discovers and loads commands, agents, skills, personalities, and rules from .ai-coding-config and .bmad-method

import type {
  ToolingConfig,
  ToolingCommand,
  ToolingAgent,
  ToolingSkill,
  ToolingPersonality,
  ToolingRule,
} from './types';
import {
  parseCommand,
  parseAgent,
  parseSkill,
  parsePersonality,
  parseRule,
} from './parser';

// Configuration paths relative to workspace root
const CONFIG_PATHS = {
  // ai-coding-config paths
  commands: '.ai-coding-config/plugins/core/commands',
  agents: '.ai-coding-config/plugins/core/agents',
  skills: '.ai-coding-config/plugins/core/skills',
  personalities: '.ai-coding-config/plugins/personalities',
  rules: '.ai-coding-config/.cursor/rules',
  // BMAD Method paths
  bmadAgents: '.bmad-method/src/bmm/agents',
  bmadCoreAgents: '.bmad-method/src/core/agents',
};

// Files to skip (non-content files)
const SKIP_FILES = ['CLAUDE.md', 'README.md'];

/**
 * Tooling manifest - pre-computed list of available tooling
 * This is used when we can't dynamically scan the filesystem
 */
export const TOOLING_MANIFEST = {
  commands: [
    'address-pr-comments',
    'ai-coding-config',
    'autotask',
    'cleanup-worktree',
    'do-issue',
    'generate-AGENTS-file',
    'generate-llms-txt',
    'handoff-context',
    'knowledge',
    'load-rules',
    'multi-review',
    'personality-change',
    'polish-sweep',
    'product-intel',
    'repo-tooling',
    'session',
    'setup-environment',
    'troubleshoot',
    'upgrade-deps',
    'verify-fix',
    'wrap-up',
  ],
  // Development agents from ai-coding-config
  agents: [
    'architecture-auditor',
    'autonomous-developer',
    'code-consistency-reviewer',
    'comment-analyzer',
    'debugger',
    'design-reviewer',
    'empathy-reviewer',
    'error-handling-reviewer',
    'git-writer',
    'library-advisor',
    'logic-reviewer',
    'logo-fetcher',
    'mobile-ux-reviewer',
    'observability-reviewer',
    'performance-reviewer',
    'prompt-engineer',
    'recovery-reviewer',
    'robustness-reviewer',
    'security-reviewer',
    'seo-specialist',
    'simplifier',
    'style-reviewer',
    'test-analyzer',
    'test-engineer',
    'test-runner',
    'ux-clarity-reviewer',
    'ux-consistency-reviewer',
    'ux-designer',
  ],
  // BMAD planning agents (YAML format in .bmad-method)
  bmadAgents: [
    'analyst',      // Mary - Business Analyst
    'architect',    // Winston - Solutions Architect
    'pm',           // John - Product Manager
    'dev',          // Developer
    'sm',           // Bob - Scrum Master
    'tea',          // Test/Enterprise Architect
    'ux-designer',  // Sally - UX Designer
    'quick-flow-solo-dev', // Barry - Quick Flow Developer
    'bmad-master',  // Core orchestrator
  ],
  skills: [
    'brainstorm-synthesis',
    'brainstorming',
    'mcp-debug',
    'playwright-browser',
    'research',
    'skill-creator',
    'systematic-debugging',
    'writing-for-llms',
    'youtube-transcript-analyzer',
  ],
  personalities: [
    'bob-ross',
    'luminous',
    'marie-kondo',
    'ron-swanson',
    'samantha',
    'sherlock',
    'stewie',
  ],
};

/**
 * Create default tooling items from manifest
 * Used when files can't be loaded dynamically
 */
function createDefaultTooling(): ToolingConfig {
  const commands: ToolingCommand[] = TOOLING_MANIFEST.commands.map(name => ({
    id: `command-${name}`,
    name,
    description: `Run the /${name} command`,
    content: '',
    filePath: `${CONFIG_PATHS.commands}/${name}.md`,
  }));

  const agents: ToolingAgent[] = TOOLING_MANIFEST.agents.map(name => ({
    id: `agent-${name}`,
    name,
    description: `Invoke the @${name} agent`,
    content: '',
    filePath: `${CONFIG_PATHS.agents}/${name}.md`,
  }));

  const skills: ToolingSkill[] = TOOLING_MANIFEST.skills.map(name => ({
    id: `skill-${name}`,
    name,
    description: `Use the ${name} skill`,
    content: '',
    filePath: `${CONFIG_PATHS.skills}/${name}/SKILL.md`,
  }));

  const personalities: ToolingPersonality[] = TOOLING_MANIFEST.personalities.map(name => ({
    id: `personality-${name}`,
    name,
    description: `${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')} personality`,
    content: '',
    filePath: `${CONFIG_PATHS.personalities}/personality-${name}/personality.mdc`,
  }));

  return {
    commands,
    agents,
    skills,
    personalities,
    rules: [],
    loaded: true,
  };
}

/**
 * Fetch and parse a single file
 */
async function fetchFile(basePath: string, relativePath: string): Promise<string | null> {
  try {
    const response = await fetch(`${basePath}/${relativePath}`);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Load all tooling from the .ai-coding-config directory
 * In browser context, uses fetch against static assets or API
 */
export async function loadTooling(basePath: string = ''): Promise<ToolingConfig> {
  // If no base path provided, return default tooling from manifest
  if (!basePath) {
    return createDefaultTooling();
  }

  const config: ToolingConfig = {
    commands: [],
    agents: [],
    skills: [],
    personalities: [],
    rules: [],
    loaded: false,
  };

  try {
    // Load commands
    for (const name of TOOLING_MANIFEST.commands) {
      const content = await fetchFile(basePath, `${CONFIG_PATHS.commands}/${name}.md`);
      if (content) {
        config.commands.push(parseCommand(content, `${CONFIG_PATHS.commands}/${name}.md`));
      }
    }

    // Load agents
    for (const name of TOOLING_MANIFEST.agents) {
      const content = await fetchFile(basePath, `${CONFIG_PATHS.agents}/${name}.md`);
      if (content) {
        config.agents.push(parseAgent(content, `${CONFIG_PATHS.agents}/${name}.md`));
      }
    }

    // Load skills
    for (const name of TOOLING_MANIFEST.skills) {
      const content = await fetchFile(basePath, `${CONFIG_PATHS.skills}/${name}/SKILL.md`);
      if (content) {
        config.skills.push(parseSkill(content, `${CONFIG_PATHS.skills}/${name}/SKILL.md`));
      }
    }

    // Load personalities
    for (const name of TOOLING_MANIFEST.personalities) {
      const content = await fetchFile(basePath, `${CONFIG_PATHS.personalities}/personality-${name}/personality.mdc`);
      if (content) {
        config.personalities.push(parsePersonality(content, `${CONFIG_PATHS.personalities}/personality-${name}/personality.mdc`));
      }
    }

    config.loaded = true;
  } catch (error) {
    config.error = error instanceof Error ? error.message : 'Failed to load tooling';
    // Return default tooling on error
    return createDefaultTooling();
  }

  return config;
}

/**
 * Get tooling synchronously (from manifest)
 * Use this when you need tooling immediately without async loading
 */
export function getDefaultTooling(): ToolingConfig {
  return createDefaultTooling();
}

/**
 * Search tooling by query
 */
export function searchTooling(
  config: ToolingConfig,
  query: string,
  types?: ('command' | 'agent' | 'skill' | 'personality')[]
): Array<ToolingCommand | ToolingAgent | ToolingSkill | ToolingPersonality> {
  const normalizedQuery = query.toLowerCase();
  const results: Array<ToolingCommand | ToolingAgent | ToolingSkill | ToolingPersonality> = [];

  const shouldSearchType = (type: string) => !types || types.includes(type as any);

  if (shouldSearchType('command')) {
    results.push(...config.commands.filter(cmd =>
      cmd.name.toLowerCase().includes(normalizedQuery) ||
      cmd.description.toLowerCase().includes(normalizedQuery)
    ));
  }

  if (shouldSearchType('agent')) {
    results.push(...config.agents.filter(agent =>
      agent.name.toLowerCase().includes(normalizedQuery) ||
      agent.description.toLowerCase().includes(normalizedQuery)
    ));
  }

  if (shouldSearchType('skill')) {
    results.push(...config.skills.filter(skill =>
      skill.name.toLowerCase().includes(normalizedQuery) ||
      skill.description.toLowerCase().includes(normalizedQuery) ||
      skill.triggers?.some(t => t.toLowerCase().includes(normalizedQuery))
    ));
  }

  if (shouldSearchType('personality')) {
    results.push(...config.personalities.filter(p =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.description.toLowerCase().includes(normalizedQuery)
    ));
  }

  return results;
}
