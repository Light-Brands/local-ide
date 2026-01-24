'use client';

import React, { useCallback, useRef } from 'react';
import { useIDEStore, BottomZoneHeight } from '../../stores/ideStore';
import { TerminalIcon, ChatIcon, ChevronUpIcon, ChevronDownIcon } from '../Icons';

interface MobileBottomZoneProps {
  terminalContent: React.ReactNode;
  chatContent: React.ReactNode;
}

// Haptic feedback helper
const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(durations[style]);
  }
};

export function MobileBottomZone({ terminalContent, chatContent }: MobileBottomZoneProps) {
  const {
    mobile,
    setMobileBottomZoneTab,
    setMobileBottomZoneHeight,
    expandMobileBottomZone,
    collapseMobileBottomZone,
    serverStatus,
  } = useIDEStore();

  const { bottomZoneTab, bottomZoneHeight, chatUnreadCount } = mobile;
  const isTerminalRunning = serverStatus === 'running' || serverStatus === 'starting';

  // Touch handling for swipe gestures
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      haptic('light');
      if (deltaY > 0) {
        // Swiped up - expand
        expandMobileBottomZone();
      } else {
        // Swiped down - collapse
        collapseMobileBottomZone();
      }
    }
  }, [expandMobileBottomZone, collapseMobileBottomZone]);

  const handleTabClick = useCallback((tab: 'terminal' | 'chat') => {
    haptic('light');
    setMobileBottomZoneTab(tab);
  }, [setMobileBottomZoneTab]);

  const handleToggleHeight = useCallback(() => {
    haptic('light');
    if (bottomZoneHeight === 'collapsed') {
      setMobileBottomZoneHeight('half');
    } else {
      setMobileBottomZoneHeight('collapsed');
    }
  }, [bottomZoneHeight, setMobileBottomZoneHeight]);

  const handleDoubleClickToggle = useCallback(() => {
    haptic('medium');
    if (bottomZoneHeight === 'fullscreen') {
      setMobileBottomZoneHeight('half');
    } else {
      setMobileBottomZoneHeight('fullscreen');
    }
  }, [bottomZoneHeight, setMobileBottomZoneHeight]);

  // Calculate height based on state
  const getHeightClass = () => {
    switch (bottomZoneHeight) {
      case 'collapsed':
        return 'h-12';
      case 'half':
        return 'h-[50vh]';
      case 'expanded':
        return 'h-[75vh]';
      case 'fullscreen':
        return 'h-[calc(100vh-56px)]'; // Full height minus header
      default:
        return 'h-12';
    }
  };

  return (
    <div
      className={`flex flex-col bg-neutral-900 border-t border-neutral-700 transition-all duration-200 ${getHeightClass()}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toggle bar */}
      <div
        className="flex items-center justify-center gap-4 px-4 h-12 shrink-0 cursor-pointer"
        onDoubleClick={handleDoubleClickToggle}
      >
        {/* Drag handle / height toggle */}
        <button
          className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
          onClick={handleToggleHeight}
          aria-label={bottomZoneHeight === 'collapsed' ? 'Expand' : 'Collapse'}
        >
          {bottomZoneHeight === 'collapsed' ? (
            <ChevronUpIcon size={18} />
          ) : (
            <ChevronDownIcon size={18} />
          )}
        </button>

        {/* Terminal tab */}
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            bottomZoneTab === 'terminal'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200'
          } ${isTerminalRunning ? 'border-l-2 border-green-500' : ''}`}
          onClick={() => handleTabClick('terminal')}
          aria-selected={bottomZoneTab === 'terminal'}
        >
          <TerminalIcon size={16} />
          <span className="text-sm">Terminal</span>
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-neutral-700" />

        {/* Chat tab */}
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors relative ${
            bottomZoneTab === 'chat'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => handleTabClick('chat')}
          aria-selected={bottomZoneTab === 'chat'}
        >
          <ChatIcon size={16} />
          <span className="text-sm">Chat</span>
          {chatUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-primary-500 rounded-full">
              {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content area */}
      {bottomZoneHeight !== 'collapsed' && (
        <div className="flex-1 overflow-hidden">
          {/* Terminal content */}
          <div
            className={`h-full ${bottomZoneTab === 'terminal' ? 'block' : 'hidden'}`}
            aria-hidden={bottomZoneTab !== 'terminal'}
          >
            {terminalContent}
          </div>

          {/* Chat content */}
          <div
            className={`h-full ${bottomZoneTab === 'chat' ? 'block' : 'hidden'}`}
            aria-hidden={bottomZoneTab !== 'chat'}
          >
            {chatContent}
          </div>
        </div>
      )}
    </div>
  );
}
