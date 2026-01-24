'use client';

import React from 'react';
import { useIDEStore, MobileMainPane } from '../../stores/ideStore';
import {
  GlobeIcon,
  CodeIcon,
  DatabaseIcon,
  RocketIcon,
  ActivityIcon,
} from '../Icons';

interface NavItem {
  id: MobileMainPane;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'preview', label: 'Preview', icon: <GlobeIcon size={20} /> },
  { id: 'editor', label: 'Editor', icon: <CodeIcon size={20} /> },
  { id: 'database', label: 'Database', icon: <DatabaseIcon size={20} /> },
  { id: 'deployments', label: 'Deploy', icon: <RocketIcon size={20} /> },
  { id: 'activity', label: 'Activity', icon: <ActivityIcon size={20} /> },
];

// Haptic feedback helper
const haptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export function MobileBottomNav() {
  const { mobile, setMobileMainPane } = useIDEStore();
  const { mainPane } = mobile;

  const handleNavClick = (pane: MobileMainPane) => {
    haptic();
    setMobileMainPane(pane);
  };

  // Get current pane index for indicator dots
  const currentIndex = NAV_ITEMS.findIndex((item) => item.id === mainPane);

  return (
    <nav className="flex flex-col bg-neutral-900 border-t border-neutral-800 safe-area-bottom">
      {/* Pane indicator dots */}
      <div className="flex items-center justify-center gap-1.5 py-1.5">
        {NAV_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-primary-400 scale-125'
                : 'bg-neutral-600'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-around px-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const isActive = mainPane === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors tap-highlight-none ${
                isActive
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700'
              }`}
              aria-selected={isActive}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
