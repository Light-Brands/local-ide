'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useIDEStore, MobileMainPane } from '../../stores/ideStore';
import { useIDEContext } from '../../contexts/IDEContext';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileBottomZone } from './MobileBottomZone';
import dynamic from 'next/dynamic';

// Loading skeleton for panes
function MobilePaneSkeleton() {
  return (
    <div className="flex flex-col h-full bg-neutral-900 animate-pulse">
      <div className="h-12 bg-neutral-800" />
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-800 rounded w-1/2" />
        <div className="h-4 bg-neutral-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// Lazy load pane components
const PreviewPane = dynamic(
  () => import('../panes/PreviewPane').then((m) => m.PreviewPane),
  { loading: () => <MobilePaneSkeleton /> }
);

const EditorPane = dynamic(
  () => import('../panes/EditorPane').then((m) => m.EditorPane),
  { loading: () => <MobilePaneSkeleton /> }
);

const DatabasePane = dynamic(
  () => import('../panes/DatabasePane').then((m) => m.DatabasePane),
  { loading: () => <MobilePaneSkeleton /> }
);

const DeployPane = dynamic(
  () => import('../panes/DeployPane').then((m) => m.DeployPane),
  { loading: () => <MobilePaneSkeleton /> }
);

const ActivityPane = dynamic(
  () => import('../panes/ActivityPane').then((m) => m.ActivityPane),
  { loading: () => <MobilePaneSkeleton /> }
);

const SettingsPane = dynamic(
  () => import('../panes/SettingsPane').then((m) => m.SettingsPane),
  { loading: () => <MobilePaneSkeleton /> }
);

// Bottom zone components
const TerminalPane = dynamic(
  () => import('../panes/TerminalPane').then((m) => m.TerminalPane),
  { loading: () => <MobilePaneSkeleton />, ssr: false }
);

const ChatPane = dynamic(
  () => import('../panes/ChatPane').then((m) => m.ChatPane),
  { loading: () => <MobilePaneSkeleton /> }
);

// Main pane component mapping
const MAIN_PANE_COMPONENTS: Record<MobileMainPane, React.ComponentType> = {
  preview: PreviewPane,
  editor: EditorPane,
  database: DatabasePane,
  deployments: DeployPane,
  activity: ActivityPane,
  settings: SettingsPane,
};

// Haptic feedback helper
const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(durations[style]);
  }
};

export function MobileIDELayout() {
  const { repoFullName } = useIDEContext();
  const { mobile, setMobileMainPane, integrations } = useIDEStore();
  const { mainPane, bottomZoneHeight } = mobile;

  // Swipe handling for main pane navigation
  const touchStartX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const mainPaneOrder: MobileMainPane[] = ['preview', 'editor', 'database', 'deployments', 'activity', 'settings'];

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(false);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 80;

    if (Math.abs(deltaX) > threshold) {
      const currentIndex = mainPaneOrder.indexOf(mainPane);

      if (deltaX > 0 && currentIndex > 0) {
        // Swiped right - previous pane
        haptic('light');
        setMobileMainPane(mainPaneOrder[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < mainPaneOrder.length - 1) {
        // Swiped left - next pane
        haptic('light');
        setMobileMainPane(mainPaneOrder[currentIndex + 1]);
      }
    }

    setIsSwiping(false);
  }, [mainPane, mainPaneOrder, setMobileMainPane]);

  // Get the active main pane component
  const MainPaneComponent = MAIN_PANE_COMPONENTS[mainPane];

  // Get branch name from integrations
  const branchName = integrations.github.branch || 'main';

  return (
    <div
      className="flex flex-col h-[100dvh] bg-neutral-950 text-white overflow-hidden"
      data-bottom-zone-height={bottomZoneHeight}
    >
      {/* Mobile header */}
      <MobileHeader repoFullName={repoFullName} branchName={branchName} />

      {/* Main pane area */}
      <div
        className={`flex-1 overflow-hidden transition-all duration-200 ${
          bottomZoneHeight === 'collapsed' ? 'flex-[1]' :
          bottomZoneHeight === 'half' ? 'flex-[1]' :
          bottomZoneHeight === 'expanded' ? 'flex-[0.3]' :
          'flex-[0]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <MainPaneComponent />
      </div>

      {/* Bottom zone (Terminal + Chat toggle) */}
      <MobileBottomZone
        terminalContent={<TerminalPane />}
        chatContent={<ChatPane />}
      />

      {/* Bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
