/**
 * GitHub API Service
 * Handles all GitHub operations for the IDE
 */

import {
  getStoredGitHubToken as _getStoredGitHubToken,
  setStoredGitHubToken as _setStoredGitHubToken,
  clearStoredGitHubToken as _clearStoredGitHubToken,
  getStoredSelectedRepo,
} from '../auth';

// Re-export token functions for convenience
export const getStoredGitHubToken = _getStoredGitHubToken;
export const setStoredGitHubToken = _setStoredGitHubToken;
export const clearStoredGitHubToken = _clearStoredGitHubToken;

// =============================================================================
// TYPES
// =============================================================================

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  sha?: string;
  size?: number;
  children?: FileNode[];
}

export interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export interface CommitResult {
  sha: string;
  message: string;
  url: string;
}

// =============================================================================
// API HELPERS
// =============================================================================

async function githubFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredGitHubToken();

  if (!token) {
    throw new Error('No GitHub token available');
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// =============================================================================
// FILE TREE OPERATIONS
// =============================================================================

/**
 * Get the full file tree for a repository
 * Uses the Git Trees API for efficiency (single request for entire tree)
 */
export async function getFileTree(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<FileNode[]> {
  // Get the tree recursively
  const tree = await githubFetch<GitHubTree>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  // Convert flat tree to nested structure
  return buildNestedTree(tree.tree);
}

/**
 * Convert flat GitHub tree to nested FileNode structure
 */
function buildNestedTree(items: GitHubTreeItem[]): FileNode[] {
  const root: FileNode[] = [];
  const pathMap = new Map<string, FileNode>();

  // Sort items to ensure directories come before their contents
  const sortedItems = [...items].sort((a, b) => {
    const aDepth = a.path.split('/').length;
    const bDepth = b.path.split('/').length;
    return aDepth - bDepth;
  });

  for (const item of sortedItems) {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');

    const node: FileNode = {
      name,
      path: item.path,
      type: item.type === 'tree' ? 'directory' : 'file',
      sha: item.sha,
      size: item.size,
      children: item.type === 'tree' ? [] : undefined,
    };

    pathMap.set(item.path, node);

    if (parentPath === '') {
      // Root level item
      root.push(node);
    } else {
      // Find parent and add as child
      const parent = pathMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  }

  // Sort children: directories first, then alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
}

/**
 * Get contents of a directory (non-recursive)
 */
export async function getDirectoryContents(
  owner: string,
  repo: string,
  path: string = '',
  branch: string = 'main'
): Promise<GitHubFile[]> {
  const endpoint = path
    ? `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    : `/repos/${owner}/${repo}/contents?ref=${branch}`;

  return githubFetch<GitHubFile[]>(endpoint);
}

// =============================================================================
// FILE CONTENT OPERATIONS
// =============================================================================

/**
 * Get the content of a single file
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<FileContent> {
  const data = await githubFetch<{
    name: string;
    path: string;
    sha: string;
    size: number;
    content: string;
    encoding: string;
  }>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);

  // Decode base64 content
  const content =
    data.encoding === 'base64'
      ? decodeBase64(data.content)
      : data.content;

  return {
    ...data,
    content,
  };
}

/**
 * Get raw file content (for large files)
 */
export async function getRawFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<string> {
  const token = getStoredGitHubToken();

  if (!token) {
    throw new Error('No GitHub token available');
  }

  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  return response.text();
}

// =============================================================================
// FILE MODIFICATION OPERATIONS
// =============================================================================

/**
 * Create or update a file in the repository
 */
export async function saveFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  sha?: string
): Promise<CommitResult> {
  // If no SHA provided, try to get current file SHA
  let fileSha = sha;
  if (!fileSha) {
    try {
      const existing = await getFileContent(owner, repo, path, branch);
      fileSha = existing.sha;
    } catch {
      // File doesn't exist, this is a new file
    }
  }

  const body: Record<string, string> = {
    message,
    content: encodeBase64(content),
    branch,
  };

  if (fileSha) {
    body.sha = fileSha;
  }

  const result = await githubFetch<{
    commit: {
      sha: string;
      message: string;
      html_url: string;
    };
    content: {
      sha: string;
    };
  }>(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return {
    sha: result.commit.sha,
    message: result.commit.message,
    url: result.commit.html_url,
  };
}

/**
 * Delete a file from the repository
 */
export async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string,
  branch: string = 'main'
): Promise<CommitResult> {
  const result = await githubFetch<{
    commit: {
      sha: string;
      message: string;
      html_url: string;
    };
  }>(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha,
      branch,
    }),
  });

  return {
    sha: result.commit.sha,
    message: result.commit.message,
    url: result.commit.html_url,
  };
}

// =============================================================================
// BRANCH OPERATIONS
// =============================================================================

/**
 * Get list of branches
 */
export async function getBranches(
  owner: string,
  repo: string
): Promise<{ name: string; protected: boolean }[]> {
  return githubFetch<{ name: string; protected: boolean }[]>(
    `/repos/${owner}/${repo}/branches`
  );
}

/**
 * Create a new branch
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromRef: string = 'main'
): Promise<void> {
  // Get the SHA of the source ref
  const ref = await githubFetch<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${fromRef}`
  );

  // Create the new branch
  await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    }),
  });
}

// =============================================================================
// COMMIT OPERATIONS
// =============================================================================

/**
 * Get recent commits
 */
export async function getCommits(
  owner: string,
  repo: string,
  branch: string = 'main',
  limit: number = 10
): Promise<
  {
    sha: string;
    message: string;
    author: string;
    date: string;
  }[]
> {
  const commits = await githubFetch<
    {
      sha: string;
      commit: {
        message: string;
        author: {
          name: string;
          date: string;
        };
      };
    }[]
  >(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${limit}`);

  return commits.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Decode base64 content (handles Unicode)
 */
function decodeBase64(str: string): string {
  // Remove any whitespace from the base64 string
  const cleaned = str.replace(/\s/g, '');

  try {
    // Try standard atob first
    return decodeURIComponent(
      atob(cleaned)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    // Fallback for non-UTF8 content
    return atob(cleaned);
  }
}

/**
 * Encode content to base64 (handles Unicode)
 */
function encodeBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return btoa(str);
  }
}

/**
 * Get language from file extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    graphql: 'graphql',
    gql: 'graphql',
  };

  return languageMap[ext] || 'plaintext';
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get file tree for the currently selected repo
 */
export async function getCurrentRepoTree(): Promise<FileNode[]> {
  const repo = getStoredSelectedRepo();
  if (!repo) {
    throw new Error('No repository selected');
  }

  return getFileTree(repo.owner.login, repo.name, repo.default_branch);
}

/**
 * Get file content for the currently selected repo
 */
export async function getCurrentRepoFile(path: string): Promise<FileContent> {
  const repo = getStoredSelectedRepo();
  if (!repo) {
    throw new Error('No repository selected');
  }

  return getFileContent(repo.owner.login, repo.name, path, repo.default_branch);
}

/**
 * Save file to the currently selected repo
 */
export async function saveCurrentRepoFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<CommitResult> {
  const repo = getStoredSelectedRepo();
  if (!repo) {
    throw new Error('No repository selected');
  }

  return saveFile(
    repo.owner.login,
    repo.name,
    path,
    content,
    message,
    repo.default_branch,
    sha
  );
}
