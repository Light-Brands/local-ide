/**
 * Settings Client for IDE
 *
 * The IDE runs on a separate port from the App, but needs access to
 * settings configured in the App's dashboard. This client fetches
 * settings from the App's API endpoints.
 *
 * This allows:
 * - IDE to use integrations configured in dashboard (GitHub, Vercel, etc.)
 * - Settings to be shared between IDE and App
 * - Single source of truth for configuration
 */

export interface IntegrationSettings {
  github: {
    connected: boolean;
    token?: string;
    owner?: string;
    repo?: string;
    branch?: string;
  };
  vercel: {
    connected: boolean;
    token?: string;
    teamId?: string;
    projectId?: string;
    projectName?: string;
  };
  supabase: {
    connected: boolean;
    url?: string;
    anonKey?: string;
    projectRef?: string;
  };
  claude: {
    configured: boolean;
    apiKey?: string;
  };
}

export interface IDESettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface WorkspaceSettings {
  rootDir: string;
  excludePatterns: string[];
  watchPatterns: string[];
}

export interface AllSettings {
  integrations: IntegrationSettings;
  ide: IDESettings;
  workspace: WorkspaceSettings;
}

// Default App URL - IDE calls this for settings
const DEFAULT_APP_URL = 'http://localhost:3000';

class SettingsClient {
  private appUrl: string;
  private cache: Partial<AllSettings> = {};
  private cacheExpiry: number = 0;
  private cacheDuration = 30000; // 30 seconds

  constructor(appUrl: string = DEFAULT_APP_URL) {
    this.appUrl = appUrl;
  }

  /**
   * Set the App URL (if different from default)
   */
  setAppUrl(url: string): void {
    this.appUrl = url;
    this.clearCache();
  }

  /**
   * Clear the settings cache
   */
  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }

  /**
   * Check if App is reachable
   */
  async isAppAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.appUrl}/api/health`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch integrations from App
   */
  async getIntegrations(): Promise<IntegrationSettings> {
    // Check cache first
    if (this.cache.integrations && Date.now() < this.cacheExpiry) {
      return this.cache.integrations;
    }

    try {
      const response = await fetch(`${this.appUrl}/api/settings/integrations`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.status}`);
      }

      const data = await response.json();
      this.cache.integrations = data;
      this.cacheExpiry = Date.now() + this.cacheDuration;
      return data;
    } catch (error) {
      console.warn('[SettingsClient] Failed to fetch from App, using localStorage fallback');
      return this.getIntegrationsFromLocalStorage();
    }
  }

  /**
   * Fallback: Get integrations from localStorage
   * Used when App is not available (e.g., not started yet)
   */
  private getIntegrationsFromLocalStorage(): IntegrationSettings {
    if (typeof window === 'undefined') {
      return this.getDefaultIntegrations();
    }

    try {
      const github = localStorage.getItem('ide-github-integration');
      const vercel = localStorage.getItem('ide-vercel-integration');
      const supabase = localStorage.getItem('ide-supabase-integration');
      const claudeKey = localStorage.getItem('claude-api-key');

      return {
        github: github ? JSON.parse(github) : { connected: false },
        vercel: vercel ? JSON.parse(vercel) : { connected: false },
        supabase: supabase ? JSON.parse(supabase) : { connected: false },
        claude: {
          configured: !!claudeKey,
          apiKey: claudeKey || undefined,
        },
      };
    } catch {
      return this.getDefaultIntegrations();
    }
  }

  private getDefaultIntegrations(): IntegrationSettings {
    return {
      github: { connected: false },
      vercel: { connected: false },
      supabase: { connected: false },
      claude: { configured: false },
    };
  }

  /**
   * Save integration settings
   */
  async saveIntegration(
    type: keyof IntegrationSettings,
    settings: IntegrationSettings[keyof IntegrationSettings]
  ): Promise<void> {
    try {
      const response = await fetch(`${this.appUrl}/api/settings/integrations/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to save integration: ${response.status}`);
      }

      // Update cache
      if (this.cache.integrations) {
        this.cache.integrations[type] = settings as any;
      }
    } catch (error) {
      console.warn('[SettingsClient] Failed to save to App, using localStorage fallback');
      this.saveIntegrationToLocalStorage(type, settings);
    }
  }

  private saveIntegrationToLocalStorage(
    type: keyof IntegrationSettings,
    settings: IntegrationSettings[keyof IntegrationSettings]
  ): void {
    if (typeof window === 'undefined') return;

    const key = `ide-${type}-integration`;
    localStorage.setItem(key, JSON.stringify(settings));
  }

  /**
   * Fetch IDE settings
   */
  async getIDESettings(): Promise<IDESettings> {
    if (this.cache.ide && Date.now() < this.cacheExpiry) {
      return this.cache.ide;
    }

    try {
      const response = await fetch(`${this.appUrl}/api/settings/ide`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch IDE settings: ${response.status}`);
      }

      const data = await response.json();
      this.cache.ide = data;
      return data;
    } catch {
      return this.getDefaultIDESettings();
    }
  }

  private getDefaultIDESettings(): IDESettings {
    return {
      theme: 'dark',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      autoSave: true,
      autoSaveDelay: 1000,
    };
  }

  /**
   * Save IDE settings
   */
  async saveIDESettings(settings: Partial<IDESettings>): Promise<void> {
    try {
      const response = await fetch(`${this.appUrl}/api/settings/ide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to save IDE settings: ${response.status}`);
      }

      // Update cache
      this.cache.ide = { ...this.cache.ide, ...settings } as IDESettings;
    } catch (error) {
      console.warn('[SettingsClient] Failed to save IDE settings:', error);
    }
  }

  /**
   * Get all settings at once
   */
  async getAllSettings(): Promise<AllSettings> {
    const [integrations, ide] = await Promise.all([
      this.getIntegrations(),
      this.getIDESettings(),
    ]);

    return {
      integrations,
      ide,
      workspace: {
        rootDir: process.cwd?.() || '/Users/lawless/Documents/local-ide',
        excludePatterns: ['node_modules', '.git', '.next', 'dist'],
        watchPatterns: ['src/**/*', 'public/**/*'],
      },
    };
  }
}

// Singleton instance
let instance: SettingsClient | null = null;

export function getSettingsClient(): SettingsClient {
  if (!instance) {
    instance = new SettingsClient();
  }
  return instance;
}

/**
 * Initialize settings client with custom App URL
 */
export function initSettingsClient(appUrl: string): SettingsClient {
  instance = new SettingsClient(appUrl);
  return instance;
}
