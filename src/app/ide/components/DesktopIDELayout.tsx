'use client';

import React, { useCallback, useMemo } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../stores/ideStore';
import {
  PanePortalProvider,
  PanePortalTarget,
  PaneContentPortal,
  PANE_CONFIG,
  type PaneNumber,
} from '../contexts/PanePortalContext';
import { SettingsModal } from './modals/SettingsModal';
import { DesktopHeader } from './navigation/DesktopHeader';
import { PaneTabBar } from './navigation/PaneTabBar';
import dynamic from 'next/dynamic';
import {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
  X,
  GripVertical,
} from 'lucide-react';

// Lazy load pane components
const DeveloperPane = dynamic(() => import('./panes/DeveloperPane').then((m) => m.DeveloperPane), { ssr: false });
const EditorPane = dynamic(() => import('./panes/EditorPane').then((m) => m.EditorPane), { ssr: false });
const PreviewPane = dynamic(() => import('./panes/PreviewPane').then((m) => m.PreviewPane), { ssr: false });
const DatabasePane = dynamic(() => import('./panes/DatabasePane').then((m) => m.DatabasePane), { ssr: false });
const DeployPane = dynamic(() => import('./panes/DeployPane').then((m) => m.DeployPane), { ssr: false });
const TerminalPane = dynamic(() => import('./panes/TerminalPane').then((m) => m.TerminalPane), { ssr: false }); // Legacy

import { ActivitySlidePanel } from './panels/ActivitySlidePanel';
import { OperationsPanel } from './operations';

// Pane components mapping (Activity is now a slide-out panel, not a regular pane)
const PANE_COMPONENTS: Record<number, React.ComponentType> = {
  1: DeveloperPane,  // Unified Developer pane with Chat + Terminal tabs
  2: EditorPane,
  3: TerminalPane,   // Legacy - kept for backwards compatibility
  4: PreviewPane,
  5: DatabasePane,
  6: DeployPane,
};

// Icons mapping
const PANE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
};

// Minimum pixel width for pane content (allows horizontal scroll when smaller)
const MIN_PANE_CONTENT_WIDTH = 200;

// Resize handle component - wide hit area for easy grabbing
function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-3 hover:w-4 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-primary-500 active:bg-primary-600 transition-all cursor-col-resize flex items-center justify-center">
      <GripVertical className="w-3 h-4 text-neutral-400 group-hover:text-white" />
    </PanelResizeHandle>
  );
}

// Pane header with close button
interface PaneHeaderProps {
  paneId: number;
  onClose: () => void;
}

function PaneHeader({ paneId, onClose }: PaneHeaderProps) {
  const config = PANE_CONFIG[paneId as PaneNumber];
  if (!config) return null;

  const Icon = PANE_ICONS[config.icon];

  return (
    <div className="flex-shrink-0 h-10 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-neutral-500" />}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {config.name}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        aria-label={`Close ${config.name}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Main desktop layout content
function DesktopLayoutContent() {
  const paneOrder = useIDEStore((state) => state.paneOrder);
  const paneVisibility = useIDEStore((state) => state.paneVisibility);
  const togglePane = useIDEStore((state) => state.togglePane);
  const setPaneWidth = useIDEStore((state) => state.setPaneWidth);

  // Get visible panes in order
  const visiblePanes = useMemo(
    () => paneOrder.filter((id) => paneVisibility[id]),
    [paneOrder, paneVisibility]
  );

  // Calculate default size - evenly distributed
  const getDefaultSize = useCallback(() => {
    return 100 / Math.max(visiblePanes.length, 1);
  }, [visiblePanes.length]);

  // Handle resize - receives PanelSize with asPercentage and inPixels
  const handleResize = useCallback(
    (paneId: number, size: { asPercentage: number; inPixels: number }) => {
      setPaneWidth(paneId, size.inPixels);
    },
    [setPaneWidth]
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <DesktopHeader />

      {/* Pane Tab Bar */}
      <PaneTabBar />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Main panel area */}
        <div className="flex-1 min-w-0">
          {visiblePanes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <p className="text-sm mb-2">No panes visible</p>
                <p className="text-xs text-neutral-400">
                  Press <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">⌘1-7</kbd> to toggle panes
                </p>
              </div>
            </div>
          ) : (
            <PanelGroup
              id="ide-panes"
              orientation="horizontal"
              className="h-full"
            >
              {visiblePanes.map((paneId, index) => (
                <React.Fragment key={paneId}>
                  {index > 0 && <ResizeHandle />}
                  <Panel
                    id={`pane-${paneId}`}
                    defaultSize={getDefaultSize()}
                    minSize={1}
                    onResize={(size) => handleResize(paneId, size)}
                    className="flex flex-col bg-white dark:bg-neutral-900 overflow-hidden"
                    style={{ minWidth: 0 }}
                  >
                    <PaneHeader paneId={paneId} onClose={() => togglePane(paneId)} />
                    {/* Scrollable pane content with minimum width */}
                    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto pane-scroll">
                      <div
                        className="h-full min-h-full"
                        style={{ minWidth: MIN_PANE_CONTENT_WIDTH }}
                      >
                        <PanePortalTarget paneId={paneId} />
                      </div>
                    </div>
                  </Panel>
                </React.Fragment>
              ))}
            </PanelGroup>
          )}
        </div>
      </div>

      {/* Hidden pane content holders - keeps state alive */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {paneOrder.map((paneId) => {
          const PaneComponent = PANE_COMPONENTS[paneId];
          if (!PaneComponent) return null;

          return (
            <PaneContentPortal key={paneId} paneId={paneId} isVisible={paneVisibility[paneId]}>
              <PaneComponent />
            </PaneContentPortal>
          );
        })}
      </div>

      {/* Settings Modal */}
      <SettingsModal />

      {/* Activity Slide Panel */}
      <ActivitySlidePanel />

      {/* Operations Panel */}
      <OperationsPanel />
    </div>
  );
}

// Export the main component with portal provider
export function DesktopIDELayout() {
  return (
    <PanePortalProvider>
      <DesktopLayoutContent />
    </PanePortalProvider>
  );
}
