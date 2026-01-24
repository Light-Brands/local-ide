'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import {
  X,
  Github,
  Cloud,
  Database,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import {
  getStoredGitHubToken,
  setStoredGitHubToken,
  clearStoredGitHubToken,
} from '@/lib/ide/services/github';
import {
  getStoredVercelToken,
  setStoredVercelToken,
  clearStoredVercelToken,
  clearStoredVercelProject,
} from '@/lib/ide/services/vercel';
import {
  getStoredSupabaseConfig,
  setStoredSupabaseConfig,
  clearStoredSupabaseConfig,
} from '@/lib/ide/services/supabase-db';
import {
  getStoredClaudeApiKey,
  setStoredClaudeApiKey,
  clearStoredClaudeApiKey,
} from '@/lib/ide/services/claude';

type SettingsTab = 'github' | 'vercel' | 'supabase' | 'claude';

export function SettingsModal() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('github');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Form states
  const [githubToken, setGitHubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');

  const showSettings = useIDEStore((state) => state.ui.showSettings);
  const setShowSettings = useIDEStore((state) => state.setShowSettings);
  const setGitHubConnection = useIDEStore((state) => state.setGitHubConnection);
  const setVercelConnection = useIDEStore((state) => state.setVercelConnection);
  const setSupabaseConnection = useIDEStore((state) => state.setSupabaseConnection);
  const setClaudeConnection = useIDEStore((state) => state.setClaudeConnection);

  // Load existing values on mount
  useEffect(() => {
    if (showSettings) {
      setGitHubToken(getStoredGitHubToken() || '');
      setVercelToken(getStoredVercelToken() || '');

      const supabaseConfig = getStoredSupabaseConfig();
      if (supabaseConfig) {
        setSupabaseUrl(supabaseConfig.url);
        setSupabaseAnonKey(supabaseConfig.anonKey);
        setSupabaseServiceKey(supabaseConfig.serviceRoleKey || '');
      }

      setClaudeApiKey(getStoredClaudeApiKey() || '');
    }
  }, [showSettings]);

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showSaveSuccess = () => {
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Save handlers
  const handleSaveGitHub = () => {
    if (githubToken.trim()) {
      setStoredGitHubToken(githubToken.trim());
      setGitHubConnection({ connected: true });
    } else {
      clearStoredGitHubToken();
      setGitHubConnection({ connected: false });
    }
    showSaveSuccess();
  };

  const handleSaveVercel = () => {
    if (vercelToken.trim()) {
      setStoredVercelToken(vercelToken.trim());
      setVercelConnection({ connected: true });
    } else {
      clearStoredVercelToken();
      clearStoredVercelProject();
      setVercelConnection({ connected: false, projectId: null });
    }
    showSaveSuccess();
  };

  const handleSaveSupabase = () => {
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
      setStoredSupabaseConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
        serviceRoleKey: supabaseServiceKey.trim() || undefined,
      });
      setSupabaseConnection({ connected: true, url: supabaseUrl.trim() });
    } else {
      clearStoredSupabaseConfig();
      setSupabaseConnection({ connected: false, url: null });
    }
    showSaveSuccess();
  };

  const handleSaveClaude = () => {
    if (claudeApiKey.trim()) {
      setStoredClaudeApiKey(claudeApiKey.trim());
      setClaudeConnection({ connected: true });
    } else {
      clearStoredClaudeApiKey();
      setClaudeConnection({ connected: false });
    }
    showSaveSuccess();
  };

  // Disconnect handlers
  const handleDisconnectGitHub = () => {
    clearStoredGitHubToken();
    setGitHubToken('');
    setGitHubConnection({ connected: false });
    showSaveSuccess();
  };

  const handleDisconnectVercel = () => {
    clearStoredVercelToken();
    clearStoredVercelProject();
    setVercelToken('');
    setVercelConnection({ connected: false, projectId: null });
    showSaveSuccess();
  };

  const handleDisconnectSupabase = () => {
    clearStoredSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setSupabaseServiceKey('');
    setSupabaseConnection({ connected: false, url: null });
    showSaveSuccess();
  };

  const handleDisconnectClaude = () => {
    clearStoredClaudeApiKey();
    setClaudeApiKey('');
    setClaudeConnection({ connected: false });
    showSaveSuccess();
  };

  if (!showSettings) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; connected: boolean }[] = [
    { id: 'github', label: 'GitHub', icon: <Github className="w-4 h-4" />, connected: !!getStoredGitHubToken() },
    { id: 'vercel', label: 'Vercel', icon: <Cloud className="w-4 h-4" />, connected: !!getStoredVercelToken() },
    { id: 'supabase', label: 'Supabase', icon: <Database className="w-4 h-4" />, connected: !!getStoredSupabaseConfig() },
    { id: 'claude', label: 'Claude AI', icon: <Sparkles className="w-4 h-4" />, connected: !!getStoredClaudeApiKey() },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Settings
          </h2>
          <div className="flex items-center gap-2">
            {saveStatus && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="w-4 h-4" />
                {saveStatus}
              </span>
            )}
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.connected && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'github' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    GitHub Personal Access Token
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Used for reading and writing files to your repositories.{' '}
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                    >
                      Create token <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <div className="relative">
                    <input
                      type={showSecrets['github'] ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGitHubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className={cn(
                        'w-full px-4 py-2.5 pr-10 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-sm font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('github')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets['github'] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {getStoredGitHubToken() && (
                    <button
                      onClick={handleDisconnectGitHub}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleSaveGitHub}
                    className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'vercel' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Vercel Access Token
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Used for managing deployments and viewing logs.{' '}
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                    >
                      Create token <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <div className="relative">
                    <input
                      type={showSecrets['vercel'] ? 'text' : 'password'}
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                      className={cn(
                        'w-full px-4 py-2.5 pr-10 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-sm font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('vercel')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets['vercel'] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {getStoredVercelToken() && (
                    <button
                      onClick={handleDisconnectVercel}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleSaveVercel}
                    className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'supabase' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Supabase Project URL
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Your Supabase project URL (e.g., https://xxx.supabase.co)
                  </p>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Anon/Public Key
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Found in Project Settings → API
                  </p>
                  <div className="relative">
                    <input
                      type={showSecrets['supabase-anon'] ? 'text' : 'password'}
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className={cn(
                        'w-full px-4 py-2.5 pr-10 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-sm font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('supabase-anon')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets['supabase-anon'] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Service Role Key
                    <span className="ml-2 text-xs font-normal text-neutral-500">(Optional)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Required for schema introspection and admin operations
                  </p>
                  <div className="relative">
                    <input
                      type={showSecrets['supabase-service'] ? 'text' : 'password'}
                      value={supabaseServiceKey}
                      onChange={(e) => setSupabaseServiceKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className={cn(
                        'w-full px-4 py-2.5 pr-10 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-sm font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('supabase-service')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets['supabase-service'] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Keep your service role key secret. Never expose it in client-side code.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {getStoredSupabaseConfig() && (
                    <button
                      onClick={handleDisconnectSupabase}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleSaveSupabase}
                    className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'claude' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    Anthropic API Key
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Used for Claude AI chat features.{' '}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                    >
                      Get API key <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <div className="relative">
                    <input
                      type={showSecrets['claude'] ? 'text' : 'password'}
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className={cn(
                        'w-full px-4 py-2.5 pr-10 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-sm font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('claude')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets['claude'] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Without an API key, the chat will use demo mode with simulated responses.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {getStoredClaudeApiKey() && (
                    <button
                      onClick={handleDisconnectClaude}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleSaveClaude}
                    className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
