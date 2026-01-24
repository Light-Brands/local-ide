'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  ListTodo,
  TestTube2,
  Plug,
  Wrench,
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  epicData,
  routeData,
  toolingCommands,
  toolingAgents,
  toolingRules,
  getEpicStatus,
  getEpicProgress,
  getEpicTaskCounts,
  getAllTasks,
  getTotalProgress,
  type EpicData,
  type TrackerTask,
  type TaskType,
  type TaskStatus,
} from '@/data/dev/trackerData';
import { typeIcons } from '@/components/dev/shared';

// Animation config
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

type TabId = 'overview' | 'tasks' | 'tdd' | 'routes' | 'tooling' | 'architecture';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'tdd', label: 'TDD', icon: TestTube2 },
  { id: 'routes', label: 'Routes', icon: Plug },
  { id: 'tooling', label: 'Tooling', icon: Wrench },
  { id: 'architecture', label: 'Architecture', icon: Layers },
];

// Task type icons imported from shared components

// Status config
const taskStatusConfig: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  pending: { icon: Circle, color: 'text-neutral-400' },
  'in-progress': { icon: Clock, color: 'text-amber-500' },
  complete: { icon: CheckCircle2, color: 'text-emerald-500' },
  blocked: { icon: AlertCircle, color: 'text-red-500' },
};

// =============================================================================
// Overview Tab
// =============================================================================

function OverviewTab({ onEpicClick }: { onEpicClick: (epicId: string) => void }) {
  const progress = getTotalProgress();
  const completedEpics = epicData.filter(e => getEpicStatus(e) === 'complete').length;
  const inProgressEpics = epicData.filter(e => getEpicStatus(e) === 'in-progress').length;
  const blockedEpics = epicData.filter(e => getEpicStatus(e) === 'blocked').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'PROGRESS', value: `${progress.percentage.toFixed(0)}%`, color: 'text-primary' },
          { label: 'COMPLETE', value: completedEpics, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'IN_PROGRESS', value: inProgressEpics, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'BLOCKED', value: blockedEpics, color: 'text-red-600 dark:text-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl border',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            <div className={cn('text-2xl font-bold font-mono tabular-nums', stat.color)}>{stat.value}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Build Order */}
      <div className={cn(
        'p-5 rounded-xl border',
        'bg-white dark:bg-neutral-900',
        'border-neutral-200/60 dark:border-neutral-800/60'
      )}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            BUILD_ORDER
          </h3>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {epicData.map((epic, idx) => {
            const status = getEpicStatus(epic);
            return (
              <div key={epic.epicId} className="flex items-center">
                <button
                  onClick={() => status !== 'blocked' && onEpicClick(epic.epicId)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    status === 'complete' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                    status === 'in-progress' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                    status === 'blocked' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed',
                    status === 'not-started' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
                    status !== 'blocked' && 'hover:scale-105 cursor-pointer'
                  )}
                >
                  {epic.epicName}
                </button>
                {idx < epicData.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Epic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {epicData.map((epic) => {
          const status = getEpicStatus(epic);
          const epicProgress = getEpicProgress(epic);
          const counts = getEpicTaskCounts(epic);

          return (
              <motion.button
              key={epic.epicId}
              onClick={() => status !== 'blocked' && onEpicClick(epic.epicId)}
              whileHover={status !== 'blocked' ? { y: -2 } : undefined}
              className={cn(
                'text-left p-5 rounded-xl border transition-all',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60',
                status !== 'blocked' && 'hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer',
                status === 'blocked' && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  {epic.epicId}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono',
                    status === 'complete' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                    status === 'in-progress' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                    status === 'blocked' && 'bg-red-100 dark:bg-red-900/30 text-red-500',
                    status === 'not-started' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  )}
                >
                  {status.replace('-', '_')}
                </span>
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 font-mono text-sm">
                {epic.epicName}
              </h3>
              <p className="text-xs text-neutral-500 mb-4 font-mono">{epic.phase}</p>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="4" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      className={cn(
                        status === 'complete' && 'stroke-emerald-500',
                        status === 'in-progress' && 'stroke-amber-500',
                        status === 'blocked' && 'stroke-red-400',
                        status === 'not-started' && 'stroke-neutral-300'
                      )}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${epicProgress * 1.257} 125.7`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-900 dark:text-white">
                    {Math.round(epicProgress)}%
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-neutral-900 dark:text-white font-medium font-mono tabular-nums">
                    {counts.completed}/{counts.total} TASKS
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    {counts.inProgress} IN_PROGRESS
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Tasks Tab
// =============================================================================

function TasksTab({ filter }: { filter?: string }) {
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const tasks = useMemo(() => {
    let result = getAllTasks();
    if (filter) result = result.filter(t => t.epic === filter);
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
    return result;
  }, [filter, typeFilter]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TrackerTask[]> = {};
    for (const task of tasks) {
      const key = `${task.epic}/${task.category}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return groups;
  }, [tasks]);

  const types: (TaskType | 'all')[] = ['all', 'table', 'endpoint', 'service', 'component', 'test', 'config'];

  return (
    <div className="space-y-6">
      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mt-6">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border font-mono uppercase',
              typeFilter === type
                ? 'bg-primary text-primary-foreground border-primary'
                : cn(
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60',
                    'text-neutral-600 dark:text-neutral-400',
                    'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    'hover:border-primary/30 dark:hover:border-primary/30'
                  )
            )}
          >
            {type === 'all' ? (
              'All'
            ) : (
              <>
                {typeIcons[type] && (() => {
                  const Icon = typeIcons[type];
                  return <Icon className="w-3 h-3 inline mr-1.5" />;
                })()}
                <span>{type}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
          <div key={groupKey}>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              {groupKey}
              <span className="text-neutral-400">({groupTasks.length})</span>
            </h3>
            <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden bg-white dark:bg-neutral-900">
              {groupTasks.map((task, idx) => {
                const StatusIcon = taskStatusConfig[task.status].icon;
                const isExpanded = expandedTask === task.id;
                const canExpand = task.filePath || task.acceptanceCriteria?.length || task.relatedTests?.length;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      idx !== groupTasks.length - 1 && 'border-b border-neutral-100 dark:border-neutral-800'
                    )}
                  >
                    <button
                      onClick={() => canExpand && setExpandedTask(isExpanded ? null : task.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 text-left transition-colors',
                        canExpand && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer',
                        !canExpand && 'cursor-default'
                      )}
                    >
                      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', taskStatusConfig[task.status].color)} />
                      {typeIcons[task.type] && (() => {
                        const TypeIcon = typeIcons[task.type];
                        return <TypeIcon className="w-4 h-4 flex-shrink-0 text-neutral-400 dark:text-neutral-500" />;
                      })()}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {task.name}
                        </span>
                        {task.description && (
                          <span className="text-neutral-500 text-xs ml-2 hidden sm:inline">
                            {task.description}
                          </span>
                        )}
                      </div>
                      {canExpand && (
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-neutral-400 transition-transform flex-shrink-0',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 ml-11">
                            {task.filePath && (
                              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                                  File Path
                                </span>
                                <code className="text-xs text-neutral-700 dark:text-neutral-300">
                                  {task.filePath}
                                </code>
                              </div>
                            )}
                            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">
                                  Acceptance Criteria
                                </span>
                                <ul className="space-y-1">
                                  {task.acceptanceCriteria.map((criteria, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex gap-2">
                                      <span className="text-emerald-500">•</span>
                                      {criteria}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TDD Tab
// =============================================================================

function TDDTab() {
  const coverage = [
    { layer: 'Service Layer', current: 0, threshold: 90 },
    { layer: 'API Routes', current: 0, threshold: 85 },
    { layer: 'Components', current: 0, threshold: 75 },
    { layer: 'Utils & Helpers', current: 0, threshold: 95 },
  ];

  return (
    <div className="space-y-6">
      {/* Coverage */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-5">
          Coverage Thresholds
        </h3>
        <div className="space-y-5">
          {coverage.map((data) => (
            <div key={data.layer}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">{data.layer}</span>
                <span className="text-neutral-500">
                  <span className="font-medium text-neutral-900 dark:text-white">{data.current}%</span>
                  <span className="text-neutral-400"> / {data.threshold}%</span>
                </span>
              </div>
              <div className="relative h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 z-10"
                  style={{ left: `${data.threshold}%` }}
                />
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    data.current >= data.threshold ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                  style={{ width: `${Math.min(data.current, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TDD Cycle */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-5">
          TDD Cycle
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { phase: 'Red', desc: 'Write failing tests', color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
            { phase: 'Green', desc: 'Make tests pass', color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
            { phase: 'Refactor', desc: 'Clean up code', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
          ].map((p, idx) => (
            <div key={p.phase} className="relative">
              <div className={cn('p-4 rounded-xl border text-center', p.color)}>
                <div className="text-lg font-bold">{p.phase}</div>
                <div className="text-[10px] mt-1 opacity-80">{p.desc}</div>
              </div>
              {idx < 2 && (
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 text-neutral-300 dark:text-neutral-600 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Routes Tab
// =============================================================================

function RoutesTab() {
  const [epicFilter, setEpicFilter] = useState<string | null>(null);
  const filteredRoutes = epicFilter ? routeData.filter(r => r.epic === epicFilter) : routeData;

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    POST: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PUT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    PATCH: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };

  return (
    <div className="space-y-6">
      {/* Epic Filter */}
      <div className="flex flex-wrap gap-2 mt-6">
        <button
          onClick={() => setEpicFilter(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            !epicFilter
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          )}
        >
          All
        </button>
        {epicData.map((epic) => (
          <button
            key={epic.epicId}
            onClick={() => setEpicFilter(epic.epicId)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              epicFilter === epic.epicId
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            )}
          >
            {epic.epicId}
          </button>
        ))}
      </div>

      {/* Routes Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 col-span-2 md:col-span-1">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">{filteredRoutes.length}</div>
          <div className="text-xs text-neutral-500">Total Routes</div>
        </div>
        {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
          <div key={method} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
            <div className="text-xl font-bold text-neutral-900 dark:text-white">
              {filteredRoutes.filter(r => r.method === method).length}
            </div>
            <div className="text-xs text-neutral-500">{method}</div>
          </div>
        ))}
      </div>

      {/* Routes List */}
      <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden bg-white dark:bg-neutral-900">
        {filteredRoutes.map((route, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center gap-3 p-4',
              idx !== filteredRoutes.length - 1 && 'border-b border-neutral-100 dark:border-neutral-800'
            )}
          >
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', methodColors[route.method])}>
              {route.method}
            </span>
            <code className="text-sm font-mono text-neutral-900 dark:text-white flex-1">{route.path}</code>
            {route.auth && (
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                🔒
              </span>
            )}
            <span className="text-xs text-neutral-400 hidden sm:block">{route.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Tooling Tab
// =============================================================================

function ToolingTab() {
  return (
    <div className="space-y-6">
      {/* Commands */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Commands
        </h3>
        <div className="space-y-3">
          {toolingCommands.map((cmd) => (
            <div key={cmd.name} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3 mb-1">
                <code className="text-sm font-medium text-primary">{cmd.name}</code>
                <span className="text-xs text-neutral-500">{cmd.description}</span>
              </div>
              <code className="text-xs text-neutral-400 font-mono">{cmd.usage}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          AI Agents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toolingAgents.map((agent) => (
            <div key={agent.name} className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">{agent.name}</div>
              <div className="text-[10px] text-primary uppercase tracking-wider mb-2">{agent.specialization}</div>
              <div className="text-xs text-neutral-500 mb-3">{agent.description}</div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((cap, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Coding Rules
        </h3>
        <div className="space-y-2">
          {toolingRules.map((rule) => (
            <div key={rule.name} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', rule.alwaysApply ? 'bg-emerald-500' : 'bg-neutral-300')} />
              <code className="text-sm font-mono text-neutral-900 dark:text-white">{rule.name}</code>
              <span className="text-xs text-neutral-400 flex-1">{rule.description}</span>
              {rule.alwaysApply && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Active</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Architecture Tab
// =============================================================================

function ArchitectureTab() {
  const layers = [
    { name: 'Frontend', items: ['Next.js 16 (App Router)', 'React 19', 'Tailwind CSS 4', 'Framer Motion'] },
    { name: 'Backend', items: ['Supabase (PostgreSQL)', 'Row Level Security', 'Supabase Auth', 'Supabase Storage'] },
    { name: 'AI Services', items: ['Claude Code Assistant', 'AutoDev Operations', 'Context Aggregation'] },
  ];

  return (
    <div className="space-y-6">
      {/* Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">{layer.name}</h3>
            <ul className="space-y-2">
              {layer.items.map((item) => (
                <li key={item} className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Data Flow */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Data Flow
        </h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {['Browser', 'React UI', 'API Routes', 'Services', 'Supabase'].map((step, idx) => (
            <div key={step} className="flex items-center min-w-0">
              <div className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center whitespace-nowrap">
                {step}
              </div>
              {idx < 4 && (
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono">
            TRACKER
          </h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 ml-4 text-sm font-mono">
          [PROGRESS_MONITOR] Development operations
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedEpic(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border relative',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : cn(
                      'bg-white dark:bg-neutral-900',
                      'border-neutral-200/60 dark:border-neutral-800/60',
                      'text-neutral-600 dark:text-neutral-400',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                      'hover:border-primary/30 dark:hover:border-primary/30'
                    ),
                'font-mono uppercase'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (selectedEpic || '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              onEpicClick={(epicId) => {
                setSelectedEpic(epicId);
                setActiveTab('tasks');
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {selectedEpic && (
                <button
                  onClick={() => setSelectedEpic(null)}
                  className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                >
                  ← All Tasks
                </button>
              )}
              <TasksTab filter={selectedEpic || undefined} />
            </div>
          )}

          {activeTab === 'tdd' && <TDDTab />}
          {activeTab === 'routes' && <RoutesTab />}
          {activeTab === 'tooling' && <ToolingTab />}
          {activeTab === 'architecture' && <ArchitectureTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
