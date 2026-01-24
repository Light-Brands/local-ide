'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ServiceId = 'terminal' | 'chat' | 'ide' | 'preview' | 'tunnel';
export type ServiceStatus = 'healthy' | 'unhealthy' | 'starting' | 'unknown';

export interface ServiceState {
  id: ServiceId;
  name: string;
  status: ServiceStatus;
  port?: number;
  error?: string;
  url?: string;
}

interface UseServiceHealthOptions {
  /** Polling interval in ms (default: 5000) */
  interval?: number;
  /** Whether to poll immediately on mount (default: true) */
  pollOnMount?: boolean;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

interface SessionCounts {
  chat: number;
  terminal: number;
  tmux: number;
}

interface UseServiceHealthReturn {
  services: ServiceState[];
  sessions: SessionCounts;
  isLoading: boolean;
  refresh: () => Promise<void>;
  startService: (serviceId: ServiceId) => Promise<boolean>;
  restartService: (serviceId: ServiceId) => Promise<boolean>;
  restartAll: () => Promise<boolean>;
  clearSessions: () => Promise<boolean>;
  getService: (id: ServiceId) => ServiceState | undefined;
  healthySummary: { healthy: number; total: number };
}

const DEFAULT_SERVICES: ServiceState[] = [
  { id: 'ide', name: 'IDE Server', status: 'unknown', port: 4000 },
  { id: 'preview', name: 'Preview', status: 'unknown', port: 3000 },
  { id: 'terminal', name: 'Terminal Server', status: 'unknown', port: 4001 },
  { id: 'chat', name: 'Chat Server', status: 'unknown', port: 4002 },
  { id: 'tunnel', name: 'Cloudflare Tunnel', status: 'unknown' },
];

async function checkHealthViaApi(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function useServiceHealth(options: UseServiceHealthOptions = {}): UseServiceHealthReturn {
  const { interval = 5000, pollOnMount = true, enabled = true } = options;

  const [services, setServices] = useState<ServiceState[]>(DEFAULT_SERVICES);
  const [sessions, setSessions] = useState<SessionCounts>({ chat: 0, terminal: 0, tmux: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const checkAllServices = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Use the /api/services endpoint to check all services at once
    // This avoids CORS issues by proxying through Next.js API routes
    try {
      const response = await fetch('/api/services');
      const data = await response.json();

      if (data.success && Array.isArray(data.services)) {
        const updatedServices: ServiceState[] = data.services.map((s: { id: ServiceId; name: string; port: number; status: string }) => ({
          id: s.id,
          name: s.name,
          port: s.port || undefined,
          status: s.status as ServiceStatus,
        }));

        // Update session counts
        if (data.sessions && isMountedRef.current) {
          setSessions(data.sessions);
        }

        // Also check tunnel separately for URL info
        try {
          const tunnelResponse = await fetch('/api/tunnel');
          const tunnelData = await tunnelResponse.json();
          const tunnelService = updatedServices.find(s => s.id === 'tunnel');
          if (tunnelService && tunnelData.config?.subdomain) {
            tunnelService.url = `https://${tunnelData.config.subdomain}`;
          }
        } catch {
          // Tunnel info fetch failed, continue with what we have
        }

        if (isMountedRef.current) {
          setServices(updatedServices);
        }
        return;
      }
    } catch {
      // API call failed, fall back to checking IDE health only
    }

    // Fallback: just check what we can via same-origin requests
    const updatedServices: ServiceState[] = [];

    // Check IDE Server (port 4000) - we're running on it, so check via API
    const ideHealthy = await checkHealthViaApi('/api/health');
    updatedServices.push({
      id: 'ide',
      name: 'IDE Server',
      status: ideHealthy ? 'healthy' : 'unhealthy',
      port: 4000,
    });

    // For other services, mark as unknown since we can't check directly
    updatedServices.push(
      { id: 'preview', name: 'Preview', status: 'unknown', port: 3000 },
      { id: 'terminal', name: 'Terminal Server', status: 'unknown', port: 4001 },
      { id: 'chat', name: 'Chat Server', status: 'unknown', port: 4002 },
      { id: 'tunnel', name: 'Tunnel', status: 'unknown' }
    );

    if (isMountedRef.current) {
      setServices(updatedServices);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkAllServices();
    setIsLoading(false);
  }, [checkAllServices]);

  const startService = useCallback(async (serviceId: ServiceId): Promise<boolean> => {
    // Mark as starting
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'starting' as ServiceStatus } : s))
    );

    try {
      // Tunnel uses its own API
      if (serviceId === 'tunnel') {
        const response = await fetch('/api/tunnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        const data = await response.json();
        setTimeout(refresh, 1500);
        return data.success === true;
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', services: [serviceId] }),
      });

      const data = await response.json();

      // Wait a moment then refresh
      setTimeout(refresh, 1500);

      return data.success === true;
    } catch (error) {
      console.error(`Failed to start ${serviceId}:`, error);
      await refresh();
      return false;
    }
  }, [refresh]);

  const restartService = useCallback(async (serviceId: ServiceId): Promise<boolean> => {
    // Mark as starting
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'starting' as ServiceStatus } : s))
    );

    try {
      // Tunnel uses its own API - stop then start
      if (serviceId === 'tunnel') {
        await fetch('/api/tunnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop' }),
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await fetch('/api/tunnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        const data = await response.json();
        setTimeout(refresh, 1500);
        return data.success === true;
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart', services: [serviceId] }),
      });

      const data = await response.json();

      // Wait a moment then refresh
      setTimeout(refresh, 2000);

      return data.success === true;
    } catch (error) {
      console.error(`Failed to restart ${serviceId}:`, error);
      await refresh();
      return false;
    }
  }, [refresh]);

  const restartAll = useCallback(async (): Promise<boolean> => {
    // Mark all restartable services as starting
    setServices((prev) =>
      prev.map((s) =>
        ['terminal', 'chat'].includes(s.id)
          ? { ...s, status: 'starting' as ServiceStatus }
          : s
      )
    );

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart', services: ['all'] }),
      });

      const data = await response.json();

      // Wait a moment then refresh
      setTimeout(refresh, 2500);

      return data.success === true;
    } catch (error) {
      console.error('Failed to restart all services:', error);
      await refresh();
      return false;
    }
  }, [refresh]);

  const clearSessions = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-sessions' }),
      });

      const data = await response.json();

      // Refresh to update session counts
      setTimeout(refresh, 1000);

      return data.success === true;
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      await refresh();
      return false;
    }
  }, [refresh]);

  const getService = useCallback((id: ServiceId): ServiceState | undefined => {
    return services.find((s) => s.id === id);
  }, [services]);

  const healthySummary = {
    healthy: services.filter((s) => s.status === 'healthy').length,
    total: services.length,
  };

  // Set up polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) return;

    if (pollOnMount) {
      refresh();
    }

    intervalRef.current = setInterval(checkAllServices, interval);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, pollOnMount, refresh, checkAllServices]);

  return {
    services,
    sessions,
    isLoading,
    refresh,
    startService,
    restartService,
    restartAll,
    clearSessions,
    getService,
    healthySummary,
  };
}
