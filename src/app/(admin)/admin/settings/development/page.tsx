'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Github,
  Triangle,
  Database,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Settings,
  RefreshCw,
  Rocket,
  Code2,
  Loader2,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

interface IntegrationStatus {
  connected: boolean;
  details?: string;
  lastChecked?: Date;
}

interface IntegrationCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
  color: string;
  shadowColor: string;
}

function IntegrationCard({
  title,
  description,
  href,
  icon: Icon,
  status,
  color,
  shadowColor,
}: IntegrationCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        href={href}
        className={cn(
          'group relative block rounded-2xl p-6',
          'bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          'hover:border-neutral-300 dark:hover:border-neutral-700',
          'transition-all duration-300',
          'hover:shadow-lg',
          shadowColor
        )}
      >
        {/* Status indicator */}
        <div className="absolute top-4 right-4">
          {status.connected ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-medium">
              <XCircle className="w-3 h-3" />
              Not Connected
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            'bg-gradient-to-br',
            color
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {description}
        </p>

        {/* Details */}
        {status.details && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
            {status.details}
          </p>
        )}

        {/* Arrow */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function DevelopmentSettingsPage() {
  const searchParams = useSearchParams();
  const fromIDE = searchParams.get('from') === 'ide';

  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({
    github: { connected: false },
    vercel: { connected: false },
    supabase: { connected: false },
    claude: { connected: false },
    cloudflare: { connected: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      const result = await response.json();
      const data = result.data || result; // Handle both { data: {...} } and direct response

      // Also fetch tunnel status
      let tunnelStatus = { connected: false, details: undefined as string | undefined };
      try {
        const tunnelResponse = await fetch('/api/tunnel');
        const tunnelData = await tunnelResponse.json();
        if (tunnelData.config?.tunnelName) {
          tunnelStatus = {
            connected: tunnelData.config.isRunning || false,
            details: tunnelData.config.subdomain || tunnelData.config.tunnelName,
          };
        }
      } catch {
        // Tunnel API might not be available
      }

      setIntegrations({
        github: {
          connected: !!data.github?.connected,
          details: data.github?.owner || (data.github?.connected ? 'Token configured' : undefined),
        },
        vercel: {
          connected: !!data.vercel?.connected,
          details: data.vercel?.projectName || (data.vercel?.connected ? 'Token configured' : undefined),
        },
        supabase: {
          connected: !!data.supabase?.connected,
          details: data.supabase?.url || undefined,
        },
        claude: {
          connected: !!data.claude?.connected,
          details: data.claude?.model || (data.claude?.connected ? 'API key configured' : undefined),
        },
        cloudflare: tunnelStatus,
      });
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Check integration statuses from API
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIntegrations();
  };

  const integrationCards = [
    {
      title: 'GitHub',
      description: 'Repository access, file operations, and git commands',
      href: '/admin/settings/development/github',
      icon: Github,
      status: integrations.github,
      color: 'from-neutral-700 to-neutral-900',
      shadowColor: 'hover:shadow-neutral-500/10',
    },
    {
      title: 'Vercel',
      description: 'Deployment management, logs, and environment variables',
      href: '/admin/settings/development/vercel',
      icon: Triangle,
      status: integrations.vercel,
      color: 'from-neutral-900 to-neutral-700',
      shadowColor: 'hover:shadow-neutral-500/10',
    },
    {
      title: 'Supabase',
      description: 'Database management, schema exploration, and queries',
      href: '/admin/settings/development/supabase',
      icon: Database,
      status: integrations.supabase,
      color: 'from-emerald-500 to-green-600',
      shadowColor: 'hover:shadow-emerald-500/10',
    },
    {
      title: 'Claude AI',
      description: 'AI-powered coding assistant and chat integration',
      href: '/admin/settings/development/claude',
      icon: Sparkles,
      status: integrations.claude,
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'hover:shadow-amber-500/10',
    },
    {
      title: 'Cloudflare Tunnel',
      description: 'Expose local environment to the internet via custom domain',
      href: '/admin/settings/development/cloudflare',
      icon: Cloud,
      status: integrations.cloudflare,
      color: 'from-orange-500 to-orange-600',
      shadowColor: 'hover:shadow-orange-500/10',
    },
  ];

  const connectedCount = Object.values(integrations).filter((i) => i.connected).length;
  const totalIntegrations = Object.keys(integrations).length;
  const allConnected = connectedCount === totalIntegrations;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-neutral-500">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {fromIDE ? (
            // IDE setup header
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                {allConnected ? 'Ready to Launch!' : 'Configure Your IDE'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                {allConnected
                  ? 'All integrations are configured. You can now start coding.'
                  : 'Connect the required services to enable the IDE.'}
              </p>
            </div>
          ) : (
            // Normal admin header
            <>
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                <Link href="/admin/settings" className="hover:text-neutral-700 dark:hover:text-neutral-300">
                  Settings
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-neutral-700 dark:text-neutral-300">Integrations</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    Development Integrations
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Configure services for the Local IDE
                  </p>
                </div>
                {allConnected && (
                  <Link
                    href="/ide"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Rocket className="w-4 h-4" />
                    Launch IDE
                  </Link>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Status overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  connectedCount === totalIntegrations
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : connectedCount > 0
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                )}
              >
                {connectedCount === totalIntegrations ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : connectedCount > 0 ? (
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Settings className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {connectedCount === totalIntegrations
                    ? 'All services connected'
                    : connectedCount > 0
                    ? `${connectedCount} of ${totalIntegrations} services connected`
                    : 'No services connected'}
                </h2>
                <p className="text-sm text-neutral-500">
                  {connectedCount === totalIntegrations
                    ? 'Your IDE is fully configured and ready to use'
                    : 'Configure the remaining services for full functionality'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {Object.entries(integrations).map(([key, status]) => (
                  <div
                    key={key}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-medium',
                      status.connected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    )}
                  >
                    {key[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Integration cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {integrationCards.map((card) => (
            <IntegrationCard key={card.title} {...card} />
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          {fromIDE && allConnected && (
            <Link
              href="/ide"
              className="flex items-center justify-center gap-2 w-full max-w-md py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
            >
              <Rocket className="w-5 h-5" />
              Launch IDE
            </Link>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
