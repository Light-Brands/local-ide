/**
 * Design Tokens
 * Premium design system tokens inspired by Apple/Vercel aesthetics
 * All values are carefully crafted for visual harmony
 *
 * REFINEMENT NOTES:
 * - Colors tuned for 2px offset rhythm and optical balance
 * - Shadows use subtle blue undertones for depth
 * - Typography includes micro-kerning adjustments
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary - Deep, sophisticated blue with purple undertones
  // Refined: Slightly warmer 500, better dark mode 400
  primary: {
    50: '#f0f4ff',
    100: '#e0e8ff',
    200: '#c7d4fe',
    300: '#a4b8fc',
    400: '#818cf8', // Refined: warmer, more vibrant for dark mode
    500: '#6366f1', // Refined: shifted toward indigo for sophistication
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Secondary - Warm, elegant violet
  // Refined: More rose undertones for premium feel
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Refined: more magenta for energy
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },

  // Neutral - Carefully balanced grays with subtle cool undertone
  // Refined: Slight blue undertone for modern tech aesthetic
  neutral: {
    0: '#ffffff',
    50: '#fafbfc', // Refined: subtle blue tint
    100: '#f4f5f7',
    200: '#e4e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712', // Refined: near-black with depth
  },

  // Accent colors for variety - refined with better contrast
  accent: {
    success: {
      light: '#ecfdf5',
      default: '#10b981',
      dark: '#059669',
      subtle: '#d1fae5', // Added: for hover states
    },
    warning: {
      light: '#fffbeb',
      default: '#f59e0b',
      dark: '#d97706',
      subtle: '#fef3c7',
    },
    error: {
      light: '#fef2f2',
      default: '#ef4444',
      dark: '#dc2626',
      subtle: '#fee2e2',
    },
    info: {
      light: '#eff6ff',
      default: '#3b82f6',
      dark: '#2563eb',
      subtle: '#dbeafe',
    },
  },

  // Gradient definitions - refined for more depth and sophistication
  gradients: {
    // Primary: More subtle angle, refined color stops
    primary: 'linear-gradient(137deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
    // Secondary: Warmer, more inviting
    secondary: 'linear-gradient(137deg, #d946ef 0%, #f472b6 50%, #fb7185 100%)',
    // Subtle: Barely there, premium feel
    subtle: 'linear-gradient(137deg, #f8fafc 0%, #f0f4ff 50%, #fdf4ff 100%)',
    // Dark: Rich depth with blue undertones
    dark: 'linear-gradient(137deg, #111827 0%, #1f2937 100%)',
    // Glass: More pronounced for depth
    glass: 'linear-gradient(137deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
    // Mesh: Asymmetric positioning for organic feel
    mesh: 'radial-gradient(ellipse 80% 50% at 35% 20%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(ellipse 60% 40% at 75% 10%, rgba(217, 70, 239, 0.12) 0px, transparent 50%), radial-gradient(ellipse 50% 60% at 10% 60%, rgba(244, 114, 182, 0.08) 0px, transparent 50%)',
    // NEW: Radial glow for focal points
    radialGlow: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
    // NEW: Text gradient with better color harmony
    text: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families
  fonts: {
    sans: 'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    mono: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace)',
    display: 'var(--font-display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
  },

  // Font sizes with line heights (following a perfect fourth scale ~1.333)
  scale: {
    // Display sizes - for hero headlines
    '7xl': { fontSize: '4.5rem', lineHeight: '1', letterSpacing: '-0.025em' },      // 72px
    '6xl': { fontSize: '3.75rem', lineHeight: '1', letterSpacing: '-0.025em' },     // 60px
    '5xl': { fontSize: '3rem', lineHeight: '1.1', letterSpacing: '-0.02em' },       // 48px

    // Heading sizes
    '4xl': { fontSize: '2.25rem', lineHeight: '1.15', letterSpacing: '-0.02em' },   // 36px
    '3xl': { fontSize: '1.875rem', lineHeight: '1.2', letterSpacing: '-0.015em' },  // 30px
    '2xl': { fontSize: '1.5rem', lineHeight: '1.25', letterSpacing: '-0.01em' },    // 24px
    'xl': { fontSize: '1.25rem', lineHeight: '1.35', letterSpacing: '-0.01em' },    // 20px

    // Body sizes
    'lg': { fontSize: '1.125rem', lineHeight: '1.6', letterSpacing: '0' },          // 18px
    'base': { fontSize: '1rem', lineHeight: '1.6', letterSpacing: '0' },            // 16px
    'sm': { fontSize: '0.875rem', lineHeight: '1.5', letterSpacing: '0' },          // 14px

    // Caption/small sizes
    'xs': { fontSize: '0.75rem', lineHeight: '1.5', letterSpacing: '0.01em' },      // 12px
    '2xs': { fontSize: '0.625rem', lineHeight: '1.5', letterSpacing: '0.02em' },    // 10px
  },

  // Font weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// =============================================================================
// SPACING (4px/8px base grid)
// =============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Container max widths
export const containers = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
  full: '100%',
} as const;

// =============================================================================
// SHADOWS
// Refined with subtle blue undertones for modern tech aesthetic
// =============================================================================

export const shadows = {
  // Subtle shadows for cards and elevated surfaces
  // Refined: Added subtle blue tint for depth perception
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(99 102 241 / 0.02)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(99 102 241 / 0.04)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(99 102 241 / 0.04)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(99 102 241 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(99 102 241 / 0.05)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.2), 0 12px 24px -8px rgb(99 102 241 / 0.08)',

  // Colored shadows for interactive elements - refined with layered depth
  primary: '0 4px 14px 0 rgb(99 102 241 / 0.2), 0 2px 6px 0 rgb(99 102 241 / 0.1)',
  primaryLg: '0 10px 40px 0 rgb(99 102 241 / 0.25), 0 4px 12px 0 rgb(99 102 241 / 0.15)',
  primaryXl: '0 20px 60px 0 rgb(99 102 241 / 0.3), 0 8px 24px 0 rgb(217 70 239 / 0.1)', // NEW
  secondary: '0 4px 14px 0 rgb(217 70 239 / 0.2), 0 2px 6px 0 rgb(217 70 239 / 0.1)',
  secondaryLg: '0 10px 40px 0 rgb(217 70 239 / 0.25), 0 4px 12px 0 rgb(217 70 239 / 0.15)', // NEW

  // Inner shadows - refined for subtle depth
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
  innerLg: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.06)',
  innerSubtle: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.02)', // NEW

  // Glass effect shadows - refined for premium feel
  glass: '0 8px 32px 0 rgb(0 0 0 / 0.06), 0 2px 8px 0 rgb(99 102 241 / 0.04)',
  glassLg: '0 16px 64px 0 rgb(0 0 0 / 0.08), 0 4px 16px 0 rgb(99 102 241 / 0.05)',
  glassPremium: '0 24px 80px 0 rgb(0 0 0 / 0.1), 0 8px 32px 0 rgb(99 102 241 / 0.06)', // NEW

  // Elevation shadows - distinct levels for visual hierarchy
  elevation1: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px 0 rgb(0 0 0 / 0.04)', // Cards
  elevation2: '0 4px 8px 0 rgb(0 0 0 / 0.06), 0 2px 4px 0 rgb(0 0 0 / 0.04)', // Elevated cards
  elevation3: '0 12px 24px 0 rgb(0 0 0 / 0.08), 0 4px 8px 0 rgb(0 0 0 / 0.04)', // Modals
  elevation4: '0 24px 48px 0 rgb(0 0 0 / 0.1), 0 8px 16px 0 rgb(0 0 0 / 0.05)', // Overlays

  // Hover shadow transitions
  cardHover: '0 12px 28px -6px rgb(0 0 0 / 0.12), 0 4px 10px -4px rgb(99 102 241 / 0.08)', // NEW
  buttonHover: '0 6px 20px 0 rgb(99 102 241 / 0.3)', // NEW

  none: 'none',
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const radius = {
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  DEFAULT: '0.5rem', // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  '4xl': '2rem',    // 32px
  full: '9999px',
} as const;

// =============================================================================
// ANIMATIONS
// Refined with organic, hand-crafted feel - not robotic
// =============================================================================

export const animation = {
  // Timing functions - premium easing curves
  // Refined: Tuned for organic, human feel
  easing: {
    // Standard easing
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Premium/smooth easing - refined for silk-like feel
    smooth: 'cubic-bezier(0.22, 1, 0.36, 1)', // Refined: more dramatic ease-out
    smoothOut: 'cubic-bezier(0.16, 1, 0.3, 1)', // Refined: snappier exit
    smoothIn: 'cubic-bezier(0.7, 0, 0.84, 0)', // Refined: gentle entry

    // Spring-like easing - refined for tactile feedback
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Refined: subtle overshoot
    springSubtle: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)', // NEW: barely perceptible bounce
    bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',

    // Apple-style easing - refined for premium feel
    apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    appleIn: 'cubic-bezier(0.42, 0, 1, 1)',
    appleOut: 'cubic-bezier(0, 0, 0.58, 1)',

    // NEW: Micro-interaction easings
    hover: 'cubic-bezier(0.33, 1, 0.68, 1)', // Quick in, soft out for hovers
    press: 'cubic-bezier(0.4, 0, 0.6, 1)', // Immediate feedback
    reveal: 'cubic-bezier(0.16, 1, 0.3, 1)', // Dramatic entrance
    exit: 'cubic-bezier(0.7, 0, 1, 0.5)', // Clean exit

    // NEW: Organic/natural easings
    natural: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)', // Symmetric, natural
    breathe: 'cubic-bezier(0.37, 0, 0.63, 1)', // Like breathing
  },

  // Durations - refined for perceptual timing
  duration: {
    instant: '0ms',
    micro: '75ms',   // NEW: Micro-interactions
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    relaxed: '300ms',
    slow: '400ms',
    slower: '500ms',
    deliberate: '600ms', // NEW: Intentional pause
    lazy: '700ms',
    glacial: '1000ms',
    epic: '1500ms', // NEW: Hero animations
  },

  // Spring configurations (for Framer Motion) - refined for premium feel
  spring: {
    // Snappy: Quick response, firm stop
    snappy: { type: 'spring', stiffness: 500, damping: 35 },
    // Smooth: Silk-like movement
    smooth: { type: 'spring', stiffness: 180, damping: 25 },
    // Bouncy: Playful, energetic
    bouncy: { type: 'spring', stiffness: 300, damping: 12, mass: 0.8 },
    // Gentle: Soft, calming
    gentle: { type: 'spring', stiffness: 100, damping: 18 },
    // NEW: Premium - Apple-like
    premium: { type: 'spring', stiffness: 250, damping: 28, mass: 0.9 },
    // NEW: Micro - for subtle interactions
    micro: { type: 'spring', stiffness: 600, damping: 40 },
    // NEW: Organic - natural movement
    organic: { type: 'spring', stiffness: 150, damping: 22, mass: 1.1 },
    // NEW: Entrance - dramatic reveal
    entrance: { type: 'spring', stiffness: 200, damping: 20, delay: 0.1 },
  },

  // NEW: Stagger configurations for coordinated animations
  stagger: {
    fast: 0.03,
    normal: 0.05,
    relaxed: 0.08,
    slow: 0.12,
    dramatic: 0.15,
  },
} as const;

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  raised: 1,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
  max: 9999,
} as const;

// =============================================================================
// BLUR VALUES
// =============================================================================

export const blur = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '40px',
} as const;

// =============================================================================
// EXPORT ALL TOKENS
// =============================================================================

export const tokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  containers,
  shadows,
  radius,
  animation,
  zIndex,
  blur,
} as const;

export type Tokens = typeof tokens;
export default tokens;
