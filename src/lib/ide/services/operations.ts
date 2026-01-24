/**
 * Operation Tracking Service
 * Tracks AI operations (reads, writes, globs, searches, agents, commands) in real-time
 */

// =============================================================================
// TYPES
// =============================================================================

export type OperationType =
  | 'read'
  | 'write'
  | 'edit'
  | 'glob'
  | 'grep'
  | 'bash'
  | 'agent'
  | 'research'
  | 'skill'
  | 'thinking';

export type OperationStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';

export interface Operation {
  id: string;
  type: OperationType;
  status: OperationStatus;
  title: string;
  description?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  metadata?: Record<string, unknown>;
  error?: string;
}

export type OperationFilter = 'all' | 'files' | 'search' | 'commands' | 'agents';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_OPERATIONS = 100;

// Map tool names from Claude API to operation types
export const TOOL_TO_OPERATION_TYPE: Record<string, OperationType> = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Glob: 'glob',
  Grep: 'grep',
  Bash: 'bash',
  Task: 'agent',
  WebFetch: 'research',
  WebSearch: 'research',
  Skill: 'skill',
};

// Filter mappings
export const FILTER_TYPES: Record<OperationFilter, OperationType[]> = {
  all: [],
  files: ['read', 'write', 'edit'],
  search: ['glob', 'grep'],
  commands: ['bash'],
  agents: ['agent', 'research', 'skill', 'thinking'],
};

// Operation display info
export const OPERATION_INFO: Record<OperationType, { icon: string; color: string; label: string }> = {
  read: { icon: 'FileText', color: 'blue', label: 'Reading' },
  write: { icon: 'Save', color: 'green', label: 'Writing' },
  edit: { icon: 'Edit3', color: 'amber', label: 'Editing' },
  glob: { icon: 'FolderOpen', color: 'purple', label: 'Searching files' },
  grep: { icon: 'Search', color: 'cyan', label: 'Searching code' },
  bash: { icon: 'Terminal', color: 'orange', label: 'Running command' },
  agent: { icon: 'Bot', color: 'pink', label: 'Agent working' },
  research: { icon: 'Globe', color: 'indigo', label: 'Researching' },
  skill: { icon: 'Zap', color: 'yellow', label: 'Running skill' },
  thinking: { icon: 'Brain', color: 'neutral', label: 'Thinking' },
};

// =============================================================================
// OPERATION TRACKER SERVICE
// =============================================================================

type OperationListener = (operations: Operation[]) => void;

class OperationTrackerService {
  private operations: Operation[] = [];
  private listeners: Set<OperationListener> = new Set();

  // ===========================================================================
  // LIFECYCLE METHODS
  // ===========================================================================

  /**
   * Start a new operation
   */
  startOperation(
    type: OperationType,
    title: string,
    options?: {
      id?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Operation {
    const operation: Operation = {
      id: options?.id || crypto.randomUUID(),
      type,
      status: 'running',
      title,
      description: options?.description,
      startedAt: new Date(),
      metadata: options?.metadata,
    };

    this.operations.push(operation);
    this.enforceLimit();
    this.notifyListeners();

    return operation;
  }

  /**
   * Complete an operation with success or error
   */
  completeOperation(
    id: string,
    status: 'success' | 'error' | 'cancelled' = 'success',
    options?: {
      error?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    const operation = this.operations.find((op) => op.id === id);
    if (!operation) return;

    operation.status = status;
    operation.completedAt = new Date();
    operation.duration = operation.completedAt.getTime() - operation.startedAt.getTime();

    if (options?.error) {
      operation.error = options.error;
    }
    if (options?.metadata) {
      operation.metadata = { ...operation.metadata, ...options.metadata };
    }

    this.notifyListeners();
  }

  /**
   * Update an operation's metadata or description
   */
  updateOperation(
    id: string,
    updates: {
      title?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    const operation = this.operations.find((op) => op.id === id);
    if (!operation) return;

    if (updates.title) operation.title = updates.title;
    if (updates.description) operation.description = updates.description;
    if (updates.metadata) {
      operation.metadata = { ...operation.metadata, ...updates.metadata };
    }

    this.notifyListeners();
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  trackRead(path: string, id?: string): Operation {
    const fileName = path.split('/').pop() || path;
    return this.startOperation('read', `Reading ${fileName}`, {
      id,
      description: path,
      metadata: { path },
    });
  }

  trackWrite(path: string, id?: string): Operation {
    const fileName = path.split('/').pop() || path;
    return this.startOperation('write', `Writing ${fileName}`, {
      id,
      description: path,
      metadata: { path },
    });
  }

  trackEdit(path: string, id?: string): Operation {
    const fileName = path.split('/').pop() || path;
    return this.startOperation('edit', `Editing ${fileName}`, {
      id,
      description: path,
      metadata: { path },
    });
  }

  trackGlob(pattern: string, id?: string): Operation {
    return this.startOperation('glob', `Searching: ${pattern}`, {
      id,
      description: pattern,
      metadata: { pattern },
    });
  }

  trackGrep(pattern: string, id?: string): Operation {
    const truncated = pattern.length > 30 ? pattern.slice(0, 30) + '...' : pattern;
    return this.startOperation('grep', `Searching: ${truncated}`, {
      id,
      description: pattern,
      metadata: { pattern },
    });
  }

  trackBash(command: string, id?: string): Operation {
    const truncated = command.length > 40 ? command.slice(0, 40) + '...' : command;
    return this.startOperation('bash', `$ ${truncated}`, {
      id,
      description: command,
      metadata: { command },
    });
  }

  trackAgent(description: string, id?: string): Operation {
    return this.startOperation('agent', description, {
      id,
      metadata: { agentType: 'task' },
    });
  }

  trackResearch(query: string, id?: string): Operation {
    const truncated = query.length > 40 ? query.slice(0, 40) + '...' : query;
    return this.startOperation('research', `Searching: ${truncated}`, {
      id,
      description: query,
      metadata: { query },
    });
  }

  trackSkill(name: string, id?: string): Operation {
    return this.startOperation('skill', `Running /${name}`, {
      id,
      metadata: { skill: name },
    });
  }

  trackThinking(id?: string): Operation {
    return this.startOperation('thinking', 'Thinking...', { id });
  }

  /**
   * Track a tool use from Claude API
   */
  trackToolUse(toolName: string, input: Record<string, unknown>, id?: string): Operation | null {
    const type = TOOL_TO_OPERATION_TYPE[toolName];
    if (!type) return null;

    // Generate appropriate title based on tool
    let title = OPERATION_INFO[type].label;
    let description: string | undefined;

    switch (toolName) {
      case 'Read':
        if (input.file_path) {
          const path = input.file_path as string;
          title = `Reading ${path.split('/').pop()}`;
          description = path;
        }
        break;
      case 'Write':
        if (input.file_path) {
          const path = input.file_path as string;
          title = `Writing ${path.split('/').pop()}`;
          description = path;
        }
        break;
      case 'Edit':
        if (input.file_path) {
          const path = input.file_path as string;
          title = `Editing ${path.split('/').pop()}`;
          description = path;
        }
        break;
      case 'Glob':
        if (input.pattern) {
          title = `Glob: ${input.pattern}`;
          description = input.pattern as string;
        }
        break;
      case 'Grep':
        if (input.pattern) {
          const pattern = input.pattern as string;
          title = `Grep: ${pattern.slice(0, 30)}${pattern.length > 30 ? '...' : ''}`;
          description = pattern;
        }
        break;
      case 'Bash':
        if (input.command) {
          const cmd = input.command as string;
          title = `$ ${cmd.slice(0, 40)}${cmd.length > 40 ? '...' : ''}`;
          description = cmd;
        }
        break;
      case 'Task':
        if (input.description) {
          title = input.description as string;
        }
        break;
      case 'WebFetch':
        if (input.url) {
          title = `Fetching: ${(input.url as string).slice(0, 30)}...`;
        }
        break;
      case 'WebSearch':
        if (input.query) {
          title = `Searching: ${(input.query as string).slice(0, 30)}...`;
        }
        break;
      case 'Skill':
        if (input.skill) {
          title = `Running /${input.skill}`;
        }
        break;
    }

    return this.startOperation(type, title, {
      id,
      description,
      metadata: { toolName, input },
    });
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  getAll(): Operation[] {
    return [...this.operations];
  }

  getRecent(count: number = 50): Operation[] {
    return this.operations.slice(-count).reverse();
  }

  getRunning(): Operation[] {
    return this.operations.filter((op) => op.status === 'running');
  }

  getByFilter(filter: OperationFilter): Operation[] {
    if (filter === 'all') return this.getRecent();

    const types = FILTER_TYPES[filter];
    return this.operations
      .filter((op) => types.includes(op.type))
      .slice(-50)
      .reverse();
  }

  getById(id: string): Operation | undefined {
    return this.operations.find((op) => op.id === id);
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  subscribe(listener: OperationListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current operations
    listener(this.getRecent());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const recent = this.getRecent();
    this.listeners.forEach((listener) => listener(recent));
  }

  // ===========================================================================
  // MANAGEMENT
  // ===========================================================================

  clear(): void {
    this.operations = [];
    this.notifyListeners();
  }

  private enforceLimit(): void {
    if (this.operations.length > MAX_OPERATIONS) {
      this.operations = this.operations.slice(-MAX_OPERATIONS);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let operationTrackerInstance: OperationTrackerService | null = null;

export function getOperationTracker(): OperationTrackerService {
  if (!operationTrackerInstance) {
    operationTrackerInstance = new OperationTrackerService();
  }
  return operationTrackerInstance;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatOperationDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function getOperationStatusColor(status: OperationStatus): string {
  switch (status) {
    case 'pending':
      return 'text-neutral-500';
    case 'running':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'cancelled':
      return 'text-neutral-400';
    default:
      return 'text-neutral-500';
  }
}

export function getOperationTypeColor(type: OperationType): string {
  const colors: Record<OperationType, string> = {
    read: 'text-blue-500 bg-blue-500/10',
    write: 'text-green-500 bg-green-500/10',
    edit: 'text-amber-500 bg-amber-500/10',
    glob: 'text-purple-500 bg-purple-500/10',
    grep: 'text-cyan-500 bg-cyan-500/10',
    bash: 'text-orange-500 bg-orange-500/10',
    agent: 'text-pink-500 bg-pink-500/10',
    research: 'text-indigo-500 bg-indigo-500/10',
    skill: 'text-yellow-500 bg-yellow-500/10',
    thinking: 'text-neutral-500 bg-neutral-500/10',
  };
  return colors[type] || 'text-neutral-500 bg-neutral-500/10';
}
