/**
 * Vercel API Service
 * Handles deployment operations and project management
 */

// =============================================================================
// TYPES
// =============================================================================

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments: VercelDeployment[];
  link?: {
    type: string;
    repo: string;
    org: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  source?: 'git' | 'cli' | 'api';
  meta?: {
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
  target?: 'production' | 'preview';
  inspectorUrl?: string;
}

export interface VercelDeploymentLog {
  id: string;
  type: 'stdout' | 'stderr' | 'command' | 'exit';
  text: string;
  created: number;
  serial: number;
}

export interface VercelDomain {
  name: string;
  apexName: string;
  verified: boolean;
  gitBranch: string | null;
}

export interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  type: 'plain' | 'secret' | 'encrypted';
  target: ('production' | 'preview' | 'development')[];
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// STORAGE
// =============================================================================

const VERCEL_TOKEN_KEY = 'local-ide-vercel-token';
const VERCEL_PROJECT_KEY = 'local-ide-vercel-project';

export function getStoredVercelToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VERCEL_TOKEN_KEY);
}

export function setStoredVercelToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERCEL_TOKEN_KEY, token);
}

export function clearStoredVercelToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VERCEL_TOKEN_KEY);
}

export function getStoredVercelProject(): VercelProject | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(VERCEL_PROJECT_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredVercelProject(project: VercelProject): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERCEL_PROJECT_KEY, JSON.stringify(project));
}

export function clearStoredVercelProject(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VERCEL_PROJECT_KEY);
}

// =============================================================================
// API HELPERS
// =============================================================================

async function vercelFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredVercelToken();

  if (!token) {
    throw new Error('No Vercel token available');
  }

  const response = await fetch(`https://api.vercel.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Vercel API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// =============================================================================
// PROJECT OPERATIONS
// =============================================================================

/**
 * List all projects for the authenticated user
 */
export async function listProjects(): Promise<VercelProject[]> {
  const data = await vercelFetch<{ projects: VercelProject[] }>('/v9/projects');
  return data.projects;
}

/**
 * Get a specific project by ID or name
 */
export async function getProject(projectId: string): Promise<VercelProject> {
  return vercelFetch<VercelProject>(`/v9/projects/${projectId}`);
}

/**
 * Find a project linked to a GitHub repo
 */
export async function findProjectByRepo(
  owner: string,
  repo: string
): Promise<VercelProject | null> {
  const projects = await listProjects();
  return (
    projects.find(
      (p) =>
        p.link?.type === 'github' &&
        p.link.org.toLowerCase() === owner.toLowerCase() &&
        p.link.repo.toLowerCase() === repo.toLowerCase()
    ) || null
  );
}

// =============================================================================
// DEPLOYMENT OPERATIONS
// =============================================================================

/**
 * List deployments for a project
 */
export async function listDeployments(
  projectId: string,
  limit: number = 20
): Promise<VercelDeployment[]> {
  const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
    `/v6/deployments?projectId=${projectId}&limit=${limit}`
  );
  return data.deployments;
}

/**
 * Get a specific deployment
 */
export async function getDeployment(deploymentId: string): Promise<VercelDeployment> {
  return vercelFetch<VercelDeployment>(`/v13/deployments/${deploymentId}`);
}

/**
 * Get deployment build logs
 */
export async function getDeploymentLogs(
  deploymentId: string
): Promise<VercelDeploymentLog[]> {
  const data = await vercelFetch<{ logs: VercelDeploymentLog[] }>(
    `/v2/deployments/${deploymentId}/events`
  );
  return data.logs || [];
}

/**
 * Cancel a deployment
 */
export async function cancelDeployment(deploymentId: string): Promise<void> {
  await vercelFetch(`/v12/deployments/${deploymentId}/cancel`, {
    method: 'PATCH',
  });
}

/**
 * Redeploy a deployment
 */
export async function redeploy(
  deploymentId: string,
  target?: 'production' | 'preview'
): Promise<VercelDeployment> {
  const deployment = await getDeployment(deploymentId);

  const body: Record<string, unknown> = {
    name: deployment.name,
    deploymentId,
  };

  if (target) {
    body.target = target;
  }

  return vercelFetch<VercelDeployment>('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// =============================================================================
// DOMAIN OPERATIONS
// =============================================================================

/**
 * List domains for a project
 */
export async function listDomains(projectId: string): Promise<VercelDomain[]> {
  const data = await vercelFetch<{ domains: VercelDomain[] }>(
    `/v9/projects/${projectId}/domains`
  );
  return data.domains;
}

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

/**
 * List environment variables for a project
 */
export async function listEnvVars(projectId: string): Promise<VercelEnvVar[]> {
  const data = await vercelFetch<{ envs: VercelEnvVar[] }>(
    `/v9/projects/${projectId}/env`
  );
  return data.envs;
}

/**
 * Create an environment variable
 */
export async function createEnvVar(
  projectId: string,
  key: string,
  value: string,
  target: ('production' | 'preview' | 'development')[] = ['production', 'preview', 'development'],
  type: 'plain' | 'secret' | 'encrypted' = 'encrypted'
): Promise<VercelEnvVar> {
  return vercelFetch<VercelEnvVar>(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({ key, value, target, type }),
  });
}

/**
 * Delete an environment variable
 */
export async function deleteEnvVar(
  projectId: string,
  envId: string
): Promise<void> {
  await vercelFetch(`/v9/projects/${projectId}/env/${envId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get deployments for the stored project
 */
export async function getCurrentProjectDeployments(
  limit: number = 20
): Promise<VercelDeployment[]> {
  const project = getStoredVercelProject();
  if (!project) {
    throw new Error('No Vercel project selected');
  }
  return listDeployments(project.id, limit);
}

/**
 * Get the production URL for the stored project
 */
export async function getProductionUrl(): Promise<string | null> {
  const project = getStoredVercelProject();
  if (!project) return null;

  const deployments = await listDeployments(project.id, 1);
  const production = deployments.find(
    (d) => d.target === 'production' && d.readyState === 'READY'
  );

  return production ? `https://${production.url}` : null;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

export function getDeploymentStatusColor(state: VercelDeployment['state']): string {
  switch (state) {
    case 'READY':
      return 'text-green-500';
    case 'BUILDING':
    case 'INITIALIZING':
      return 'text-amber-500';
    case 'QUEUED':
      return 'text-blue-500';
    case 'ERROR':
      return 'text-red-500';
    case 'CANCELED':
      return 'text-neutral-500';
    default:
      return 'text-neutral-400';
  }
}

export function getDeploymentStatusLabel(state: VercelDeployment['state']): string {
  switch (state) {
    case 'READY':
      return 'Ready';
    case 'BUILDING':
      return 'Building';
    case 'INITIALIZING':
      return 'Initializing';
    case 'QUEUED':
      return 'Queued';
    case 'ERROR':
      return 'Failed';
    case 'CANCELED':
      return 'Canceled';
    default:
      return state;
  }
}

export function formatDeploymentTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
