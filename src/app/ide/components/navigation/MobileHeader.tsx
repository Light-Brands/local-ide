'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import {
  GitBranch,
  Menu,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ServiceHealthIndicator } from './ServiceHealthIndicator';

export function MobileHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const github = useIDEStore((state) => state.integrations.github);
  const setShowSettings = useIDEStore((state) => state.setShowSettings);

  const isConnected = github.connected;

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-11"
      style={{
        // Minimal padding for status bar - PWA handles notch area
        paddingTop: '4px',
      }}
    >
      {/* Left: Repo info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Connection indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            isConnected
              ? 'bg-emerald-500'
              : 'bg-neutral-400 dark:bg-neutral-600'
          )}
        />

        {/* Repo name */}
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {github.owner && github.repo
            ? `${github.owner}/${github.repo}`
            : 'local-ide'}
        </span>

        {/* Branch */}
        {github.branch && (
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
            <GitBranch className="w-3 h-3" />
            <span className="max-w-[60px] truncate">{github.branch}</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Service Health */}
        <ServiceHealthIndicator compact />

        {/* Connection status */}
        <button
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={isConnected ? 'Connected' : 'Disconnected'}
        >
          {isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        {/* Refresh */}
        <button
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>

        {/* Menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          className="absolute top-11 right-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-50"
        >
          <button
            onClick={() => {
              setShowMenu(false);
              setShowSettings(true);
            }}
            className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      )}
    </header>
  );
}
