# Claude Code Configuration for Light Brands AI

> AI-first development configuration for rapid, high-quality web development

---

## CRITICAL: Project Foundation (READ FIRST)

**Before ANY development work, always reference the project's planning files:**

### Active Project Context
```
/docs/planning/projects/[project-name].json  # SINGLE SOURCE OF TRUTH
```

This JSON file contains:
- **Plan**: Problem, goals, user stories, constraints, success criteria
- **Brand**: Colors, typography, tone, style guidelines
- **Epics**: All features broken into tasks with status tracking
- **Routes**: API endpoints
- **Activity**: Change log

### How to Use
1. Load the active project: `loadProject('project-id')` from `@/lib/project`
2. Reference `plan` section for requirements
3. Reference `brand` section for design decisions
4. Update task status as you work: `updateTaskStatus(...)`

### Planning System Files
```
/docs/planning/PROJECT-SCHEMA.json           # JSON schema definition
/docs/planning/projects/_template.json       # Template for new projects
/docs/planning/projects/[project].json       # Active project files
/src/lib/project/project-store.ts            # Read/write utilities
```

---

## Orchestration Entry Point

**For ANY new request, start here:**
```
/.claude/START.md                            # Universal entry point
```

This will:
1. Ask for your plan (or help build one)
2. Ask for brand guidelines (or help establish them)
3. Save both to `/docs/planning/projects/[project].json`
4. Route through the optimal agent sequence

---

## Project Context

This is a premium Next.js 14+ boilerplate optimized for AI-assisted development. All development MUST follow the design system tokens and principles defined in `/src/design-system/`.

## Core Principles

1. **Plan First**: Always reference or create a project plan before coding
2. **Brand Consistency**: Follow project brand guidelines from project.json
3. **Design Token Enforcement**: Never hardcode colors, spacing, or typography values
4. **Clean Architecture**: Separation of concerns, single responsibility
5. **TDD Mindset**: Write tests for critical paths
6. **DRY Code**: Extract reusable patterns into utilities/components
7. **Performance First**: Target Lighthouse 95+
8. **Track Progress**: Update task status in project.json as you work

## File References

Always consult these files before making changes:

```
# PROJECT FOUNDATION (check first!)
/docs/planning/projects/[active-project].json  # Plan, brand, tasks, progress

# DESIGN SYSTEM
/src/design-system/tokens.ts      # All design tokens
/src/design-system/theme.css      # CSS variables and utilities
/src/design-system/DESIGN-PRINCIPLES.md  # Design guidelines

# ORCHESTRATION
/.claude/START.md                 # Universal entry point
/docs/orchestration/ORCHESTRATOR.md  # Orchestration rules

# UTILITIES
/AI-RULES.md                      # Development rules
/src/lib/utils.ts                 # Utility functions
/src/lib/project/                 # Project store utilities
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
