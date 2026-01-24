'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIDEAuth } from '@/lib/ide/auth';
import { useIDEStore } from '../stores/ideStore';
import {
  Loader2,
  Check,
  ArrowRight,
  ArrowLeft,
  Github,
  Triangle,
  Database,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { setStoredSupabaseConfig } from '@/lib/ide/services/supabase-db';

type Step = 'github' | 'vercel' | 'supabase' | 'claude' | 'complete';

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: typeof Github;
  color: string;
}

const steps: StepConfig[] = [
  {
    id: 'github',
    title: 'GitHub',
    description: 'Repository access',
    icon: Github,
    color: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
  },
  {
    id: 'vercel',
    title: 'Vercel',
    description: 'Deployments',
    icon: Triangle,
    color: 'bg-black text-white',
  },
  {
    id: 'supabase',
    title: 'Supabase',
    description: 'Database',
    icon: Database,
    color: 'bg-emerald-600 text-white',
  },
  {
    id: 'claude',
    title: 'Claude',
    description: 'AI Assistant',
    icon: Sparkles,
    color: 'bg-[#cc785c] text-white',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, selectedRepo, completeOnboarding } =
    useIDEAuth();
  const setGitHubConnection = useIDEStore((s) => s.setGitHubConnection);
  const setVercelConnection = useIDEStore((s) => s.setVercelConnection);
  const setSupabaseConnection = useIDEStore((s) => s.setSupabaseConnection);
  const setClaudeConnection = useIDEStore((s) => s.setClaudeConnection);

  const [currentStep, setCurrentStep] = useState<Step>('github');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Form states
  const [vercelToken, setVercelToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [claudePath, setClaudePath] = useState('claude');
  const [claudeVersion, setClaudeVersion] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/ide/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mark GitHub as complete (already connected via auth)
  useEffect(() => {
    if (selectedRepo) {
      setCompletedSteps((prev) => new Set([...prev, 'github']));
      setGitHubConnection({
        connected: true,
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: selectedRepo.default_branch,
      });
    }
  }, [selectedRepo, setGitHubConnection]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    } else {
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleConnectVercel = async () => {
    if (!vercelToken.trim()) {
      setError('Please enter your Vercel token');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Validate token by fetching user info
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      // Save connection
      setVercelConnection({
        connected: true,
        projectId: null, // Will be set when they select a project
      });
      localStorage.setItem('vercel_token', vercelToken);

      setCompletedSteps((prev) => new Set([...prev, 'vercel']));
      handleNext();
    } catch {
      setError('Invalid Vercel token. Please check and try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setError('Please enter both URL and service key');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Validate by checking connection
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error('Connection failed');
      }

      // Save connection to localStorage using the correct format for DatabasePane
      setStoredSupabaseConfig({
        url: supabaseUrl,
        anonKey: supabaseKey,
        serviceRoleKey: supabaseKey, // Service key used for admin operations
      });

      // Also save to server-side config for persistence
      try {
        await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'supabase',
            config: {
              url: supabaseUrl,
              anonKey: supabaseKey,
              serviceKey: supabaseKey,
            },
          }),
        });
      } catch (e) {
        console.error('Failed to save Supabase config to server:', e);
      }

      // Update store
      setSupabaseConnection({
        connected: true,
        url: supabaseUrl,
      });

      setCompletedSteps((prev) => new Set([...prev, 'supabase']));
      handleNext();
    } catch {
      setError('Could not connect to Supabase. Please check your credentials.');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestClaudeConnection = async () => {
    setConnecting(true);
    setError(null);
    setClaudeVersion(null);

    try {
      const response = await fetch('/api/ide/chat/status');
      const data = await response.json();

      if (data.connected) {
        setClaudeVersion(data.version);
        setError(null);
      } else {
        setError(data.error || 'Claude CLI not found or not authenticated');
        setClaudeVersion(null);
      }
    } catch (err) {
      setError('Failed to check Claude CLI status');
      setClaudeVersion(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectClaude = () => {
    if (!claudeVersion) {
      setError('Please test the connection first');
      return;
    }

    // Save connection state
    setClaudeConnection({
      connected: true,
      model: 'claude-cli',
    });
    localStorage.setItem('claude_cli_path', claudePath);

    setCompletedSteps((prev) => new Set([...prev, 'claude']));
    handleNext();
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push('/ide');
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
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto" />
          <h1 className="mt-6 text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {currentStep === 'complete' ? 'All set!' : 'Connect your services'}
          </h1>
          <p className="mt-2 text-neutral-500">
            {currentStep === 'complete'
              ? 'Your IDE is ready to use'
              : 'Link your development tools to unlock full IDE power'}
          </p>
        </div>

        {/* Progress indicators */}
        {currentStep !== 'complete' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2',
                    index < steps.length - 1 && 'flex-1'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5',
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step content */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
          {/* GitHub step - already connected */}
          {currentStep === 'github' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <Github className="w-6 h-6 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    GitHub Connected
                  </h2>
                  <p className="text-sm text-emerald-600">Already set up via login</p>
                </div>
              </div>

              {selectedRepo && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <p className="text-sm text-neutral-500 mb-1">Selected repository</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedRepo.full_name}
                  </p>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Vercel step */}
          {currentStep === 'vercel' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                  <Triangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Connect Vercel
                  </h2>
                  <p className="text-sm text-neutral-500">For deployment management</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="Enter your Vercel token"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                  )}
                />
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary-500 hover:underline"
                >
                  Get a token from Vercel
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleConnectVercel}
                  disabled={connecting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Supabase step */}
          {currentStep === 'supabase' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Connect Supabase
                  </h2>
                  <p className="text-sm text-neutral-500">For database management</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxxx.supabase.co"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Service Role Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="Enter service role key"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                    )}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    Found in Project Settings → API → service_role key
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleConnectSupabase}
                  disabled={connecting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Claude step */}
          {currentStep === 'claude' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#cc785c] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Configure Claude CLI
                  </h2>
                  <p className="text-sm text-neutral-500">AI-powered assistance with full tool access</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Claude CLI Path
                </label>
                <input
                  type="text"
                  value={claudePath}
                  onChange={(e) => {
                    setClaudePath(e.target.value);
                    setClaudeVersion(null); // Reset verification on change
                  }}
                  placeholder="claude"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl font-mono text-sm',
                    'bg-neutral-50 dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                  )}
                />
                <p className="mt-2 text-xs text-neutral-400">
                  Usually just &quot;claude&quot; if installed via npm. Run <code className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">claude login</code> first.
                </p>
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  onClick={handleTestClaudeConnection}
                  disabled={connecting}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors',
                    claudeVersion
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  )}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing connection...
                    </>
                  ) : claudeVersion ? (
                    <>
                      <Check className="w-4 h-4" />
                      Connected: {claudeVersion}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{error}</p>
                    <p className="mt-1 text-xs opacity-75">
                      Make sure Claude CLI is installed and you&apos;re logged in with <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">claude login</code>
                    </p>
                  </div>
                </div>
              )}

              {claudeVersion && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">
                  <p className="font-medium">Claude CLI is ready!</p>
                  <p className="text-xs mt-1 opacity-75">
                    Your Claude Max/Pro subscription provides full access to AI tools and file operations.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleConnectClaude}
                  disabled={!claudeVersion}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors',
                    claudeVersion
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  )}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Complete step */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  You&apos;re all set!
                </h2>
                <p className="mt-2 text-neutral-500">
                  Your IDE is configured and ready to use.
                </p>
              </div>

              {/* Connection summary */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isConnected = completedSteps.has(step.id);

                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                    >
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {step.title}
                      </span>
                      {isConnected ? (
                        <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                      ) : (
                        <span className="text-xs text-neutral-400 ml-auto">
                          Skipped
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary-500 text-white font-semibold text-lg hover:bg-primary-600 transition-colors shadow-lg"
              >
                Open IDE
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
