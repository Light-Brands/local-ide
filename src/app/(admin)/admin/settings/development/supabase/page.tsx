'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Database,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Key,
  Shield,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  FolderKanban,
  HardDrive,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupabaseOrg {
  id: string;
  name: string;
  slug: string;
}

interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
  database?: {
    host: string;
  };
}

interface ProjectApiKeys {
  anon_key?: string;
  service_role_key?: string;
}

interface ProjectInfo {
  id: string;
  ref: string;
  name: string;
  orgId: string;
  orgName: string;
  region: string;
  url: string;
  anonKey?: string;
  serviceKey?: string;
}

export default function SupabaseSettingsPage() {
  // Access token (from Supabase account settings)
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Organizations and projects
  const [organizations, setOrganizations] = useState<SupabaseOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<SupabaseOrg | null>(null);
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard URL
  const dashboardUrl = useMemo(() => {
    if (!projectInfo?.ref) return 'https://supabase.com/dashboard';
    return `https://supabase.com/dashboard/project/${projectInfo.ref}`;
  }, [projectInfo]);

  // Fetch organizations (via server proxy to avoid CORS)
  const fetchOrganizations = useCallback(async (token: string) => {
    setIsLoadingOrgs(true);
    try {
      const response = await fetch('/api/integrations/supabase/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid token or insufficient permissions');
      }

      const data = result.data || [];
      setOrganizations(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      throw err;
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  // Fetch projects (via server proxy to avoid CORS)
  const fetchProjects = useCallback(async (token: string) => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch('/api/integrations/supabase/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch projects');
      }

      const data = result.data || [];
      setProjects(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Fetch API keys for a project (via server proxy to avoid CORS)
  const fetchProjectKeys = useCallback(async (token: string, projectRef: string): Promise<ProjectApiKeys> => {
    setIsLoadingKeys(true);
    try {
      const response = await fetch('/api/integrations/supabase/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, projectRef }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch API keys:', result.error);
        return {};
      }

      return {
        anon_key: result.data?.anonKey,
        service_role_key: result.data?.serviceKey,
      };
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      return {};
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  // Load saved settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/integrations/supabase');
        const data = await response.json();

        if (data.connected && data.data) {
          const savedToken = data.data.accessToken || '';
          setAccessToken(savedToken);
          setIsConnected(true);
          setTokenValidated(!!savedToken);

          if (data.data.projectRef) {
            setProjectInfo({
              id: data.data.projectId || '',
              ref: data.data.projectRef,
              name: data.data.projectName || '',
              orgId: data.data.orgId || '',
              orgName: data.data.orgName || '',
              region: data.data.region || '',
              url: data.data.url || '',
              anonKey: data.data.anonKey,
              serviceKey: data.data.serviceKey,
            });

            if (data.data.orgId) {
              setSelectedOrg({
                id: data.data.orgId,
                name: data.data.orgName || '',
                slug: '',
              });
            }
          }

          // Fetch orgs and projects if we have a token
          if (savedToken) {
            try {
              await fetchOrganizations(savedToken);
              await fetchProjects(savedToken);
            } catch {
              // Token might be invalid, that's ok
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [fetchOrganizations, fetchProjects]);

  // Filter projects by selected org
  const filteredProjects = useMemo(() => {
    if (!selectedOrg) return projects;
    return projects.filter(p => p.organization_id === selectedOrg.id);
  }, [projects, selectedOrg]);

  // Test connection and fetch orgs/projects
  const testConnection = useCallback(async () => {
    if (!accessToken) {
      setError('Please enter an access token');
      return;
    }

    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const orgs = await fetchOrganizations(accessToken);
      await fetchProjects(accessToken);

      setTokenValidated(true);
      setSuccess(`Connected! Found ${orgs.length} organization(s)`);

      // Auto-select first org if only one
      if (orgs.length === 1) {
        setSelectedOrg(orgs[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setTokenValidated(false);
      setOrganizations([]);
      setProjects([]);
    } finally {
      setIsTesting(false);
    }
  }, [accessToken, fetchOrganizations, fetchProjects]);

  // Select a project
  const selectProject = useCallback(async (project: SupabaseProject) => {
    if (!accessToken) return;

    const org = organizations.find(o => o.id === project.organization_id);
    const projectRef = project.id;
    const projectUrl = `https://${projectRef}.supabase.co`;

    // Fetch API keys
    const keys = await fetchProjectKeys(accessToken, projectRef);

    setProjectInfo({
      id: project.id,
      ref: projectRef,
      name: project.name,
      orgId: project.organization_id,
      orgName: org?.name || '',
      region: project.region,
      url: projectUrl,
      anonKey: keys.anon_key,
      serviceKey: keys.service_role_key,
    });

    setIsConnected(true);
  }, [accessToken, organizations, fetchProjectKeys]);

  // Save settings
  const saveSettings = useCallback(async () => {
    if (!projectInfo) {
      setError('Please select a project first');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/supabase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          url: projectInfo.url,
          projectId: projectInfo.id,
          projectRef: projectInfo.ref,
          projectName: projectInfo.name,
          orgId: projectInfo.orgId,
          orgName: projectInfo.orgName,
          region: projectInfo.region,
          anonKey: projectInfo.anonKey,
          serviceKey: projectInfo.serviceKey,
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
  }, [accessToken, projectInfo]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!confirm('Are you sure you want to disconnect Supabase?')) return;

    try {
      await fetch('/api/integrations/supabase', { method: 'DELETE' });

      setAccessToken('');
      setOrganizations([]);
      setProjects([]);
      setSelectedOrg(null);
      setProjectInfo(null);
      setTokenValidated(false);
      setIsConnected(false);
      setSuccess('Disconnected from Supabase');
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
            <span className="text-neutral-700 dark:text-neutral-300">Supabase</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Supabase Integration
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isConnected && projectInfo ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    {projectInfo.orgName && `${projectInfo.orgName} / `}{projectInfo.name}
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

        {/* Access Token */}
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
            Create an access token in your{' '}
            <a
              href="https://supabase.com/dashboard/account/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-600"
            >
              Supabase account settings
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
            . This allows access to all your organizations and projects.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxx"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-neutral-50 dark:bg-neutral-800',
                  'border border-neutral-200 dark:border-neutral-700',
                  'font-mono text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
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
              disabled={isTesting || !accessToken}
              className="px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
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

        {/* Organization Selection */}
        {tokenValidated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Select Organization
            </h2>

            {isLoadingOrgs ? (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading organizations...</span>
              </div>
            ) : organizations.length === 0 ? (
              <p className="text-sm text-neutral-500">No organizations found</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      selectedOrg?.id === org.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100 block">
                        {org.name}
                      </span>
                    </div>
                    {selectedOrg?.id === org.id && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Project Selection */}
        {tokenValidated && selectedOrg && (
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
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Selected project display */}
            {projectInfo && projectInfo.orgId === selectedOrg.id && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {projectInfo.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {projectInfo.region}
                        <span className="text-neutral-300 dark:text-neutral-600">•</span>
                        <code className="text-emerald-600 dark:text-emerald-400">{projectInfo.ref}</code>
                      </div>
                    </div>
                  </div>
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {/* Show API keys status */}
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Key className="w-3 h-3 text-neutral-400" />
                    <span className={projectInfo.anonKey ? 'text-emerald-600' : 'text-neutral-400'}>
                      Anon key {projectInfo.anonKey ? '✓' : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Shield className="w-3 h-3 text-neutral-400" />
                    <span className={projectInfo.serviceKey ? 'text-emerald-600' : 'text-neutral-400'}>
                      Service key {projectInfo.serviceKey ? '✓' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500">Loading projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No projects found in {selectedOrg.name}</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project)}
                    disabled={isLoadingKeys}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all',
                      'border',
                      projectInfo?.id === project.id && projectInfo?.orgId === selectedOrg.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                      isLoadingKeys && 'opacity-50 cursor-wait'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-6">
                          <span className="text-xs text-neutral-500">{project.region}</span>
                          <span className="text-neutral-300 dark:text-neutral-600">•</span>
                          <code className="text-xs text-neutral-400">{project.id}</code>
                        </div>
                      </div>
                      {projectInfo?.id === project.id && projectInfo?.orgId === selectedOrg.id ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : isLoadingKeys ? (
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-400 flex-shrink-0" />
                      ) : null}
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
            disabled={isSaving || !projectInfo}
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
