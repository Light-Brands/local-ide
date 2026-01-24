/**
 * File Tree API
 *
 * Returns a hierarchical tree of the project directory structure.
 * Supports scoped views: 'workspace' (user-editable) vs 'all' (full codebase)
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Project root - always this app (self-evolving platform)
const PROJECT_ROOT = process.cwd();

// =============================================================================
// WORKSPACE CONFIGURATION
// =============================================================================

// User-editable paths (the "workspace")
const USER_WORKSPACE_PATHS = [
  'src/app/(public)',       // User's app pages
  'src/components/custom',  // User's custom components
  'src/lib/custom',         // User's utilities
  'public',                 // Static assets
];

// Core/protected paths (IDE infrastructure)
const CORE_PATHS = [
  'src/app/ide',
  'src/app/(admin)',
  'src/app/api',
  'src/lib/ide',
  'src/components/ui',
  'src/components/admin',
  'server',
];

// Directories and files to always exclude
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.lock',
  '.env.local',
  '.env.*.local',
  '.local-ide',
];

// =============================================================================
// TYPES
// =============================================================================

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  scope?: 'user' | 'core' | 'config';  // Indicates editability
  children?: TreeNode[];
}

type Scope = 'workspace' | 'all';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a name matches any ignore pattern
 */
function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
      );
      return regex.test(name);
    }
    return name === pattern;
  });
}

/**
 * Determine the scope of a path
 */
function getPathScope(relativePath: string): 'user' | 'core' | 'config' {
  // Check if it's a user workspace path
  for (const userPath of USER_WORKSPACE_PATHS) {
    if (relativePath.startsWith(userPath) || relativePath === userPath) {
      return 'user';
    }
  }

  // Check if it's a core path
  for (const corePath of CORE_PATHS) {
    if (relativePath.startsWith(corePath) || relativePath === corePath) {
      return 'core';
    }
  }

  // Config files at root level
  if (!relativePath.includes('/')) {
    return 'config';
  }

  return 'core';
}

/**
 * Check if path should be included in workspace view
 */
function isInWorkspace(relativePath: string): boolean {
  for (const userPath of USER_WORKSPACE_PATHS) {
    if (relativePath.startsWith(userPath) || userPath.startsWith(relativePath)) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively build directory tree
 */
async function buildTree(
  dirPath: string,
  relativePath: string = '',
  scope: Scope = 'all',
  maxDepth: number = 15,
  currentDepth: number = 0
): Promise<TreeNode[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      // Skip ignored files/directories
      if (shouldIgnore(entry.name)) {
        continue;
      }

      const entryPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
      const fullPath = path.join(dirPath, entry.name);

      // In workspace scope, filter to only user paths
      if (scope === 'workspace' && !isInWorkspace(entryPath)) {
        continue;
      }

      const nodeScope = getPathScope(entryPath);

      if (entry.isDirectory()) {
        const children = await buildTree(
          fullPath,
          entryPath,
          scope,
          maxDepth,
          currentDepth + 1
        );

        // Don't include empty directories in workspace view
        if (scope === 'workspace' && children.length === 0 && !isInWorkspace(entryPath)) {
          continue;
        }

        nodes.push({
          name: entry.name,
          type: 'directory',
          path: entryPath,
          scope: nodeScope,
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          type: 'file',
          path: entryPath,
          scope: nodeScope,
        });
      }
    }

    // Sort: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`[Tree API] Error reading ${dirPath}:`, error);
    return [];
  }
}

/**
 * Build a focused tree starting from specific workspace paths
 */
async function buildWorkspaceTree(): Promise<TreeNode[]> {
  const workspaceNodes: TreeNode[] = [];

  for (const workspacePath of USER_WORKSPACE_PATHS) {
    const fullPath = path.join(PROJECT_ROOT, workspacePath);

    try {
      await fs.access(fullPath);
      const children = await buildTree(fullPath, workspacePath, 'workspace');

      // Create the path structure
      const parts = workspacePath.split('/');
      let currentLevel = workspaceNodes;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partPath = parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;

        let existing = currentLevel.find(n => n.name === part);

        if (!existing) {
          existing = {
            name: part,
            type: 'directory' as const,
            path: partPath,
            scope: 'user' as const,
            children: isLast ? children : [],
          };
          currentLevel.push(existing);
        } else if (isLast) {
          existing.children = children;
        }

        if (!isLast) {
          if (!existing.children) existing.children = [];
          currentLevel = existing.children;
        }
      }
    } catch {
      // Path doesn't exist yet, skip
    }
  }

  return workspaceNodes;
}

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * GET /api/files/tree?scope=workspace|all
 *
 * Returns the file tree
 * - scope=workspace: Only user-editable paths (default)
 * - scope=all: Full codebase (for advanced users)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scope = (searchParams.get('scope') || 'workspace') as Scope;

  try {
    let tree: TreeNode[];

    if (scope === 'workspace') {
      tree = await buildWorkspaceTree();
    } else {
      tree = await buildTree(PROJECT_ROOT, '', scope);
    }

    return NextResponse.json({
      root: PROJECT_ROOT,
      name: path.basename(PROJECT_ROOT),
      scope,
      workspacePaths: USER_WORKSPACE_PATHS,
      tree,
    });
  } catch (error) {
    console.error('[Tree API] Error building tree:', error);
    return NextResponse.json(
      { error: 'Failed to read directory tree' },
      { status: 500 }
    );
  }
}
