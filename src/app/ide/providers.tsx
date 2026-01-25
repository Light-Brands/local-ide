'use client';

import { ToolingProvider } from './contexts/ToolingContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { PWAProvider } from './components/PWAProvider';
import { SyncMonitor } from './components/SyncMonitor';
import { IDEAuthProvider } from '@/lib/ide/auth';
import { useSessionCleanup } from './hooks';
import { ToastProvider } from '@/components/ui/Toast';

// Component that runs the session cleanup hook
function SessionCleanupMonitor() {
  useSessionCleanup();
  return null;
}

interface IDEProvidersProps {
  children: React.ReactNode;
}

export function IDEProviders({ children }: IDEProvidersProps) {
  return (
    <IDEAuthProvider>
      <ToastProvider>
        <ToolingProvider>
          <ServiceProvider>
            <PWAProvider>
              {children}
              {/* File sync monitor - notifies when files change */}
              <SyncMonitor />
              {/* Session cleanup - clears orphaned tmux sessions when no tabs are open */}
              <SessionCleanupMonitor />
            </PWAProvider>
          </ServiceProvider>
        </ToolingProvider>
      </ToastProvider>
    </IDEAuthProvider>
  );
}
