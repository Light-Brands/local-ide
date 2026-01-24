'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Terminal,
  MessageSquare,
  Server,
  Eye,
  Cloud,
  X,
  RefreshCw,
  Play,
  ExternalLink,
  Loader2,
  Trash2,
} from 'lucide-react';
import { ServiceId, ServiceState, ServiceStatus } from '../../hooks/useServiceHealth';

const SERVICE_ICONS: Record<ServiceId, typeof Terminal> = {
  terminal: Terminal,
  chat: MessageSquare,
  ide: Server,
  preview: Eye,
  tunnel: Cloud,
};

// Services that can be started/restarted via API
const MANAGEABLE_SERVICES: ServiceId[] = ['preview', 'terminal', 'chat', 'tunnel'];

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

function getStatusText(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'Running';
    case 'unhealthy':
      return 'Not running';
    case 'starting':
      return 'Starting...';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

interface SessionCounts {
  chat: number;
  terminal: number;
  tmux: number;
}

interface ServiceHealthPopoverProps {
  services: ServiceState[];
  sessions: SessionCounts;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onStart: (serviceId: ServiceId) => Promise<boolean>;
  onRestart: (serviceId: ServiceId) => Promise<boolean>;
  onRestartAll: () => Promise<boolean>;
  onClearSessions: () => Promise<boolean>;
  onClose: () => void;
}

export const ServiceHealthPopover = forwardRef<HTMLDivElement, ServiceHealthPopoverProps>(
  function ServiceHealthPopover(
    { services, sessions, isLoading, onRefresh, onStart, onRestart, onRestartAll, onClearSessions, onClose },
    ref
  ) {
    const totalSessions = sessions.chat + sessions.terminal + sessions.tmux;
    return (
      <div
        ref={ref}
        className={cn(
          'absolute top-full right-0 mt-2 w-72 z-50',
          'bg-white dark:bg-neutral-900 rounded-lg shadow-lg',
          'border border-neutral-200 dark:border-neutral-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Services
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
                isLoading && 'opacity-50'
              )}
              title="Refresh"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-neutral-500', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Service List */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {services.map((service) => {
            const Icon = SERVICE_ICONS[service.id];
            const canManage = MANAGEABLE_SERVICES.includes(service.id);
            const isStarting = service.status === 'starting';

            return (
              <div
                key={service.id}
                className="px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-neutral-900',
                          getStatusColor(service.status)
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {service.name}
                    </span>
                  </div>

                  {canManage && (
                    <button
                      onClick={() =>
                        service.status === 'healthy'
                          ? onRestart(service.id)
                          : onStart(service.id)
                      }
                      disabled={isStarting}
                      className={cn(
                        'px-2 py-1 text-xs rounded transition-colors',
                        'border border-neutral-200 dark:border-neutral-700',
                        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        'text-neutral-600 dark:text-neutral-400',
                        isStarting && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isStarting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : service.status === 'healthy' ? (
                        'Restart'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          Start
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                  {service.port && <span>Port {service.port}</span>}
                  {service.port && <span>•</span>}
                  <span>{getStatusText(service.status)}</span>
                  {service.url && (
                    <>
                      <span>•</span>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sessions Info */}
        {totalSessions > 0 && (
          <div className="px-3 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Active Sessions ({totalSessions})
              </span>
              <button
                onClick={onClearSessions}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  'bg-red-100 dark:bg-red-900/30',
                  'hover:bg-red-200 dark:hover:bg-red-900/50',
                  'text-red-600 dark:text-red-400',
                  'flex items-center gap-1'
                )}
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>
            <div className="flex gap-3 text-xs text-neutral-600 dark:text-neutral-400">
              {sessions.chat > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {sessions.chat} chat
                </span>
              )}
              {sessions.terminal > 0 && (
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  {sessions.terminal} terminal
                </span>
              )}
              {sessions.tmux > 0 && (
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {sessions.tmux} tmux
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onRestartAll}
            className={cn(
              'w-full px-3 py-1.5 text-sm rounded-lg transition-colors',
              'bg-neutral-100 dark:bg-neutral-800',
              'hover:bg-neutral-200 dark:hover:bg-neutral-700',
              'text-neutral-700 dark:text-neutral-300',
              'flex items-center justify-center gap-2'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart All Servers
          </button>
        </div>
      </div>
    );
  }
);
