// =============================================================================
// Component Context Formatter
// Formats component data into AI-friendly markdown
// =============================================================================

import type { ComponentData } from './types';

/**
 * Format component data into markdown context for pasting into chat
 */
export function formatComponentContext(data: ComponentData): string {
  const lines: string[] = [
    '## Component Context',
    '',
  ];

  // Primary identification
  if (data.componentName) {
    lines.push(`**Component:** ${data.componentName}`);
  }

  lines.push(`**Element:** \`<${data.elementTag}>\``);

  if (data.elementId) {
    lines.push(`**ID:** \`#${data.elementId}\``);
  }

  // Key identifying attributes (most useful for finding in code)
  if (data.href) {
    lines.push(`**href:** \`${data.href}\``);
  }

  if (data.ariaLabel) {
    lines.push(`**aria-label:** \`${data.ariaLabel}\``);
  }

  // Text content - often the most searchable
  if (data.textContent) {
    const truncated = data.textContent.slice(0, 100);
    const ellipsis = data.textContent.length > 100 ? '...' : '';
    lines.push(`**Text:** "${truncated}${ellipsis}"`);
  }

  // Data attributes (very useful for identification)
  const dataAttrEntries = Object.entries(data.dataAttributes);
  if (dataAttrEntries.length > 0) {
    lines.push('**Data Attributes:**');
    dataAttrEntries.slice(0, 5).forEach(([key, value]) => {
      lines.push(`  - \`${key}="${value}"\``);
    });
  }

  // CSS Selector for precise identification
  if (data.uniqueSelector) {
    lines.push('');
    lines.push(`**Selector:** \`${data.uniqueSelector}\``);
  }

  // Search hints - the most actionable part
  if (data.searchHints && data.searchHints.length > 0) {
    lines.push('');
    lines.push('**Search in code for:**');
    data.searchHints.slice(0, 5).forEach((hint) => {
      lines.push(`  - \`${hint}\``);
    });
  }

  // Context path
  if (data.componentPath && data.componentPath !== 'Page') {
    lines.push('');
    lines.push(`**Path:** ${data.componentPath}`);
  }

  if (data.parentChain.length > 0) {
    lines.push(`**DOM Path:** ${data.parentChain.join(' > ')}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('_Use the search hints above to find this element in the codebase._');

  return lines.join('\n');
}
