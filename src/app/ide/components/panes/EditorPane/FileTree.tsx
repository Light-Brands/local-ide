'use client';

import { useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/lib/ide/services/github';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileCode,
  FileJson,
  FileText,
  Image,
  Settings,
  Shield,
  Code2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// Extended FileNode with scope information
interface ScopedFileNode extends FileNode {
  scope?: 'user' | 'core' | 'config';
}

interface FileTreeProps {
  tree: ScopedFileNode[];
  expandedFolders: string[];
  activeFile: string | null;
  unsavedFiles: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
  onRefresh: () => void;
  repoName?: string;
  scope?: 'workspace' | 'all';
  onScopeChange?: (scope: 'workspace' | 'all') => void;
}

// Get file icon based on extension
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const iconMap: Record<string, typeof File> = {
    // Code files
    ts: FileCode,
    tsx: FileCode,
    js: FileCode,
    jsx: FileCode,
    py: FileCode,
    rs: FileCode,
    go: FileCode,
    java: FileCode,
    cpp: FileCode,
    c: FileCode,
    h: FileCode,

    // Data files
    json: FileJson,
    yaml: FileJson,
    yml: FileJson,
    toml: FileJson,

    // Text/docs
    md: FileText,
    txt: FileText,
    readme: FileText,

    // Images
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
    webp: Image,
    ico: Image,

    // Config
    config: Settings,
    env: Settings,
  };

  // Check for config files by name
  if (name.startsWith('.') || name.includes('config') || name.includes('rc')) {
    return Settings;
  }

  return iconMap[ext] || File;
}

// File tree item component
const FileTreeItem = memo(function FileTreeItem({
  node,
  depth,
  isExpanded,
  isActive,
  hasUnsaved,
  onFileClick,
  onFolderToggle,
  expandedFolders,
  activeFile,
  unsavedFiles,
  showScope,
}: {
  node: ScopedFileNode;
  depth: number;
  isExpanded: boolean;
  isActive: boolean;
  hasUnsaved: boolean;
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
  expandedFolders: string[];
  activeFile: string | null;
  unsavedFiles: Record<string, string>;
  showScope?: boolean;
}) {
  const FileIcon = node.type === 'file' ? getFileIcon(node.name) : null;
  const isCore = node.scope === 'core';
  const isConfig = node.scope === 'config';

  // Folder colors based on scope
  const getFolderColor = () => {
    if (isCore) return 'text-purple-400';
    if (isConfig) return 'text-blue-400';
    return 'text-amber-400'; // user scope
  };

  return (
    <div>
      <button
        onClick={() => {
          if (node.type === 'directory') {
            onFolderToggle(node.path);
          } else {
            onFileClick(node.path);
          }
        }}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors',
          'hover:bg-neutral-800/50',
          isActive && 'bg-primary-500/20 text-primary-400',
          !isActive && 'text-neutral-300',
          isCore && !isActive && 'text-neutral-400'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={showScope && isCore ? 'Core file (protected)' : undefined}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-neutral-500" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-500" />
            )}
            {isExpanded ? (
              <FolderOpen className={cn('w-4 h-4 flex-shrink-0', getFolderColor())} />
            ) : (
              <Folder className={cn('w-4 h-4 flex-shrink-0', getFolderColor())} />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            {FileIcon && (
              <FileIcon className={cn(
                'w-4 h-4 flex-shrink-0',
                isCore ? 'text-neutral-500' : 'text-neutral-400'
              )} />
            )}
          </>
        )}
        <span className="truncate flex-1 text-left">{node.name}</span>
        {showScope && isCore && (
          <span title="Core">
            <Shield className="w-3 h-3 text-purple-400/60 flex-shrink-0" />
          </span>
        )}
        {hasUnsaved && (
          <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
        )}
      </button>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {(node.children as ScopedFileNode[]).map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedFolders.includes(child.path)}
              isActive={activeFile === child.path}
              hasUnsaved={unsavedFiles[child.path] !== undefined}
              onFileClick={onFileClick}
              onFolderToggle={onFolderToggle}
              expandedFolders={expandedFolders}
              activeFile={activeFile}
              unsavedFiles={unsavedFiles}
              showScope={showScope}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const FileTree = memo(function FileTree({
  tree,
  expandedFolders,
  activeFile,
  unsavedFiles,
  isLoading,
  error,
  onFileClick,
  onFolderToggle,
  onRefresh,
  repoName,
  scope = 'workspace',
  onScopeChange,
}: FileTreeProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tree based on search query
  const filterTree = useCallback((nodes: ScopedFileNode[], query: string): ScopedFileNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes.reduce<ScopedFileNode[]>((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(lowerQuery)) {
          acc.push(node);
        }
      } else if (node.children) {
        const filteredChildren = filterTree(node.children as ScopedFileNode[], query);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQuery)) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  }, []);

  const displayTree = showSearch && searchQuery ? filterTree(tree, searchQuery) : tree;
  const isAllScope = scope === 'all';

  return (
    <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider truncate">
          {repoName || 'Workspace'}
        </span>
        <div className="flex items-center gap-1">
          {onScopeChange && (
            <button
              onClick={() => onScopeChange(isAllScope ? 'workspace' : 'all')}
              className={cn(
                'p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors',
                isAllScope && 'bg-purple-500/20 text-purple-400'
              )}
              title={isAllScope ? 'Show workspace only' : 'Show all files'}
            >
              {isAllScope ? (
                <Code2 className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              'p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors',
              showSearch && 'bg-neutral-800 text-neutral-200'
            )}
            title="Search files"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scope indicator */}
      {isAllScope && (
        <div className="px-3 py-1.5 bg-purple-500/10 border-b border-purple-500/20">
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <Shield className="w-3 h-3" />
            <span>Viewing all files (including core)</span>
          </div>
        </div>
      )}

      {/* Search input */}
      {showSearch && (
        <div className="px-2 py-2 border-b border-neutral-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full px-2 py-1.5 text-sm bg-neutral-800 text-neutral-200 rounded border border-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none placeholder:text-neutral-500"
            autoFocus
          />
        </div>
      )}

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {isLoading && tree.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : error && tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : displayTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Folder className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-500">
              {searchQuery ? 'No files match your search' : 'No files found'}
            </p>
          </div>
        ) : (
          displayTree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              isExpanded={expandedFolders.includes(node.path)}
              isActive={activeFile === node.path}
              hasUnsaved={unsavedFiles[node.path] !== undefined}
              onFileClick={onFileClick}
              onFolderToggle={onFolderToggle}
              expandedFolders={expandedFolders}
              activeFile={activeFile}
              unsavedFiles={unsavedFiles}
              showScope={isAllScope}
            />
          ))
        )}
      </div>
    </div>
  );
});
