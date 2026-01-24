'use client';

import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import { useServiceContext } from '../../contexts/ServiceContext';
import {
  GitBranch,
  Settings,
  RefreshCw,
  Command,
  Wifi,
  WifiOff,
  ChevronDown,
  Github,
  Database,
  Triangle,
  ExternalLink,
  Check,
  X,
  Cloud,
  Bot,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { OperationStatusBar } from '../operations';
import { ServiceHealthIndicator } from './ServiceHealthIndicator';
import { useServiceHealth } from '../../hooks/useServiceHealth';

// Status indicator component
function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full flex items-center justify-center',
        'border border-white dark:border-neutral-900',
        connected ? 'bg-emerald-500' : 'bg-red-500'
      )}
    >
      {connected ? (
        <Check className="w-1.5 h-1.5 text-white" strokeWidth={4} />
      ) : (
        <X className="w-1.5 h-1.5 text-white" strokeWidth={4} />
      )}
    </div>
  );
}

export function DesktopHeader() {
  // Use service context for live integration status
  const services = useServiceContext();
  const setShowSettings = useIDEStore((state) => state.setShowSettings);
  const { getService } = useServiceHealth();

  // Get values from service context (real-time from API)
  const github = services.github;
  const vercel = services.vercel;
  const supabase = services.supabase;
  const claude = services.claude;

  // Get tunnel status from service health
  const tunnelService = getService('tunnel');
  const tunnelConnected = tunnelService?.status === 'healthy';

  const isConnected = github.connected;

  // Construct external URLs
  const githubUrl = github.owner && github.repo
    ? `https://github.com/${github.owner}/${github.repo}`
    : null;

  // Build Vercel URL with proper owner slug (team or personal account)
  const vercelUrl = vercel.connected && vercel.projectName
    ? `https://vercel.com/${vercel.ownerSlug || vercel.projectName}/${vercel.projectName}`
    : null;

  const supabaseUrl = supabase.projectRef
    ? `https://supabase.com/dashboard/project/${supabase.projectRef}`
    : supabase.url
    ? `https://supabase.com/dashboard`
    : null;

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Left: Logo + Repo */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Logo size="sm" />

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800" />

        {/* Repo selector */}
        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          {/* Connection indicator */}
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected
                ? 'bg-emerald-500'
                : 'bg-neutral-400 dark:bg-neutral-600'
            )}
          />

          {/* Repo name */}
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {github.owner && github.repo
              ? `${github.owner}/${github.repo}`
              : 'local-ide'}
          </span>

          <ChevronDown className="w-3 h-3 text-neutral-500" />
        </button>

        {/* Branch */}
        {github.branch && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <GitBranch className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {github.branch}
            </span>
          </div>
        )}

        {/* Service Links - Always visible, styled based on connection */}
        <div className="flex items-center gap-0.5 ml-2">
          {/* GitHub */}
          <a
            href={githubUrl || 'https://github.com'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center px-1.5 py-1.5 rounded-lg transition-colors group",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
            title={githubUrl ? `Open ${github.owner}/${github.repo} in GitHub` : "GitHub - Click to open"}
          >
            <div className="relative">
              <Github className={cn(
                "w-5 h-5 transition-colors",
                github.connected
                  ? "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                  : "text-neutral-400"
              )} />
              <StatusBadge connected={github.connected} />
            </div>
          </a>

          {/* Vercel */}
          <a
            href={vercelUrl || 'https://vercel.com'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center px-1.5 py-1.5 rounded-lg transition-colors group",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
            title={vercelUrl ? `Open ${vercel.projectName || 'project'} in Vercel` : "Vercel - Click to open"}
          >
            <div className="relative">
              <Triangle className={cn(
                "w-5 h-5 transition-colors",
                vercel.connected
                  ? "text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white"
                  : "text-neutral-400"
              )} />
              <StatusBadge connected={vercel.connected} />
            </div>
          </a>

          {/* Supabase */}
          <a
            href={supabaseUrl || 'https://supabase.com/dashboard'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center px-1.5 py-1.5 rounded-lg transition-colors group",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
            title={supabaseUrl ? `Open ${supabase.projectName || 'project'} in Supabase` : "Supabase - Click to open"}
          >
            <div className="relative">
              <Database className={cn(
                "w-5 h-5 transition-colors",
                supabase.connected
                  ? "text-neutral-600 dark:text-neutral-400 group-hover:text-emerald-500"
                  : "text-neutral-400"
              )} />
              <StatusBadge connected={supabase.connected} />
            </div>
          </a>

          {/* Claude */}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center px-1.5 py-1.5 rounded-lg transition-colors group",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
            title={claude.connected ? `Claude: ${claude.model} - Click to open console` : "Claude - Click to open console"}
          >
            <div className="relative">
              <Bot className={cn(
                "w-5 h-5 transition-colors",
                claude.connected
                  ? "text-neutral-600 dark:text-neutral-400 group-hover:text-amber-500"
                  : "text-neutral-400"
              )} />
              <StatusBadge connected={claude.connected} />
            </div>
          </a>

          {/* Cloudflare Tunnel */}
          <a
            href={tunnelService?.url || 'https://dash.cloudflare.com'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center px-1.5 py-1.5 rounded-lg transition-colors group",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
            title={tunnelConnected ? `Tunnel: ${tunnelService?.url || 'Connected'} - Click to open` : "Cloudflare - Click to open dashboard"}
          >
            <div className="relative">
              <Cloud className={cn(
                "w-5 h-5 transition-colors",
                tunnelConnected
                  ? "text-neutral-600 dark:text-neutral-400 group-hover:text-orange-500"
                  : "text-neutral-400"
              )} />
              <StatusBadge connected={tunnelConnected} />
            </div>
          </a>
        </div>
      </div>

      {/* Center: Command Palette hint */}
      <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
        <Command className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-xs text-neutral-500">Command Palette</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Operations Status */}
        <OperationStatusBar />

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800" />

        {/* Service Health Indicator */}
        <ServiceHealthIndicator />

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800" />

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2 py-1">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-neutral-400" />
          )}
          <span className="text-xs text-neutral-500">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Refresh */}
        <button
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>
    </header>
  );
}
