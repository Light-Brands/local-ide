/**
 * File Sync Service
 *
 * Ensures the filesystem is the source of truth by:
 * 1. Tracking file versions via content hashes
 * 2. Detecting when client/server are out of sync
 * 3. Triggering appropriate refresh strategies (HMR, soft reload, hard reload)
 * 4. Providing hooks for components to react to file changes
 */

import { createHash } from 'crypto';
import { getWorkspaceService, isIDEContext } from './workspace';
import { IDE_FEATURES } from '../features';
import { safeIDEOperation } from '../error-handler';

export interface FileVersion {
  path: string;
  hash: string;
  timestamp: number;
  size: number;
}

export interface SyncStatus {
  inSync: boolean;
  serverVersion: string;
  clientVersion: string;
  stalePaths: string[];
  lastCheck: number;
}

export type SyncStrategy = 'hmr' | 'soft-reload' | 'hard-reload' | 'server-restart';

export interface FileSyncEvent {
  type: 'file-changed' | 'sync-required' | 'sync-complete' | 'error';
  path?: string;
  strategy?: SyncStrategy;
  error?: string;
}

type FileSyncListener = (event: FileSyncEvent) => void;

class FileSyncService {
  private listeners: Set<FileSyncListener> = new Set();
  private fileVersions: Map<string, FileVersion> = new Map();
  private serverBuildId: string | null = null;
  private clientBuildId: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;
  private appAvailable = true; // Assume available, stop polling if not
  private appCheckAttempts = 0;
  private maxAppCheckAttempts = 3; // Stop trying after 3 failures

  // IDE paths - changes here should NOT trigger any refresh
  // The IDE shell should remain stable
  private idePaths = [
    /^src\/app\/ide\//,
    /^src\/lib\/ide\//,
  ];

  // Critical paths that require hard reload when changed (app files only)
  private criticalPaths = [
    /^src\/app\/(?!ide).*\/layout\.tsx$/,
    /^src\/app\/(?!ide).*\/page\.tsx$/,
    /^src\/lib\/(?!ide).*\/store.*\.ts$/,
    /^next\.config\./,
    /^tailwind\.config\./,
  ];

  // Paths that can use HMR (app files only)
  private hmrSafePaths = [
    /^src\/components\//,
    /^src\/app\/(?!ide).*\/components\//,
    /\.css$/,
  ];

  /**
   * Start monitoring for sync issues
   */
  start(intervalMs = 2000): void {
    // Skip if file sync is disabled
    if (!IDE_FEATURES.fileSync) {
      console.log('[FileSync] File sync is disabled');
      return;
    }

    if (this.checkInterval) return;

    // Initial check
    this.checkSync();

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkSync();
    }, intervalMs);

    // Listen for visibility changes - check when tab becomes visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkSync();
        }
      });
    }

    console.log('[FileSync] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('[FileSync] Stopped monitoring');
  }

  /**
   * Reset app availability check (e.g., when app might have started)
   */
  resetAppCheck(): void {
    this.appAvailable = true;
    this.appCheckAttempts = 0;
    console.log('[FileSync] Reset app availability check');
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener: FileSyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: FileSyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[FileSync] Listener error:', e);
      }
    });
  }

  /**
   * Check if client and server are in sync
   */
  async checkSync(): Promise<SyncStatus> {
    // If file sync is disabled, always report as in sync
    if (!IDE_FEATURES.fileSync) {
      return {
        inSync: true,
        serverVersion: 'disabled',
        clientVersion: 'disabled',
        stalePaths: [],
        lastCheck: Date.now(),
      };
    }

    if (this.isChecking) {
      return {
        inSync: true,
        serverVersion: this.serverBuildId || 'unknown',
        clientVersion: this.clientBuildId || 'unknown',
        stalePaths: [],
        lastCheck: Date.now(),
      };
    }

    // Skip if app has been detected as unavailable
    if (!this.appAvailable) {
      this.isChecking = false;
      return {
        inSync: true,
        serverVersion: 'standalone',
        clientVersion: this.clientBuildId || 'unknown',
        stalePaths: [],
        lastCheck: Date.now(),
      };
    }

    this.isChecking = true;

    const result = await safeIDEOperation(
      'FileSync',
      'checkSync',
      async () => {
        // Fetch server's current build info from the APP (port 3000)
        // The IDE (port 4000) checks the APP's sync status
        const isIDEPort = typeof window !== 'undefined' && window.location.port === '4000';
        const appUrl = isIDEPort ? 'http://localhost:3000' : '';

        // Use short timeout to fail fast if app isn't running
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${appUrl}/api/ide/sync-status`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // App is available, reset failure counter
        this.appCheckAttempts = 0;
        this.appAvailable = true;

        if (!response.ok) {
          throw new Error(`Sync check failed: ${response.status}`);
        }

        const serverStatus = await response.json();

        // Compare build IDs
        const newServerBuildId = serverStatus.buildId;

        // First time - just store the ID
        if (!this.clientBuildId) {
          this.clientBuildId = newServerBuildId;
          this.serverBuildId = newServerBuildId;
        }

        // Check for mismatch
        const inSync = this.clientBuildId === newServerBuildId;

        if (!inSync) {
          console.log('[FileSync] Out of sync detected', {
            client: this.clientBuildId,
            server: newServerBuildId,
          });

          // Determine best strategy based on what changed
          const strategy = this.determineStrategy(serverStatus.changedPaths || []);

          this.emit({
            type: 'sync-required',
            strategy,
          });

          // Update server build ID
          this.serverBuildId = newServerBuildId;
        }

        return {
          inSync,
          serverVersion: newServerBuildId,
          clientVersion: this.clientBuildId || 'unknown',
          stalePaths: serverStatus.changedPaths || [],
          lastCheck: Date.now(),
        };
      },
      {
        fallback: {
          inSync: true,
          serverVersion: 'standalone',
          clientVersion: this.clientBuildId || 'unknown',
          stalePaths: [],
          lastCheck: Date.now(),
        },
        severity: 'silent',
        onError: () => {
          // Track connection failures - stop polling if app consistently unavailable
          this.appCheckAttempts++;
          if (this.appCheckAttempts >= this.maxAppCheckAttempts) {
            this.appAvailable = false;
            console.log('[FileSync] App on port 3000 not available, disabling sync checks');
          }
        },
      }
    );

    this.isChecking = false;
    return result!;
  }

  /**
   * Check if a path is an IDE file (should not trigger refresh)
   */
  private isIDEPath(path: string): boolean {
    return this.idePaths.some((pattern) => pattern.test(path));
  }

  /**
   * Determine the best refresh strategy for changed files
   */
  private determineStrategy(changedPaths: string[]): SyncStrategy {
    // Filter out IDE paths - IDE should never refresh
    const appPaths = changedPaths.filter((path) => !this.isIDEPath(path));

    // If only IDE files changed, no refresh needed
    if (appPaths.length === 0) {
      console.log('[FileSync] Only IDE files changed - no refresh needed');
      return 'hmr'; // Will just acknowledge, no actual refresh
    }

    console.log('[FileSync] App files changed:', appPaths);

    // Check for critical changes that need hard reload
    for (const path of appPaths) {
      for (const pattern of this.criticalPaths) {
        if (pattern.test(path)) {
          console.log('[FileSync] Critical app path changed:', path);
          return 'hard-reload';
        }
      }
    }

    // Check if all changes are HMR-safe
    const allHmrSafe = appPaths.every((path) =>
      this.hmrSafePaths.some((pattern) => pattern.test(path))
    );

    if (allHmrSafe && appPaths.length > 0) {
      return 'hmr';
    }

    // Default to soft reload for most cases
    return 'soft-reload';
  }

  /**
   * Execute a sync strategy
   *
   * When in IDE context, we refresh the app iframe instead of the whole IDE.
   * This keeps the IDE stable while the app being developed refreshes.
   */
  async executeStrategy(strategy: SyncStrategy): Promise<void> {
    console.log('[FileSync] Executing strategy:', strategy);

    // Check if we're in IDE context - if so, only refresh the app iframe
    const inIDE = isIDEContext();
    const workspace = getWorkspaceService();

    switch (strategy) {
      case 'hmr':
        // HMR should happen automatically, just update our tracking
        this.clientBuildId = this.serverBuildId;
        this.emit({ type: 'sync-complete' });
        break;

      case 'soft-reload':
        if (inIDE) {
          // In IDE: only refresh the preview iframe
          console.log('[FileSync] Refreshing app iframe only (IDE stays stable)');
          workspace.refreshApp();
          this.clientBuildId = this.serverBuildId;
          this.emit({ type: 'sync-complete' });
        } else if (typeof window !== 'undefined') {
          // Not in IDE: use Next.js router refresh
          // @ts-expect-error - Next.js internal
          if (window.__NEXT_DATA__?.router?.refresh) {
            // @ts-expect-error - Next.js internal
            window.__NEXT_DATA__.router.refresh();
          } else {
            window.location.reload();
          }
        }
        break;

      case 'hard-reload':
        if (inIDE) {
          // In IDE: hard refresh the preview iframe
          console.log('[FileSync] Hard refreshing app iframe (IDE stays stable)');
          workspace.hardRefreshApp();
          this.clientBuildId = this.serverBuildId;
          this.emit({ type: 'sync-complete' });
        } else if (typeof window !== 'undefined') {
          // Not in IDE: full page reload
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          }
          window.location.reload();
        }
        break;

      case 'server-restart':
        // Notify user that server needs restart
        this.emit({
          type: 'error',
          error: 'Server restart required. Run: npm run dev:tunnel:restart',
        });
        break;
    }
  }

  /**
   * Force a sync check and execute appropriate strategy
   */
  async forceSync(): Promise<void> {
    const status = await this.checkSync();

    if (!status.inSync) {
      const strategy = this.determineStrategy(status.stalePaths);
      await this.executeStrategy(strategy);
    }
  }

  /**
   * Mark that we've acknowledged the current client version
   * Call this after hydration completes successfully
   */
  acknowledgeVersion(): void {
    this.clientBuildId = this.serverBuildId;
  }

  /**
   * Get current sync status without making a request
   */
  getStatus(): { inSync: boolean; clientVersion: string | null; serverVersion: string | null } {
    return {
      inSync: this.clientBuildId === this.serverBuildId,
      clientVersion: this.clientBuildId,
      serverVersion: this.serverBuildId,
    };
  }
}

// Singleton instance
let instance: FileSyncService | null = null;

export function getFileSyncService(): FileSyncService {
  if (!instance) {
    instance = new FileSyncService();
  }
  return instance;
}

/**
 * Hash file content for comparison
 */
export function hashContent(content: string): string {
  return createHash('md5').update(content).digest('hex').slice(0, 12);
}
