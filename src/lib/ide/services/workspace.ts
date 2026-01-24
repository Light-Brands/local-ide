/**
 * Workspace Service
 *
 * Manages the separation between IDE (shell) and the app being developed (sandbox).
 *
 * Key Concepts:
 * - IDE runs on IDE_PORT (4000) - stable, rarely refreshes
 * - App runs on APP_PORT (3000) - refreshes on file changes
 * - Preview pane shows iframe of the app
 * - File sync only triggers iframe refresh, not IDE refresh
 */

export interface WorkspaceConfig {
  /** Port the IDE runs on */
  idePort: number;
  /** Port the app being developed runs on */
  appPort: number;
  /** Root directory of the workspace/project */
  rootDir: string;
  /** Whether the app server is running */
  appServerRunning: boolean;
}

export interface WorkspaceStatus {
  ide: {
    port: number;
    healthy: boolean;
    url: string;
  };
  app: {
    port: number;
    healthy: boolean;
    url: string;
    lastRefresh: number;
  };
  tunnel?: {
    url: string;
    healthy: boolean;
  };
}

type WorkspaceEventType =
  | 'app-ready'
  | 'app-refresh-needed'
  | 'app-refreshed'
  | 'app-error'
  | 'app-server-started'
  | 'app-server-stopped';

interface WorkspaceEvent {
  type: WorkspaceEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

type WorkspaceListener = (event: WorkspaceEvent) => void;

class WorkspaceService {
  private config: WorkspaceConfig = {
    idePort: 4000,  // IDE shell - stable, never refreshes
    appPort: 3000,  // App being developed - refreshes on changes
    rootDir: process.cwd?.() || '/Users/lawless/Documents/local-ide',
    appServerRunning: false,
  };

  private listeners = new Set<WorkspaceListener>();
  private iframeRef: HTMLIFrameElement | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the workspace service
   */
  init(config: Partial<WorkspaceConfig> = {}): void {
    this.config = { ...this.config, ...config };
    this.startHealthCheck();
  }

  /**
   * Set the iframe element for the preview pane
   */
  setPreviewIframe(iframe: HTMLIFrameElement | null): void {
    this.iframeRef = iframe;
  }

  /**
   * Get the URL for the app being developed
   */
  getAppUrl(path = '/'): string {
    if (typeof window === 'undefined') {
      return `http://localhost:${this.config.appPort}${path}`;
    }

    const { protocol, hostname } = window.location;

    // If accessing via tunnel, construct tunnel URL for app
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Assuming app is accessible via same tunnel on different path or subdomain
      // For now, return localhost - the iframe will work if on same network
      return `http://localhost:${this.config.appPort}${path}`;
    }

    return `${protocol}//localhost:${this.config.appPort}${path}`;
  }

  /**
   * Get the URL for the IDE
   */
  getIdeUrl(path = '/ide'): string {
    if (typeof window === 'undefined') {
      return `http://localhost:${this.config.idePort}${path}`;
    }
    return window.location.origin + path;
  }

  /**
   * Refresh only the app iframe, not the IDE
   */
  refreshApp(): void {
    if (this.iframeRef) {
      const currentSrc = this.iframeRef.src;
      // Add cache-busting param
      const url = new URL(currentSrc);
      url.searchParams.set('_refresh', Date.now().toString());
      this.iframeRef.src = url.toString();

      this.emit({
        type: 'app-refreshed',
        timestamp: Date.now(),
      });
    } else {
      // Fallback: post message to iframe
      const iframe = document.querySelector('iframe[data-preview]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'refresh' }, '*');
      }
    }
  }

  /**
   * Hard refresh the app iframe
   */
  hardRefreshApp(): void {
    if (this.iframeRef) {
      // Force reload by removing and re-adding src
      const src = this.iframeRef.src;
      this.iframeRef.src = 'about:blank';
      setTimeout(() => {
        if (this.iframeRef) {
          this.iframeRef.src = src;
        }
      }, 100);
    }
  }

  /**
   * Navigate the app iframe to a specific path
   */
  navigateApp(path: string): void {
    const url = this.getAppUrl(path);
    if (this.iframeRef) {
      this.iframeRef.src = url;
    }
  }

  /**
   * Check if the app server is healthy
   */
  async checkAppHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.getAppUrl('/api/health'), {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      // Try just fetching the root
      try {
        const response = await fetch(this.getAppUrl('/'), {
          method: 'HEAD',
          cache: 'no-store',
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get current workspace status
   */
  async getStatus(): Promise<WorkspaceStatus> {
    const appHealthy = await this.checkAppHealth();

    return {
      ide: {
        port: this.config.idePort,
        healthy: true, // If this code is running, IDE is healthy
        url: this.getIdeUrl(),
      },
      app: {
        port: this.config.appPort,
        healthy: appHealthy,
        url: this.getAppUrl(),
        lastRefresh: Date.now(),
      },
    };
  }

  /**
   * Subscribe to workspace events
   */
  subscribe(listener: WorkspaceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: WorkspaceEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[Workspace] Listener error:', e);
      }
    });
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.checkAppHealth();
      if (healthy !== this.config.appServerRunning) {
        this.config.appServerRunning = healthy;
        this.emit({
          type: healthy ? 'app-server-started' : 'app-server-stopped',
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }

  /**
   * Stop health checks
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.listeners.clear();
  }
}

// Singleton
let instance: WorkspaceService | null = null;

export function getWorkspaceService(): WorkspaceService {
  if (!instance) {
    instance = new WorkspaceService();
  }
  return instance;
}

/**
 * Determine if we're running as the IDE or the App
 */
export function isIDEContext(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check port from env or default
    return true; // Assume IDE context on server
  }

  // Client-side: check current URL
  const port = window.location.port;
  return port === '4000' || window.location.pathname.startsWith('/ide');
}

/**
 * Determine if we're inside an iframe (being previewed)
 */
export function isPreviewContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.self !== window.top;
}
