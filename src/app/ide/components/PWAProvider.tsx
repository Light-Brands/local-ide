'use client';

import { useEffect, useState, useCallback } from 'react';
import { useServiceWorker } from '../hooks';
import { Wifi, WifiOff, RefreshCw, X, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isOnline, needsUpdate, skipWaiting } = useServiceWorker();
  const [hasMounted, setHasMounted] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Detect iOS and installed state
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Don't show install prompt if already installed
    if (standalone) return;

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Show install prompt after a delay
    const timer = setTimeout(() => {
      if (ios) {
        setShowIOSInstructions(true);
      } else if (deferredPrompt) {
        setShowInstall(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a delay if not already shown
      setTimeout(() => setShowInstall(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Show offline notification
  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      const timer = setTimeout(() => setShowOffline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Show update notification
  useEffect(() => {
    if (needsUpdate) {
      setShowUpdate(true);
    }
  }, [needsUpdate]);

  return (
    <>
      {children}

      {/* Only render notifications after hydration to prevent mismatch */}
      {hasMounted && (
        <>
          {/* Offline indicator */}
          <div
            className={cn(
              'fixed top-0 left-0 right-0 z-50 transition-transform duration-300',
              'pt-[env(safe-area-inset-top)]',
              showOffline ? 'translate-y-0' : '-translate-y-full'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
                isOnline
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              )}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Back online
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  You&apos;re offline - some features may be limited
                </>
              )}
              <button
                onClick={() => setShowOffline(false)}
                className="ml-2 p-1 rounded hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Install prompt (Chrome/Android) */}
          {showInstall && !isInstalled && deferredPrompt && (
            <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Install Local IDE
                    </h4>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Add to your home screen for quick access and offline use.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleInstall}
                        className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Install
                      </button>
                      <button
                        onClick={dismissInstall}
                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={dismissInstall}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* iOS Install Instructions */}
          {showIOSInstructions && !isInstalled && isIOS && (
            <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Install Local IDE
                    </h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs font-medium">Share</span> button, then select <span className="font-medium">&quot;Add to Home Screen&quot;</span>
                    </p>
                    <button
                      onClick={dismissInstall}
                      className="mt-3 text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                      Got it
                    </button>
                  </div>
                  <button
                    onClick={dismissInstall}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update available notification */}
          {showUpdate && (
            <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      Update available
                    </h4>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      A new version of Local IDE is ready.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={skipWaiting}
                        className="px-3 py-1.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                      >
                        Update now
                      </button>
                      <button
                        onClick={() => setShowUpdate(false)}
                        className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
