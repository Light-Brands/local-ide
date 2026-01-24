'use client';

import { useEffect, useCallback } from 'react';
import { useIDEStore } from '../stores/ideStore';

// Build a key string from keyboard event
function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('cmd');
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function useKeyboardShortcuts() {
  const {
    togglePane,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandDictionaryOpen,
    setCommandDictionaryOpen,
    isMobile,
    activeFile,
    closeFile,
    fileTreeCollapsed,
    setFileTreeCollapsed,
    mobile,
    toggleMobileBottomZone,
  } = useIDEStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow some shortcuts even in inputs
      const key = buildKeyString(e);
      if (key !== 'cmd+s' && key !== 'ctrl+s' && key !== 'escape') {
        return;
      }
    }

    const key = buildKeyString(e);

    // Command Palette (Cmd+K or Ctrl+K)
    if (key === 'cmd+k' || key === 'ctrl+k') {
      e.preventDefault();
      setCommandPaletteOpen(!commandPaletteOpen);
      return;
    }

    // Command Dictionary (Cmd+/ or Ctrl+/)
    if (key === 'cmd+/' || key === 'ctrl+/') {
      e.preventDefault();
      setCommandDictionaryOpen(!commandDictionaryOpen);
      return;
    }

    // Close command palette or dictionary with Escape
    if (key === 'escape') {
      if (commandDictionaryOpen) {
        e.preventDefault();
        setCommandDictionaryOpen(false);
        return;
      }
      if (commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }
    }

    // Desktop pane shortcuts (Cmd+1-7 or Ctrl+1-7)
    if (!isMobile) {
      const paneShortcuts: Record<string, number> = {
        'cmd+1': 1, 'ctrl+1': 1, // Chat
        'cmd+2': 2, 'ctrl+2': 2, // Editor
        'cmd+3': 3, 'ctrl+3': 3, // Preview
        'cmd+4': 4, 'ctrl+4': 4, // Database
        'cmd+5': 5, 'ctrl+5': 5, // Deployments
        'cmd+6': 6, 'ctrl+6': 6, // Activity
        'cmd+7': 7, 'ctrl+7': 7, // Terminal
      };

      if (paneShortcuts[key]) {
        e.preventDefault();
        togglePane(paneShortcuts[key]);
        return;
      }
    }

    // Toggle sidebar (Cmd+B or Ctrl+B)
    if (key === 'cmd+b' || key === 'ctrl+b') {
      e.preventDefault();
      setFileTreeCollapsed(!fileTreeCollapsed);
      return;
    }

    // Close current file (Cmd+W or Ctrl+W)
    if (key === 'cmd+w' || key === 'ctrl+w') {
      if (activeFile) {
        e.preventDefault();
        closeFile(activeFile);
      }
      return;
    }

    // Toggle terminal/chat (Cmd+` or Ctrl+`)
    if (key === 'cmd+`' || key === 'ctrl+`') {
      e.preventDefault();
      if (isMobile) {
        toggleMobileBottomZone();
      }
      return;
    }

    // Save file (Cmd+S or Ctrl+S) - prevent default, let editor handle it
    if (key === 'cmd+s' || key === 'ctrl+s') {
      e.preventDefault();
      // The editor component should handle this
      document.dispatchEvent(new CustomEvent('ide:save-file'));
      return;
    }

  }, [
    togglePane,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandDictionaryOpen,
    setCommandDictionaryOpen,
    isMobile,
    activeFile,
    closeFile,
    fileTreeCollapsed,
    setFileTreeCollapsed,
    toggleMobileBottomZone,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
