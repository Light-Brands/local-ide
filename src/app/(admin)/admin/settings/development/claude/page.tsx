'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Key,
  Cpu,
  Zap,
  ExternalLink,
  AlertCircle,
  Loader2,
  MessageSquare,
  Terminal,
  Cloud,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Best balance of speed and capability' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Fast and capable' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest responses' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most powerful' },
];

type ConnectionMode = 'cli' | 'api';

interface CLIStatus {
  installed: boolean;
  authenticated: boolean;
  version: string | null;
  user: string | null;
  path: string | null;
}

export default function ClaudeSettingsPage() {
  // Connection mode
  const [mode, setMode] = useState<ConnectionMode>('cli');

  // CLI settings
  const [cliPath, setCliPath] = useState('/usr/local/bin/claude');
  const [cliStatus, setCliStatus] = useState<CLIStatus | null>(null);
  const [isCheckingCLI, setIsCheckingCLI] = useState(false);

  // API settings
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(CLAUDE_MODELS[0].id);

  // Common state
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Check CLI status
  const checkCLIStatus = useCallback(async (path?: string) => {
    setIsCheckingCLI(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/claude/cli-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliPath: path || cliPath }),
      });

      const data = await response.json();

      if (data.success) {
        setCliStatus(data.status);
        if (data.status.installed && data.status.authenticated) {
          setIsConnected(true);
          setSuccess(`Claude CLI connected as ${data.status.user || 'authenticated user'}`);
        }
      } else {
        setCliStatus({
          installed: false,
          authenticated: false,
          version: null,
          user: null,
          path: null,
        });
      }
    } catch (err) {
      console.error('CLI status check failed:', err);
      setCliStatus({
        installed: false,
        authenticated: false,
        version: null,
        user: null,
        path: null,
      });
    } finally {
      setIsCheckingCLI(false);
    }
  }, [cliPath]);

  // Load saved settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/integrations/claude');
        const data = await response.json();

        if (data.connected && data.data) {
          const savedMode = data.data.mode || 'cli';
          setMode(savedMode);
          setCliPath(data.data.cliPath || '/usr/local/bin/claude');
          setApiKey(data.data.apiKey || '');
          setSelectedModel(data.data.model || CLAUDE_MODELS[0].id);
          setIsConnected(true);

          // Check CLI status if in CLI mode
          if (savedMode === 'cli') {
            checkCLIStatus(data.data.cliPath);
          }
        } else {
          // No saved settings, check CLI status by default
          checkCLIStatus();
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Still check CLI status on error
        checkCLIStatus();
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [checkCLIStatus]);

  // Test connection
  const testConnection = useCallback(async () => {
    if (!apiKey) {
      setError('Please enter an API key first');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResponse(null);

    try {
      const response = await fetch('/api/integrations/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model: selectedModel }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setIsConnected(true);
        if (data.data?.response) {
          setTestResponse(data.data.response);
        }
      } else {
        throw new Error(data.message || 'Connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, selectedModel]);

  // Save settings
  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/claude', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          cliPath,
          apiKey: mode === 'api' ? apiKey : undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setIsConnected(true);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [mode, cliPath, apiKey, selectedModel]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!confirm('Are you sure you want to disconnect Claude?')) return;

    try {
      await fetch('/api/integrations/claude', { method: 'DELETE' });

      setApiKey('');
      setSelectedModel(CLAUDE_MODELS[0].id);
      setIsConnected(false);
      setTestResponse(null);
      setCliStatus(null);
      setSuccess('Disconnected from Claude');
    } catch {
      setError('Failed to disconnect');
    }
  }, []);

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
            <span className="text-neutral-700 dark:text-neutral-300">Claude</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Claude AI Integration
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <XCircle className="w-4 h-4" />
                    Not connected
                  </span>
                )}
              </div>
            </div>
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

        {/* Connection Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Connection Mode
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Choose how to connect to Claude AI
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('cli')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                mode === 'cli'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
            >
              <Terminal className={cn('w-6 h-6', mode === 'cli' ? 'text-amber-500' : 'text-neutral-400')} />
              <div className="text-center">
                <span className="font-medium text-neutral-900 dark:text-neutral-100 block">CLI Mode</span>
                <span className="text-xs text-neutral-500">Use Claude subscription</span>
              </div>
              {mode === 'cli' && <CheckCircle className="w-4 h-4 text-amber-500" />}
            </button>

            <button
              onClick={() => setMode('api')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                mode === 'api'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
            >
              <Cloud className={cn('w-6 h-6', mode === 'api' ? 'text-amber-500' : 'text-neutral-400')} />
              <div className="text-center">
                <span className="font-medium text-neutral-900 dark:text-neutral-100 block">API Mode</span>
                <span className="text-xs text-neutral-500">Use API key</span>
              </div>
              {mode === 'api' && <CheckCircle className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        </motion.div>

        {/* CLI Configuration */}
        {mode === 'cli' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Claude CLI
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Uses your Claude Pro/Team subscription via the local CLI.{' '}
              <a
                href="https://docs.anthropic.com/en/docs/claude-code/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600"
              >
                Install Claude CLI
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </p>

            {/* CLI Status */}
            <div className="mb-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">CLI Status</span>
                <button
                  onClick={() => checkCLIStatus()}
                  disabled={isCheckingCLI}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <RefreshCw className={cn('w-3 h-3', isCheckingCLI && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {isCheckingCLI ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking CLI status...
                </div>
              ) : cliStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {cliStatus.installed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {cliStatus.installed ? `Installed (${cliStatus.version || 'version unknown'})` : 'Not installed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cliStatus.authenticated ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {cliStatus.authenticated ? `Authenticated${cliStatus.user ? ` as ${cliStatus.user}` : ''}` : 'Not authenticated'}
                    </span>
                  </div>
                  {cliStatus.path && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <FolderOpen className="w-3 h-3" />
                      {cliStatus.path}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">Click refresh to check CLI status</div>
              )}
            </div>

            {/* CLI Path */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                CLI Path (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cliPath}
                  onChange={(e) => setCliPath(e.target.value)}
                  placeholder="/usr/local/bin/claude"
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'font-mono text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  )}
                />
                <button
                  onClick={() => checkCLIStatus()}
                  disabled={isCheckingCLI}
                  className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  {isCheckingCLI ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Detect'}
                </button>
              </div>
            </div>

            {/* Authentication hint */}
            {cliStatus?.installed && !cliStatus?.authenticated && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  CLI is installed but not authenticated. Run <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs font-mono">claude login</code> in your terminal to authenticate.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* API Key input */}
        {mode === 'api' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              API Key
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Get your API key from the{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600"
              >
                Anthropic Console
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </p>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-xxxxxxxxxxxx"
                  className={cn(
                    'w-full pl-11 pr-11 py-3 rounded-xl',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'font-mono text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  )}
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={testConnection}
                disabled={isTesting || !apiKey}
                className="px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Test'}
              </button>
            </div>

            {/* Test response */}
            {testResponse && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">{testResponse}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Model selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Default Model
          </h2>

          <div className="space-y-2">
            {CLAUDE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border transition-colors',
                  selectedModel === model.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <Cpu className={cn(
                    'w-5 h-5',
                    selectedModel === model.id ? 'text-amber-500' : 'text-neutral-400'
                  )} />
                  <div className="text-left">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
                      {model.name}
                    </span>
                    <span className="text-xs text-neutral-500">{model.description}</span>
                  </div>
                </div>
                {selectedModel === model.id && (
                  <CheckCircle className="w-5 h-5 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Usage info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {mode === 'cli' ? 'Subscription Usage' : 'API Usage'}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {mode === 'cli' ? (
                  <>
                    CLI mode uses your Claude Pro or Team subscription. No additional API costs.
                    The IDE terminal will communicate directly with your local Claude CLI.
                  </>
                ) : (
                  <>
                    Claude API usage is billed based on input and output tokens. Monitor your usage in the{' '}
                    <a
                      href="https://console.anthropic.com/settings/plans"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Anthropic Console
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          {isConnected && (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={saveSettings}
            disabled={isSaving || (mode === 'api' && !apiKey) || (mode === 'cli' && !cliStatus?.authenticated)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </motion.div>
      </div>
    </div>
  );
}
