/**
 * IDE Feature Flags
 *
 * Controls which IDE features are enabled. Set NEXT_PUBLIC_IDE_ENABLED=false
 * on Vercel to disable all IDE features for the marketing site deployment.
 */

// Master switch for all IDE features
export const IDE_ENABLED = process.env.NEXT_PUBLIC_IDE_ENABLED !== 'false';

// Individual feature flags (all default to true when IDE is enabled)
export const IDE_FEATURES = {
  // Master switch
  enabled: IDE_ENABLED,

  // Activity tracking (file opens, terminal commands, etc.)
  activityTracking: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_ACTIVITY_ENABLED !== 'false',

  // Claude AI chat integration
  claudeChat: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_CLAUDE_ENABLED !== 'false',

  // Persistent chat via tmux (survives browser disconnect)
  persistentChat: IDE_ENABLED && process.env.NEXT_PUBLIC_PERSISTENT_CHAT !== 'false',

  // Terminal functionality
  terminal: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_TERMINAL_ENABLED !== 'false',

  // File sync checking
  fileSync: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_FILE_SYNC_ENABLED !== 'false',

  // GitHub integration
  github: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_GITHUB_ENABLED !== 'false',

  // Vercel integration
  vercel: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_VERCEL_ENABLED !== 'false',

  // Database browser
  database: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_DATABASE_ENABLED !== 'false',

  // Local file system access
  localFiles: IDE_ENABLED && process.env.NEXT_PUBLIC_IDE_LOCAL_FILES_ENABLED !== 'false',
} as const;

/**
 * Check if a specific IDE feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof IDE_FEATURES): boolean {
  return IDE_FEATURES[feature];
}

/**
 * Check if IDE is running in degraded mode (some features disabled)
 */
export function isIDEDegraded(): boolean {
  if (!IDE_ENABLED) return true;
  return Object.values(IDE_FEATURES).some(enabled => !enabled);
}

/**
 * Get list of disabled features for debugging
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(IDE_FEATURES)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);
}
