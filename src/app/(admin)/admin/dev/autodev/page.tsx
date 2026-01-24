'use client';

import { useState, useMemo } from 'react';
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
  TrendingUp,
  TrendingDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColors, colors, gradients } from '@/lib/design/tokens';

// Animation config
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } 
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardHover = {
  scale: 1.02,
};

type AutodevTab = 'command' | 'sentinel' | 'pulse' | 'cortex' | 'genesis' | 'nexus';

const tabs: { id: AutodevTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'command', label: 'Command', icon: Command, desc: 'Control center' },
  { id: 'sentinel', label: 'Sentinel', icon: Eye, desc: 'Monitoring' },
  { id: 'pulse', label: 'Pulse', icon: Heart, desc: 'Health checks' },
  { id: 'cortex', label: 'Cortex', icon: Brain, desc: 'AI insights' },
  { id: 'genesis', label: 'Genesis', icon: Wrench, desc: 'Self-healing' },
  { id: 'nexus', label: 'Nexus', icon: Settings, desc: 'Configuration' },
];

// Demo data
const demoAlerts = [
  { id: '1', level: 'warning', title: 'High Memory Usage', message: 'Memory usage at 78%', time: '2m ago' },
  { id: '2', level: 'info', title: 'Deployment Complete', message: 'v2.1.0 deployed successfully', time: '15m ago' },
  { id: '3', level: 'critical', title: 'API Latency Spike', message: 'Response time >500ms', time: '1h ago' },
];

const demoRecommendations = [
  { id: '1', title: 'Enable caching for API routes', impact: 'high', effort: 'low' },
  { id: '2', title: 'Update authentication tokens', impact: 'medium', effort: 'medium' },
  { id: '3', title: 'Add retry logic to external calls', impact: 'high', effort: 'medium' },
];

const demoMetrics = [
  { label: 'Response Time', value: '142ms', trend: 'down', change: '-12%' },
  { label: 'Error Rate', value: '0.02%', trend: 'down', change: '-8%' },
  { label: 'Memory Usage', value: '67%', trend: 'up', change: '+5%' },
  { label: 'CPU Load', value: '34%', trend: 'down', change: '-3%' },
  { label: 'Active Sessions', value: '1,247', trend: 'up', change: '+18%' },
  { label: 'API Latency', value: '89ms', trend: 'down', change: '-6%' },
];

// =============================================================================
// Command Center Tab
// =============================================================================

function CommandCenter() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SYSTEM_HEALTH', value: '94%', icon: Activity, color: colors.success.text },
          { label: 'ACTIVE_ALERTS', value: '3', icon: AlertTriangle, color: colors.warning.text },
          { label: 'RECOMMENDATIONS', value: '5', icon: Zap, color: colors.primary.text },
          { label: 'AUTO_HEALED', value: '12', icon: CheckCircle2, color: colors.success.text },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={cardHover}
              className={cn(
                'p-5 rounded-xl border transition-all relative overflow-hidden group',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60',
                'hover:border-primary/40 dark:hover:border-primary/40',
                'hover:shadow-md hover:shadow-primary/5'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    stat.color === colors.success.text && 'bg-success/10',
                    stat.color === colors.warning.text && 'bg-warning/10',
                    stat.color === colors.primary.text && 'bg-primary/10'
                  )}>
                    <Icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                </div>
                <div className={cn('text-3xl font-bold font-mono tabular-nums mb-1', stat.color)}>{stat.value}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Pulse */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={cn(
          'p-6 rounded-xl border relative overflow-hidden',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60',
          'shadow-sm'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-primary rounded-full shadow-sm shadow-primary/50" />
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                SYSTEM_PULSE
              </h3>
            </div>
            <div className={cn('flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-success/10', colors.success.text)}>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn('w-2 h-2 rounded-full', colors.success.solid)}
              />
              <span className="text-xs font-mono font-medium">HEALTHY</span>
            </div>
          </div>
          <div className="flex items-end gap-0.5 h-16 mb-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg p-2">
            {useMemo(() => {
              // Generate consistent bar heights with smooth wave pattern
              const heights = Array.from({ length: 48 }, (_, i) => {
                // Create a wave pattern with some variation
                const wave = Math.sin(i / 6) * 20;
                const variation = (i % 4) * 3;
                const baseHeight = 40 + wave + variation;
                return Math.max(18, Math.min(98, baseHeight));
              });
              return heights;
            }, []).map((height, i) => {
              const isRecent = i >= 44;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ delay: i * 0.01, duration: 0.3 }}
                  className={cn(
                    'flex-1 rounded-sm transition-all min-h-[2px] shadow-sm',
                    isRecent 
                      ? 'bg-gradient-to-t from-success to-success/60 shadow-sm shadow-success/20' 
                      : 'bg-neutral-300/60 dark:bg-neutral-700/60'
                  )}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span className="font-medium">288 HEARTBEATS</span>
            <span className="flex items-center gap-2">
              <span className="text-warning">2 ISSUES</span>
              <span className="text-neutral-400">•</span>
              <span className="text-success">2 AUTO_RESOLVED</span>
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Active Alerts
            </h3>
          </div>
          <div className="space-y-3">
            {demoAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={cn(
                  'p-4 rounded-lg border-l-4 transition-all group',
                  'hover:shadow-sm hover:scale-[1.01]',
                  alert.level === 'critical' && cn(colors.error.bg, colors.error.border, 'hover:border-error/60'),
                  alert.level === 'warning' && cn(colors.warning.bg, colors.warning.border, 'hover:border-warning/60'),
                  alert.level === 'info' && cn('bg-primary/10 dark:bg-primary/20 border-primary', 'hover:border-primary/60')
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.level === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-error" />}
                      {alert.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{alert.message}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono whitespace-nowrap">{alert.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              AI Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {demoRecommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{rec.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                        rec.impact === 'high' && cn(colors.success.bg, colors.success.text),
                        rec.impact === 'medium' && cn(colors.warning.bg, colors.warning.text)
                      )}>
                        {rec.impact} impact
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        {rec.effort} effort
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm',
                      colors.primary.text,
                      colors.primary.bg,
                      'hover:shadow-md hover:shadow-primary/20'
                    )}
                  >
                    Apply
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {demoMetrics.map((metric, index) => {
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          const trendColor = metric.label === 'Memory Usage'
            ? (metric.trend === 'up' ? colors.warning.text : colors.success.text)
            : (metric.trend === 'down' ? colors.success.text : colors.warning.text);

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={cardHover}
              className={cn(
                'p-6 rounded-xl border transition-all relative overflow-hidden group',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60',
                'hover:border-primary/40 dark:hover:border-primary/40',
                'hover:shadow-lg hover:shadow-primary/10'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono font-semibold">{metric.label}</span>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold',
                    trendColor,
                    trendColor === colors.success.text && 'bg-success/10',
                    trendColor === colors.warning.text && 'bg-warning/10'
                  )}>
                    <TrendIcon className="w-4 h-4" />
                    {metric.change}
                  </div>
                </div>
                <div className="text-4xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mb-6">{metric.value}</div>
                {/* Enhanced bar chart */}
                <div className="flex items-end gap-1 h-24 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200/50 dark:border-neutral-700/50">
                  {useMemo(() => {
                    // Generate consistent bar heights based on metric index for variety
                    const baseVariation = index % 3;
                    return Array.from({ length: 20 }, (_, i) => {
                      // Create varied patterns per metric with smooth transitions
                      const pattern = (i + baseVariation * 7) % 5;
                      const wave = Math.sin(i / 3) * 8;
                      const baseHeight = 35 + pattern * 10 + wave + (i % 3) * 3;
                      return Math.max(25, Math.min(98, baseHeight));
                    });
                  }, [index]).map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${height}%`, opacity: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={cn('flex-1 rounded-sm min-h-[4px] shadow-sm', gradients.primary)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error Stream */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            Error Stream
          </h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[
            { time: '10:32:15', message: '[WARN] Slow query detected: 245ms', type: 'warn' },
            { time: '10:31:42', message: '[INFO] Cache miss for user_preferences', type: 'info' },
            { time: '10:30:18', message: '[ERROR] Connection timeout to analytics', type: 'error' },
            { time: '10:29:55', message: '[INFO] Reconnected to analytics service', type: 'info' },
          ].map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg font-mono text-xs border transition-all',
                'hover:shadow-sm hover:scale-[1.01]',
                log.type === 'error' && cn(colors.error.bg, colors.error.border, 'border-error/30'),
                log.type === 'warn' && cn(colors.warning.bg, colors.warning.border, 'border-warning/30'),
                log.type === 'info' && 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/50 dark:border-neutral-700/50'
              )}
            >
              <span className="text-neutral-400 dark:text-neutral-500 font-medium">{log.time}</span>
              <span className={cn(
                'font-medium',
                log.type === 'error' && colors.error.text,
                log.type === 'warn' && colors.warning.text,
                log.type === 'info' && 'text-neutral-500 dark:text-neutral-400'
              )}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Pulse Tab
// =============================================================================

function PulseDashboard() {
  const cycles = [
    { type: 'Heartbeat', interval: 'Every 5 min', status: 'active', lastRun: '2m ago' },
    { type: 'Daily', interval: 'Daily @ 6 AM', status: 'idle', lastRun: '18h ago' },
    { type: 'Weekly', interval: 'Sundays', status: 'idle', lastRun: '3 days ago' },
    { type: 'Monthly', interval: '1st of month', status: 'idle', lastRun: '22 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cycles.map((cycle, index) => (
          <motion.div
            key={cycle.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={cardHover}
            className={cn(
              'p-5 rounded-xl border transition-all relative overflow-hidden group',
              'bg-white dark:bg-neutral-900',
              cycle.status === 'active'
                ? cn(colors.success.border, 'border-success/50 shadow-sm shadow-success/10')
                : 'border-neutral-200/60 dark:border-neutral-800/60',
              'hover:shadow-md hover:shadow-primary/5'
            )}
          >
            {cycle.status === 'active' && (
              <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/5" />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">{cycle.type}</span>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                  cycle.status === 'active'
                    ? cn(colors.success.bg, colors.success.text, 'shadow-sm shadow-success/20')
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                )}>
                  {cycle.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{cycle.interval}</p>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Last: {cycle.lastRun}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Digests */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            Recent Digests
          </h3>
        </div>
        <div className="space-y-3">
          {[
            { type: 'Daily', date: 'Jan 22, 2026', summary: 'All systems nominal. 3 optimizations applied.' },
            { type: 'Daily', date: 'Jan 21, 2026', summary: '1 warning resolved. Performance +12%.' },
            { type: 'Weekly', date: 'Jan 19, 2026', summary: 'Weekly review complete. 15 recommendations.' },
          ].map((digest, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    digest.type === 'Daily' ? 'bg-primary' : 'bg-warning'
                  )} />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">{digest.type} Digest</span>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{digest.date}</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{digest.summary}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
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
          {[
            { label: 'Analyzed', value: '1,247', color: 'text-neutral-900 dark:text-white', icon: Brain },
            { label: 'Accepted', value: '892', color: colors.success.text, icon: CheckCircle2 },
            { label: 'Rejected', value: '45', color: colors.error.text, icon: X },
            { label: 'Success Rate', value: '95.2%', color: colors.primary.text, icon: TrendingUp },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={cardHover}
                className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 hover:shadow-md hover:shadow-primary/5 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      stat.color === colors.success.text && 'bg-success/10',
                      stat.color === colors.error.text && 'bg-error/10',
                      stat.color === colors.primary.text && 'bg-primary/10',
                      stat.color === 'text-neutral-900 dark:text-white' && 'bg-neutral-100 dark:bg-neutral-800'
                    )}>
                      <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                    </div>
                  </div>
                  <div className={cn('text-3xl font-bold font-mono tabular-nums mb-1', stat.color)}>{stat.value}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patterns */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Detected Patterns
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { pattern: 'Peak traffic at 9-10 AM EST', confidence: 94 },
              { pattern: 'Memory spikes after batch jobs', confidence: 87 },
              { pattern: 'Faster response on weekends', confidence: 76 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary/30 transition-all group"
              >
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1">{item.pattern}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.confidence}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      className={cn('h-full rounded-full', gradients.primary)}
                    />
                  </div>
                  <span className={cn('text-xs font-semibold font-mono w-10 text-right', colors.primary.text)}>{item.confidence}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Predictions
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { prediction: 'Traffic increase next Monday', probability: 89, timeframe: '3 days' },
              { prediction: 'Memory threshold reached', probability: 65, timeframe: '1 week' },
              { prediction: 'API upgrade recommended', probability: 78, timeframe: '2 weeks' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1">{item.prediction}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">{item.timeframe}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.probability}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      className={cn('h-full rounded-full', gradients.primary)}
                    />
                  </div>
                  <span className={cn('text-xs font-semibold font-mono w-10 text-right', colors.primary.text)}>{item.probability}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// Genesis Tab - Optimized Spacecraft Design
// =============================================================================

function GenesisDashboard() {
  const [autonomyLevel, setAutonomyLevel] = useState(50);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const levels = [
    { value: 0, label: 'MANUAL', color: 'text-neutral-400', desc: 'Full manual control' },
    { value: 25, label: 'CONSERVATIVE', color: colors.warning.text, desc: 'Safe, cautious healing' },
    { value: 50, label: 'BALANCED', color: colors.primary.text, desc: 'Recommended default' },
    { value: 75, label: 'AGGRESSIVE', color: colors.success.text, desc: 'Proactive healing' },
    { value: 100, label: 'FULL_AUTO', color: colors.success.text, desc: 'Maximum autonomy' },
  ];

  const currentLevel = levels.reduce((prev, curr) =>
    Math.abs(curr.value - autonomyLevel) < Math.abs(prev.value - autonomyLevel) ? curr : prev
  );

  return (
    <div className="space-y-6">
      {/* Autonomy Level - Compact Spacecraft Design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={cn(
          'p-8 rounded-2xl border relative overflow-hidden',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60',
          'shadow-lg'
        )}
      >
        {/* Futuristic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full shadow-lg shadow-primary/50" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                AUTONOMY_LEVEL
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                System self-healing capability
              </p>
            </div>
          </div>

          {/* Main Control Area - Side-by-side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
            {/* Circular Progress Indicator - Compact */}
            <div className="relative w-48 h-48 flex-shrink-0 mx-auto lg:mx-0">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
                animate={{
                  scale: [1, 1.03, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="56"
                  fill="none"
                  className="stroke-primary/20"
                  strokeWidth="2"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  className="stroke-neutral-200 dark:stroke-neutral-800"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: autonomyLevel / 100 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    strokeDasharray: '326.73',
                    strokeDashoffset: '0',
                    filter: 'drop-shadow(0 0 8px rgba(var(--primary), 0.5))',
                  }}
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  className="stroke-primary/10"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <motion.div
                  key={autonomyLevel}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn('text-5xl font-bold font-mono tabular-nums mb-2', colors.primary.text)}
                >
                  {autonomyLevel}%
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider',
                    currentLevel.color,
                    currentLevel.color === colors.primary.text && 'bg-primary/10 border border-primary/20',
                    currentLevel.color === colors.warning.text && 'bg-warning/10 border border-warning/20',
                    currentLevel.color === colors.success.text && 'bg-success/10 border border-success/20'
                  )}
                >
                  {currentLevel.label}
                </motion.div>
              </div>
            </div>

            {/* Controls Section - Compact */}
            <div className="space-y-6">
              {/* Level Presets - Compact Horizontal */}
              <div>
                <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono mb-3">
                  QUICK_PRESETS
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {levels.map((level) => {
                    const isActive = autonomyLevel === level.value;
                    const isHovered = hoveredLevel === level.value;
                    return (
                      <motion.button
                        key={level.value}
                        onMouseEnter={() => setHoveredLevel(level.value)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAutonomyLevel(level.value)}
                        className={cn(
                          'p-3 rounded-lg border transition-all relative overflow-hidden group',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                          isActive
                            ? cn(
                                'bg-primary/10 border-primary/40 shadow-md shadow-primary/20',
                                level.color
                              )
                            : cn(
                                'bg-neutral-50 dark:bg-neutral-800/50',
                                'border-neutral-200 dark:border-neutral-700',
                                'hover:border-primary/30 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              )
                        )}
                        title={level.desc}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                        <div className="relative text-center">
                          <div className={cn(
                            'text-sm font-bold font-mono mb-1',
                            isActive ? level.color : 'text-neutral-400 dark:text-neutral-500'
                          )}>
                            {level.value}%
                          </div>
                          <div className={cn(
                            'text-[10px] font-semibold font-mono uppercase leading-tight',
                            isActive ? level.color : 'text-neutral-400 dark:text-neutral-500'
                          )}>
                            {level.label.split('_')[0]}
                          </div>
                        </div>
                        {/* Tooltip on hover */}
                        {isHovered && !isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-mono whitespace-nowrap shadow-xl z-20 pointer-events-none"
                          >
                            {level.desc}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Precision Slider with Value Display */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                    PRECISION_CONTROL
                  </div>
                  <motion.div
                    key={autonomyLevel}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-bold font-mono tabular-nums',
                      'bg-primary/10 text-primary border border-primary/20'
                    )}
                  >
                    {autonomyLevel}%
                  </motion.div>
                </div>
                <div className="relative">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div
                      className={cn('h-full rounded-full', gradients.primary)}
                      initial={{ width: 0 }}
                      animate={{ width: `${autonomyLevel}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {levels.map((level) => (
                      <div
                        key={level.value}
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{ left: `${level.value}%` }}
                      >
                        <div className={cn(
                          'absolute top-0 w-0.5 h-3 rounded-full transition-all',
                          autonomyLevel >= level.value 
                            ? 'bg-primary shadow-sm shadow-primary/50' 
                            : 'bg-neutral-300 dark:bg-neutral-600'
                        )} />
                      </div>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={autonomyLevel}
                    onChange={(e) => setAutonomyLevel(Number(e.target.value))}
                    className="absolute top-0 w-full h-3 opacity-0 cursor-pointer z-10
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                      [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-white
                      dark:[&::-webkit-slider-thumb]:border-neutral-900
                      [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/40
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:ring-primary/50
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary
                      [&::-moz-range-thumb]:border-3 [&::-moz-range-thumb]:border-white
                      dark:[&::-moz-range-thumb]:border-neutral-900
                      [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:shadow-primary/40"
                    aria-label="Autonomy level"
                  />
                </div>
              </div>

              {/* Stats Grid - Compact Horizontal */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
                {[
                  { label: 'AUTO_HEALED', value: '12', color: colors.success.text, icon: CheckCircle2 },
                  { label: 'ACTIVE_RULES', value: '2', color: colors.primary.text, icon: Zap },
                  { label: 'SUCCESS_RATE', value: '96%', color: colors.success.text, icon: TrendingUp },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={cn(
                        'text-center p-4 rounded-lg border transition-all group relative overflow-hidden',
                        'bg-neutral-50 dark:bg-neutral-800/50',
                        'border-neutral-200/50 dark:border-neutral-700/50',
                        'hover:border-primary/40 hover:shadow-md hover:shadow-primary/5'
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-2',
                          stat.color === colors.success.text && 'bg-success/10',
                          stat.color === colors.primary.text && 'bg-primary/10'
                        )}>
                          <Icon className={cn('w-5 h-5', stat.color)} />
                        </div>
                        <div className={cn('text-2xl font-bold font-mono tabular-nums mb-1', stat.color)}>{stat.value}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Healing Rules - Compact Design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className={cn(
          'p-6 rounded-2xl border relative overflow-hidden',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60',
          'shadow-lg'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-success/3" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-lg shadow-primary/50" />
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              HEALING_RULES
            </h3>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Auto-restart on crash', level: 'L0', enabled: true, success: 98 },
              { name: 'Cache clear on memory spike', level: 'L1', enabled: true, success: 95 },
              { name: 'Scale on traffic surge', level: 'L2', enabled: false, success: 88 },
              { name: 'Rollback on error spike', level: 'L3', enabled: false, success: 100 },
            ].map((rule, index) => (
              <motion.div
                key={rule.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-all group relative overflow-hidden',
                  'bg-neutral-50 dark:bg-neutral-800/50',
                  'border-neutral-200/50 dark:border-neutral-700/50',
                  'hover:border-primary/40 hover:shadow-sm hover:shadow-primary/5'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-4 flex-1 min-w-0">
                  <span className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-bold font-mono flex-shrink-0',
                    'bg-primary/10 text-primary border border-primary/20',
                    'shadow-sm'
                  )}>
                    {rule.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{rule.name}</span>
                      {rule.enabled && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase flex-shrink-0', colors.success.bg, colors.success.text)}
                        >
                          ON
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rule.success}%` }}
                          transition={{ delay: 0.25 + index * 0.03, duration: 0.5 }}
                          className={cn('h-full rounded-full', rule.enabled ? gradients.success : 'bg-neutral-400')}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono text-neutral-500 dark:text-neutral-400 w-10 text-right tabular-nums flex-shrink-0">
                        {rule.success}%
                      </span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all relative flex-shrink-0 shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    rule.enabled 
                      ? cn(colors.primary.solid, 'shadow-primary/20') 
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                  aria-label={`Toggle ${rule.name}`}
                >
                  <motion.div
                    layout
                    className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all',
                      rule.enabled ? 'left-[1.625rem]' : 'left-0.5'
                    )}
                  />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Nexus Tab
// =============================================================================

function NexusDashboard() {
  const modules = [
    { name: 'Sentinel', desc: 'Real-time monitoring', enabled: true, icon: Eye },
    { name: 'Pulse', desc: 'Periodic analysis', enabled: true, icon: Heart },
    { name: 'Cortex', desc: 'AI intelligence', enabled: true, icon: Brain },
    { name: 'Genesis', desc: 'Self-healing', enabled: false, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* System Modules */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            System Modules
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                whileHover={cardHover}
                className={cn(
                  'p-5 rounded-xl border transition-all relative overflow-hidden group',
                  module.enabled
                    ? cn('bg-primary/5 border-primary/30', 'hover:border-primary/50 hover:shadow-md hover:shadow-primary/10')
                    : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                )}
              >
                {module.enabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        module.enabled ? 'bg-primary/10' : 'bg-neutral-200 dark:bg-neutral-700'
                      )}>
                        <Icon className={cn('w-5 h-5', module.enabled ? colors.primary.text : 'text-neutral-400 dark:text-neutral-500')} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">{module.name}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        module.enabled ? cn(colors.primary.solid, 'shadow-sm shadow-primary/20') : 'bg-neutral-300 dark:bg-neutral-600'
                      )}
                    >
                      <motion.div
                        layout
                        className={cn(
                          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all',
                          module.enabled ? 'left-5' : 'left-0.5'
                        )}
                      />
                    </motion.button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{module.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Audit Trail */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            Audit Trail
          </h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[
            { actor: 'autodev', action: 'Cache cleared automatically', outcome: 'success', time: '10:32 AM' },
            { actor: 'user', action: 'Disabled Genesis module', outcome: 'success', time: '10:15 AM' },
            { actor: 'system', action: 'Daily digest generated', outcome: 'success', time: '6:00 AM' },
            { actor: 'autodev', action: 'Recommendation #42 applied', outcome: 'success', time: 'Yesterday' },
            { actor: 'autodev', action: 'Memory optimization failed', outcome: 'failure', time: 'Yesterday' },
          ].map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide font-mono',
                  entry.actor === 'autodev' && cn(colors.primary.bg, colors.primary.text),
                  entry.actor === 'user' && cn(colors.secondary.bg, colors.secondary.text),
                  entry.actor === 'system' && 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                )}>
                  {entry.actor}
                </span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{entry.action}</span>
              </div>
              <div className="flex items-center gap-3">
                {entry.outcome === 'success' ? (
                  <CheckCircle2 className={cn('w-4 h-4', colors.success.text)} />
                ) : (
                  <X className={cn('w-4 h-4', colors.error.text)} />
                )}
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{entry.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function AutoDevPage() {
  const [activeTab, setActiveTab] = useState<AutodevTab>('command');

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-sm shadow-primary/50" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono">
            AUTODEV
          </h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 ml-4 text-sm font-mono">
          [AUTONOMOUS_SYSTEM] AI-powered operations
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border font-mono uppercase relative',
                isActive
                  ? cn(
                      'bg-primary text-primary-foreground border-primary',
                      'shadow-md shadow-primary/20'
                    )
                  : cn(
                      'bg-white dark:bg-neutral-900',
                      'border-neutral-200/60 dark:border-neutral-800/60',
                      'text-neutral-600 dark:text-neutral-400',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                      'hover:border-primary/40 dark:hover:border-primary/40',
                      'hover:shadow-sm'
                    )
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn('w-4 h-4 relative z-10', isActive && 'text-primary-foreground')} />
              <span className="hidden sm:inline relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'command' && <CommandCenter />}
          {activeTab === 'sentinel' && <SentinelDashboard />}
          {activeTab === 'pulse' && <PulseDashboard />}
          {activeTab === 'cortex' && <CortexDashboard />}
          {activeTab === 'genesis' && <GenesisDashboard />}
          {activeTab === 'nexus' && <NexusDashboard />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
