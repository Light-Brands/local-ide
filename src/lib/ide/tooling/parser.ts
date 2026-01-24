// YAML Frontmatter Parser for AI Tooling Files
// Parses markdown files with YAML frontmatter to extract metadata

import type {
  ToolingCommand,
  ToolingAgent,
  ToolingSkill,
  ToolingPersonality,
  ToolingRule,
} from './types';

interface ParsedFrontmatter {
  [key: string]: unknown;
}

interface ParseResult {
  frontmatter: ParsedFrontmatter;
  content: string;
}

/**
 * Parse YAML frontmatter from markdown content
 * Supports standard YAML frontmatter format:
 * ---
 * key: value
 * ---
 * content...
 */
export function parseFrontmatter(markdown: string): ParseResult {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const [, yamlContent, content] = match;
  const frontmatter: ParsedFrontmatter = {};

  // Parse YAML manually (simple key: value pairs)
  // Handles # prettier-ignore comments and quoted strings
  const lines = yamlContent.split('\n');
  let currentKey = '';

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      continue;
    }

    // Check for key: value pattern
    const keyValueMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, rawValue] = keyValueMatch;
      currentKey = key;

      // Handle quoted strings
      let value: unknown = rawValue.trim();
      if (typeof value === 'string') {
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Handle arrays (simple format)
        if (value === '') {
          // Could be a multi-line value or empty
          frontmatter[currentKey] = '';
        } else {
          frontmatter[currentKey] = value;
        }
      }
    } else if (line.startsWith('  - ') && currentKey) {
      // Array item continuation
      const item = line.slice(4).trim();
      const cleanItem = item.startsWith('"') && item.endsWith('"')
        ? item.slice(1, -1)
        : item.startsWith("'") && item.endsWith("'")
        ? item.slice(1, -1)
        : item;

      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = [];
      }
      (frontmatter[currentKey] as string[]).push(cleanItem);
    }
  }

  return { frontmatter, content: content.trim() };
}

/**
 * Parse a command markdown file
 */
export function parseCommand(markdown: string, filePath: string): ToolingCommand {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const name = filePath.split('/').pop()?.replace('.md', '') || 'unknown';

  return {
    id: `command-${name}`,
    name,
    description: String(frontmatter.description || ''),
    version: frontmatter.version ? String(frontmatter.version) : undefined,
    argumentHint: frontmatter['argument-hint'] ? String(frontmatter['argument-hint']) : undefined,
    content,
    filePath,
  };
}

/**
 * Parse an agent markdown file
 */
export function parseAgent(markdown: string, filePath: string): ToolingAgent {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const fileName = filePath.split('/').pop()?.replace('.md', '') || 'unknown';
  const name = String(frontmatter.name || fileName);

  return {
    id: `agent-${name}`,
    name,
    description: String(frontmatter.description || ''),
    version: frontmatter.version ? String(frontmatter.version) : undefined,
    model: frontmatter.model as 'opus' | 'sonnet' | 'haiku' | undefined,
    color: frontmatter.color as ToolingAgent['color'],
    tools: Array.isArray(frontmatter.tools) ? frontmatter.tools.map(String) : undefined,
    content,
    filePath,
  };
}

/**
 * Parse a skill SKILL.md file
 */
export function parseSkill(markdown: string, filePath: string): ToolingSkill {
  const { frontmatter, content } = parseFrontmatter(markdown);
  // Extract skill name from directory path (e.g., .../skills/systematic-debugging/SKILL.md)
  const pathParts = filePath.split('/');
  const skillDirIndex = pathParts.findIndex(p => p === 'skills');
  const skillName = skillDirIndex >= 0 ? pathParts[skillDirIndex + 1] : 'unknown';
  const name = String(frontmatter.name || skillName);

  return {
    id: `skill-${name}`,
    name,
    description: String(frontmatter.description || ''),
    version: frontmatter.version ? String(frontmatter.version) : undefined,
    category: frontmatter.category ? String(frontmatter.category) : undefined,
    triggers: Array.isArray(frontmatter.triggers) ? frontmatter.triggers.map(String) : undefined,
    content,
    filePath,
  };
}

/**
 * Parse a personality .mdc file
 */
export function parsePersonality(markdown: string, filePath: string): ToolingPersonality {
  const { frontmatter, content } = parseFrontmatter(markdown);
  // Extract personality name from directory (e.g., .../personality-samantha/personality.mdc)
  const pathParts = filePath.split('/');
  const personalityDir = pathParts.find(p => p.startsWith('personality-'));
  const name = personalityDir?.replace('personality-', '') || String(frontmatter.name || 'unknown');

  return {
    id: `personality-${name}`,
    name,
    description: String(frontmatter.description || `${name} personality`),
    content,
    filePath,
  };
}

/**
 * Parse a rule .mdc file
 */
export function parseRule(markdown: string, filePath: string): ToolingRule {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const fileName = filePath.split('/').pop()?.replace('.mdc', '') || 'unknown';

  return {
    id: `rule-${fileName}`,
    name: fileName,
    description: frontmatter.description ? String(frontmatter.description) : undefined,
    alwaysApply: frontmatter.alwaysApply === true || frontmatter.alwaysApply === 'true',
    globs: Array.isArray(frontmatter.globs) ? frontmatter.globs.map(String) : undefined,
    content,
    filePath,
  };
}
