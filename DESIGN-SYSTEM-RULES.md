# Design System Rules - Next.js/TypeScript App

You are building a Next.js 16/TypeScript app with a complete design system. Follow these rules STRICTLY:

## DESIGN TOKENS - NEVER use hardcoded values:

### 1. COLORS - Use Tailwind color classes with dark mode support:
   - **Backgrounds**: `bg-white dark:bg-neutral-900`, `bg-neutral-50 dark:bg-neutral-950`
   - **Text**: `text-neutral-900 dark:text-white`, `text-neutral-600 dark:text-neutral-400`
   - **Borders**: `border-neutral-200 dark:border-neutral-800`
   - **Primary**: `bg-primary-500`, `text-primary-600 dark:text-primary-400`
   - **Secondary**: `bg-secondary-500`, `text-secondary-600 dark:text-secondary-400`
   - **State colors**: `bg-green-500`, `bg-amber-500`, `bg-red-500`, `bg-blue-500`
   - **Gradients**: `bg-gradient-to-r from-primary-500 to-secondary-500`
   ❌ NEVER: `#3b82f6`, `color: 'red'`, `backgroundColor: '#fff'`

### 2. SPACING - Only use Tailwind spacing scale:
   - Padding: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px)
   - Gap: `gap-2`, `gap-4`, `gap-6`, `gap-8`
   - Margin: `m-2`, `m-4`, `m-6`, `m-8`
   - Can use fractional values: `p-1.5`, `gap-2.5`, `mb-2.5`
   ❌ NEVER: `padding: '15px'`, `margin: '1.2rem'`, `gap: '10px'`

### 3. TYPOGRAPHY - Only use these classes:
   - Sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
   - Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
   - Line heights: `leading-tight`, `leading-relaxed`, `leading-normal`
   - Letter spacing: `tracking-tight`, `tracking-normal`
   ❌ NEVER: `fontSize: '18px'`, `fontWeight: 550`, `lineHeight: '1.5'`

### 4. RADIUS - Only use Tailwind radius classes:
   - `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
   ❌ NEVER: `borderRadius: '8px'`, `rounded-[8px]`

### 5. SHADOWS - Only use Tailwind shadow classes:
   - `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`
   - Colored shadows: `shadow-primary-500/20`, `shadow-neutral-900/[0.04]`
   ❌ NEVER: `boxShadow: '0 4px 6px rgba(0,0,0,0.1)'`

### 6. ANIMATIONS - Use Framer Motion for complex animations:
   - Simple transitions: `transition-all duration-200 ease-smooth`
   - Complex animations: Use `framer-motion` with `motion.div`, `motion.button`, etc.
   - Spring configs: Use tokens from `@/design-system/tokens` (animation.spring)
   ❌ NEVER: Inline animation objects with hardcoded values

## COMPONENT STRUCTURE - Every component must follow this exact pattern:

```typescript
'use client';

import * as React from 'react';
import { forwardRef } from 'react';
import { motion } from 'framer-motion'; // If animations needed
import { cn } from '@/lib/utils';

// 1. Define variant types
type ComponentVariant = 'default' | 'secondary' | 'outline';
type ComponentSize = 'sm' | 'md' | 'lg';

// 2. Define variant styles using Record pattern
const variantStyles: Record<ComponentVariant, string> = {
  default: cn(
    'bg-neutral-900 dark:bg-white',
    'text-white dark:text-neutral-900',
    'hover:bg-neutral-800 dark:hover:bg-neutral-100'
  ),
  secondary: cn(
    'bg-neutral-100 dark:bg-neutral-800',
    'text-neutral-900 dark:text-white',
    'hover:bg-neutral-200 dark:hover:bg-neutral-700'
  ),
  outline: cn(
    'bg-transparent',
    'border-2 border-neutral-200 dark:border-neutral-800',
    'hover:bg-neutral-50 dark:hover:bg-neutral-800'
  ),
};

const sizeStyles: Record<ComponentSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

// 3. TypeScript interface
interface ComponentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ComponentVariant;
  size?: ComponentSize;
  loading?: boolean;
}

// 4. Component with forwardRef
const Component = forwardRef<HTMLButtonElement, ComponentProps>(
  ({ className, variant = 'default', size = 'md', loading, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'base-classes-here',
          'transition-all duration-200 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Component.displayName = 'Component';
export { Component };
```

## KEY DIFFERENCES FROM STANDARD PATTERNS:

1. **NO CVA (class-variance-authority)** - Use Record-based variant styles instead
2. **Use `clsx` via `cn`** - Not tailwind-merge (already wrapped in `@/lib/utils`)
3. **Framer Motion for animations** - Use `motion.*` components for interactive animations
4. **Dark mode classes** - Always include `dark:` variants for colors
5. **CSS Variables available** - Can use `var(--color-background)` but prefer Tailwind classes

## ACCESSIBILITY - Every component MUST include:

- Proper ARIA attributes (`aria-label`, `aria-describedby`, `aria-invalid`, `aria-live`)
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus visible styles: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`
- Screen reader support (`role`, `aria-live` for dynamic content)
- Proper semantic HTML elements

## VALIDATION BEFORE COMPLETING:

❌ FAIL if you find ANY:
- Hex colors (`#anything`)
- Pixel values for spacing (`15px`, `20px`)
- Arbitrary Tailwind values (`[anything]`) - except for opacity like `shadow-neutral-900/[0.04]`
- Inline styles with hardcoded values (except for Framer Motion style props)
- Missing `forwardRef` for components that need refs
- Missing ARIA attributes for interactive elements
- No keyboard support
- Missing dark mode variants for colors
- Using CVA instead of Record pattern

✅ PASS only when ALL styling uses:
- Tailwind color classes with dark mode (`bg-white dark:bg-neutral-900`)
- Tailwind spacing scale (`p-4`, `gap-6`, `m-2`)
- Typography scale (`text-lg`, `font-semibold`)
- Record-based variant patterns (NOT CVA)
- Full TypeScript types
- Accessibility complete
- Framer Motion for complex animations (when needed)
- `cn` utility for className merging

Apply this to EVERY component you create or modify. No exceptions.


**NEVER USE EMOJIS - ONLY REAL REPRESENTATIVE ICONS**