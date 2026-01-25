'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';
import { useToast } from '@/components/ui/Toast';
import { formatComponentContext } from '@/lib/ide/componentSelector/formatContext';
import type { SelectorMode, HoverData, ComponentData } from '@/lib/ide/componentSelector/types';

interface UseComponentSelectorOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onElementSelected?: (data: ComponentData, formattedContext: string) => void;
}

interface UseComponentSelectorReturn {
  isEnabled: boolean;
  mode: SelectorMode;
  enable: (mode: SelectorMode) => void;
  disable: () => void;
  hoveredComponent: HoverData | null;
  selectedElements: ComponentData[];
  clearElements: () => void;
}

/**
 * Hook for managing component selector state and postMessage communication
 */
export function useComponentSelector({
  iframeRef,
  onElementSelected,
}: UseComponentSelectorOptions): UseComponentSelectorReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [mode, setMode] = useState<SelectorMode>('once');
  const [hoveredComponent, setHoveredComponent] = useState<HoverData | null>(null);
  const [selectedElements, setSelectedElements] = useState<ComponentData[]>([]);
  const { success } = useToast();

  // Send enable/disable message to iframe
  const sendMessage = useCallback((type: 'enable' | 'disable') => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      iframe.contentWindow.postMessage({
        type: type === 'enable' ? 'component-selector:enable' : 'component-selector:disable',
        source: 'ide',
      }, '*');
    } catch (error) {
      console.warn('Failed to send message to iframe:', error);
    }
  }, [iframeRef]);

  // Send enable/disable when state changes
  useEffect(() => {
    sendMessage(isEnabled ? 'enable' : 'disable');
  }, [isEnabled, sendMessage]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'app-preview') return;

      if (event.data.type === 'component-selector:hover') {
        setHoveredComponent(event.data.data);
      }

      if (event.data.type === 'component-selector:selected') {
        const data = event.data.data as ComponentData;
        const context = formatComponentContext(data);

        // Track selected element
        setSelectedElements(prev => {
          // Avoid duplicates based on uniqueSelector
          const exists = prev.some(e => e.uniqueSelector === data.uniqueSelector);
          if (exists) return prev;
          return [...prev, data];
        });

        // Call the callback if provided (for adding to context)
        if (onElementSelected) {
          onElementSelected(data, context);
        }

        // Copy to clipboard
        navigator.clipboard.writeText(context).then(() => {
          const name = data.componentName || data.elementTag || 'element';
          success(`Copied ${name} context. Added to Elements!`);

          // Only auto-disable in "once" mode
          if (mode === 'once') {
            setIsEnabled(false);
            setHoveredComponent(null);
          }
        }).catch((error) => {
          console.error('Failed to copy to clipboard:', error);
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [success, mode, onElementSelected]);

  // ESC to cancel
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEnabled(false);
        setHoveredComponent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  // Enable with specific mode
  const enable = useCallback((selectedMode: SelectorMode) => {
    setMode(selectedMode);
    setIsEnabled(true);
  }, []);

  // Disable selector
  const disable = useCallback(() => {
    setIsEnabled(false);
    setHoveredComponent(null);
  }, []);

  // Clear selected elements
  const clearElements = useCallback(() => {
    setSelectedElements([]);
  }, []);

  return {
    isEnabled,
    mode,
    enable,
    disable,
    hoveredComponent,
    selectedElements,
    clearElements,
  };
}
