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
  ChevronLeft,
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
import { ProgressRing, StatusBadge, taskStatusConfig, typeIcons, StatCard } from '@/components/dev/shared';

type TabId = 'overview' | 'tasks' | 'tdd' | 'routes' | 'tooling' | 'architecture';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'tdd', label: 'TDD', icon: TestTube2 },
  { id: 'routes', label: 'Routes', icon: Plug },
  { id: 'tooling', label: 'Tooling', icon: Wrench },
  { id: 'architecture', label: 'Architecture', icon: Layers },
];

// =============================================================================
// Epic Card Component
// =============================================================================

function EpicCard({ epic, onClick }: { epic: EpicData; onClick?: () => void }) {
  const status = getEpicStatus(epic);
  const progress = getEpicProgress(epic);
  const counts = getEpicTaskCounts(epic);

  return (
    <motion.div
      whileHover={status !== 'blocked' ? { scale: 1.02 } : undefined}
      className={cn(
        'p-4 rounded-2xl border transition-all duration-300',
        'bg-white dark:bg-neutral-900',
        status === 'blocked'
          ? 'border-red-200 dark:border-red-900/50 opacity-75'
          : 'border-neutral-200/60 dark:border-neutral-800/60 cursor-pointer hover:shadow-lg'
      )}
      onClick={status !== 'blocked' ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {epic.epicId}
          </span>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            {epic.epicName}
          </h3>
          <span
            className={cn(
              'text-[10px] uppercase tracking-wider font-medium',
              epic.phase === 'Foundation' ? 'text-amber-500' : epic.phase === 'MVP' ? 'text-blue-500' : 'text-emerald-500'
            )}
          >
            {epic.phase}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-4 mb-3">
        <ProgressRing percentage={progress} size={64} strokeWidth={5} status={status} />
        <div className="flex-1">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="text-neutral-900 dark:text-white font-semibold">{counts.completed}</span>
            <span className="mx-1">/</span>
            <span>{counts.total} tasks</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
            <span className="text-amber-500">{counts.inProgress} in progress</span>
            <span className="text-neutral-400">{counts.pending} pending</span>
          </div>
        </div>
      </div>

      {epic.dependencies.length > 0 && status === 'blocked' && (
        <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <span className="text-[9px] text-red-500 uppercase tracking-wider font-medium">Blocked by:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {epic.dependencies.map((dep) => (
              <span key={dep} className="px-2 py-0.5 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overall Progress" value={`${progress.percentage.toFixed(1)}%`} color="primary" />
        <StatCard label="Epics Complete" value={completedEpics} color="emerald" />
        <StatCard label="In Progress" value={inProgressEpics} color="amber" />
        <StatCard label="Blocked" value={blockedEpics} color="red" />
      </div>

      {/* Dependency Graph */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Epic Dependencies</h3>
        <div className="text-center text-neutral-500 text-sm mb-4">
          Build Order: Foundation → Content → Analytics → Developer Tools
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {epicData.map((epic, idx) => {
            const status = getEpicStatus(epic);
            return (
              <div key={epic.epicId} className="flex items-center">
                <div
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border',
                    status === 'complete'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : status === 'in-progress'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                  )}
                >
                  {epic.epicName}
                </div>
                {idx < epicData.length - 1 && <span className="mx-2 text-neutral-300 dark:text-neutral-600">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Epic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {epicData.map((epic) => (
          <EpicCard key={epic.epicId} epic={epic} onClick={() => onEpicClick(epic.epicId)} />
        ))}
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
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              typeFilter === type
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
          >
            {type === 'all' ? 'All' : `${typeIcons[type]} ${type}`}
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
        <div key={groupKey}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
            {groupKey} <span className="text-neutral-300 dark:text-neutral-600">({groupTasks.length})</span>
          </h3>
          <div className="space-y-1">
            {groupTasks.map((task) => {
              const statusCfg = taskStatusConfig[task.status];
              const isExpanded = expandedTask === task.id;
              const canExpand = task.filePath || task.acceptanceCriteria?.length || task.relatedTests?.length;

              return (
                <div key={task.id}>
                  <div
                    onClick={() => canExpand && setExpandedTask(isExpanded ? null : task.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      'bg-white dark:bg-neutral-900',
                      task.status === 'complete' ? 'border-emerald-200 dark:border-emerald-900/50' :
                      task.status === 'blocked' ? 'border-red-200 dark:border-red-900/50' :
                      task.status === 'in-progress' ? 'border-amber-200 dark:border-amber-900/50' :
                      'border-neutral-200/60 dark:border-neutral-800/60',
                      canExpand && 'cursor-pointer hover:shadow-sm',
                      isExpanded && 'rounded-b-none'
                    )}
                  >
                    <span className={cn('text-lg', statusCfg.className)}>{statusCfg.icon}</span>
                    <span className="text-sm">{typeIcons[task.type]}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{task.name}</span>
                      {task.description && (
                        <span className="text-neutral-500 text-xs ml-2 hidden sm:inline">{task.description}</span>
                      )}
                    </div>
                    {canExpand && (
                      <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', isExpanded && 'rotate-180')} />
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-t-0 border-neutral-200/60 dark:border-neutral-800/60 rounded-b-xl space-y-3">
                          {task.filePath && (
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">File Path</span>
                              <div className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{task.filePath}</div>
                            </div>
                          )}
                          {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Acceptance Criteria</span>
                              <ul className="mt-1 space-y-1">
                                {task.acceptanceCriteria.map((criteria, i) => (
                                  <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex gap-2">
                                    <span className="text-primary-500">•</span> {criteria}
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
      {/* Coverage Thresholds */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Coverage Thresholds</h3>
        <div className="space-y-4">
          {coverage.map((data) => {
            const isPassing = data.current >= data.threshold;
            return (
              <div key={data.layer} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">{data.layer}</span>
                  <span className={isPassing ? 'text-emerald-600 font-medium' : 'text-neutral-400'}>
                    {data.current}% <span className="text-neutral-300 dark:text-neutral-600">/ {data.threshold}%</span>
                  </span>
                </div>
                <div className="relative h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 z-10"
                    style={{ left: `${data.threshold}%` }}
                  />
                  <div
                    className={cn('h-full rounded-full transition-all', isPassing ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600')}
                    style={{ width: `${Math.min(data.current, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TDD Cycle */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">TDD Cycle</h3>
        <div className="flex items-center justify-between gap-4">
          {[
            { phase: 'Red', desc: 'Write failing tests', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400' },
            { phase: 'Green', desc: 'Make tests pass', color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
            { phase: 'Refactor', desc: 'Clean up code', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400' },
          ].map((p, idx) => (
            <div key={p.phase} className="flex items-center flex-1">
              <div className={cn('flex-1 p-4 rounded-xl border-2 text-center', p.color)}>
                <div className="text-lg font-bold">{p.phase}</div>
                <div className="text-[10px] opacity-70">{p.desc}</div>
              </div>
              {idx < 2 && <span className="mx-2 text-neutral-300 dark:text-neutral-600">→</span>}
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
    POST: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    PUT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    PATCH: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  };

  return (
    <div className="space-y-6">
      {/* Epic Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEpicFilter(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            !epicFilter
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
          )}
        >
          All Epics
        </button>
        {epicData.map((epic) => (
          <button
            key={epic.epicId}
            onClick={() => setEpicFilter(epic.epicId)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              epicFilter === epic.epicId
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
            )}
          >
            {epic.epicId}
          </button>
        ))}
      </div>

      {/* Routes Summary */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{filteredRoutes.length}</div>
        <div className="text-xs text-neutral-500 uppercase tracking-wider">API Routes</div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-emerald-600">GET: {filteredRoutes.filter(r => r.method === 'GET').length}</span>
          <span className="text-amber-600">POST: {filteredRoutes.filter(r => r.method === 'POST').length}</span>
          <span className="text-blue-600">PUT: {filteredRoutes.filter(r => r.method === 'PUT').length}</span>
          <span className="text-red-600">DELETE: {filteredRoutes.filter(r => r.method === 'DELETE').length}</span>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-2">
        {filteredRoutes.map((route, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60"
          >
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', methodColors[route.method])}>
              {route.method}
            </span>
            <span className="text-sm font-mono text-neutral-900 dark:text-white flex-1">{route.path}</span>
            {route.auth && <span className="text-[10px] text-amber-500">🔒 Auth</span>}
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
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Available Commands</h3>
        <div className="space-y-3">
          {toolingCommands.map((cmd) => (
            <div key={cmd.name} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-primary-600 dark:text-primary-400 font-mono text-sm font-medium">{cmd.name}</span>
                <span className="text-neutral-500 text-sm flex-1">{cmd.description}</span>
              </div>
              <div className="text-xs text-neutral-400 font-mono mt-1">{cmd.usage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">AI Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toolingAgents.map((agent) => (
            <div key={agent.name} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{agent.name}</div>
              <div className="text-xs text-amber-600 uppercase mb-2">{agent.specialization}</div>
              <div className="text-sm text-neutral-500">{agent.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.map((cap, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Coding Rules</h3>
        <div className="space-y-2">
          {toolingRules.map((rule) => (
            <div key={rule.name} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <span className={cn('w-2 h-2 rounded-full', rule.alwaysApply ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300')} />
              <span className="text-sm font-mono text-neutral-900 dark:text-white">{rule.name}</span>
              <span className="text-xs text-neutral-400 flex-1">{rule.description}</span>
              {rule.alwaysApply && <span className="text-[10px] text-emerald-500 uppercase">Always Active</span>}
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
  return (
    <div className="space-y-6">
      {/* System Architecture */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">System Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-blue-700 dark:text-blue-400 font-semibold mb-2">Frontend</div>
            <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Next.js 16 (App Router)</li>
              <li>• React 19</li>
              <li>• Tailwind CSS 4</li>
              <li>• Framer Motion</li>
            </ul>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="text-emerald-700 dark:text-emerald-400 font-semibold mb-2">Backend</div>
            <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Supabase (PostgreSQL)</li>
              <li>• Row Level Security</li>
              <li>• Supabase Auth</li>
              <li>• Supabase Storage</li>
            </ul>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
            <div className="text-violet-700 dark:text-violet-400 font-semibold mb-2">AI Services</div>
            <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Claude Code Assistant</li>
              <li>• AutoDev Operations</li>
              <li>• Context Aggregation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Flow */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Data Flow</h3>
        <div className="flex items-center justify-between gap-2">
          {['Browser', 'React UI', 'API Routes', 'Services', 'Supabase'].map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex-1 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">{step}</div>
              </div>
              {idx < 4 && <span className="mx-2 text-neutral-300 dark:text-neutral-600">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Tracker Page
// =============================================================================

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Dev Tracker
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Development Progress & Architecture
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedEpic(null); }}
              className={cn(
                'flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
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
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  All Tasks
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
    </div>
  );
}
