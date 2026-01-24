'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../stores/ideStore';
import { MobileHeader } from './navigation/MobileHeader';
import { MobileBottomNav } from './navigation/MobileBottomNav';
import { BottomDrawer } from './bottom-drawer/BottomDrawer';
import { MainPaneContainer } from './panes/MainPaneContainer';
import { SettingsModal } from './modals/SettingsModal';

export function MobileIDELayout() {
  const drawerHeight = useIDEStore((state) => state.drawer.height);
  const [isPWA, setIsPWA] = useState(false);

  // Detect if running as installed PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');
    setIsPWA(isStandalone);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculate main pane height based on drawer state
  const getMainPaneClass = () => {
    switch (drawerHeight) {
      case 'collapsed':
        return 'flex-1';
      case 'half':
        return 'h-[45%]';
      case 'expanded':
        return 'h-[25%]';
      case 'fullscreen':
        return 'h-0 overflow-hidden';
      default:
        return 'flex-1';
    }
  };

  return (
    <div
      className={cn(
        "h-full w-full flex flex-col bg-neutral-950 overflow-hidden",
        // Use safe area padding only when NOT in PWA mode (browser has its own chrome)
        !isPWA && "pt-[env(safe-area-inset-top)]"
      )}
    >
      {/* Header - always visible unless fullscreen drawer */}
      {drawerHeight !== 'fullscreen' && <MobileHeader />}

      {/* Main Pane Area */}
      <div
        className={cn(
          'transition-all duration-200 ease-out min-h-0',
          getMainPaneClass()
        )}
      >
        <MainPaneContainer />
      </div>

      {/* Bottom Drawer (Terminal + Chat) */}
      <BottomDrawer />

      {/* Bottom Navigation - always visible unless fullscreen drawer */}
      {drawerHeight !== 'fullscreen' && <MobileBottomNav />}

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}
