'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Github,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  GitBranch,
  FolderGit2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  User,
  ChevronDown,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  type: 'User' | 'Organization';
}

interface GitHubOrg {
  login: string;
  avatar_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

export default function GitHubSettingsPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User and organizations
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Repository selection
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Get owners list (user + orgs)
  const owners = useMemo(() => {
    const list: Array<{ login: string; avatar_url: string; type: 'user' | 'org' }> = [];
    if (currentUser) {
      list.push({ login: currentUser.login, avatar_url: currentUser.avatar_url, type: 'user' });
    }
    organizations.forEach((org) => {
      list.push({ login: org.login, avatar_url: org.avatar_url, type: 'org' });
    });
    return list;
  }, [currentUser, organizations]);

  // Filter repos by selected owner
  const filteredRepos = useMemo(() => {
    if (!selectedOwner) return repos;
    return repos.filter((repo) => repo.owner.login === selectedOwner);
  }, [repos, selectedOwner]);

  // Fetch user info and organizations
  const fetchUserAndOrgs = useCallback(async (accessToken: string) => {
    setIsLoadingOrgs(true);
    try {
      // Fetch user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Invalid token or token lacks required permissions');
      }

      const userData: GitHubUser = await userResponse.json();
      setCurrentUser(userData);

      // Fetch organizations
      const orgsResponse = await fetch('https://api.github.com/user/orgs', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (orgsResponse.ok) {
        const orgsData: GitHubOrg[] = await orgsResponse.json();
        setOrganizations(orgsData);
      }

      return userData;
    } catch (err) {
      console.error('Failed to fetch user/orgs:', err);
      throw err;
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  // Fetch repos from GitHub (all accessible repos)
  const fetchRepos = useCallback(async (accessToken: string) => {
    setIsLoadingRepos(true);
    try {
      // Fetch user repos
      const userReposResponse = await fetch(
        'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!userReposResponse.ok) {
        throw new Error(`GitHub API error: ${userReposResponse.status}`);
      }

      const userRepos: GitHubRepo[] = await userReposResponse.json();
      setRepos(userRepos);
      setTokenValidated(true);
    } catch (err) {
      console.error('Failed to fetch repos:', err);
      setError('Failed to fetch repositories from GitHub');
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  // Load saved settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/integrations/github');
        const data = await response.json();

        if (data.connected && data.data) {
          setToken(data.data.token || '');
          setIsConnected(true);
          setTokenValidated(true);
          if (data.data.owner) {
            setRepoInfo({
              owner: data.data.owner,
              repo: data.data.repo || '',
              defaultBranch: data.data.branch || 'main',
            });
            setSelectedOwner(data.data.owner);
          }
          // Fetch user, orgs, and repos if we have a token
          if (data.data.token) {
            await fetchUserAndOrgs(data.data.token);
            await fetchRepos(data.data.token);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [fetchUserAndOrgs, fetchRepos]);

  // Test connection and fetch everything
  const testConnection = useCallback(async () => {
    if (!token) {
      setError('Please enter a token first');
      return;
    }

    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = await fetchUserAndOrgs(token);
      setSuccess(`Connected as ${userData.login}`);
      setTokenValidated(true);

      // Auto-select user as default owner
      setSelectedOwner(userData.login);

      // Fetch repos
      await fetchRepos(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setTokenValidated(false);
      setRepos([]);
      setOrganizations([]);
      setCurrentUser(null);
    } finally {
      setIsTesting(false);
    }
  }, [token, fetchUserAndOrgs, fetchRepos]);

  // Select a repository
  const selectRepo = useCallback((repo: GitHubRepo) => {
    setRepoInfo({
      owner: repo.owner.login,
      repo: repo.name,
      defaultBranch: repo.default_branch,
    });
    setIsConnected(true);
  }, []);

  // Save settings
  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/github', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          owner: repoInfo?.owner,
          repo: repoInfo?.repo,
          branch: repoInfo?.defaultBranch,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [token, repoInfo]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!confirm('Are you sure you want to disconnect GitHub?')) return;

    try {
      await fetch('/api/integrations/github', { method: 'DELETE' });

      setToken('');
      setRepoInfo(null);
      setIsConnected(false);
      setTokenValidated(false);
      setRepos([]);
      setOrganizations([]);
      setCurrentUser(null);
      setSelectedOwner(null);
      setSuccess('Disconnected from GitHub');
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
            <span className="text-neutral-700 dark:text-neutral-300">GitHub</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                GitHub Integration
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isConnected && repoInfo ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    {repoInfo.owner}/{repoInfo.repo}
                  </span>
                ) : tokenValidated ? (
                  <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    Select a repository
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

        {/* Token input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Personal Access Token
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Create a{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user,read:org&description=Local%20IDE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600"
            >
              Personal Access Token
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>{' '}
            with <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">repo</code>,{' '}
            <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">read:user</code>, and{' '}
            <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">read:org</code> scopes.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-neutral-50 dark:bg-neutral-800',
                  'border border-neutral-200 dark:border-neutral-700',
                  'font-mono text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                )}
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testConnection}
              disabled={isTesting || !token}
              className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : tokenValidated ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </motion.div>

        {/* Organization/Owner Selection */}
        {tokenValidated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Select Account / Organization
            </h2>

            {isLoadingOrgs ? (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading organizations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {owners.map((owner) => (
                  <button
                    key={owner.login}
                    onClick={() => setSelectedOwner(owner.login)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      selectedOwner === owner.login
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                  >
                    <img
                      src={owner.avatar_url}
                      alt={owner.login}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        {owner.type === 'org' ? (
                          <Building2 className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        ) : (
                          <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
                          {owner.login}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {owner.type === 'org' ? 'Organization' : 'Personal'}
                      </span>
                    </div>
                    {selectedOwner === owner.login && (
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Repository Selection */}
        {tokenValidated && selectedOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Select Repository
              </h2>
              <span className="text-sm text-neutral-500">
                {filteredRepos.length} repositories
              </span>
            </div>

            {/* Selected repo display */}
            {repoInfo && repoInfo.owner === selectedOwner && (
              <div className="mb-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="w-5 h-5 text-primary-500" />
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {repoInfo.owner}/{repoInfo.repo}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500">
                        <GitBranch className="w-3 h-3 inline mr-1" />
                        {repoInfo.defaultBranch}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {isLoadingRepos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500">Loading repositories...</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No repositories found for {selectedOwner}</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all',
                      'border',
                      repoInfo?.repo === repo.name && repoInfo?.owner === repo.owner.login
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {repo.name}
                          </span>
                          {repo.private ? (
                            <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          ) : (
                            <Globe className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-neutral-500 truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-400 flex-shrink-0">
                        <GitBranch className="w-3 h-3" />
                        {repo.default_branch}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

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
            disabled={isSaving || !token || !repoInfo}
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
