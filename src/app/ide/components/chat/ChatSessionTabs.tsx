'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useChatSessions, type ChatSession } from '../../stores/ideStore';
import { Plus, X, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface ChatSessionTabsProps {
  className?: string;
}

export function ChatSessionTabs({ className }: ChatSessionTabsProps) {
  const {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
    renameSession,
  } = useChatSessions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleNewSession = useCallback(() => {
    addSession();
  }, [addSession]);

  const handleSelectSession = useCallback((sessionId: string) => {
    if (sessionId !== activeSessionId) {
      setActiveSession(sessionId);
    }
  }, [activeSessionId, setActiveSession]);

  const handleCloseSession = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    removeSession(sessionId);
  }, [removeSession]);

  const handleStartRename = useCallback((e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditName(session.name);
    setMenuOpenId(null);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameSession]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  }, [handleFinishRename]);

  // If no sessions exist, create one
  if (sessions.length === 0) {
    return (
      <div className={cn('flex items-center gap-1 px-2 py-1 border-b border-neutral-800', className)}>
        <button
          onClick={handleNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 border-b border-neutral-800 overflow-x-auto scrollbar-none', className)}>
      {/* Session tabs */}
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const isEditing = session.id === editingId;
        const messageCount = session.messages.length;

        return (
          <div
            key={session.id}
            onClick={() => handleSelectSession(session.id)}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer min-w-0 max-w-[160px]',
              isActive
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />

            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{session.name}</span>
            )}

            {/* Message count badge */}
            {messageCount > 0 && !isEditing && (
              <span className={cn(
                'flex-shrink-0 px-1 py-0.5 rounded text-[10px] font-medium',
                isActive ? 'bg-primary-500/30 text-primary-200' : 'bg-neutral-700 text-neutral-400'
              )}>
                {messageCount}
              </span>
            )}

            {/* Actions */}
            {isActive && !isEditing && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => handleStartRename(e, session)}
                  className="p-0.5 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title="Rename"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleCloseSession(e, session.id)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* New session button */}
      <button
        onClick={handleNewSession}
        className="flex-shrink-0 p-1.5 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        title="New chat session"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
