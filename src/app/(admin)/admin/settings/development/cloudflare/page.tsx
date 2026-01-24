'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Cloud,
  ChevronRight,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Plus,
  Globe,
  Wifi,
  WifiOff,
  Terminal,
  Settings,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TunnelConfig {
  tunnelId?: string;
  tunnelName?: string;
  subdomain?: string;
  localPort?: number;
  isRunning?: boolean;
  createdAt?: string;
}

interface TunnelInfo {
  id: string;
  name: string;
  connections: number;
}

interface TunnelStatus {
  installed: boolean;
  authenticated: boolean;
  tunnels: { id: string; name: string; createdAt: string }[];
  config: TunnelConfig;
  tunnelInfo?: TunnelInfo | null;
  installCommand?: string;
  loginCommand?: string;
}

export default function CloudflareSettingsPage() {
  const [status, setStatus] = useState<TunnelStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Form state for new tunnel
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tunnelForm, setTunnelForm] = useState({
    tunnelName: '',
    subdomain: '',
    domain: '',
    localPort: 4000,
  });

  // Fetch tunnel status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/tunnel');
      const data = await response.json();
      setStatus(data);

      // Parse subdomain if exists
      if (data.config?.subdomain) {
        const parts = data.config.subdomain.split('.');
        if (parts.length >= 2) {
          setTunnelForm(prev => ({
            ...prev,
            subdomain: parts[0],
            domain: parts.slice(1).join('.'),
            localPort: data.config.localPort || 4000,
            tunnelName: data.config.tunnelName || '',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch tunnel status:', err);
      setError('Failed to load tunnel status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check tunnel health
  const checkHealth = useCallback(async () => {
    if (!status?.config?.subdomain) return;

    setCheckingHealth(true);
    try {
      const response = await fetch(`https://${status.config.subdomain}`, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      setIsHealthy(true);
    } catch {
      setIsHealthy(false);
    } finally {
      setCheckingHealth(false);
    }
  }, [status?.config?.subdomain]);

  // Auto-check health when tunnel is running
  useEffect(() => {
    if (status?.config?.isRunning && status?.config?.subdomain) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [status?.config?.isRunning, status?.config?.subdomain, checkHealth]);

  // Handle tunnel actions
  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setActionLoading(action);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message);
        await fetchStatus();

        if (action === 'start') {
          setTimeout(checkHealth, 3000);
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
            <Link href="/admin/settings" className="hover:text-neutral-700 dark:hover:text-neutral-300">
              Settings
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/admin/settings/development" className="hover:text-neutral-700 dark:hover:text-neutral-300">
              Development
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-700 dark:text-neutral-300">Cloudflare Tunnel</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Cloudflare Tunnel
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {status?.config?.isRunning ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-4 h-4" />
                    Connected - {status.config.subdomain}
                  </span>
                ) : status?.config?.tunnelName ? (
                  <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-4 h-4" />
                    Tunnel stopped
                  </span>
                ) : status?.authenticated ? (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <Settings className="w-4 h-4" />
                    Ready to configure
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <XCircle className="w-4 h-4" />
                    Not connected
                  </span>
                )}
              </div>
            </div>
            {/* Quick Actions */}
            {status?.config?.tunnelName && (
              <div className="flex items-center gap-2">
                {status.config.isRunning ? (
                  <button
                    onClick={() => handleAction('stop')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'stop' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('start')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'start' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Error/Success messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </motion.div>
        )}

        {/* Step 1: Installation Check */}
        {!status?.installed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Install Cloudflared CLI
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  The cloudflared CLI is required to create tunnels. Install it using Homebrew:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-neutral-900 text-neutral-100 rounded-xl text-sm font-mono">
                    brew install cloudflared
                  </code>
                  <button
                    onClick={() => copyToClipboard('brew install cloudflared')}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    <Copy className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <button
                  onClick={fetchStatus}
                  className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check again after installing
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Authentication */}
        {status?.installed && !status?.authenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Authenticate with Cloudflare
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Run this command in your terminal. It will open a browser to connect your Cloudflare account:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-neutral-900 text-neutral-100 rounded-xl text-sm font-mono">
                    cloudflared login
                  </code>
                  <button
                    onClick={() => copyToClipboard('cloudflared login')}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    <Copy className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <button
                  onClick={fetchStatus}
                  className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check authentication status
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Status Card */}
        {status?.authenticated && status?.config?.tunnelName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Tunnel Status
              </h2>
              <button
                onClick={fetchStatus}
                disabled={!!actionLoading}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4 text-neutral-500', actionLoading && 'animate-spin')} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Connection Status */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-2 mb-2">
                  {status.config.isRunning ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                  )}
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Connection
                  </span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {status.config.isRunning ? 'Active' : 'Stopped'}
                </p>
              </div>

              {/* Health Status */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Health
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {checkingHealth ? (
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  ) : isHealthy === null ? (
                    <span className="text-neutral-500">-</span>
                  ) : isHealthy ? (
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Healthy</span>
                  ) : (
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">Unreachable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tunnel Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">Tunnel Name</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {status.config.tunnelName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">Tunnel ID</span>
                <span className="text-sm font-mono text-neutral-900 dark:text-neutral-100">
                  {status.config.tunnelId?.substring(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">Local Port</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {status.config.localPort}
                </span>
              </div>
              {status.config.subdomain && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-neutral-500">Public URL</span>
                  <a
                    href={`https://${status.config.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    https://{status.config.subdomain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {status.config.subdomain && status.config.isRunning && (
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <a
                    href={`https://${status.config.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Public URL
                  </a>
                  <button
                    onClick={() => copyToClipboard(`https://${status.config.subdomain}`)}
                    className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={checkHealth}
                    disabled={checkingHealth}
                    className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    {checkingHealth ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Configuration Form */}
        {status?.authenticated && !status?.config?.tunnelName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Create New Tunnel
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Set up a tunnel to expose your local development server to the internet.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tunnel Name
                  </label>
                  <input
                    type="text"
                    value={tunnelForm.tunnelName}
                    onChange={(e) => setTunnelForm({ ...tunnelForm, tunnelName: e.target.value })}
                    placeholder="my-dev-tunnel"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Local Port
                  </label>
                  <input
                    type="number"
                    value={tunnelForm.localPort}
                    onChange={(e) => setTunnelForm({ ...tunnelForm, localPort: parseInt(e.target.value) || 4000 })}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={tunnelForm.subdomain}
                    onChange={(e) => setTunnelForm({ ...tunnelForm, subdomain: e.target.value })}
                    placeholder="dev"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={tunnelForm.domain}
                    onChange={(e) => setTunnelForm({ ...tunnelForm, domain: e.target.value })}
                    placeholder="example.com"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Must be managed by Cloudflare
                  </p>
                </div>
              </div>

              {tunnelForm.subdomain && tunnelForm.domain && (
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your site will be available at:{' '}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      https://{tunnelForm.subdomain}.{tunnelForm.domain}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={() => handleAction('create', tunnelForm)}
                disabled={!tunnelForm.tunnelName || !!actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'create' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Tunnel
              </button>
            </div>
          </motion.div>
        )}

        {/* Configure DNS (after tunnel created but no subdomain) */}
        {status?.authenticated && status?.config?.tunnelName && !status?.config?.subdomain && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Configure DNS Route
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Point a subdomain to your tunnel.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Subdomain
                </label>
                <input
                  type="text"
                  value={tunnelForm.subdomain}
                  onChange={(e) => setTunnelForm({ ...tunnelForm, subdomain: e.target.value })}
                  placeholder="dev"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'text-neutral-900 dark:text-white',
                    'placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={tunnelForm.domain}
                  onChange={(e) => setTunnelForm({ ...tunnelForm, domain: e.target.value })}
                  placeholder="example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'text-neutral-900 dark:text-white',
                    'placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  )}
                />
              </div>
            </div>

            <button
              onClick={() => handleAction('configure-dns', {
                tunnelName: status.config.tunnelName,
                subdomain: tunnelForm.subdomain,
                domain: tunnelForm.domain,
              })}
              disabled={!tunnelForm.subdomain || !tunnelForm.domain || !!actionLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'configure-dns' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              Configure DNS
            </button>
          </motion.div>
        )}

        {/* Available Tunnels */}
        {status?.authenticated && status?.tunnels && status.tunnels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Your Cloudflare Tunnels
            </h2>
            <div className="space-y-2">
              {status.tunnels.map((tunnel) => (
                <div
                  key={tunnel.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl',
                    tunnel.name === status.config?.tunnelName
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'bg-neutral-50 dark:bg-neutral-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Cloud className={cn(
                      'w-5 h-5',
                      tunnel.name === status.config?.tunnelName
                        ? 'text-primary-500'
                        : 'text-neutral-400'
                    )} />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {tunnel.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        ID: {tunnel.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  {tunnel.name === status.config?.tunnelName ? (
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30">
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAction('save-config', {
                        tunnelName: tunnel.name,
                        localPort: tunnelForm.localPort,
                      })}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Use this tunnel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Danger Zone */}
        {status?.config?.tunnelName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50"
          >
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Deleting the tunnel will remove the DNS records and make the public URL inaccessible.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this tunnel? This cannot be undone.')) {
                  handleAction('delete');
                }
              }}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'delete' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Tunnel
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
