'use client';

import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, FileCode, Slash, Bot, ExternalLink, GitBranch, ZoomIn, ZoomOut, Maximize2, X, RotateCcw, Move } from 'lucide-react';

// Mermaid config for dark theme
const mermaidConfig = {
  startOnLoad: false,
  theme: 'dark' as const,
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#f5f5f5',
    primaryBorderColor: '#525252',
    lineColor: '#737373',
    secondaryColor: '#1e3a5f',
    tertiaryColor: '#262626',
    background: '#171717',
    mainBkg: '#262626',
    nodeBorder: '#525252',
    clusterBkg: '#1f1f1f',
    clusterBorder: '#404040',
    titleColor: '#f5f5f5',
    edgeLabelBackground: '#262626',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis' as const,
  },
  securityLevel: 'loose',
} as const;

// Track if mermaid has been initialized
let mermaidInitialized = false;

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

// Interactive diagram viewer modal
const DiagramViewer = memo(function DiagramViewer({
  svgContent,
  onClose,
}: {
  svgContent: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.25, 0.25));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(z + delta, 0.25), 4));
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-neutral-800/90 rounded-lg px-2 py-1.5 border border-neutral-700 shadow-lg">
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-2 text-xs text-neutral-400 font-mono min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-neutral-600 mx-1" />
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-neutral-600 mx-1" />
        <div className="flex items-center gap-1 px-1.5 text-neutral-500">
          <Move className="w-3 h-3" />
          <span className="text-xs">Drag to pan</span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[100] p-2 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Diagram container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <div
            className="[&>svg]:max-w-none [&>svg]:max-h-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    </div>
  );
});

// Mermaid diagram component
const MermaidBlock = memo(function MermaidBlock({
  code,
}: {
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const openViewer = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      try {
        // Dynamically import mermaid only on client
        const mermaid = (await import('mermaid')).default;

        // Initialize mermaid only once
        if (!mermaidInitialized) {
          mermaid.initialize(mermaidConfig);
          mermaidInitialized = true;
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram - mermaid.render returns SVG string
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvgContent(null);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <>
      <div className="my-2 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-750 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-mono">mermaid</span>
          </div>
          <div className="flex items-center gap-1">
            {svgContent && (
              <button
                onClick={openViewer}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                title="Open interactive viewer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand</span>
              </button>
            )}
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
        </div>
        <div className="p-4 overflow-x-auto bg-neutral-900/50">
          {error ? (
            <div className="text-red-400 text-sm">
              <p className="font-medium mb-1">Diagram error:</p>
              <pre className="text-xs text-red-300 bg-red-900/20 p-2 rounded overflow-x-auto">
                {error}
              </pre>
              <pre className="mt-2 text-xs text-neutral-400 bg-neutral-800 p-2 rounded overflow-x-auto">
                {code}
              </pre>
            </div>
          ) : svgContent ? (
            <div
              className="flex justify-center [&>svg]:max-w-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={openViewer}
              title="Click to expand"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex justify-center animate-pulse">
              <div className="text-neutral-500 text-sm py-4">Rendering diagram...</div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen viewer modal */}
      {isViewerOpen && svgContent && (
        <DiagramViewer svgContent={svgContent} onClose={closeViewer} />
      )}
    </>
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

    // Use MermaidBlock for mermaid diagrams, CodeBlock for everything else
    if (language.toLowerCase() === 'mermaid') {
      parts.push(
        <MermaidBlock key={`mermaid-${key++}`} code={code} />
      );
    } else {
      parts.push(
        <CodeBlock key={`code-${key++}`} language={language} code={code} />
      );
    }

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
