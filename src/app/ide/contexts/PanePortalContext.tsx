'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Pane ID mapping (Activity is now a slide-out panel, not a regular pane)
export const PANE_CONFIG = {
  1: { name: 'Developer', icon: 'Code2' },
  2: { name: 'Editor', icon: 'Code' },
  3: { name: 'Terminal', icon: 'Terminal' }, // Legacy - now part of Developer pane
  4: { name: 'Preview', icon: 'Eye' },
  5: { name: 'Database', icon: 'Database' },
  6: { name: 'Deployments', icon: 'Rocket' },
} as const;

export type PaneNumber = keyof typeof PANE_CONFIG;

interface PanePortalContextType {
  targets: Record<number, HTMLDivElement | null>;
  registerTarget: (paneId: number, element: HTMLDivElement | null) => void;
  unregisterTarget: (paneId: number) => void;
}

const PanePortalContext = createContext<PanePortalContextType | null>(null);

export function PanePortalProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<Record<number, HTMLDivElement | null>>({});

  const registerTarget = useCallback((paneId: number, element: HTMLDivElement | null) => {
    setTargets((prev) => ({ ...prev, [paneId]: element }));
  }, []);

  const unregisterTarget = useCallback((paneId: number) => {
    setTargets((prev) => {
      const { [paneId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <PanePortalContext.Provider value={{ targets, registerTarget, unregisterTarget }}>
      {children}
    </PanePortalContext.Provider>
  );
}

export function usePanePortal() {
  const context = useContext(PanePortalContext);
  if (!context) {
    throw new Error('usePanePortal must be used within PanePortalProvider');
  }
  return context;
}

// Portal target component - renders where pane content will appear
interface PanePortalTargetProps {
  paneId: number;
  className?: string;
}

export function PanePortalTarget({ paneId, className }: PanePortalTargetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerTarget, unregisterTarget } = usePanePortal();

  useEffect(() => {
    if (ref.current) {
      registerTarget(paneId, ref.current);
    }
    return () => {
      unregisterTarget(paneId);
    };
  }, [paneId, registerTarget, unregisterTarget]);

  return <div ref={ref} className={className} style={{ height: '100%', width: '100%' }} />;
}

// Portal content component - renders pane content to the target
interface PaneContentPortalProps {
  paneId: number;
  isVisible: boolean;
  children: React.ReactNode;
}

export function PaneContentPortal({ paneId, isVisible, children }: PaneContentPortalProps) {
  const { targets } = usePanePortal();
  const target = targets[paneId];

  // Always render the content, but portal it to target when visible
  // This preserves state (especially for terminal)
  if (!target || !isVisible) {
    // Render hidden to keep state alive
    return (
      <div style={{ display: 'none', position: 'absolute', visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return createPortal(children, target);
}

// Hook to get pane configuration
export function usePaneConfig(paneId: number) {
  return PANE_CONFIG[paneId as PaneNumber] || { name: 'Unknown', icon: 'Box' };
}
