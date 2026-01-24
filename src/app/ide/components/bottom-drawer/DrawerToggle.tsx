'use client';

import { cn } from '@/lib/utils';
import { useIDEStore, type DrawerTab } from '../../stores/ideStore';
import { Terminal, MessageSquare } from 'lucide-react';

export function DrawerToggle() {
  const activeTab = useIDEStore((state) => state.drawer.activeTab);
  const setTab = useIDEStore((state) => state.setDrawerTab);
  const isRunning = useIDEStore((state) => state.terminal.isRunning);
  const unreadCount = useIDEStore((state) => state.chat.unreadCount);

  const tabs: { id: DrawerTab; label: string; icon: typeof Terminal }[] = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex-shrink-0 flex border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showRunningDot = tab.id === 'terminal' && isRunning;
        const showUnreadBadge = tab.id === 'chat' && unreadCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4',
              'text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              isActive
                ? 'text-neutral-900 dark:text-neutral-100 border-primary-500'
                : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>

            {/* Running indicator (terminal) */}
            {showRunningDot && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}

            {/* Unread badge (chat) */}
            {showUnreadBadge && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-primary-500 text-white rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
