'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIDEAuth, type GitHubRepo } from '@/lib/ide/auth';
import {
  Loader2,
  Search,
  Lock,
  Globe,
  GitBranch,
  ArrowRight,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function IDESetupPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    isAuthenticated,
    repos,
    selectedRepo,
    isLoadingRepos,
    fetchRepos,
    selectRepo,
    isOnboardingComplete,
  } = useIDEAuth();

  const [search, setSearch] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(
    selectedRepo?.id || null
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/ide/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch repos on mount
  useEffect(() => {
    if (isAuthenticated && repos.length === 0) {
      fetchRepos();
    }
  }, [isAuthenticated, repos.length, fetchRepos]);

  // Filter repos by search
  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = async () => {
    const repo = repos.find((r) => r.id === selectedRepoId);
    if (repo) {
      await selectRepo(repo);
      // Go to onboarding if not complete, otherwise go to IDE
      if (isOnboardingComplete) {
        router.push('/ide');
      } else {
        router.push('/ide/onboarding');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto" />
          <h1 className="mt-6 text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Select a repository
          </h1>
          <p className="mt-2 text-neutral-500">
            Choose the repo you want to work with in the IDE
          </p>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {user.name}
              </p>
              <p className="text-sm text-neutral-500 truncate">
                @{user.githubUsername || user.email}
              </p>
            </div>
            <button
              onClick={fetchRepos}
              disabled={isLoadingRepos}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoadingRepos && 'animate-spin')}
              />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
            )}
          />
        </div>

        {/* Repo list */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {isLoadingRepos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-neutral-500">Loading repos...</span>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">
                {search ? 'No repositories match your search' : 'No repositories found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
              {filteredRepos.map((repo) => (
                <RepoItem
                  key={repo.id}
                  repo={repo}
                  isSelected={selectedRepoId === repo.id}
                  onSelect={() => setSelectedRepoId(repo.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="mt-6">
          <button
            onClick={handleContinue}
            disabled={!selectedRepoId}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'px-6 py-4 rounded-xl',
              'font-semibold text-lg',
              'transition-all',
              selectedRepoId
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            )}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Skip for now */}
        <p className="mt-4 text-center text-sm text-neutral-400">
          You can change this anytime in settings
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Repo Item Component
// =============================================================================

function RepoItem({
  repo,
  isSelected,
  onSelect,
}: {
  repo: GitHubRepo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const timeAgo = getTimeAgo(new Date(repo.updated_at));

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
          isSelected
            ? 'border-primary-500 bg-primary-500'
            : 'border-neutral-300 dark:border-neutral-600'
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Repo info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {repo.name}
          </span>
          {repo.private ? (
            <Lock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          )}
        </div>

        {repo.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-1">
            {repo.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {repo.default_branch}
          </span>
          <span>Updated {timeAgo}</span>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
