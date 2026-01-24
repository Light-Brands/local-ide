'use client';

import { useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { X, FileCode, FileJson, FileText, File, Image, Settings } from 'lucide-react';

interface FileTabsProps {
  openFiles: string[];
  activeFile: string | null;
  unsavedFiles: Record<string, string>;
  onFileSelect: (path: string) => void;
  onFileClose: (path: string) => void;
}

// Get file icon based on extension
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const iconMap: Record<string, typeof File> = {
    ts: FileCode,
    tsx: FileCode,
    js: FileCode,
    jsx: FileCode,
    py: FileCode,
    rs: FileCode,
    go: FileCode,
    json: FileJson,
    yaml: FileJson,
    yml: FileJson,
    md: FileText,
    txt: FileText,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
  };

  if (name.startsWith('.') || name.includes('config')) {
    return Settings;
  }

  return iconMap[ext] || File;
}

// Get color for file type
function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const colorMap: Record<string, string> = {
    ts: 'text-blue-400',
    tsx: 'text-blue-400',
    js: 'text-yellow-400',
    jsx: 'text-yellow-400',
    py: 'text-green-400',
    rs: 'text-orange-400',
    json: 'text-amber-400',
    md: 'text-neutral-400',
    css: 'text-pink-400',
    html: 'text-orange-400',
  };

  return colorMap[ext] || 'text-neutral-400';
}

export const FileTabs = memo(function FileTabs({
  openFiles,
  activeFile,
  unsavedFiles,
  onFileSelect,
  onFileClose,
}: FileTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeFile]);

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 flex items-center bg-neutral-900 border-b border-neutral-800 overflow-x-auto pane-scroll"
    >
      {openFiles.map((filePath) => {
        const fileName = filePath.split('/').pop() || filePath;
        const isActive = activeFile === filePath;
        const hasUnsaved = unsavedFiles[filePath] !== undefined;
        const FileIcon = getFileIcon(fileName);
        const fileColor = getFileColor(fileName);

        return (
          <button
            key={filePath}
            ref={isActive ? activeTabRef : null}
            onClick={() => onFileSelect(filePath)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 text-sm border-r border-neutral-800 transition-colors whitespace-nowrap flex-shrink-0',
              isActive
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <FileIcon className={cn('w-4 h-4 flex-shrink-0', isActive ? fileColor : 'text-neutral-500')} />

            <span className="truncate max-w-[120px]">{fileName}</span>

            {hasUnsaved && (
              <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(filePath);
              }}
              className={cn(
                'p-0.5 rounded transition-colors flex-shrink-0',
                'hover:bg-neutral-700 text-neutral-500 hover:text-neutral-200',
                !isActive && 'opacity-0 group-hover:opacity-100'
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </button>
        );
      })}
    </div>
  );
});
