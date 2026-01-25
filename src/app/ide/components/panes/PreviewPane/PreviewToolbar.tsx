'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Globe,
  WifiOff,
  RotateCcw,
  MousePointer2,
} from 'lucide-react';
import type { SelectorMode } from '@/lib/ide/componentSelector/types';
import { DEVICE_PRESETS, DEVICE_CATEGORIES, type DeviceType, type Orientation } from './DeviceFrame';

interface ComponentSelectorProps {
  isEnabled: boolean;
  mode: SelectorMode;
  enable: (mode: SelectorMode) => void;
  disable: () => void;
}

interface PreviewToolbarProps {
  mode: 'local' | 'deployed';
  setMode: (mode: 'local' | 'deployed') => void;
  deviceFrame: DeviceType;
  setDeviceFrame: (device: DeviceType) => void;
  orientation: Orientation;
  setOrientation: (orientation: Orientation) => void;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  previewUrl: string | null;
  deployedUrl: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onUrlSubmit: (e: React.FormEvent) => void;
  isMobile?: boolean;
  componentSelector?: ComponentSelectorProps;
}

export const PreviewToolbar = memo(function PreviewToolbar({
  mode,
  setMode,
  deviceFrame,
  setDeviceFrame,
  orientation,
  setOrientation,
  customUrl,
  setCustomUrl,
  previewUrl,
  deployedUrl,
  isLoading,
  onRefresh,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onUrlSubmit,
  isMobile = false,
  componentSelector,
}: PreviewToolbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDeployedClick = () => {
    // Just switch the mode - the iframe will load the deployed URL
    setMode('deployed');
  };

  const handleOpenExternal = () => {
    if (deployedUrl) {
      window.open(deployedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeviceSelect = (device: DeviceType) => {
    setDeviceFrame(device);
    setOpenDropdown(null);
  };

  const currentDevice = DEVICE_PRESETS[deviceFrame];
  const currentCategory = currentDevice?.category || 'responsive';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'phone': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Mode toggle */}
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5">
          <button
            onClick={() => setMode('local')}
            className={cn(
              'px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              mode === 'local'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
          >
            Local
          </button>
          <button
            onClick={handleDeployedClick}
            className={cn(
              'px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
              mode === 'deployed'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
            title={deployedUrl ? `Preview ${deployedUrl}` : 'No deployed URL available'}
          >
            Tunnel
          </button>
        </div>
        {/* External link button */}
        {deployedUrl && (
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={`Open ${deployedUrl} in new tab`}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* URL bar (desktop only) */}
      {!isMobile && (
        <form onSubmit={onUrlSubmit} className="flex flex-1 mx-4">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
            ) : previewUrl ? (
              <Globe className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-neutral-400" />
            )}
            <input
              type="text"
              value={customUrl || previewUrl || ''}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter URL or use local/deployed preview"
              className="flex-1 bg-transparent text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 outline-none"
            />
          </div>
        </form>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Device frame dropdowns (desktop only) */}
        {!isMobile && (
          <div ref={dropdownRef} className="flex items-center gap-1 mr-2 border-r border-neutral-200 dark:border-neutral-700 pr-2">
            {/* Phone dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'phone' ? null : 'phone')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors flex items-center gap-0.5',
                  currentCategory === 'phone'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
                )}
                aria-label="Phone devices"
              >
                <Smartphone className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'phone' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                  {DEVICE_CATEGORIES.phone.devices.map((deviceId) => {
                    const device = DEVICE_PRESETS[deviceId as DeviceType];
                    return (
                      <button
                        key={deviceId}
                        onClick={() => handleDeviceSelect(deviceId as DeviceType)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center',
                          deviceFrame === deviceId && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        )}
                      >
                        <span>{device.name}</span>
                        <span className="text-xs text-neutral-400">
                          {typeof device.width === 'number' ? `${device.width}×${device.height}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tablet dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'tablet' ? null : 'tablet')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors flex items-center gap-0.5',
                  currentCategory === 'tablet'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
                )}
                aria-label="Tablet devices"
              >
                <Tablet className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'tablet' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                  {DEVICE_CATEGORIES.tablet.devices.map((deviceId) => {
                    const device = DEVICE_PRESETS[deviceId as DeviceType];
                    return (
                      <button
                        key={deviceId}
                        onClick={() => handleDeviceSelect(deviceId as DeviceType)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center',
                          deviceFrame === deviceId && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        )}
                      >
                        <span>{device.name}</span>
                        <span className="text-xs text-neutral-400">
                          {typeof device.width === 'number' ? `${device.width}×${device.height}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'desktop' ? null : 'desktop')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors flex items-center gap-0.5',
                  currentCategory === 'desktop' || currentCategory === 'responsive'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
                )}
                aria-label="Desktop sizes"
              >
                <Monitor className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'desktop' && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                  {/* Responsive option */}
                  <button
                    onClick={() => handleDeviceSelect('none')}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center',
                      deviceFrame === 'none' && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    )}
                  >
                    <span>Responsive</span>
                    <span className="text-xs text-neutral-400">Full width</span>
                  </button>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />
                  {DEVICE_CATEGORIES.desktop.devices.map((deviceId) => {
                    const device = DEVICE_PRESETS[deviceId as DeviceType];
                    return (
                      <button
                        key={deviceId}
                        onClick={() => handleDeviceSelect(deviceId as DeviceType)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center',
                          deviceFrame === deviceId && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        )}
                      >
                        <span>{device.name}</span>
                        <span className="text-xs text-neutral-400">
                          {typeof device.width === 'number' ? `${device.width}×${device.height}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orientation toggle for non-responsive devices */}
            {deviceFrame !== 'none' && currentCategory !== 'desktop' && (
              <button
                onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                aria-label="Rotate device"
                title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Component Selector dropdown */}
            {componentSelector && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (componentSelector.isEnabled) {
                      componentSelector.disable();
                    } else {
                      setOpenDropdown(openDropdown === 'selector' ? null : 'selector');
                    }
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors flex items-center gap-0.5',
                    componentSelector.isEnabled
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
                  )}
                  aria-label="Component selector"
                  title={componentSelector.isEnabled ? 'Disable component selector' : 'Enable component selector'}
                >
                  <MousePointer2 className="w-4 h-4" />
                  {!componentSelector.isEnabled && <ChevronDown className="w-3 h-3" />}
                </button>
                {openDropdown === 'selector' && !componentSelector.isEnabled && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                    <button
                      onClick={() => {
                        componentSelector.enable('once');
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex flex-col"
                    >
                      <span className="font-medium">Once</span>
                      <span className="text-xs text-neutral-400">Single select</span>
                    </button>
                    <button
                      onClick={() => {
                        componentSelector.enable('on');
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex flex-col"
                    >
                      <span className="font-medium">On</span>
                      <span className="text-xs text-neutral-400">Multi-select</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation (mobile) */}
        {isMobile && (
          <>
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-30"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onForward}
              disabled={!canGoForward}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-30"
              aria-label="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>

        {/* Open external */}
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
            aria-label="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
});
