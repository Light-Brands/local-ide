'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface IDEUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  githubUsername: string | null;
  githubAccessToken: string | null;
}

export interface GitHubRepo {
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

interface IDEAuthContextValue {
  user: IDEUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Auth actions
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;

  // GitHub data
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  isLoadingRepos: boolean;
  fetchRepos: () => Promise<void>;
  selectRepo: (repo: GitHubRepo) => Promise<void>;

  // Onboarding
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const IDEAuthContext = createContext<IDEAuthContextValue | null>(null);

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && url.length > 0 && key && key.length > 0);
}

// =============================================================================
// PROVIDER
// =============================================================================

export function IDEAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<IDEUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GitHub data
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  // Onboarding
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // ==========================================================================
  // Session Management
  // ==========================================================================

  useEffect(() => {
    // Skip Supabase initialization if not configured
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setIsLoading(false);
      return;
    }

    // Check for existing session
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setIsLoading(false);
          return;
        }

        if (currentSession) {
          await handleSession(currentSession);
        }
      } catch (err) {
        console.error('Init session error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && newSession) {
        await handleSession(newSession);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setRepos([]);
        setSelectedRepo(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load saved repo selection
  useEffect(() => {
    if (user) {
      const savedRepo = localStorage.getItem('ide_selected_repo');
      if (savedRepo) {
        try {
          setSelectedRepo(JSON.parse(savedRepo));
        } catch {
          // Invalid saved data
        }
      }

      const onboardingDone = localStorage.getItem('ide_onboarding_complete');
      setIsOnboardingComplete(onboardingDone === 'true');
    }
  }, [user]);

  // ==========================================================================
  // Handle Session
  // ==========================================================================

  const handleSession = async (newSession: Session) => {
    setSession(newSession);

    const supabaseUser = newSession.user;

    // Extract GitHub data from user metadata
    const githubUsername =
      supabaseUser.user_metadata?.user_name ||
      supabaseUser.user_metadata?.preferred_username ||
      null;

    // Get the provider token (GitHub access token)
    // This is available after OAuth sign-in
    const githubAccessToken = newSession.provider_token || null;

    const ideUser: IDEUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email ||
        '',
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      githubUsername,
      githubAccessToken,
    };

    setUser(ideUser);

    // Store the GitHub token for later use (encrypted in a real app)
    if (githubAccessToken) {
      localStorage.setItem('github_access_token', githubAccessToken);
    }
  };

  // ==========================================================================
  // Auth Actions
  // ==========================================================================

  const signInWithGitHub = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please set up integrations first.');
      return;
    }

    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/ide/auth/callback`,
          scopes: 'repo read:user user:email',
        },
      });

      if (signInError) {
        setError(signInError.message);
        console.error('GitHub sign-in error:', signInError);
      }
    } catch (err) {
      setError('Failed to connect to authentication service');
      console.error('GitHub sign-in error:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore errors during sign out
      }
    }

    // Clear local storage
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('ide_selected_repo');
    localStorage.removeItem('ide_onboarding_complete');

    setUser(null);
    setSession(null);
    setRepos([]);
    setSelectedRepo(null);
    setIsOnboardingComplete(false);

    router.push('/ide/login');
  }, [router]);

  // ==========================================================================
  // GitHub Actions
  // ==========================================================================

  const fetchRepos = useCallback(async () => {
    const token =
      user?.githubAccessToken || localStorage.getItem('github_access_token');

    if (!token) {
      setError('No GitHub access token available');
      return;
    }

    setIsLoadingRepos(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      console.error('Fetch repos error:', err);
      setError('Failed to fetch repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  }, [user?.githubAccessToken]);

  const selectRepo = useCallback(async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    localStorage.setItem('ide_selected_repo', JSON.stringify(repo));
  }, []);

  // ==========================================================================
  // Onboarding
  // ==========================================================================

  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    localStorage.setItem('ide_onboarding_complete', 'true');
  }, []);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const value: IDEAuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    error,

    signInWithGitHub,
    signOut,

    repos,
    selectedRepo,
    isLoadingRepos,
    fetchRepos,
    selectRepo,

    isOnboardingComplete,
    completeOnboarding,
  };

  return (
    <IDEAuthContext.Provider value={value}>{children}</IDEAuthContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useIDEAuth() {
  const context = useContext(IDEAuthContext);

  if (!context) {
    throw new Error('useIDEAuth must be used within an IDEAuthProvider');
  }

  return context;
}

// =============================================================================
// UTILITIES
// =============================================================================

export function getStoredGitHubToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('github_access_token');
}

export function setStoredGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('github_access_token', token);
}

export function clearStoredGitHubToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('github_access_token');
}

export function getStoredSelectedRepo(): GitHubRepo | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('ide_selected_repo');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}
