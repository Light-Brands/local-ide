'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, FileCode, Slash, Bot, ExternalLink } from 'lucide-react';

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

// Code block component with copy button
const CodeBlock = memo(function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-2 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-750 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-mono">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-sm font-mono text-neutral-200">{code}</code>
      </pre>
    </div>
  );
});

// Parse inline formatting: bold, italic, strikethrough, links, code, commands, mentions
function parseInlineElements(content: string, keyPrefix = ''): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  // Process inline elements in order of appearance
  while (remaining.length > 0) {
    // Find the first match of any pattern
    const patterns = [
      { regex: /\*\*([\s\S]+?)\*\*/, type: 'bold' },
      { regex: /__([\s\S]+?)__/, type: 'bold' },
      { regex: /\*([^*]+)\*/, type: 'italic' },
      { regex: /_([^_]+)_/, type: 'italic' },
      { regex: /~~([\s\S]+?)~~/, type: 'strikethrough' },
      { regex: /`([^`]+)`/, type: 'code' },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link' },
      { regex: /(?:^|[\s])(\/[a-z0-9-]+)/i, type: 'command' },
      { regex: /(?:^|[\s])(@[a-z0-9-]+)/i, type: 'mention' },
    ];

    let firstMatch: { index: number; match: RegExpExecArray; type: string } | null = null;

    for (const { regex, type } of patterns) {
      const match = regex.exec(remaining);
      if (match && (firstMatch === null || match.index < firstMatch.index)) {
        firstMatch = { index: match.index, match, type };
      }
    }

    if (!firstMatch) {
      // No more matches, add remaining text
      if (remaining) {
        parts.push(remaining);
      }
      break;
    }

    // Add text before the match
    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    const { match, type } = firstMatch;
    const uniqueKey = `${keyPrefix}-${key++}`;

    switch (type) {
      case 'bold':
        parts.push(
          <strong key={uniqueKey} className="font-semibold text-white">
            {parseInlineElements(match[1], uniqueKey)}
          </strong>
        );
        break;
      case 'italic':
        parts.push(
          <em key={uniqueKey} className="italic text-neutral-200">
            {parseInlineElements(match[1], uniqueKey)}
          </em>
        );
        break;
      case 'strikethrough':
        parts.push(
          <del key={uniqueKey} className="line-through text-neutral-500">
            {parseInlineElements(match[1], uniqueKey)}
          </del>
        );
        break;
      case 'code':
        parts.push(
          <code
            key={uniqueKey}
            className="px-1.5 py-0.5 rounded bg-neutral-700 text-amber-300 font-mono text-xs"
          >
            {match[1]}
          </code>
        );
        break;
      case 'link':
        parts.push(
          <a
            key={uniqueKey}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {match[1]}
            <ExternalLink className="w-3 h-3" />
          </a>
        );
        break;
      case 'command': {
        const name = match[1].trim().slice(1);
        // Include any leading whitespace
        const leadingSpace = match[0].slice(0, match[0].indexOf('/'));
        if (leadingSpace) parts.push(leadingSpace);
        parts.push(
          <span
            key={uniqueKey}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-mono text-xs bg-blue-500/20 text-blue-300"
          >
            <Slash className="w-3 h-3" />
            {name}
          </span>
        );
        break;
      }
      case 'mention': {
        const name = match[1].trim().slice(1);
        const leadingSpace = match[0].slice(0, match[0].indexOf('@'));
        if (leadingSpace) parts.push(leadingSpace);
        parts.push(
          <span
            key={uniqueKey}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-mono text-xs bg-purple-500/20 text-purple-300"
          >
            <Bot className="w-3 h-3" />
            {name}
          </span>
        );
        break;
      }
    }

    remaining = remaining.slice(firstMatch.index + match[0].length);
  }

  return parts.length > 0 ? parts : [content];
}

// Check if a line is a block-level element (doesn't need <br> after it)
function isBlockElement(line: string): boolean {
  // Headers
  if (/^#{1,6}\s+/.test(line)) return true;
  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) return true;
  // Blockquote
  if (line.startsWith('> ')) return true;
  // Unordered list
  if (/^(\s*)[-*+]\s+/.test(line)) return true;
  // Ordered list
  if (/^(\s*)\d+\.\s+/.test(line)) return true;
  return false;
}

// Parse a single line for block-level elements
function parseBlockLine(line: string, key: string): React.ReactNode {
  // Headers
  const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headerMatch) {
    const level = Math.min(Math.max(headerMatch[1].length, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
    const text = headerMatch[2];
    const sizes: Record<number, string> = {
      1: 'text-xl font-bold text-white mt-3 mb-1',
      2: 'text-lg font-bold text-white mt-2 mb-1',
      3: 'text-base font-semibold text-white mt-2 mb-0.5',
      4: 'text-sm font-semibold text-neutral-100 mt-1 mb-0.5',
      5: 'text-sm font-medium text-neutral-200 mt-1',
      6: 'text-xs font-medium text-neutral-300 mt-1',
    };
    // Use createElement for dynamic heading level
    const headingClass = sizes[level];
    switch (level) {
      case 1: return <h1 key={key} className={headingClass}>{parseInlineElements(text, key)}</h1>;
      case 2: return <h2 key={key} className={headingClass}>{parseInlineElements(text, key)}</h2>;
      case 3: return <h3 key={key} className={headingClass}>{parseInlineElements(text, key)}</h3>;
      case 4: return <h4 key={key} className={headingClass}>{parseInlineElements(text, key)}</h4>;
      case 5: return <h5 key={key} className={headingClass}>{parseInlineElements(text, key)}</h5>;
      case 6: return <h6 key={key} className={headingClass}>{parseInlineElements(text, key)}</h6>;
    }
  }

  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
    return <hr key={key} className="my-2 border-neutral-700" />;
  }

  // Blockquote
  if (line.startsWith('> ')) {
    return (
      <blockquote
        key={key}
        className="pl-3 border-l-2 border-blue-500 text-neutral-300 italic"
      >
        {parseInlineElements(line.slice(2), key)}
      </blockquote>
    );
  }

  // Unordered list item
  const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
  if (ulMatch) {
    const indent = Math.floor(ulMatch[1].length / 2);
    return (
      <div
        key={key}
        className="flex items-start gap-2 py-0.5"
        style={{ paddingLeft: `${indent * 16}px` }}
      >
        <span className="text-blue-400 mt-0.5">•</span>
        <span>{parseInlineElements(ulMatch[2], key)}</span>
      </div>
    );
  }

  // Ordered list item
  const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
  if (olMatch) {
    const indent = Math.floor(olMatch[1].length / 2);
    return (
      <div
        key={key}
        className="flex items-start gap-2 py-0.5"
        style={{ paddingLeft: `${indent * 16}px` }}
      >
        <span className="text-blue-400 font-mono text-xs mt-0.5 min-w-[1.5em] text-right">
          {olMatch[2]}.
        </span>
        <span>{parseInlineElements(olMatch[3], key)}</span>
      </div>
    );
  }

  // Regular line with inline formatting
  return <span key={key}>{parseInlineElements(line, key)}</span>;
}

// Parse markdown content including code blocks
function parseMarkdown(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      // Parse block-level elements line by line
      const lines = textBefore.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line || i < lines.length - 1) {
          parts.push(parseBlockLine(line, `block-${key}-${i}`));
          // Only add <br> after inline text, not after block elements
          if (i < lines.length - 1 && !isBlockElement(line) && !isBlockElement(lines[i + 1])) {
            parts.push(<br key={`br-${key}-${i}`} />);
          }
        }
      }
      key++;
    }

    // Add the code block
    const language = match[1] || 'text';
    const code = match[2].trim();

    parts.push(
      <CodeBlock key={`code-${key++}`} language={language} code={code} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    // Parse block-level elements line by line
    const lines = remaining.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line || i < lines.length - 1) {
        parts.push(parseBlockLine(line, `remaining-${key}-${i}`));
        // Only add <br> after inline text, not after block elements
        if (i < lines.length - 1 && !isBlockElement(line) && !isBlockElement(lines[i + 1])) {
          parts.push(<br key={`br-remaining-${key}-${i}`} />);
        }
      }
    }
  }

  return parts.length > 0 ? parts : [content];
}

export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  className,
}: ChatMarkdownProps) {
  const parsedContent = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      className={cn(
        'text-sm break-words leading-relaxed',
        className
      )}
    >
      {parsedContent}
    </div>
  );
});
