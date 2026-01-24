'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMobileDetect } from '../hooks/useMobileDetect';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useIDEStore } from '../stores/ideStore';
import { MobileIDELayout } from './mobile/MobileIDELayout';
import { DesktopIDELayout } from './DesktopIDELayout';
import { CommandPalette } from './CommandPalette';
import { CommandDictionary } from './modals/CommandDictionary';
import { LoaderIcon } from './Icons';
import type { DictionaryItem } from '@/lib/ide/tooling';

// Set up viewport height CSS variable for mobile
function useViewportHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);
}

export function IDELayout() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMobileDetect();
  const initSession = useIDEStore((state) => state.initSession);
  const commandDictionaryOpen = useIDEStore((state) => state.commandDictionaryOpen);
  const commandDictionaryPillar = useIDEStore((state) => state.commandDictionaryPillar);
  const setCommandDictionaryOpen = useIDEStore((state) => state.setCommandDictionaryOpen);

  // Set up viewport height for mobile
  useViewportHeight();

  // Set up keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize session on mount
  useEffect(() => {
    initSession();
    setMounted(true);
  }, [initSession]);

  // Handle dictionary item selection
  const handleDictionarySelect = useCallback((item: DictionaryItem) => {
    // Dispatch custom event for ChatPane to catch
    const event = new CustomEvent('dictionary:select', {
      detail: { type: item.type, name: item.name },
    });
    window.dispatchEvent(event);
    // Close the dictionary
    setCommandDictionaryOpen(false);
  }, [setCommandDictionaryOpen]);

  // Show loading state until hydrated
  if (!mounted) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="w-8 h-8 text-primary-500" />
          <p className="text-sm text-neutral-500">Loading IDE...</p>
        </div>
      </div>
    );
  }

  // Render appropriate layout based on device
  return (
    <>
      {isMobile ? <MobileIDELayout /> : <DesktopIDELayout />}
      <CommandPalette />
      <CommandDictionary
        isOpen={commandDictionaryOpen}
        onClose={() => setCommandDictionaryOpen(false)}
        onSelect={handleDictionarySelect}
        initialPillar={commandDictionaryPillar}
      />
    </>
  );
}
