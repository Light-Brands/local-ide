'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Eye,
  Heart,
  Brain,
  Wrench,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Cpu,
  HardDrive,
  Users,
  Gauge,
  RefreshCw,
  Shield,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline, StatCard, AnimatedNumber } from '@/components/dev/shared';

type AutodevTab = 'command' | 'sentinel' | 'pulse' | 'cortex' | 'genesis' | 'nexus';

const tabs: { id: AutodevTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'command', label: 'Command', icon: Command, color: 'from-violet-500 to-indigo-500' },
  { id: 'sentinel', label: 'Sentinel', icon: Eye, color: 'from-cyan-500 to-blue-500' },
  { id: 'pulse', label: 'Pulse', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'cortex', label: 'Cortex', icon: Brain, color: 'from-emerald-500 to-teal-500' },
  { id: 'genesis', label: 'Genesis', icon: Wrench, color: 'from-orange-500 to-amber-500' },
  { id: 'nexus', label: 'Nexus', icon: Settings, color: 'from-slate-500 to-zinc-500' },
];

// Demo data
const demoAlerts = [
  { id: '1', level: 'warning', title: 'High Memory Usage', message: 'Memory usage at 78%', time: '2 min ago' },
  { id: '2', level: 'info', title: 'Deployment Complete', message: 'v2.1.0 deployed successfully', time: '15 min ago' },
  { id: '3', level: 'critical', title: 'API Latency Spike', message: 'Response time >500ms', time: '1 hour ago' },
];

const demoRecommendations = [
  { id: '1', type: 'performance', title: 'Enable caching for API routes', impact: 'high', effort: 'low' },
  { id: '2', type: 'security', title: 'Update authentication tokens', impact: 'medium', effort: 'medium' },
  { id: '3', type: 'reliability', title: 'Add retry logic to external calls', impact: 'high', effort: 'medium' },
];

const demoMetrics = [
  { label: 'Response Time', value: '142ms', trend: [120, 135, 128, 145, 138, 142], status: 'good' },
  { label: 'Error Rate', value: '0.02%', trend: [0.05, 0.03, 0.02, 0.04, 0.02, 0.02], status: 'good' },
  { label: 'Memory Usage', value: '67%', trend: [55, 60, 63, 68, 70, 67], status: 'warning' },
  { label: 'CPU Load', value: '34%', trend: [40, 35, 38, 32, 36, 34], status: 'good' },
  { label: 'Active Sessions', value: '1,247', trend: [1100, 1150, 1200, 1180, 1220, 1247], status: 'good' },
  { label: 'API Latency', value: '89ms', trend: [95, 88, 92, 85, 90, 89], status: 'good' },
];

// =============================================================================
// Command Center Tab
// =============================================================================

function CommandCenter() {
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="System Health"
          value="94%"
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          label="Active Alerts"
          value="3"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
        <StatCard
          label="Recommendations"
          value="5"
          icon={<Zap className="w-5 h-5 text-violet-500" />}
        />
        <StatCard
          label="Auto-Healed Today"
          value="12"
          icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          color="primary"
        />
      </div>

      {/* System Pulse Bar */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">System Pulse</span>
          <span className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Healthy
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-8 rounded-sm transition-colors',
                i < 45 ? 'bg-emerald-500/80' : i < 47 ? 'bg-amber-500/80' : 'bg-neutral-200 dark:bg-neutral-800'
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
          <span>288 heartbeats today</span>
          <span>2 issues detected • 2 auto-resolved</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Active Alerts
          </h3>
          <div className="space-y-3">
            {demoAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-xl border-l-4',
                  alert.level === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  alert.level === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">{alert.title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{alert.message}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {demoRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">{rec.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium',
                        rec.impact === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      )}>
                        {rec.impact} impact
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                        {rec.effort} effort
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sentinel Tab
// =============================================================================

function SentinelDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {demoMetrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              'p-4 rounded-2xl border',
              'bg-white dark:bg-neutral-900',
              metric.status === 'warning'
                ? 'border-amber-200 dark:border-amber-900/50'
                : 'border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">{metric.label}</span>
              <span className={cn(
                'w-2 h-2 rounded-full',
                metric.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'
              )} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">{metric.value}</span>
              <Sparkline
                data={metric.trend}
                width={60}
                height={24}
                color={metric.status === 'good' ? '#10b981' : '#f59e0b'}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Error Stream */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Error Stream
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[
            { time: '10:32:15', message: '[WARN] Slow query detected: 245ms', type: 'warn' },
            { time: '10:31:42', message: '[INFO] Cache miss for user_preferences', type: 'info' },
            { time: '10:30:18', message: '[ERROR] Connection timeout to analytics', type: 'error' },
            { time: '10:29:55', message: '[INFO] Reconnected to analytics service', type: 'info' },
          ].map((log, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg font-mono text-xs',
                log.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                log.type === 'warn' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500'
              )}
            >
              <span className="text-neutral-400">{log.time}</span>
              <span className="flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Pulse Tab
// =============================================================================

function PulseDashboard() {
  const cycles = [
    { type: 'Heartbeat', interval: 'Every 5 min', status: 'active', lastRun: '2 min ago' },
    { type: 'Daily', interval: 'Daily @ 6 AM', status: 'idle', lastRun: '18 hours ago' },
    { type: 'Weekly', interval: 'Sundays', status: 'idle', lastRun: '3 days ago' },
    { type: 'Monthly', interval: '1st of month', status: 'idle', lastRun: '22 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cycles.map((cycle) => (
          <div
            key={cycle.type}
            className={cn(
              'p-4 rounded-2xl border',
              'bg-white dark:bg-neutral-900',
              cycle.status === 'active'
                ? 'border-emerald-200 dark:border-emerald-900/50'
                : 'border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{cycle.type}</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium',
                cycle.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              )}>
                {cycle.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{cycle.interval}</p>
            <p className="text-[10px] text-neutral-400 mt-2">Last: {cycle.lastRun}</p>
          </div>
        ))}
      </div>

      {/* Recent Digests */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Recent Digests
        </h3>
        <div className="space-y-3">
          {[
            { type: 'Daily', date: 'Jan 22, 2026', summary: 'All systems nominal. 3 optimizations applied.' },
            { type: 'Daily', date: 'Jan 21, 2026', summary: '1 warning resolved. Performance +12%.' },
            { type: 'Weekly', date: 'Jan 19, 2026', summary: 'Weekly review complete. 15 recommendations.' },
          ].map((digest, i) => (
            <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{digest.type} Digest</span>
                <span className="text-xs text-neutral-400">{digest.date}</span>
              </div>
              <p className="text-xs text-neutral-500">{digest.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Cortex Tab
// =============================================================================

function CortexDashboard() {
  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Analyzed" value="1,247" color="primary" />
        <StatCard label="Accepted" value="892" color="emerald" />
        <StatCard label="Rejected" value="45" color="red" />
        <StatCard label="Success Rate" value="95.2%" color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Patterns */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Detected Patterns
          </h3>
          <div className="space-y-3">
            {[
              { pattern: 'Peak traffic at 9-10 AM EST', confidence: 94 },
              { pattern: 'Memory spikes after batch jobs', confidence: 87 },
              { pattern: 'Faster response on weekends', confidence: 76 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.pattern}</span>
                <span className="text-xs font-medium text-emerald-600">{item.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Predictions */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Predictions
          </h3>
          <div className="space-y-3">
            {[
              { prediction: 'Traffic increase next Monday', probability: 89, timeframe: '3 days' },
              { prediction: 'Memory threshold reached', probability: 65, timeframe: '1 week' },
              { prediction: 'API upgrade recommended', probability: 78, timeframe: '2 weeks' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.prediction}</span>
                  <span className="text-xs text-neutral-400">{item.timeframe}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${item.probability}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-violet-600">{item.probability}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Genesis Tab
// =============================================================================

function GenesisDashboard() {
  const [autonomyLevel, setAutonomyLevel] = useState(50);

  const levels = [
    { value: 0, label: 'Manual', desc: 'All actions require approval' },
    { value: 25, label: 'Conservative', desc: 'Only safe actions auto-applied' },
    { value: 50, label: 'Balanced', desc: 'Most actions auto-applied' },
    { value: 75, label: 'Aggressive', desc: 'All non-critical auto-applied' },
    { value: 100, label: 'Full Auto', desc: 'Complete autonomous control' },
  ];

  const currentLevel = levels.reduce((prev, curr) =>
    Math.abs(curr.value - autonomyLevel) < Math.abs(prev.value - autonomyLevel) ? curr : prev
  );

  return (
    <div className="space-y-6">
      {/* Autonomy Dial */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Autonomy Level
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between mt-2">
              {levels.map((level) => (
                <div
                  key={level.value}
                  className={cn(
                    'text-[10px] font-medium',
                    autonomyLevel >= level.value ? 'text-primary-600' : 'text-neutral-400'
                  )}
                >
                  {level.label}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{autonomyLevel}%</div>
            <div className="text-xs text-neutral-500 mt-1">{currentLevel.desc}</div>
          </div>
        </div>
      </div>

      {/* Healing Rules */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Healing Rules
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Auto-restart on crash', level: 'L0', enabled: true, success: 98 },
            { name: 'Cache clear on memory spike', level: 'L1', enabled: true, success: 95 },
            { name: 'Scale on traffic surge', level: 'L2', enabled: false, success: 88 },
            { name: 'Rollback on error spike', level: 'L3', enabled: false, success: 100 },
          ].map((rule) => (
            <div
              key={rule.name}
              className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold',
                  rule.level === 'L0' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  rule.level === 'L1' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  rule.level === 'L2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  'bg-red-100 dark:bg-red-900/30 text-red-600'
                )}>
                  {rule.level}
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{rule.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">{rule.success}% success</span>
                <button
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors',
                    rule.enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow transition-transform',
                      rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Nexus Tab
// =============================================================================

function NexusDashboard() {
  const toggles = [
    { name: 'Sentinel', desc: 'Real-time monitoring', enabled: true, icon: Eye },
    { name: 'Pulse', desc: 'Periodic analysis', enabled: true, icon: Heart },
    { name: 'Cortex', desc: 'AI intelligence', enabled: true, icon: Brain },
    { name: 'Genesis', desc: 'Self-healing', enabled: false, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* System Toggles */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          System Modules
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {toggles.map((toggle) => {
            const Icon = toggle.icon;
            return (
              <div
                key={toggle.name}
                className={cn(
                  'p-4 rounded-xl border transition-colors',
                  toggle.enabled
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-5 h-5', toggle.enabled ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400')} />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{toggle.name}</span>
                  </div>
                  <button
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors',
                      toggle.enabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full bg-white shadow transition-transform',
                        toggle.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-neutral-500">{toggle.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Audit Trail
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[
            { actor: 'autodev', action: 'Cache cleared automatically', outcome: 'success', time: '10:32 AM' },
            { actor: 'user', action: 'Disabled Genesis module', outcome: 'success', time: '10:15 AM' },
            { actor: 'system', action: 'Daily digest generated', outcome: 'success', time: '6:00 AM' },
            { actor: 'autodev', action: 'Recommendation #42 applied', outcome: 'success', time: 'Yesterday' },
            { actor: 'autodev', action: 'Memory optimization failed', outcome: 'failure', time: 'Yesterday' },
          ].map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium',
                  entry.actor === 'autodev' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' :
                  entry.actor === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                )}>
                  {entry.actor}
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{entry.action}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[10px]',
                  entry.outcome === 'success' ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {entry.outcome === 'success' ? '✓' : '✗'}
                </span>
                <span className="text-xs text-neutral-400">{entry.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main AutoDev Page
// =============================================================================

export default function AutoDevPage() {
  const [activeTab, setActiveTab] = useState<AutodevTab>('command');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          AutoDev
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          AI-powered autonomous development operations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 min-w-[80px] flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-all',
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800'
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
          {activeTab === 'command' && <CommandCenter />}
          {activeTab === 'sentinel' && <SentinelDashboard />}
          {activeTab === 'pulse' && <PulseDashboard />}
          {activeTab === 'cortex' && <CortexDashboard />}
          {activeTab === 'genesis' && <GenesisDashboard />}
          {activeTab === 'nexus' && <NexusDashboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
