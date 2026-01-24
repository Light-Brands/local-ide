// =============================================================================
// Design Tokens - Slate Blue/Grey, Off-Black, Off-White Color System
// =============================================================================
//
// A minimal, sophisticated palette:
// - Primary (Slate Blue/Grey): ~5-10% of UI - CTAs, active states, brand moments
// - Secondary (Slate Blue): ~3-5% of UI - secondary actions, subtle accents
// - Neutral (Off-black/Off-white): ~85-90% of UI - backgrounds, text, borders
// - Accent (Slate tints): ~1-2% of UI - subtle highlights, hover states
// =============================================================================

// -----------------------------------------------------------------------------
// Brand Colors - The Core Palette
// -----------------------------------------------------------------------------
export const brandColors = {
  // Slate Blue/Grey - Primary brand color (replaces gold/orange)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',  // Main slate blue-grey
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Off-black to Off-white - Neutral scale
  neutral: {
    0: '#fafaf9',      // Off-white (not pure white)
    50: '#f5f5f4',
    100: '#e7e5e4',
    200: '#d6d3d1',
    300: '#a8a29e',
    400: '#78716c',
    500: '#57534e',
    600: '#44403c',
    700: '#292524',
    800: '#1c1917',
    900: '#0f0e0d',    // Off-black (not pure black)
  },
} as const;

// -----------------------------------------------------------------------------
// Semantic Colors - Use for states only
// -----------------------------------------------------------------------------
export const semanticColors = {
  success: '#10b981',
  warning: '#f59e0b',  // Amber for warnings
  error: '#ef4444',
  info: brandColors.slate[500],    // Reuse slate for info
} as const;

// -----------------------------------------------------------------------------
// Light Theme Tokens
// -----------------------------------------------------------------------------
export const lightTheme = {
  // Surfaces - Off-white tones
  background: brandColors.neutral[0],     // Off-white
  foreground: brandColors.neutral[900],   // Off-black
  card: brandColors.neutral[50],
  cardHover: brandColors.neutral[100],

  // Primary - Slate Blue/Grey
  primary: brandColors.slate[600],
  primaryHover: brandColors.slate[700],
  primaryForeground: brandColors.neutral[0],

  // Secondary - Slate blue for contrast
  secondary: brandColors.slate[500],
  secondaryHover: brandColors.slate[600],
  secondaryForeground: brandColors.neutral[0],

  // Text - Off-black variations
  textPrimary: brandColors.neutral[900],   // Off-black
  textSecondary: brandColors.neutral[600],
  textMuted: brandColors.neutral[400],

  // Borders - Subtle neutrals
  border: brandColors.neutral[200],
  input: brandColors.neutral[300],

  // Accents
  accent: brandColors.slate[100],  // Light slate tint for highlights
  accentForeground: brandColors.neutral[900],

  // States
  success: semanticColors.success,
  warning: semanticColors.warning,
  error: semanticColors.error,
  info: semanticColors.info,
} as const;

// -----------------------------------------------------------------------------
// Dark Theme Tokens
// -----------------------------------------------------------------------------
export const darkTheme = {
  // Surfaces - Off-black tones
  background: brandColors.neutral[900],    // Off-black
  foreground: brandColors.neutral[0],      // Off-white
  card: brandColors.neutral[800],
  cardHover: brandColors.neutral[700],

  // Primary - Lighter slate for dark mode
  primary: brandColors.slate[400],
  primaryHover: brandColors.slate[300],
  primaryForeground: brandColors.neutral[900],

  // Secondary - Lighter slate for dark mode
  secondary: brandColors.slate[300],
  secondaryHover: brandColors.slate[200],
  secondaryForeground: brandColors.neutral[900],

  // Text - Off-white variations
  textPrimary: brandColors.neutral[0],     // Off-white
  textSecondary: brandColors.neutral[300],
  textMuted: brandColors.neutral[500],

  // Borders - Subtle dark neutrals
  border: brandColors.neutral[700],
  input: brandColors.neutral[600],

  // Accents
  accent: brandColors.slate[800],  // Dark slate tint
  accentForeground: brandColors.neutral[0],

  // States
  success: semanticColors.success,
  warning: semanticColors.warning,
  error: semanticColors.error,
  info: semanticColors.info,
} as const;

// -----------------------------------------------------------------------------
// Tailwind Class Mappings - For component styling
// -----------------------------------------------------------------------------
export const colors = {
  // Primary - Blue/Purple (use for important actions, CTAs)
  primary: {
    solid: 'bg-primary',
    text: 'text-primary dark:text-primary',
    bg: 'bg-accent dark:bg-accent',
    border: 'border-primary',
    gradient: 'from-primary-500 to-primary-600',
    shadow: 'shadow-primary/20',
    hover: 'hover:bg-primary-hover',
  },

  // Secondary - Slate Blue (use for secondary actions)
  secondary: {
    solid: 'bg-secondary',
    text: 'text-secondary dark:text-secondary',
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    border: 'border-secondary',
    gradient: 'from-slate-500 to-slate-600',
    shadow: 'shadow-secondary/20',
    hover: 'hover:bg-secondary-hover',
  },

  // Success - Green (positive states only)
  success: {
    solid: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
  },

  // Warning - Uses Amber (attention needed)
  warning: {
    solid: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning',
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20',
  },

  // Error - Red (problems, critical items)
  error: {
    solid: 'bg-error',
    text: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error',
    gradient: 'from-red-500 to-red-600',
    shadow: 'shadow-red-500/20',
  },

  // Neutral - Off-black/white (default/inactive)
  neutral: {
    solid: 'bg-foreground',
    text: 'text-foreground',
    bg: 'bg-card',
    border: 'border-border',
    gradient: 'from-neutral-700 to-neutral-800',
    shadow: 'shadow-neutral-500/20',
  },
} as const;

// -----------------------------------------------------------------------------
// Status Color Mappings
// -----------------------------------------------------------------------------
export const statusColors = {
  new: colors.warning,
  pending: colors.warning,
  'in-progress': colors.primary,
  active: colors.primary,
  resolved: colors.success,
  completed: colors.success,
  blocked: colors.error,
  error: colors.error,
  archived: colors.neutral,
  inactive: colors.neutral,
} as const;

// -----------------------------------------------------------------------------
// Category/Type Colors
// -----------------------------------------------------------------------------
export const categoryColors = {
  bug: colors.error,
  enhancement: colors.primary,
  feature: colors.primary,
  question: colors.warning,
  content: colors.neutral,
  documentation: colors.neutral,
} as const;

// -----------------------------------------------------------------------------
// Priority Colors
// -----------------------------------------------------------------------------
export const priorityColors = {
  low: colors.neutral,
  medium: colors.primary,
  high: colors.warning,
  critical: colors.error,
} as const;

// -----------------------------------------------------------------------------
// File Type Colors
// -----------------------------------------------------------------------------
export const fileTypeColors = {
  image: colors.primary,
  video: colors.secondary,
  audio: colors.success,
  document: colors.warning,
  archive: colors.neutral,
} as const;

// -----------------------------------------------------------------------------
// Trend Colors
// -----------------------------------------------------------------------------
export const trendColors = {
  up: colors.success,
  down: colors.error,
  neutral: colors.neutral,
} as const;

// -----------------------------------------------------------------------------
// Component Style Presets
// -----------------------------------------------------------------------------

// Badge/pill styles
export const badge = {
  primary: 'text-primary bg-accent',
  secondary: 'text-secondary bg-slate-100 dark:bg-slate-500/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  error: 'text-error bg-error/10',
  neutral: 'text-text-muted bg-card',
} as const;

// Icon container styles
export const iconContainer = {
  primary: 'bg-accent text-primary',
  secondary: 'bg-slate-100 dark:bg-slate-500/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-card text-text-muted',
} as const;

// Gradient styles (use sparingly)
export const gradients = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25',
  secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-500/25',
  success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25',
  warning: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25',
  error: 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25',
  brand: 'bg-gradient-to-r from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/25',
} as const;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
export type SemanticColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export function getColor(semantic: SemanticColor) {
  return colors[semantic];
}

export function getBadge(semantic: SemanticColor) {
  return badge[semantic];
}

export function getIconContainer(semantic: SemanticColor) {
  return iconContainer[semantic];
}

export function getGradient(semantic: SemanticColor | 'brand'): string {
  return gradients[semantic as keyof typeof gradients];
}

// -----------------------------------------------------------------------------
// CSS Variable Mapping (for reference)
// -----------------------------------------------------------------------------
export const cssVariables = {
  light: {
    '--background': '#fafaf9',
    '--foreground': '#0f0e0d',
    '--card': '#f5f5f4',
    '--card-hover': '#e7e5e4',
    '--primary': '#475569',
    '--primary-hover': '#334155',
    '--primary-foreground': '#0f0e0d',
    '--secondary': '#475569',
    '--secondary-hover': '#334155',
    '--secondary-foreground': '#fafaf9',
    '--text-primary': '#0f0e0d',
    '--text-secondary': '#44403c',
    '--text-muted': '#78716c',
    '--border': '#d6d3d1',
    '--input': '#a8a29e',
    '--accent': '#f1f5f9',
    '--accent-foreground': '#0f0e0d',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#64748b',
  },
  dark: {
    '--background': '#0f0e0d',
    '--foreground': '#fafaf9',
    '--card': '#1c1917',
    '--card-hover': '#292524',
    '--primary': '#94a3b8',
    '--primary-hover': '#cbd5e1',
    '--primary-foreground': '#0f0e0d',
    '--secondary': '#94a3b8',
    '--secondary-hover': '#cbd5e1',
    '--secondary-foreground': '#0f0e0d',
    '--text-primary': '#fafaf9',
    '--text-secondary': '#a8a29e',
    '--text-muted': '#57534e',
    '--border': '#292524',
    '--input': '#44403c',
    '--accent': '#1e293b',
    '--accent-foreground': '#fafaf9',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#64748b',
  },
} as const;
