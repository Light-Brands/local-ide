# /dev Skill

> Phased development workflow for systematic feature implementation

## Usage

```
/dev [file-or-component] [phase]
```

## MANDATORY: Clarification Before Each Phase

**Before starting ANY phase:**

### Pre-Phase Clarification Protocol

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MANDATORY CLARIFICATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ENTER PLANNING MODE                                             │
│     └─ Review the current phase requirements                       │
│                                                                     │
│  2. ASK QUALIFYING QUESTIONS UNTIL 100% CERTAIN                     │
│     └─ "Before I begin the [phase] phase, I need to confirm:"      │
│     └─ Ask specific questions relevant to the phase                │
│     └─ Do NOT assume - when in doubt, ASK                          │
│                                                                     │
│  3. CONFIRM UNDERSTANDING                                           │
│     └─ Summarize what you will do in this phase                    │
│     └─ Wait for user confirmation                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Phase-Specific Questions:**
- **scaffold**: What file structure do you expect? Any specific naming conventions?
- **ui**: What should this look like? Any specific design requirements?
- **logic**: What behaviors are expected? What are the edge cases?
- **animation**: What animations do you want? Any specific timing/easing?
- **integration**: What API endpoints? How should errors be handled?
- **test**: What scenarios are most critical to test?
- **polish**: What areas need the most attention?

## Phases

### Phase: `scaffold`
Create the file structure and basic component shell.

```typescript
// Output: Component with proper imports, interface, and structure
'use client';

import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
}

export function ComponentName({ className }: ComponentNameProps) {
  return (
    <div className={cn('', className)}>
      {/* TODO: Implement */}
    </div>
  );
}
```

### Phase: `ui`
Implement the visual layer using design tokens.

**Checklist:**
- [ ] Use design tokens for all colors/spacing
- [ ] Implement responsive design (mobile-first)
- [ ] Add dark mode support
- [ ] Include loading/empty states
- [ ] Add proper aria labels

### Phase: `logic`
Add interactivity and state management.

**Checklist:**
- [ ] Implement event handlers
- [ ] Add form validation if needed
- [ ] Set up state management
- [ ] Handle edge cases
- [ ] Add error boundaries

### Phase: `animation`
Add micro-interactions and animations.

**Checklist:**
- [ ] Use Framer Motion for interactive elements
- [ ] Follow timing tokens from design system
- [ ] Respect `prefers-reduced-motion`
- [ ] Add entrance/exit animations
- [ ] Implement hover/focus states

### Phase: `integration`
Connect to APIs and external services.

**Checklist:**
- [ ] Connect to API endpoints
- [ ] Implement data fetching (use Server Components where possible)
- [ ] Add optimistic updates
- [ ] Handle loading states
- [ ] Implement error handling

### Phase: `test`
Write comprehensive tests.

**Checklist:**
- [ ] Unit tests for utilities
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API routes
- [ ] E2E tests for critical paths
- [ ] Accessibility tests

### Phase: `polish`
Final refinements and optimization.

**Checklist:**
- [ ] Code review for DRY violations
- [ ] Performance audit (bundle size, re-renders)
- [ ] Accessibility audit
- [ ] SEO meta tags if page component
- [ ] Documentation/comments

## Example Workflow

```bash
# 1. Scaffold the component
/dev UserProfile scaffold

# 2. Build the UI
/dev UserProfile ui

# 3. Add interactivity
/dev UserProfile logic

# 4. Animate it
/dev UserProfile animation

# 5. Connect to backend
/dev UserProfile integration

# 6. Test it
/dev UserProfile test

# 7. Final polish
/dev UserProfile polish
```

## Phase Dependencies

```
scaffold → ui → logic → animation → integration → test → polish
```

Each phase builds on the previous. Run in order for best results.

## Output Format

Each phase outputs:
1. Updated code for the component
2. Checklist of completed items
3. Next steps for following phase
4. Any blockers or decisions needed

## Integration with Hooks

After each phase, the following hooks run automatically:
- `lint-fix`: Auto-fix linting issues
- `type-check`: Verify TypeScript types
- `format`: Run Prettier
