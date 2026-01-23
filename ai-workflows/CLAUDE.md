# Claude Code Configuration for Light Brands AI

> AI-first development configuration for rapid, high-quality web development

## Project Context

This is a premium Next.js 14+ boilerplate optimized for AI-assisted development. All development MUST follow the design system tokens and principles defined in `/src/design-system/`.

## Core Principles

1. **Design Token Enforcement**: Never hardcode colors, spacing, or typography values
2. **Clean Architecture**: Separation of concerns, single responsibility
3. **TDD Mindset**: Write tests for critical paths
4. **DRY Code**: Extract reusable patterns into utilities/components
5. **Performance First**: Target Lighthouse 95+

## File References

Always consult these files before making changes:

```
/src/design-system/tokens.ts      # All design tokens
/src/design-system/theme.css      # CSS variables and utilities
/src/design-system/DESIGN-PRINCIPLES.md  # Design guidelines
/AI-RULES.md                      # Development rules
/src/lib/utils.ts                 # Utility functions
/src/lib/seo.tsx                  # SEO utilities
```

## Code Standards

### Component Structure

```typescript
'use client'; // Only if needed

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { tokens } from '@/design-system/tokens';

interface ComponentProps {
  // Props with JSDoc comments
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-classes', className)}
        {...props}
      />
    );
  }
);

Component.displayName = 'Component';
```

### Styling Rules

- Use `cn()` for class composition
- Use Tailwind classes that map to design tokens
- Mobile-first responsive design
- Dark mode support with `dark:` prefix
- Use semantic color classes (foreground, background, muted)

### Animation Patterns

- Framer Motion for interactive elements
- GSAP for complex scroll animations
- Always respect `prefers-reduced-motion`
- Use timing tokens from design system

## Allowed Operations

### File Modifications
- Create new components in `/src/components/`
- Create new pages in `/src/app/`
- Add utilities to `/src/lib/`
- Create API routes in `/src/app/api/`

### Forbidden Operations
- Modifying `/src/design-system/tokens.ts` without explicit approval
- Hardcoding colors, spacing, or typography
- Installing packages without justification
- Removing existing accessibility features
