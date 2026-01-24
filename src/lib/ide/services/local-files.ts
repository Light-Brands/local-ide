/**
 * Local File System Service
 *
 * Provides file system operations for the local IDE using the /api/files endpoints.
 */

export interface LocalFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  scope?: 'user' | 'core' | 'config';
  children?: LocalFileNode[];
}

export type FileTreeScope = 'workspace' | 'all';

export interface LocalFile {
  path: string;
  content: string;
  size?: number;
  modified?: string;
}

const API_BASE = '/api/files';

/**
 * Fetch the file tree from the local API
 * @param scope - 'workspace' for user-editable files only, 'all' for full codebase
 */
export async function getLocalFileTree(scope: FileTreeScope = 'workspace'): Promise<LocalFileNode[]> {
  try {
    const response = await fetch(`${API_BASE}/tree?scope=${scope}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file tree: ${response.status}`);
    }
    const data = await response.json();
    return data.tree || [];
  } catch (error) {
    console.error('[LocalFiles] Failed to fetch tree:', error);
    throw error;
  }
}

/**
 * Read a file from the local file system
 */
export async function getLocalFile(path: string): Promise<LocalFile> {
  try {
    const response = await fetch(`${API_BASE}?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.status}`);
    }
    const data = await response.json();
    if (data.type === 'directory') {
      throw new Error('Path is a directory, not a file');
    }
    return {
      path: data.path,
      content: data.content,
      size: data.size,
      modified: data.modified,
    };
  } catch (error) {
    console.error('[LocalFiles] Failed to read file:', error);
    throw error;
  }
}

/**
 * Save a file to the local file system
 */
export async function saveLocalFile(path: string, content: string): Promise<void> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    });
    if (!response.ok) {
      throw new Error(`Failed to save file: ${response.status}`);
    }
  } catch (error) {
    console.error('[LocalFiles] Failed to save file:', error);
    throw error;
  }
}

/**
 * Delete a file from the local file system
 */
export async function deleteLocalFile(path: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.status}`);
    }
  } catch (error) {
    console.error('[LocalFiles] Failed to delete file:', error);
    throw error;
  }
}

/**
 * Get the file language based on extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    sql: 'sql',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    markdown: 'markdown',
    txt: 'text',
    log: 'text',
    env: 'text',
    gitignore: 'text',
    dockerfile: 'dockerfile',
    toml: 'toml',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',
  };
  return languageMap[ext] || 'text';
}
