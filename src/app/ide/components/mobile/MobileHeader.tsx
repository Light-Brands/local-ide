'use client';

import React from 'react';
import { useIDEStore } from '../../stores/ideStore';
import { GitBranchIcon, SettingsIcon, MenuIcon } from '../Icons';

interface MobileHeaderProps {
  repoFullName: string;
  branchName: string;
}

export function MobileHeader({ repoFullName, branchName }: MobileHeaderProps) {
  const { setShowSettings, setMobileMainPane } = useIDEStore();

  const handleSettingsClick = () => {
    setMobileMainPane('settings');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 safe-area-top">
      {/* Left: Repo info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {repoFullName || 'local-ide'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400 shrink-0">
          <GitBranchIcon size={14} />
          <span className="text-xs">{branchName}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSettingsClick}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 active:bg-neutral-700 rounded-lg transition-colors tap-highlight-none"
          aria-label="Settings"
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
}
