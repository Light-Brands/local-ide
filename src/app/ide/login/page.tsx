'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIDEAuth } from '@/lib/ide/auth';
import { Github, Loader2, Code2, Zap, Shield, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function IDELoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signInWithGitHub, error } = useIDEAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/ide/setup');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const features = [
    {
      icon: Code2,
      title: 'Code from anywhere',
      description: 'Full IDE experience on any device',
    },
    {
      icon: Zap,
      title: 'AI-powered',
      description: 'Claude AI assistant built-in',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Your code stays in your repos',
    },
    {
      icon: Sparkles,
      title: 'Self-aware',
      description: 'The IDE can improve itself',
    },
  ];

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">
      {/* Left side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-secondary-600 p-12 flex-col justify-between">
        <div>
          <Logo size="lg" className="text-white" />
          <h1 className="mt-8 text-4xl font-bold text-white">
            Mobile-First IDE
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Build, deploy, and manage your apps from anywhere. The IDE that
            knows your entire stack.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-white/50">
          Powered by Claude AI and your favorite tools
        </p>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Logo size="lg" />
            <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Local-IDE
            </h1>
            <p className="mt-2 text-neutral-500">
              Mobile-first AI-powered IDE
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Welcome back
              </h2>
              <p className="mt-2 text-neutral-500">
                Sign in with GitHub to continue
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* GitHub sign-in button */}
            <button
              onClick={signInWithGitHub}
              className={cn(
                'w-full flex items-center justify-center gap-3',
                'px-6 py-4 rounded-xl',
                'bg-neutral-900 dark:bg-white',
                'text-white dark:text-neutral-900',
                'font-semibold text-lg',
                'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                'transition-colors',
                'shadow-lg hover:shadow-xl'
              )}
            >
              <Github className="w-6 h-6" />
              Continue with GitHub
            </button>

            {/* Info text */}
            <p className="mt-6 text-center text-xs text-neutral-400">
              By signing in, you&apos;ll grant access to your GitHub repositories.
              <br />
              We only access repos you explicitly select.
            </p>
          </div>

          {/* Why GitHub */}
          <div className="mt-8 p-6 rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
              Why GitHub?
            </h3>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                One login for auth + code access
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Direct integration with your repos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Secure OAuth - we never see your password
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
