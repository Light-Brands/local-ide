'use client';

import { ToolingProvider } from './contexts/ToolingContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { PWAProvider } from './components/PWAProvider';
import { SyncMonitor } from './components/SyncMonitor';

export function IDEProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToolingProvider>
      <ServiceProvider>
        <PWAProvider>
          {children}
          {/* File sync monitor - notifies when files change */}
          <SyncMonitor />
        </PWAProvider>
      </ServiceProvider>
    </ToolingProvider>
  );
}
