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

const panes: { id: PaneId; label: string; icon: typeof Eye }[] = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'editor', label: 'Editor', icon: FileCode },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'deploy', label: 'Deployments', icon: Rocket },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export function PaneSwitcher() {
  const activePane = useIDEStore((state) => state.activePane);
  const setActivePane = useIDEStore((state) => state.setActivePane);

  return (
    <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-x-auto">
      {panes.map((pane) => {
        const Icon = pane.icon;
        const isActive = activePane === pane.id;

        return (
          <button
            key={pane.id}
            onClick={() => setActivePane(pane.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              'whitespace-nowrap',
              isActive
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {pane.label}
          </button>
        );
      })}
    </div>
  );
}
