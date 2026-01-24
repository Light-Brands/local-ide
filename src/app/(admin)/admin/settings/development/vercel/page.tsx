'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Triangle,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  FolderKanban,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  User,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VercelUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  avatar?: string;
}

interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  avatar?: string;
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org: string;
  };
}

interface ProjectInfo {
  id: string;
  name: string;
  teamId?: string;
  teamSlug?: string;
  ownerSlug: string; // username or team slug for URL
}

export default function VercelSettingsPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User and teams
  const [currentUser, setCurrentUser] = useState<VercelUser | null>(null);
  const [teams, setTeams] = useState<VercelTeam[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<{ type: 'user' | 'team'; id: string; slug: string } | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Projects
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Get owners list (user + teams)
  const owners = useMemo(() => {
    const list: Array<{ type: 'user' | 'team'; id: string; slug: string; name: string; avatar?: string }> = [];
    if (currentUser) {
      list.push({
        type: 'user',
        id: currentUser.id,
        slug: currentUser.username,
        name: currentUser.name || currentUser.username,
        avatar: currentUser.avatar,
      });
    }
    teams.forEach((team) => {
      list.push({
        type: 'team',
        id: team.id,
        slug: team.slug,
        name: team.name,
        avatar: team.avatar,
      });
    });
    return list;
  }, [currentUser, teams]);

  // Fetch user info and teams
  const fetchUserAndTeams = useCallback(async (accessToken: string) => {
    setIsLoadingTeams(true);
    try {
      // Fetch user info
      const userResponse = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Invalid token or token lacks required permissions');
      }

      const userData = await userResponse.json();
      setCurrentUser(userData.user);

      // Fetch teams
      const teamsResponse = await fetch('https://api.vercel.com/v2/teams', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams || []);
      }

      return userData.user;
    } catch (err) {
      console.error('Failed to fetch user/teams:', err);
      throw err;
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  // Fetch projects for selected owner
  const fetchProjects = useCallback(async (accessToken: string, teamId?: string) => {
    setIsLoadingProjects(true);
    try {
      const url = teamId
        ? `https://api.vercel.com/v9/projects?teamId=${teamId}`
        : 'https://api.vercel.com/v9/projects';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Load saved settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/integrations/vercel');
        const data = await response.json();

        if (data.connected && data.data) {
          const savedToken = data.data.token || '';
          setToken(savedToken);
          setIsConnected(true);
          setTokenValidated(true);

          if (data.data.projectId) {
            setProjectInfo({
              id: data.data.projectId,
              name: data.data.projectName || '',
              teamId: data.data.teamId,
              teamSlug: data.data.teamSlug,
              ownerSlug: data.data.teamSlug || data.data.ownerSlug || '',
            });

            // Set selected owner
            if (data.data.teamId) {
              setSelectedOwner({
                type: 'team',
                id: data.data.teamId,
                slug: data.data.teamSlug || '',
              });
            }
          }

          // Fetch user, teams, and projects if we have a token
          if (savedToken) {
            const user = await fetchUserAndTeams(savedToken);
            // If no team selected, default to user
            if (!data.data.teamId && user) {
              setSelectedOwner({
                type: 'user',
                id: user.id,
                slug: user.username,
              });
            }
            // Fetch projects for selected owner
            await fetchProjects(savedToken, data.data.teamId);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [fetchUserAndTeams, fetchProjects]);

  // Fetch projects when owner changes
  useEffect(() => {
    if (tokenValidated && token && selectedOwner) {
      const teamId = selectedOwner.type === 'team' ? selectedOwner.id : undefined;
      fetchProjects(token, teamId);
    }
  }, [tokenValidated, token, selectedOwner, fetchProjects]);

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
      const userData = await fetchUserAndTeams(token);
      setSuccess(`Connected as ${userData.username}`);
      setTokenValidated(true);
      setIsConnected(true);

      // Auto-select user as default owner
      setSelectedOwner({
        type: 'user',
        id: userData.id,
        slug: userData.username,
      });

      // Fetch personal projects
      await fetchProjects(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setTokenValidated(false);
      setProjects([]);
      setTeams([]);
      setCurrentUser(null);
    } finally {
      setIsTesting(false);
    }
  }, [token, fetchUserAndTeams, fetchProjects]);

  // Select a project
  const selectProject = useCallback((project: VercelProject) => {
    if (!selectedOwner) return;

    setProjectInfo({
      id: project.id,
      name: project.name,
      teamId: selectedOwner.type === 'team' ? selectedOwner.id : undefined,
      teamSlug: selectedOwner.type === 'team' ? selectedOwner.slug : undefined,
      ownerSlug: selectedOwner.slug,
    });
  }, [selectedOwner]);

  // Save settings
  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/vercel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          projectId: projectInfo?.id,
          projectName: projectInfo?.name,
          teamId: projectInfo?.teamId,
          teamSlug: projectInfo?.teamSlug,
          ownerSlug: projectInfo?.ownerSlug,
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
  }, [token, projectInfo]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!confirm('Are you sure you want to disconnect Vercel?')) return;

    try {
      await fetch('/api/integrations/vercel', { method: 'DELETE' });

      setToken('');
      setProjectInfo(null);
      setProjects([]);
      setTeams([]);
      setCurrentUser(null);
      setSelectedOwner(null);
      setIsConnected(false);
      setTokenValidated(false);
      setSuccess('Disconnected from Vercel');
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
            <span className="text-neutral-700 dark:text-neutral-300">Vercel</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
              <Triangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Vercel Integration
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isConnected && projectInfo ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    {projectInfo.ownerSlug}/{projectInfo.name}
                  </span>
                ) : tokenValidated ? (
                  <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    Select a project
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
            Access Token
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Create an{' '}
            <a
              href="https://vercel.com/account/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600"
            >
              Access Token
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>{' '}
            from your Vercel account settings. Make sure it has access to your teams.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxx"
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

        {/* Team/Account Selection */}
        {tokenValidated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Select Account / Team
            </h2>

            {isLoadingTeams ? (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading teams...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {owners.map((owner) => (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedOwner({ type: owner.type, id: owner.id, slug: owner.slug })}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      selectedOwner?.id === owner.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                  >
                    {owner.avatar ? (
                      <img
                        src={owner.avatar}
                        alt={owner.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        {owner.type === 'team' ? (
                          <Building2 className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <User className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        {owner.type === 'team' ? (
                          <Building2 className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        ) : (
                          <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
                          {owner.name}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {owner.type === 'team' ? 'Team' : 'Personal'}
                      </span>
                    </div>
                    {selectedOwner?.id === owner.id && (
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Project Selection */}
        {tokenValidated && selectedOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Select Project
              </h2>
              <span className="text-sm text-neutral-500">
                {projects.length} projects
              </span>
            </div>

            {/* Selected project display */}
            {projectInfo && projectInfo.ownerSlug === selectedOwner.slug && (
              <div className="mb-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-5 h-5 text-primary-500" />
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {projectInfo.ownerSlug}/{projectInfo.name}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://vercel.com/${projectInfo.ownerSlug}/${projectInfo.name}`}
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

            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No projects found for {selectedOwner.slug}</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all',
                      'border',
                      projectInfo?.id === project.id && projectInfo?.ownerSlug === selectedOwner.slug
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {project.name}
                          </span>
                        </div>
                        {project.link && (
                          <p className="text-xs text-neutral-500 mt-0.5 ml-6">
                            {project.link.org}/{project.link.repo}
                          </p>
                        )}
                      </div>
                      {projectInfo?.id === project.id && projectInfo?.ownerSlug === selectedOwner.slug && (
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      )}
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
            disabled={isSaving || !token || !projectInfo}
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
