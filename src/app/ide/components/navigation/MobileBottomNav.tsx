'use client';

import { cn } from '@/lib/utils';
import { useIDEStore, type PaneId } from '../../stores/ideStore';
import {
  Eye,
  FileCode,
  Database,
  Rocket,
  Activity,
} from 'lucide-react';

const navItems: { id: PaneId; label: string; icon: typeof Eye }[] = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'editor', label: 'Editor', icon: FileCode },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export function MobileBottomNav() {
  const activePane = useIDEStore((state) => state.activePane);
  const setActivePane = useIDEStore((state) => state.setActivePane);

  return (
    <nav
      className="flex-shrink-0 flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
      style={{
        minHeight: '56px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePane === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActivePane(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
              'touch-manipulation select-none',
              isActive
                ? 'text-primary-500'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400'
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </div>
            <span
              className={cn(
                'text-[9px] font-medium uppercase tracking-wider',
                isActive ? 'text-primary-500' : ''
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
