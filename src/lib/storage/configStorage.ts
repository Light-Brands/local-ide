/**
 * Config Storage
 *
 * Handles IDE settings and integration configurations.
 * Stored in .local-ide/config/
 */

import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_DIR = process.cwd() + '/.local-ide/config';

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * Get config file path
 */
function getConfigPath(name: string): string {
  return path.join(CONFIG_DIR, `${name}.json`);
}

/**
 * Read a config file
 */
export async function readConfig<T>(name: string): Promise<T | null> {
  try {
    await ensureConfigDir();
    const filePath = getConfigPath(name);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Error reading config ${name}:`, error);
    return null;
  }
}

/**
 * Write a config file
 */
export async function writeConfig<T>(name: string, data: T): Promise<void> {
  await ensureConfigDir();
  const filePath = getConfigPath(name);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Update a config file (merge with existing)
 */
export async function updateConfig<T extends Record<string, unknown>>(
  name: string,
  updates: Partial<T>
): Promise<T> {
  const existing = await readConfig<T>(name);
  const merged = { ...existing, ...updates } as T;
  await writeConfig(name, merged);
  return merged;
}

/**
 * Delete a config file
 */
export async function deleteConfig(name: string): Promise<boolean> {
  try {
    const filePath = getConfigPath(name);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Typed Config Accessors
// =============================================================================

/**
 * IDE Settings - user preferences
 */
export interface IDESettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  terminalFontSize: number;
  sidebarWidth: number;
  panelLayout: 'horizontal' | 'vertical';
}

const DEFAULT_SETTINGS: IDESettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  autoSave: true,
  autoSaveDelay: 1000,
  terminalFontSize: 13,
  sidebarWidth: 260,
  panelLayout: 'horizontal',
};

export async function getSettings(): Promise<IDESettings> {
  const settings = await readConfig<IDESettings>('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function updateSettings(updates: Partial<IDESettings>): Promise<IDESettings> {
  const existing = await getSettings();
  const merged = { ...existing, ...updates };
  await writeConfig('settings', merged);
  return merged;
}

/**
 * Integration Configs - API tokens and service settings
 */
export interface IntegrationConfigs {
  github?: {
    token: string;
    owner?: string;
    repo?: string;
    branch?: string;
  };
  vercel?: {
    token: string;
    projectId?: string;
    projectName?: string;
    teamId?: string;
    teamSlug?: string;
    ownerSlug?: string; // Username or team slug for URL construction
  };
  supabase?: {
    accessToken?: string;
    url: string;
    projectId?: string;
    projectRef?: string;
    projectName?: string;
    orgId?: string;
    orgName?: string;
    region?: string;
    anonKey?: string;
    serviceKey?: string;
  };
  claude?: {
    mode: 'cli' | 'api';
    cliPath?: string;
    apiKey?: string;
    model: string;
  };
}

export async function getIntegrations(): Promise<IntegrationConfigs> {
  return (await readConfig<IntegrationConfigs>('integrations')) || {};
}

export async function updateIntegration<K extends keyof IntegrationConfigs>(
  service: K,
  config: IntegrationConfigs[K]
): Promise<void> {
  const integrations = await getIntegrations();
  integrations[service] = config;
  await writeConfig('integrations', integrations);
}

export async function removeIntegration(service: keyof IntegrationConfigs): Promise<void> {
  const integrations = await getIntegrations();
  delete integrations[service];
  await writeConfig('integrations', integrations);
}

export async function getIntegration<K extends keyof IntegrationConfigs>(
  service: K
): Promise<IntegrationConfigs[K] | undefined> {
  const integrations = await getIntegrations();
  return integrations[service];
}

/**
 * Recent Projects - track recently opened projects
 */
export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

export async function getRecentProjects(): Promise<RecentProject[]> {
  return (await readConfig<RecentProject[]>('recent-projects')) || [];
}

export async function addRecentProject(project: Omit<RecentProject, 'lastOpened'>): Promise<void> {
  const projects = await getRecentProjects();
  const filtered = projects.filter(p => p.path !== project.path);
  filtered.unshift({
    ...project,
    lastOpened: new Date().toISOString(),
  });
  // Keep only last 10
  await writeConfig('recent-projects', filtered.slice(0, 10));
}
