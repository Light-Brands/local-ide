'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useIDEStore } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { getProductionUrl, getStoredVercelToken } from '@/lib/ide/services/vercel';
import { Monitor, Globe, RefreshCw } from 'lucide-react';
import { DeviceFrame, DeviceInfo, type DeviceType, type Orientation } from './DeviceFrame';
import { PreviewToolbar } from './PreviewToolbar';
import { cn } from '@/lib/utils';

export function PreviewPane() {
  const isMobile = useMobileDetect();
  const [deviceFrame, setDeviceFrame] = useState<DeviceType>('none');
  const [refreshKey, setRefreshKey] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [historyState, setHistoryState] = useState<{ history: string[]; index: number }>({
    history: [],
    index: -1,
  });
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  // Track when we're navigating history to prevent re-adding to history
  const isNavigatingRef = useRef(false);

  const mode = useIDEStore((state) => state.previewMode);
  const localPort = useIDEStore((state) => state.serverPort);
  const deployedUrl = useIDEStore((state) => state.deployedUrl);
  const setMode = useIDEStore((state) => state.setPreviewMode);
  const setDeployedUrl = useIDEStore((state) => state.setDeployedUrl);
  const vercel = useIDEStore((state) => state.integrations.vercel);

  // No port scanner needed - we always preview the app on port 4000
  // The IDE and app are the same server in the self-evolving architecture

  // Cloudflare tunnel URL for local-to-remote access
  const TUNNEL_URL = 'https://ide.lightbrands.ai';

  // Fetch production URL from Vercel or use tunnel URL
  useEffect(() => {
    async function fetchProductionUrl() {
      if (vercel.connected && getStoredVercelToken()) {
        try {
          const url = await getProductionUrl();
          if (url) {
            setDeployedUrl(url);
          } else if (vercel.projectName) {
            // Fallback to default Vercel URL pattern
            setDeployedUrl(`https://${vercel.projectName}.vercel.app`);
          }
        } catch (err) {
          console.error('Failed to fetch production URL:', err);
          // Fallback to default Vercel URL pattern on error
          if (vercel.projectName) {
            setDeployedUrl(`https://${vercel.projectName}.vercel.app`);
          }
        }
      } else {
        // Use Cloudflare tunnel URL when Vercel isn't connected
        setDeployedUrl(TUNNEL_URL);
      }
    }

    // Always update the URL based on Vercel connection status
    fetchProductionUrl();
  }, [vercel.connected, vercel.projectName, setDeployedUrl]);

  // In self-evolving mode, the app runs on the same port as the IDE (4000)
  // The user's public pages are at the root URL
  const IDE_PORT = 4000;
  const previewUrl =
    customUrl ||
    (mode === 'local'
      ? `http://localhost:${IDE_PORT}`
      : (deployedUrl || TUNNEL_URL));

  // Update history when URL changes (but not when navigating history)
  useEffect(() => {
    if (!previewUrl) return;

    // Skip if we're navigating history
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    setHistoryState((prev) => {
      if (prev.history.length === 0 || prev.history[prev.index] !== previewUrl) {
        return {
          history: [...prev.history.slice(0, prev.index + 1), previewUrl],
          index: prev.index + 1,
        };
      }
      return prev;
    });
  }, [previewUrl]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setIsLoading(true);
  }, []);

  // Handle navigation
  const handleBack = useCallback(() => {
    const { history, index } = historyState;
    if (index > 0) {
      isNavigatingRef.current = true;
      setHistoryState({ history, index: index - 1 });
      setCustomUrl(history[index - 1]);
    }
  }, [historyState]);

  const handleForward = useCallback(() => {
    const { history, index } = historyState;
    if (index < history.length - 1) {
      isNavigatingRef.current = true;
      setHistoryState({ history, index: index + 1 });
      setCustomUrl(history[index + 1]);
    }
  }, [historyState]);

  // Handle URL input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      let url = customUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setCustomUrl(url);
      setRefreshKey((k) => k + 1);
    }
  };

  // Handle mode change
  const handleModeChange = (newMode: 'local' | 'deployed') => {
    setMode(newMode);
    setCustomUrl('');
  };

  return (
    <div className="h-full flex flex-col bg-neutral-100 dark:bg-neutral-900">
      {/* Toolbar */}
      <PreviewToolbar
        mode={mode}
        setMode={handleModeChange}
        deviceFrame={deviceFrame}
        setDeviceFrame={setDeviceFrame}
        orientation={orientation}
        setOrientation={setOrientation}
        customUrl={customUrl}
        setCustomUrl={setCustomUrl}
        previewUrl={previewUrl}
        deployedUrl={deployedUrl}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onBack={handleBack}
        onForward={handleForward}
        canGoBack={historyState.index > 0}
        canGoForward={historyState.index < historyState.history.length - 1}
        onUrlSubmit={handleUrlSubmit}
        isMobile={isMobile}
      />

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {previewUrl ? (
          <DeviceFrame device={deviceFrame} orientation={orientation}>
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setIsLoading(false)}
            />
          </DeviceFrame>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              No preview available
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {mode === 'local'
                ? 'Start a dev server to see the preview'
                : 'Deploy your app to see the preview'}
            </p>
            {mode === 'local' && (
              <div className="text-xs text-neutral-400">
                Run <code className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">npm run dev</code> in the terminal
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs">
        {/* Device info */}
        <div className="flex items-center gap-2 text-neutral-500">
          <DeviceInfo device={deviceFrame} orientation={orientation} />
        </div>
      </div>
    </div>
  );
}
