/**
 * Activity Tracking Service
 * Tracks and manages IDE activity events
 */

import { IDE_FEATURES } from '../features';
import { safeIDEOperation } from '../error-handler';

// =============================================================================
// TYPES
// =============================================================================

export type ActivityType =
  | 'file_open'
  | 'file_save'
  | 'file_create'
  | 'file_delete'
  | 'terminal_command'
  | 'terminal_output'
  | 'ai_message'
  | 'ai_response'
  | 'deployment_start'
  | 'deployment_success'
  | 'deployment_error'
  | 'database_query'
  | 'git_commit'
  | 'git_push'
  | 'error'
  | 'info';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type ActivityFilter = 'all' | 'files' | 'terminal' | 'ai' | 'deploy' | 'database';

// =============================================================================
// STORAGE
// =============================================================================

const ACTIVITY_STORAGE_KEY = 'local-ide-activity';
const MAX_ACTIVITIES = 500;

export function getStoredActivities(): Activity[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (!stored) return [];

  try {
    const activities = JSON.parse(stored);
    return activities.map((a: Activity) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  if (typeof window === 'undefined') return;
  // Keep only the most recent activities
  const toSave = activities.slice(-MAX_ACTIVITIES);
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(toSave));
}

export function clearActivities(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
}

// =============================================================================
// FILE-BASED PERSISTENCE (Server-side sync)
// =============================================================================

async function fetchActivitiesFromServer(): Promise<Activity[]> {
  if (!IDE_FEATURES.activityTracking) return [];

  const result = await safeIDEOperation(
    'Activity',
    'fetchFromServer',
    async () => {
      const response = await fetch('/api/activity?limit=500');
      if (!response.ok) return [];
      const data = await response.json();
      return data.activities.map((a: Activity & { timestamp: string }) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    },
    { fallback: [], severity: 'silent' }
  );

  return result ?? [];
}

async function syncActivitiesToServer(activities: Activity[]): Promise<void> {
  if (!IDE_FEATURES.activityTracking) return;

  await safeIDEOperation(
    'Activity',
    'syncToServer',
    async () => {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync: true,
          activities: activities.map(a => ({
            ...a,
            timestamp: a.timestamp.toISOString(),
          })),
        }),
      });
    },
    { severity: 'silent' }
  );
}

async function saveActivityToServer(activity: Activity): Promise<void> {
  if (!IDE_FEATURES.activityTracking) return;

  await safeIDEOperation(
    'Activity',
    'saveToServer',
    async () => {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activity,
          timestamp: activity.timestamp.toISOString(),
        }),
      });
    },
    { severity: 'silent' }
  );
}

async function clearActivitiesOnServer(): Promise<void> {
  if (!IDE_FEATURES.activityTracking) return;

  await safeIDEOperation(
    'Activity',
    'clearOnServer',
    async () => {
      await fetch('/api/activity', { method: 'DELETE' });
    },
    { severity: 'silent' }
  );
}

// =============================================================================
// ACTIVITY SERVICE CLASS
// =============================================================================

type ActivityListener = (activities: Activity[]) => void;

class ActivityService {
  private activities: Activity[] = [];
  private listeners: Set<ActivityListener> = new Set();
  private initialized = false;
  private serverSyncComplete = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // First, load from localStorage for immediate display
      this.activities = getStoredActivities();
      this.initialized = true;

      // Then sync with server for persistent storage
      this.syncWithServer();
    }
  }

  private async syncWithServer(): Promise<void> {
    if (this.serverSyncComplete) return;

    try {
      // Fetch activities from server
      const serverActivities = await fetchActivitiesFromServer();

      // Merge local and server activities by ID
      const existingIds = new Set(this.activities.map(a => a.id));
      const newFromServer = serverActivities.filter(a => !existingIds.has(a.id));

      if (newFromServer.length > 0) {
        this.activities = [...this.activities, ...newFromServer];
        // Sort by timestamp
        this.activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // Keep only recent
        if (this.activities.length > MAX_ACTIVITIES) {
          this.activities = this.activities.slice(-MAX_ACTIVITIES);
        }
        // Update localStorage
        saveActivities(this.activities);
        // Notify listeners of merged data
        this.notifyListeners();
      }

      // Sync local activities to server (in case there are any not on server)
      if (this.activities.length > 0) {
        await syncActivitiesToServer(this.activities);
      }

      this.serverSyncComplete = true;
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  // ===========================================================================
  // EVENT TRACKING
  // ===========================================================================

  track(
    type: ActivityType,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Activity {
    const activity: Activity = {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      timestamp: new Date(),
      metadata,
    };

    this.activities.push(activity);

    // Keep only recent activities
    if (this.activities.length > MAX_ACTIVITIES) {
      this.activities = this.activities.slice(-MAX_ACTIVITIES);
    }

    // Persist to localStorage
    saveActivities(this.activities);

    // Persist to server (fire and forget)
    saveActivityToServer(activity);

    // Notify listeners
    this.notifyListeners();

    return activity;
  }

  // Convenience methods for common events
  trackFileOpen(path: string): Activity {
    const fileName = path.split('/').pop() || path;
    return this.track('file_open', `Opened ${fileName}`, path);
  }

  trackFileSave(path: string, commitSha?: string): Activity {
    const fileName = path.split('/').pop() || path;
    return this.track('file_save', `Saved ${fileName}`, path, { commitSha });
  }

  trackFileCreate(path: string): Activity {
    const fileName = path.split('/').pop() || path;
    return this.track('file_create', `Created ${fileName}`, path);
  }

  trackFileDelete(path: string): Activity {
    const fileName = path.split('/').pop() || path;
    return this.track('file_delete', `Deleted ${fileName}`, path);
  }

  trackTerminalCommand(command: string): Activity {
    const truncated = command.length > 50 ? command.slice(0, 50) + '...' : command;
    return this.track('terminal_command', `$ ${truncated}`, command);
  }

  trackAIMessage(message: string): Activity {
    const truncated = message.length > 50 ? message.slice(0, 50) + '...' : message;
    return this.track('ai_message', truncated, message);
  }

  trackAIResponse(response: string): Activity {
    const truncated = response.length > 50 ? response.slice(0, 50) + '...' : response;
    return this.track('ai_response', `Claude: ${truncated}`, response);
  }

  trackDeploymentStart(name: string): Activity {
    return this.track('deployment_start', `Deployment started`, name);
  }

  trackDeploymentSuccess(name: string, url?: string): Activity {
    return this.track('deployment_success', `Deployment successful`, name, { url });
  }

  trackDeploymentError(name: string, error: string): Activity {
    return this.track('deployment_error', `Deployment failed`, error, { name });
  }

  trackDatabaseQuery(query: string): Activity {
    const truncated = query.length > 50 ? query.slice(0, 50) + '...' : query;
    return this.track('database_query', truncated, query);
  }

  trackGitCommit(message: string, sha: string): Activity {
    return this.track('git_commit', message, sha.slice(0, 7), { fullSha: sha });
  }

  trackGitPush(branch: string): Activity {
    return this.track('git_push', `Pushed to ${branch}`, branch);
  }

  trackError(message: string, details?: string): Activity {
    return this.track('error', message, details);
  }

  trackInfo(message: string, details?: string): Activity {
    return this.track('info', message, details);
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  getAll(): Activity[] {
    return [...this.activities];
  }

  getRecent(count: number = 50): Activity[] {
    return this.activities.slice(-count).reverse();
  }

  getByType(type: ActivityType): Activity[] {
    return this.activities.filter((a) => a.type === type).reverse();
  }

  getByFilter(filter: ActivityFilter): Activity[] {
    if (filter === 'all') return this.getAll().reverse();

    const typeMap: Record<ActivityFilter, ActivityType[]> = {
      all: [],
      files: ['file_open', 'file_save', 'file_create', 'file_delete'],
      terminal: ['terminal_command', 'terminal_output'],
      ai: ['ai_message', 'ai_response'],
      deploy: ['deployment_start', 'deployment_success', 'deployment_error', 'git_commit', 'git_push'],
      database: ['database_query'],
    };

    const types = typeMap[filter];
    return this.activities.filter((a) => types.includes(a.type)).reverse();
  }

  getByDateRange(start: Date, end: Date): Activity[] {
    return this.activities.filter(
      (a) => a.timestamp >= start && a.timestamp <= end
    ).reverse();
  }

  search(query: string): Activity[] {
    const lowerQuery = query.toLowerCase();
    return this.activities.filter(
      (a) =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.description?.toLowerCase().includes(lowerQuery)
    ).reverse();
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current activities
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
    this.activities = [];
    clearActivities();
    clearActivitiesOnServer();
    this.notifyListeners();
  }

  // Force a re-sync with the server
  async refresh(): Promise<void> {
    this.serverSyncComplete = false;
    await this.syncWithServer();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let activityInstance: ActivityService | null = null;

export function getActivityService(): ActivityService {
  if (!activityInstance) {
    activityInstance = new ActivityService();
  }
  return activityInstance;
}

// =============================================================================
// HELPERS
// =============================================================================

export function getActivityIcon(type: ActivityType): string {
  const iconMap: Record<ActivityType, string> = {
    file_open: 'FileText',
    file_save: 'Save',
    file_create: 'FilePlus',
    file_delete: 'Trash2',
    terminal_command: 'Terminal',
    terminal_output: 'Terminal',
    ai_message: 'MessageSquare',
    ai_response: 'Sparkles',
    deployment_start: 'Rocket',
    deployment_success: 'CheckCircle',
    deployment_error: 'XCircle',
    database_query: 'Database',
    git_commit: 'GitCommit',
    git_push: 'Upload',
    error: 'AlertCircle',
    info: 'Info',
  };

  return iconMap[type] || 'Circle';
}

export function getActivityColor(type: ActivityType): string {
  const colorMap: Record<ActivityType, string> = {
    file_open: 'text-blue-500',
    file_save: 'text-green-500',
    file_create: 'text-emerald-500',
    file_delete: 'text-red-500',
    terminal_command: 'text-amber-500',
    terminal_output: 'text-neutral-500',
    ai_message: 'text-purple-500',
    ai_response: 'text-purple-400',
    deployment_start: 'text-blue-500',
    deployment_success: 'text-green-500',
    deployment_error: 'text-red-500',
    database_query: 'text-cyan-500',
    git_commit: 'text-orange-500',
    git_push: 'text-orange-400',
    error: 'text-red-500',
    info: 'text-blue-500',
  };

  return colorMap[type] || 'text-neutral-500';
}

export function formatActivityTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return timestamp.toLocaleDateString();
}
