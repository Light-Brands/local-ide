'use client';

import { ToolingProvider } from './contexts/ToolingContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { PWAProvider } from './components/PWAProvider';
import { SyncMonitor } from './components/SyncMonitor';
import { IDEAuthProvider } from '@/lib/ide/auth';

interface IDEProvidersProps {
  children: React.ReactNode;
}

export function IDEProviders({ children }: IDEProvidersProps) {
  return (
    <IDEAuthProvider>
      <ToolingProvider>
        <ServiceProvider>
          <PWAProvider>
            {children}
            {/* File sync monitor - notifies when files change */}
            <SyncMonitor />
          </PWAProvider>
        </ServiceProvider>
      </ToolingProvider>
    </IDEAuthProvider>
  );
}
