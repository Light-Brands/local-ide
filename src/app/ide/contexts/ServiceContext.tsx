'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useIDEStore } from '../stores/ideStore';
import { setStoredSupabaseConfig, getStoredSupabaseConfig } from '@/lib/ide/services/supabase-db';

// Service connection status
interface ServiceStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
}

interface GitHubStatus extends ServiceStatus {
  owner: string | null;
  repo: string | null;
  branch: string;
}

interface VercelStatus extends ServiceStatus {
  projectId: string | null;
  projectName: string | null;
  teamId: string | null;
  teamSlug: string | null;
  ownerSlug: string | null;
}

interface SupabaseStatus extends ServiceStatus {
  url: string | null;
  projectId: string | null;
  projectRef: string | null;
  projectName: string | null;
  orgId: string | null;
  orgName: string | null;
}

interface ClaudeStatus extends ServiceStatus {
  model: string;
}

interface ServiceContextValue {
  github: GitHubStatus;
  vercel: VercelStatus;
  supabase: SupabaseStatus;
  claude: ClaudeStatus;

  // Initialization
  isInitialized: boolean;
  initializationProgress: number;

  // Actions
  refreshGitHub: () => Promise<void>;
  refreshVercel: () => Promise<void>;
  refreshSupabase: () => Promise<void>;
  refreshClaude: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextValue | null>(null);

interface ServiceProviderProps {
  children: ReactNode;
}

export function ServiceProvider({ children }: ServiceProviderProps) {
  const { integrations, setGitHubConnection, setVercelConnection, setSupabaseConnection, setClaudeConnection } = useIDEStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);

  // Service states with loading/error tracking
  const [github, setGitHub] = useState<GitHubStatus>({
    connected: false,
    loading: false,
    error: null,
    owner: null,
    repo: null,
    branch: 'main',
  });

  const [vercel, setVercel] = useState<VercelStatus>({
    connected: false,
    loading: false,
    error: null,
    projectId: null,
    projectName: null,
    teamId: null,
    teamSlug: null,
    ownerSlug: null,
  });

  const [supabase, setSupabase] = useState<SupabaseStatus>({
    connected: false,
    loading: false,
    error: null,
    url: null,
    projectId: null,
    projectRef: null,
    projectName: null,
    orgId: null,
    orgName: null,
  });

  const [claude, setClaude] = useState<ClaudeStatus>({
    connected: false,
    loading: false,
    error: null,
    model: 'claude-sonnet-4-20250514',
  });

  // Fetch all integrations from the API
  const fetchIntegrationsFromAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations');
      if (!response.ok) return null;
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      return null;
    }
  }, []);

  // Refresh GitHub connection
  const refreshGitHub = useCallback(async () => {
    setGitHub((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const integrations = await fetchIntegrationsFromAPI();

      if (integrations?.github?.connected) {
        const { owner, repo, branch } = integrations.github;
        setGitHub({
          connected: true,
          loading: false,
          error: null,
          owner: owner || null,
          repo: repo || null,
          branch: branch || 'main',
        });
        setGitHubConnection({ connected: true, owner, repo, branch: branch || 'main' });
      } else {
        setGitHub((prev) => ({ ...prev, connected: false, loading: false }));
        setGitHubConnection({ connected: false });
      }
    } catch (error) {
      setGitHub((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to GitHub',
      }));
    }
  }, [setGitHubConnection, fetchIntegrationsFromAPI]);

  // Refresh Vercel connection
  const refreshVercel = useCallback(async () => {
    setVercel((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const integrations = await fetchIntegrationsFromAPI();

      if (integrations?.vercel?.connected) {
        const { projectId, projectName, teamId, teamSlug, ownerSlug } = integrations.vercel;
        setVercel({
          connected: true,
          loading: false,
          error: null,
          projectId: projectId || null,
          projectName: projectName || null,
          teamId: teamId || null,
          teamSlug: teamSlug || null,
          ownerSlug: ownerSlug || null,
        });
        setVercelConnection({
          connected: true,
          projectId,
          projectName,
          teamId,
          teamSlug,
          ownerSlug,
        });
      } else {
        setVercel((prev) => ({ ...prev, connected: false, loading: false }));
        setVercelConnection({ connected: false });
      }
    } catch (error) {
      setVercel((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Vercel',
      }));
    }
  }, [setVercelConnection, fetchIntegrationsFromAPI]);

  // Sync Supabase credentials from server to localStorage
  const syncSupabaseCredentials = useCallback(async () => {
    // Check if we already have credentials in localStorage
    const existingConfig = getStoredSupabaseConfig();
    if (existingConfig) {
      return; // Already have credentials, no need to sync
    }

    try {
      const response = await fetch('/api/integrations/supabase/credentials');
      if (response.ok) {
        const credentials = await response.json();
        if (credentials.url && credentials.anonKey) {
          setStoredSupabaseConfig({
            url: credentials.url,
            anonKey: credentials.anonKey,
            serviceRoleKey: credentials.serviceRoleKey,
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync Supabase credentials:', error);
    }
  }, []);

  // Refresh Supabase connection
  const refreshSupabase = useCallback(async () => {
    setSupabase((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const integrations = await fetchIntegrationsFromAPI();

      if (integrations?.supabase?.connected) {
        const { url, projectId, projectRef, projectName, orgId, orgName } = integrations.supabase;
        // Extract project ref from URL if not provided
        const ref = projectRef || url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || null;

        // Sync credentials to localStorage if not present
        await syncSupabaseCredentials();

        setSupabase({
          connected: true,
          loading: false,
          error: null,
          url: url || null,
          projectId: projectId || null,
          projectRef: ref,
          projectName: projectName || null,
          orgId: orgId || null,
          orgName: orgName || null,
        });
        setSupabaseConnection({
          connected: true,
          url,
          projectId,
          projectRef: ref,
          projectName,
          orgId,
          orgName,
        });
      } else {
        setSupabase((prev) => ({ ...prev, connected: false, loading: false }));
        setSupabaseConnection({ connected: false });
      }
    } catch (error) {
      setSupabase((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Supabase',
      }));
    }
  }, [setSupabaseConnection, fetchIntegrationsFromAPI, syncSupabaseCredentials]);

  // Refresh Claude connection
  const refreshClaude = useCallback(async () => {
    setClaude((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const integrations = await fetchIntegrationsFromAPI();

      if (integrations?.claude?.connected) {
        const { model, mode } = integrations.claude;
        setClaude({
          connected: true,
          loading: false,
          error: null,
          model: model || 'claude-sonnet-4-20250514',
        });
        setClaudeConnection({
          connected: true,
          model: model || 'claude-sonnet-4-20250514',
        });
      } else {
        setClaude((prev) => ({ ...prev, connected: false, loading: false }));
        setClaudeConnection({ connected: false });
      }
    } catch (error) {
      setClaude((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Claude',
      }));
    }
  }, [setClaudeConnection, fetchIntegrationsFromAPI]);

  // Refresh all services (optimized to fetch integrations once)
  const refreshAll = useCallback(async () => {
    setInitializationProgress(0);

    try {
      // Fetch all integrations in one API call
      const integrations = await fetchIntegrationsFromAPI();
      setInitializationProgress(20);

      // Update GitHub
      if (integrations?.github?.connected) {
        const { owner, repo, branch } = integrations.github;
        setGitHub({
          connected: true,
          loading: false,
          error: null,
          owner: owner || null,
          repo: repo || null,
          branch: branch || 'main',
        });
        setGitHubConnection({ connected: true, owner, repo, branch: branch || 'main' });
      }
      setInitializationProgress(40);

      // Update Vercel
      if (integrations?.vercel?.connected) {
        const { projectId, projectName, teamId, teamSlug, ownerSlug } = integrations.vercel;
        setVercel({
          connected: true,
          loading: false,
          error: null,
          projectId: projectId || null,
          projectName: projectName || null,
          teamId: teamId || null,
          teamSlug: teamSlug || null,
          ownerSlug: ownerSlug || null,
        });
        setVercelConnection({ connected: true, projectId, projectName, teamId, teamSlug, ownerSlug });
      }
      setInitializationProgress(60);

      // Update Supabase
      if (integrations?.supabase?.connected) {
        const { url, projectId, projectRef, projectName, orgId, orgName } = integrations.supabase;
        const ref = projectRef || url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || null;

        // Sync credentials to localStorage if not present
        await syncSupabaseCredentials();

        setSupabase({
          connected: true,
          loading: false,
          error: null,
          url: url || null,
          projectId: projectId || null,
          projectRef: ref,
          projectName: projectName || null,
          orgId: orgId || null,
          orgName: orgName || null,
        });
        setSupabaseConnection({ connected: true, url, projectId, projectRef: ref, projectName, orgId, orgName });
      }
      setInitializationProgress(80);

      // Update Claude
      if (integrations?.claude?.connected) {
        const { model } = integrations.claude;
        setClaude({
          connected: true,
          loading: false,
          error: null,
          model: model || 'claude-sonnet-4-20250514',
        });
        setClaudeConnection({ connected: true, model: model || 'claude-sonnet-4-20250514' });
      }
      setInitializationProgress(100);
    } catch (error) {
      console.error('Failed to refresh integrations:', error);
    }

    setIsInitialized(true);
  }, [fetchIntegrationsFromAPI, setGitHubConnection, setVercelConnection, setSupabaseConnection, setClaudeConnection, syncSupabaseCredentials]);

  // Initialize on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Sync from store to local state (for when store changes externally)
  useEffect(() => {
    if (integrations.github.connected) {
      setGitHub((prev) => ({
        ...prev,
        connected: true,
        owner: integrations.github.owner,
        repo: integrations.github.repo,
        branch: integrations.github.branch,
      }));
    }
  }, [integrations.github]);

  useEffect(() => {
    if (integrations.vercel.connected) {
      setVercel((prev) => ({
        ...prev,
        connected: true,
        projectId: integrations.vercel.projectId,
        projectName: integrations.vercel.projectName,
        teamId: integrations.vercel.teamId,
        teamSlug: integrations.vercel.teamSlug,
        ownerSlug: integrations.vercel.ownerSlug,
      }));
    }
  }, [integrations.vercel]);

  useEffect(() => {
    if (integrations.supabase.connected) {
      setSupabase((prev) => ({
        ...prev,
        connected: true,
        url: integrations.supabase.url,
        projectId: integrations.supabase.projectId,
        projectRef: integrations.supabase.projectRef,
        projectName: integrations.supabase.projectName,
        orgId: integrations.supabase.orgId,
        orgName: integrations.supabase.orgName,
      }));
    }
  }, [integrations.supabase]);

  useEffect(() => {
    if (integrations.claude.connected) {
      setClaude((prev) => ({
        ...prev,
        connected: true,
        model: integrations.claude.model,
      }));
    }
  }, [integrations.claude]);

  const value: ServiceContextValue = {
    github,
    vercel,
    supabase,
    claude,
    isInitialized,
    initializationProgress,
    refreshGitHub,
    refreshVercel,
    refreshSupabase,
    refreshClaude,
    refreshAll,
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (!context) {
    // Return defaults for standalone usage
    return {
      github: { connected: false, loading: false, error: null, owner: null, repo: null, branch: 'main' },
      vercel: { connected: false, loading: false, error: null, projectId: null, projectName: null, teamId: null, teamSlug: null, ownerSlug: null },
      supabase: { connected: false, loading: false, error: null, url: null, projectId: null, projectRef: null, projectName: null, orgId: null, orgName: null },
      claude: { connected: false, loading: false, error: null, model: 'claude-sonnet-4-20250514' },
      isInitialized: false,
      initializationProgress: 0,
      refreshGitHub: async () => {},
      refreshVercel: async () => {},
      refreshSupabase: async () => {},
      refreshClaude: async () => {},
      refreshAll: async () => {},
    };
  }
  return context;
}
