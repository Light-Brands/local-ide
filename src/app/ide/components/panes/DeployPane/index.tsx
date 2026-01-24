'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { getActivityService } from '@/lib/ide/services/activity';
import {
  Rocket,
  RefreshCw,
  Loader2,
  AlertCircle,
  Settings,
  Key,
  ExternalLink,
  ChevronLeft,
  X,
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  StopCircle,
  RotateCcw,
  Terminal,
  Globe,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Deployment {
  id: string;
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'READY' | 'CANCELED' | 'QUEUED' | 'INITIALIZING';
  readyState: string;
  target: 'production' | 'preview' | null;
  createdAt: number;
  inspectorUrl?: string;
  meta?: {
    githubCommitRef?: string;
    githubCommitMessage?: string;
    githubCommitSha?: string;
    githubCommitAuthorName?: string;
  };
  creator?: {
    username: string;
    email?: string;
  };
}

interface DeploymentLog {
  id: string;
  type: 'stdout' | 'stderr' | 'command' | 'exit';
  text: string;
  created: number;
  serial: number;
}

interface EnvVar {
  id: string;
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type: 'plain' | 'encrypted' | 'secret';
}

type MobileView = 'list' | 'detail';

// =============================================================================
// HELPERS
// =============================================================================

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getStatusLabel(state: string): string {
  switch (state) {
    case 'READY': return 'Ready';
    case 'BUILDING': return 'Building';
    case 'INITIALIZING': return 'Initializing';
    case 'QUEUED': return 'Queued';
    case 'ERROR': return 'Failed';
    case 'CANCELED': return 'Canceled';
    default: return state;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeployPane() {
  const isMobile = useMobileDetect();
  const [view, setView] = useState<'deployments' | 'env'>('deployments');
  const [mobileView, setMobileView] = useState<MobileView>('list');

  // Deployment state
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Env vars state
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvVar | null>(null);
  const [envForm, setEnvForm] = useState({
    key: '',
    value: '',
    targets: ['production', 'preview', 'development'] as ('production' | 'preview' | 'development')[],
  });
  const [envSaving, setEnvSaving] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [logsCopied, setLogsCopied] = useState(false);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const mobileLogsContainerRef = useRef<HTMLDivElement>(null);

  const vercel = useIDEStore((state) => state.integrations.vercel);
  const setDeploymentStatus = useIDEStore((state) => state.setDeploymentStatus);

  const isConnected = vercel.connected && vercel.projectId;

  // ==========================================================================
  // FETCH DEPLOYMENTS
  // ==========================================================================

  const fetchDeployments = useCallback(async () => {
    if (!vercel.projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/vercel/deployments?projectId=${vercel.projectId}&limit=20`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch deployments');
      }

      const data = await response.json();
      setDeployments(data.deployments || []);

      // Update deployment status in store
      if (data.deployments?.length > 0) {
        const latest = data.deployments[0];
        if (latest.state === 'ERROR') setDeploymentStatus('failed');
        else if (latest.state === 'BUILDING' || latest.state === 'INITIALIZING' || latest.state === 'QUEUED') setDeploymentStatus('building');
        else if (latest.state === 'READY') setDeploymentStatus('ready');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
    } finally {
      setIsLoading(false);
    }
  }, [vercel.projectId, setDeploymentStatus]);

  // ==========================================================================
  // FETCH LOGS
  // ==========================================================================

  const fetchLogs = useCallback(async (deploymentId: string) => {
    setLoadingLogs(true);
    setLogs([]);

    try {
      const response = await fetch(`/api/integrations/vercel/deployments/${deploymentId}/logs`);

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // ==========================================================================
  // FETCH ENV VARS
  // ==========================================================================

  const fetchEnvVars = useCallback(async () => {
    if (!vercel.projectId) return;

    setEnvLoading(true);
    try {
      const response = await fetch(`/api/integrations/vercel/projects/${vercel.projectId}/env`);

      if (response.ok) {
        const data = await response.json();
        setEnvVars(data.envs || []);
      }
    } catch (err) {
      console.error('Failed to fetch env vars:', err);
    } finally {
      setEnvLoading(false);
    }
  }, [vercel.projectId]);

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const handleRedeploy = useCallback(async (deployment: Deployment) => {
    if (!vercel.projectId) return;

    setActionLoading(deployment.uid);
    const deployName = deployment.meta?.githubCommitMessage || deployment.name;

    getActivityService().trackDeploymentStart(deployName);

    try {
      const response = await fetch(`/api/integrations/vercel/projects/${vercel.projectId}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentId: deployment.uid,
          target: deployment.target || 'production',
        }),
      });

      if (response.ok) {
        getActivityService().trackInfo('Redeploy initiated', deployName);
        setTimeout(fetchDeployments, 1000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to redeploy');
      }
    } catch (err) {
      console.error('Redeploy failed:', err);
      getActivityService().trackDeploymentError(
        deployName,
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setActionLoading(null);
    }
  }, [vercel.projectId, fetchDeployments]);

  const handleCancel = useCallback(async (deploymentId: string) => {
    setActionLoading(deploymentId);

    try {
      const response = await fetch(`/api/integrations/vercel/deployments/${deploymentId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        getActivityService().trackInfo('Deployment cancelled', deploymentId);
        setTimeout(fetchDeployments, 1000);
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchDeployments]);

  const handleViewLogs = useCallback((deployment: Deployment) => {
    setSelectedDeployment(deployment);
    fetchLogs(deployment.uid);
    if (isMobile) {
      setMobileView('detail');
    }
  }, [fetchLogs, isMobile]);

  const handleMobileBack = useCallback(() => {
    setMobileView('list');
    setSelectedDeployment(null);
  }, []);

  // ==========================================================================
  // ENV VAR ACTIONS
  // ==========================================================================

  const handleAddEnv = useCallback(() => {
    setEditingEnv(null);
    setEnvForm({ key: '', value: '', targets: ['production', 'preview', 'development'] });
    setEnvError(null);
    setEnvModalOpen(true);
  }, []);

  const handleEditEnv = useCallback((env: EnvVar) => {
    setEditingEnv(env);
    setEnvForm({ key: env.key, value: '', targets: env.target });
    setEnvError(null);
    setEnvModalOpen(true);
  }, []);

  const handleSaveEnv = useCallback(async () => {
    if (!vercel.projectId || !envForm.key.trim()) {
      setEnvError('Key is required');
      return;
    }
    if (!envForm.value.trim() && !editingEnv) {
      setEnvError('Value is required');
      return;
    }
    if (envForm.targets.length === 0) {
      setEnvError('Select at least one environment');
      return;
    }

    setEnvSaving(true);
    setEnvError(null);

    try {
      const response = await fetch(`/api/integrations/vercel/projects/${vercel.projectId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: envForm.key.trim(),
          value: envForm.value,
          target: envForm.targets,
          type: 'encrypted',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save environment variable');
      }

      setEnvModalOpen(false);
      fetchEnvVars();
      getActivityService().trackInfo('Environment variable saved', envForm.key);
    } catch (err) {
      setEnvError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEnvSaving(false);
    }
  }, [vercel.projectId, envForm, editingEnv, fetchEnvVars]);

  const handleDeleteEnv = useCallback(async (env: EnvVar) => {
    if (!vercel.projectId) return;
    if (!confirm(`Delete "${env.key}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/integrations/vercel/projects/${vercel.projectId}/env`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envId: env.id }),
      });

      if (response.ok) {
        fetchEnvVars();
        getActivityService().trackInfo('Environment variable deleted', env.key);
      }
    } catch (err) {
      console.error('Failed to delete env var:', err);
    }
  }, [vercel.projectId, fetchEnvVars]);

  const toggleTarget = useCallback((target: 'production' | 'preview' | 'development') => {
    setEnvForm((prev) => ({
      ...prev,
      targets: prev.targets.includes(target)
        ? prev.targets.filter((t) => t !== target)
        : [...prev.targets, target],
    }));
  }, []);

  const handleCopyLogs = useCallback(async (isMobile = false) => {
    // Try to get text from the visible logs container
    const container = isMobile ? mobileLogsContainerRef.current : logsContainerRef.current;

    let logsText = '';

    if (container) {
      // Get the text content directly from the rendered DOM
      logsText = container.innerText || container.textContent || '';
    }

    // Fallback to logs state if container text is empty
    if (!logsText.trim() && logs.length > 0) {
      logsText = logs
        .map((log) => log.text)
        .filter((text) => text && text.trim())
        .join('\n');
    }

    if (!logsText.trim()) return;

    try {
      await navigator.clipboard.writeText(logsText);
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  }, [logs]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isConnected && view === 'deployments') {
      fetchDeployments();
    }
  }, [isConnected, view, fetchDeployments]);

  // Real-time polling for building deployments
  useEffect(() => {
    if (!isConnected || view !== 'deployments') return;

    const hasActiveBuilds = deployments.some((d) =>
      ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(d.state)
    );

    if (!hasActiveBuilds) return;

    // Poll every 3 seconds when there's an active build
    const pollInterval = setInterval(() => {
      fetchDeployments();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isConnected, view, deployments, fetchDeployments]);

  // Keep selected deployment in sync with refreshed data
  useEffect(() => {
    if (!selectedDeployment) return;

    const updated = deployments.find((d) => d.uid === selectedDeployment.uid);
    if (updated && updated.state !== selectedDeployment.state) {
      setSelectedDeployment(updated);
    }
  }, [deployments, selectedDeployment]);

  // Also poll logs for the selected deployment if it's building
  useEffect(() => {
    if (!selectedDeployment) return;

    const isBuilding = ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(selectedDeployment.state);
    if (!isBuilding) return;

    // Poll logs every 2 seconds for active builds
    const pollInterval = setInterval(() => {
      fetchLogs(selectedDeployment.uid);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedDeployment, fetchLogs]);

  useEffect(() => {
    if (isConnected && view === 'env') {
      fetchEnvVars();
    }
  }, [isConnected, view, fetchEnvVars]);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  const branches = Array.from(new Set(deployments.map((d) => d.meta?.githubCommitRef || 'unknown')));
  const filteredDeployments = branchFilter === 'all'
    ? deployments
    : deployments.filter((d) => d.meta?.githubCommitRef === branchFilter);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'READY':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'BUILDING':
      case 'INITIALIZING':
        return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'QUEUED':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'CANCELED':
        return <StopCircle className="w-5 h-5 text-neutral-400" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusBadgeClass = (state: string) => {
    switch (state) {
      case 'READY':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'BUILDING':
      case 'INITIALIZING':
      case 'QUEUED':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'ERROR':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
    }
  };

  // ==========================================================================
  // NOT CONNECTED STATE
  // ==========================================================================

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Rocket className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Vercel not connected
        </h3>
        <p className="text-sm text-neutral-500 mb-4 max-w-sm">
          Connect your Vercel account to manage deployments and environment variables.
        </p>
        <a
          href="/admin/settings/development/vercel"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Connect Vercel
        </a>
      </div>
    );
  }

  // ==========================================================================
  // MOBILE DETAIL VIEW
  // ==========================================================================

  if (isMobile && mobileView === 'detail' && selectedDeployment) {
    const isBuilding = ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(selectedDeployment.state);

    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={handleMobileBack}
            className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className={cn('px-2 py-1 text-xs rounded-full', getStatusBadgeClass(selectedDeployment.state))}>
            {getStatusLabel(selectedDeployment.state)}
          </span>
        </div>

        {/* Deployment Info */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          {selectedDeployment.meta?.githubCommitMessage && (
            <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {selectedDeployment.meta.githubCommitMessage}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            {selectedDeployment.meta?.githubCommitRef && (
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {selectedDeployment.meta.githubCommitRef}
                {selectedDeployment.meta.githubCommitSha && (
                  <code className="ml-1">{selectedDeployment.meta.githubCommitSha.substring(0, 7)}</code>
                )}
              </span>
            )}
            <span>{getTimeAgo(selectedDeployment.createdAt)}</span>
          </div>
          {selectedDeployment.url && (
            <a
              href={`https://${selectedDeployment.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-sm text-primary-500"
            >
              {selectedDeployment.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-b border-neutral-200 dark:border-neutral-800">
          {isBuilding ? (
            <button
              onClick={() => handleCancel(selectedDeployment.uid)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
            >
              <StopCircle className="w-4 h-4" />
              Cancel Build
            </button>
          ) : (
            <button
              onClick={() => handleRedeploy(selectedDeployment)}
              disabled={actionLoading === selectedDeployment.uid}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              {actionLoading === selectedDeployment.uid ? 'Redeploying...' : 'Redeploy'}
            </button>
          )}
          {selectedDeployment.url && (
            <a
              href={`https://${selectedDeployment.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Site
            </a>
          )}
        </div>

        {/* Logs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 text-sm text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Build Logs
            </div>
            <button
              onClick={() => handleCopyLogs(true)}
              disabled={logs.length === 0 || loadingLogs}
              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logsCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div ref={mobileLogsContainerRef} className="flex-1 overflow-y-auto bg-neutral-950 p-3 font-mono text-xs">
            {loadingLogs ? (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading logs...
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'py-0.5',
                    log.type === 'stderr' && 'text-red-400',
                    log.type === 'stdout' && 'text-neutral-300',
                    log.type === 'command' && 'text-blue-400',
                    log.type === 'exit' && 'text-yellow-400'
                  )}
                >
                  {log.text}
                </div>
              ))
            ) : (
              <div className="text-neutral-500">No logs available</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5">
            <button
              onClick={() => setView('deployments')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                view === 'deployments'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Rocket className="w-3.5 h-3.5" />
              {!isMobile && 'Deployments'}
            </button>
            <button
              onClick={() => setView('env')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                view === 'env'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Key className="w-3.5 h-3.5" />
              {!isMobile && 'Env Vars'}
            </button>
          </div>

          {vercel.projectName && view === 'deployments' && (
            <span className="text-xs text-neutral-500 hidden md:inline">{vercel.projectName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {view === 'deployments' && (
            <>
              {/* Branch filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 border-0 text-neutral-600 dark:text-neutral-400"
              >
                <option value="all">All branches</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchDeployments}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
              {vercel.ownerSlug && vercel.projectName && (
                <a
                  href={`https://vercel.com/${vercel.ownerSlug}/${vercel.projectName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                  title="Open in Vercel Dashboard"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </>
          )}
          {view === 'env' && (
            <button
              onClick={handleAddEnv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {view === 'deployments' ? (
        <>
          {/* Loading state */}
          {isLoading && deployments.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && deployments.length === 0 && !error && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Rocket className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-neutral-500">No deployments found</p>
              <p className="text-xs text-neutral-400 mt-1">Push to your repository to trigger a deployment</p>
            </div>
          )}

          {/* Deployments list */}
          {deployments.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              {filteredDeployments.map((deployment) => {
                const isBuilding = ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(deployment.state);

                return (
                  <div key={deployment.uid} className="border-b border-neutral-100 dark:border-neutral-800">
                    <div
                      className="px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      onClick={() => handleViewLogs(deployment)}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(deployment.state)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                              {deployment.meta?.githubCommitMessage || deployment.name}
                            </span>
                            <span className={cn('px-2 py-0.5 text-xs rounded-full', getStatusBadgeClass(deployment.state))}>
                              {getStatusLabel(deployment.state)}
                            </span>
                            {deployment.target === 'production' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                Production
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {deployment.meta?.githubCommitRef || 'unknown'}
                            </div>
                            <span>{getTimeAgo(deployment.createdAt)}</span>
                            {deployment.meta?.githubCommitAuthorName && (
                              <span>by {deployment.meta.githubCommitAuthorName}</span>
                            )}
                          </div>

                          {isBuilding && (
                            <div className="mt-2 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500 animate-pulse"
                                style={{ width: deployment.state === 'INITIALIZING' ? '20%' : '60%' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {deployment.url && deployment.state === 'READY' && (
                            <a
                              href={`https://${deployment.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {deployment.state === 'READY' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedeploy(deployment);
                              }}
                              disabled={actionLoading === deployment.uid}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-50"
                            >
                              {actionLoading === deployment.uid ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {isBuilding && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(deployment.uid);
                              }}
                              disabled={actionLoading === deployment.uid}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-50"
                            >
                              {actionLoading === deployment.uid ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <StopCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded logs (desktop) */}
                    {!isMobile && selectedDeployment?.uid === deployment.uid && (
                      <div className="px-4 pb-4">
                        <div className="bg-neutral-950 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 text-xs text-neutral-400">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3 h-3" />
                              Build Logs
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyLogs(false)}
                                disabled={logs.length === 0 || loadingLogs}
                                className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {logsCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button onClick={() => setSelectedDeployment(null)} className="p-1 hover:bg-neutral-800 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div ref={logsContainerRef} className="p-3 max-h-64 overflow-y-auto font-mono text-xs">
                            {loadingLogs ? (
                              <div className="flex items-center gap-2 text-neutral-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading logs...
                              </div>
                            ) : logs.length > 0 ? (
                              logs.map((log) => (
                                <div
                                  key={log.id}
                                  className={cn(
                                    'py-0.5',
                                    log.type === 'stderr' && 'text-red-400',
                                    log.type === 'stdout' && 'text-neutral-300',
                                    log.type === 'command' && 'text-blue-400',
                                    log.type === 'exit' && 'text-yellow-400'
                                  )}
                                >
                                  {log.text}
                                </div>
                              ))
                            ) : (
                              <div className="text-neutral-500">No logs available</div>
                            )}
                          </div>
                        </div>

                        {deployment.url && (
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <Globe className="w-3 h-3 text-neutral-500" />
                            <a
                              href={`https://${deployment.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-500 hover:text-primary-600"
                            >
                              {deployment.url}
                            </a>
                          </div>
                        )}

                        {deployment.inspectorUrl && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <ExternalLink className="w-3 h-3 text-neutral-500" />
                            <a
                              href={deployment.inspectorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-500 hover:text-neutral-400"
                            >
                              View in Vercel Dashboard
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Env Vars View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {envLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : envVars.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Key className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-neutral-500">No environment variables</p>
              <p className="text-xs text-neutral-400 mt-1">Add variables to configure your deployments</p>
              <button
                onClick={handleAddEnv}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Environment Variable
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* Group by target */}
              {['production', 'preview', 'development'].map((target) => {
                const vars = envVars.filter((env) => env.target.includes(target as any));
                if (vars.length === 0) return null;

                return (
                  <div key={target} className="p-4">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">{target}</h3>
                    <div className="space-y-2">
                      {vars.map((env) => (
                        <div key={env.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div>
                            <code className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{env.key}</code>
                            <p className="text-xs text-neutral-500 mt-0.5 font-mono">{'••••••••••••'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditEnv(env)}
                              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEnv(env)}
                              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Env Var Modal */}
      {envModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEnvModalOpen(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                {editingEnv ? 'Edit Environment Variable' : 'Add Environment Variable'}
              </h3>
              <button onClick={() => setEnvModalOpen(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {envError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                  {envError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Key</label>
                <input
                  type="text"
                  value={envForm.key}
                  onChange={(e) => setEnvForm((prev) => ({ ...prev, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                  placeholder="MY_ENV_VAR"
                  disabled={!!editingEnv}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Value {editingEnv && <span className="text-neutral-400 font-normal">(enter new value to update)</span>}
                </label>
                <textarea
                  value={envForm.value}
                  onChange={(e) => setEnvForm((prev) => ({ ...prev, value: e.target.value }))}
                  placeholder={editingEnv ? 'Enter new value...' : 'Enter value...'}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Environments</label>
                <div className="flex items-center gap-4">
                  {(['production', 'preview', 'development'] as const).map((target) => (
                    <label key={target} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={envForm.targets.includes(target)}
                        onChange={() => toggleTarget(target)}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{target}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setEnvModalOpen(false)}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnv}
                disabled={envSaving || !envForm.key.trim() || (!envForm.value.trim() && !editingEnv)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {envSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingEnv ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
