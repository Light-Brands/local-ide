'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Trash2, RefreshCw, Terminal, Play, X } from 'lucide-react';

export interface SessionInfo {
  session_id: string;
  project_path: string;
  created_at: string;
  last_activity_at: string;
  cols: number;
  rows: number;
  is_active: number;
  isLive: boolean;
}

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
}

export const SessionManager = memo(function SessionManager({
  isOpen,
  onClose,
  onSelectSession,
  currentSessionId,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/terminal/sessions');
      const data = await response.json();

      if (data.sessions) {
        setSessions(data.sessions);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(`/api/terminal/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-200">Terminal Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessions}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {error ? (
            <div className="text-center py-8 text-neutral-400 text-sm">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-sm">
              {isLoading ? 'Loading sessions...' : 'No saved sessions'}
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const isCurrent = session.session_id === currentSessionId;

                return (
                  <div
                    key={session.session_id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-colors',
                      isCurrent
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'hover:bg-neutral-800 border border-transparent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Terminal className={cn(
                          'w-4 h-4 flex-shrink-0',
                          session.isLive ? 'text-green-400' : 'text-neutral-500'
                        )} />
                        <span className={cn(
                          'text-sm font-mono truncate',
                          isCurrent ? 'text-green-400' : 'text-neutral-200'
                        )}>
                          {session.session_id.slice(0, 20)}...
                        </span>
                        {session.isLive && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                            Live
                          </span>
                        )}
                        {isCurrent && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span>Last active: {formatDate(session.last_activity_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {!isCurrent && (
                        <button
                          onClick={() => onSelectSession(session.session_id)}
                          className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-green-400 transition-colors"
                          title="Connect to session"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSession(session.session_id)}
                        className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-700 text-xs text-neutral-500">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
        </div>
      </div>
    </div>
  );
});
