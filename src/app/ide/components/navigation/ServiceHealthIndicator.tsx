'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Terminal,
  MessageSquare,
  Server,
  Eye,
  Cloud,
} from 'lucide-react';
import { useServiceHealth, ServiceId, ServiceStatus } from '../../hooks/useServiceHealth';
import { ServiceHealthPopover } from './ServiceHealthPopover';

const SERVICE_ICONS: Record<ServiceId, typeof Terminal> = {
  ide: Server,
  preview: Eye,
  terminal: Terminal,
  chat: MessageSquare,
  tunnel: Cloud,
};

function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'unhealthy':
      return 'bg-red-500';
    case 'starting':
      return 'bg-yellow-500 animate-pulse';
    case 'unknown':
    default:
      return 'bg-neutral-400 dark:bg-neutral-600';
  }
}

function getStatusTitle(status: ServiceStatus, name: string): string {
  switch (status) {
    case 'healthy':
      return `${name}: Running`;
    case 'unhealthy':
      return `${name}: Not running`;
    case 'starting':
      return `${name}: Starting...`;
    case 'unknown':
    default:
      return `${name}: Unknown`;
  }
}

interface ServiceHealthIndicatorProps {
  /** Whether to show in compact mode (for mobile) */
  compact?: boolean;
}

export function ServiceHealthIndicator({ compact = false }: ServiceHealthIndicatorProps) {
  const [showPopover, setShowPopover] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    services,
    sessions,
    isLoading,
    refresh,
    startService,
    restartService,
    restartAll,
    clearSessions,
    healthySummary,
  } = useServiceHealth();

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showPopover &&
        buttonRef.current &&
        popoverRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && showPopover) {
        setShowPopover(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPopover]);

  if (compact) {
    // Compact mode: just show a summary indicator
    const allHealthy = healthySummary.healthy === healthySummary.total;
    const someHealthy = healthySummary.healthy > 0;

    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowPopover(!showPopover)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg transition-colors',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800'
          )}
          title={`Services: ${healthySummary.healthy}/${healthySummary.total} healthy`}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              allHealthy
                ? 'bg-emerald-500'
                : someHealthy
                ? 'bg-yellow-500'
                : 'bg-red-500'
            )}
          />
          <span className="text-xs text-neutral-500">
            {healthySummary.healthy}/{healthySummary.total}
          </span>
        </button>

        {showPopover && (
          <ServiceHealthPopover
            ref={popoverRef}
            services={services}
            sessions={sessions}
            isLoading={isLoading}
            onRefresh={refresh}
            onStart={startService}
            onRestart={restartService}
            onRestartAll={restartAll}
            onClearSessions={clearSessions}
            onClose={() => setShowPopover(false)}
          />
        )}
      </div>
    );
  }

  // Full mode: show individual status dots
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPopover(!showPopover)}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          showPopover && 'bg-neutral-100 dark:bg-neutral-800'
        )}
        title={`Services: ${healthySummary.healthy}/${healthySummary.total} healthy`}
      >
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.id];
          return (
            <div
              key={service.id}
              className="relative group"
              title={getStatusTitle(service.status, service.name)}
            >
              <Icon className="w-3.5 h-3.5 text-neutral-400" />
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-neutral-900',
                  getStatusColor(service.status)
                )}
              />
            </div>
          );
        })}
      </button>

      {showPopover && (
        <ServiceHealthPopover
          ref={popoverRef}
          services={services}
          sessions={sessions}
          isLoading={isLoading}
          onRefresh={refresh}
          onStart={startService}
          onRestart={restartService}
          onRestartAll={restartAll}
          onClearSessions={clearSessions}
          onClose={() => setShowPopover(false)}
        />
      )}
    </div>
  );
}
