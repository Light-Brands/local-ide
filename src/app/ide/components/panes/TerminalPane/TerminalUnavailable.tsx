'use client';

import { Terminal, MessageSquare, RotateCcw, Cloud } from 'lucide-react';
import type { TerminalUnavailableReason } from '../../../hooks/useTerminalAvailability';
import { useIDEStore } from '../../../stores/ideStore';

interface TerminalUnavailableProps {
  reason: TerminalUnavailableReason | null;
  onRetry: () => void;
}

export function TerminalUnavailable({ reason, onRetry }: TerminalUnavailableProps) {
  const setChatMode = useIDEStore((state) => state.setChatMode);
  const setMobileBottomZoneTab = useIDEStore((state) => state.setMobileBottomZoneTab);
  const expandMobileBottomZone = useIDEStore((state) => state.expandMobileBottomZone);

  const handleOpenChat = () => {
    // Switch to chat pane in terminal mode
    setChatMode('terminal');
    setMobileBottomZoneTab('chat');
    expandMobileBottomZone();
  };

  // Production environment - show "Use AI Chat" message
  if (reason === 'production') {
    return (
      <div className="h-full flex flex-col bg-neutral-950">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">Terminal</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Cloud className="w-8 h-8 text-blue-400" />
            </div>

            <h3 className="text-lg font-semibold text-neutral-200 mb-2">
              Terminal Not Available
            </h3>

            <p className="text-sm text-neutral-400 mb-6">
              The terminal requires a local server connection and is not available in the cloud deployment.
              Use the AI Chat for command suggestions and assistance.
            </p>

            <button
              onClick={handleOpenChat}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Use AI Chat Instead
            </button>

            <p className="mt-4 text-xs text-neutral-600">
              Claude can suggest commands you can run in your local terminal
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Local environment - server not running
  if (reason === 'server_not_running') {
    return (
      <div className="h-full flex flex-col bg-neutral-950">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">Terminal</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center mx-auto mb-6">
              <Terminal className="w-8 h-8 text-yellow-400" />
            </div>

            <h3 className="text-lg font-semibold text-neutral-200 mb-2">
              Terminal Server Not Running
            </h3>

            <p className="text-sm text-neutral-400 mb-4">
              Start the terminal server to enable terminal functionality:
            </p>

            <div className="bg-neutral-900 rounded-lg p-3 mb-6 text-left">
              <code className="text-sm text-green-400 font-mono">
                npm run dev:terminal
              </code>
            </div>

            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connection failed (catch-all)
  return (
    <div className="h-full flex flex-col bg-neutral-950">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">Terminal</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8 text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-neutral-200 mb-2">
            Connection Failed
          </h3>

          <p className="text-sm text-neutral-400 mb-6">
            Unable to connect to the terminal server. Please check your network connection and try again.
          </p>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
}
