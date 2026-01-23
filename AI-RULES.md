# AI Development Rules

Guidelines for AI-assisted development to ensure consistent, high-quality, premium websites.

## Core Principles

### 1. Always Use Design Tokens

**NEVER hardcode colors, spacing, or typography values.**

```tsx
// CORRECT - Uses design tokens
<div className="bg-primary-500 text-neutral-900 p-6 rounded-xl">
<h2 className="text-3xl font-bold tracking-tight">

// INCORRECT - Hardcoded values
<div style={{ backgroundColor: '#5a6df2', padding: '24px' }}>
<h2 style={{ fontSize: '30px', fontWeight: 700 }}>
```

### 2. Reference Files

Before writing any component, reference these files:

- `src/design-system/tokens.ts` - All design token values
- `src/design-system/theme.css` - CSS variables
- `src/design-system/DESIGN-PRINCIPLES.md` - Design guidelines

### 3. Component Structure

Follow this structure for all components:

```tsx
'use client'; // Only if using client features

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props with clear types
}

export function Component({ prop }: ComponentProps) {
  return (
    <div className={cn(
      // Base styles
      'relative',
      // Design token classes
      'bg-background text-foreground',
      // Responsive variants
      'p-4 md:p-6 lg:p-8',
    )}>
      {/* Content */}
    </div>
  );
}
```

---

## Color Usage Rules

### Semantic Colors (Preferred)

Use semantic color variables that adapt to light/dark mode:

| Variable | Use Case |
|----------|----------|
| `bg-background` | Page/section backgrounds |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `bg-muted` | Subtle backgrounds |
| `border-border` | Borders and dividers |
| `text-accent` / `bg-accent` | Interactive elements |

### Brand Colors

Use the full palette for intentional brand expression:

| Color | Use Case |
|-------|----------|
| `primary-500` | CTAs, links, active states |
| `primary-50/100` | Subtle backgrounds |
| `secondary-500` | Accents, gradients |
| `neutral-*` | Text, backgrounds |

### Dark Mode Compatibility

Always verify components work in both modes:

```tsx
// This automatically adapts
<div className="bg-white dark:bg-neutral-900">

// Explicit dark mode styling when needed
<div className="text-neutral-900 dark:text-neutral-100">
```

---

## Typography Rules

### Font Sizes

| Class | Size | Use Case |
|-------|------|----------|
| `text-7xl` | 72px | Hero headlines only |
| `text-6xl` | 60px | Page titles |
| `text-5xl` | 48px | Section titles |
| `text-4xl` | 36px | Section titles (mobile) |
| `text-3xl` | 30px | Subheadings |
| `text-2xl` | 24px | Card titles |
| `text-xl` | 20px | Emphasis text |
| `text-lg` | 18px | Lead paragraphs |
| `text-base` | 16px | Body text |
| `text-sm` | 14px | Secondary text |
| `text-xs` | 12px | Captions |

### Tracking (Letter Spacing)

- Display text (5xl+): `tracking-tighter`
- Headings: `tracking-tight`
- Body: default (no class needed)
- Labels/caps: `tracking-wider`

### Font Weights

| Weight | Class | Use |
|--------|-------|-----|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Buttons, nav |
| 600 | `font-semibold` | Subheadings |
| 700 | `font-bold` | Headings |
| 800 | `font-extrabold` | Hero text |

---

## Spacing Rules

### Base Grid: 4px

All spacing should be multiples of 4px:

```tsx
// CORRECT
<div className="p-4">    // 16px
<div className="p-6">    // 24px
<div className="gap-8">  // 32px

// INCORRECT
<div className="p-[18px]">  // Not on grid
```

### Section Spacing

```tsx
// Standard section
<section className="py-16 lg:py-24">  // 64px/96px

// Component spacing
<div className="space-y-6">  // 24px between children
```

### Responsive Padding

```tsx
// Container padding pattern
<div className="px-4 sm:px-6 lg:px-8">
```

---

## Animation Guidelines

### Timing Functions

| Easing | Class/Value | Use |
|--------|-------------|-----|
| Smooth | `ease-smooth` | Most transitions |
| Spring | `ease-spring` | Playful interactions |
| Bounce | `ease-bounce` | Attention elements |

### Duration

| Duration | Use Case |
|----------|----------|
| `100-150ms` | Micro-interactions |
| `200ms` | Standard transitions |
| `300ms` | Larger elements |
| `400-500ms` | Page transitions |

### GSAP Patterns

```tsx
// Fade up on scroll
gsap.from(element, {
  y: 40,
  opacity: 0,
  duration: 0.8,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: element,
    start: 'top 80%',
  },
});
```

### Framer Motion Patterns

```tsx
// Standard entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
>

// Stagger children
const container = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

### Reduced Motion

Always respect user preferences:

```tsx
// Check preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply conditionally
<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
>
```

---

## Component Patterns

### Card Pattern

```tsx
<Card variant="default" className="p-6 lg:p-8">
  <Icon className="w-12 h-12 mb-6 text-primary-500" />
  <h3 className="text-xl font-semibold mb-3">Title</h3>
  <p className="text-muted-foreground">Description</p>
</Card>
```

### Button Pattern

```tsx
<Button
  variant="primary"  // primary | secondary | outline | ghost | gradient
  size="lg"          // sm | md | lg | xl
  icon={<ArrowRight />}
  href="/path"       // Makes it a link
>
  Label
</Button>
```

### Section Pattern

```tsx
<section className="section-padding">
  <div className="container-premium">
    <div className="max-w-3xl mx-auto text-center mb-16">
      <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
        Eyebrow
      </span>
      <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mt-4 mb-6">
        Section Title
      </h2>
      <p className="text-lg text-muted-foreground">
        Section description
      </p>
    </div>
    {/* Content */}
  </div>
</section>
```

---

## SEO Checklist

### Every Page Must Have

- [ ] Unique `<title>` tag (50-60 chars)
- [ ] Meta description (150-160 chars)
- [ ] Canonical URL
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags
- [ ] Proper heading hierarchy (single h1, sequential h2-h6)

### Implementation

```tsx
// In page.tsx or layout.tsx
export const metadata: Metadata = {
  title: 'Page Title | Brand',
  description: 'Clear, compelling description under 160 characters.',
  openGraph: {
    title: 'Page Title',
    description: 'Description for social sharing',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

### Image Optimization

```tsx
// Always use Next.js Image
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Descriptive alt text"  // REQUIRED
  width={800}
  height={600}
  priority  // For above-fold images
/>
```

---

## Performance Benchmarks

### Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | 90+ |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

### Core Web Vitals

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

### Optimization Techniques

1. **Images**: Use WebP/AVIF, proper sizing, lazy loading
2. **Fonts**: Use `next/font` with display: swap
3. **Components**: Use dynamic imports for heavy components
4. **CSS**: Purge unused styles (automatic with Tailwind)

```tsx
// Dynamic import for heavy components
const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

## File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Marketing pages group
│   ├── (dashboard)/        # Dashboard pages group
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   └── sections/           # Page sections
│       ├── HeroCentered.tsx
│       ├── HeroSplit.tsx
│       ├── HeroMinimal.tsx
│       └── CTASection.tsx
├── design-system/
│   ├── tokens.ts           # Design tokens
│   ├── theme.css           # CSS variables
│   └── DESIGN-PRINCIPLES.md
├── lib/
│   ├── utils.ts            # Utility functions
│   └── seo.ts              # SEO helpers
└── types/                  # TypeScript types
```

---

## Quick Reference

### Commonly Used Classes

```tsx
// Premium heading
"text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white"

// Body text
"text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed"

// Primary button
"px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-200"

// Glass card
"bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-glass"

// Gradient text
"bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"

// Section wrapper
"section-padding bg-white dark:bg-neutral-950"

// Container
"container-premium"
```

### Import Patterns

```tsx
// Components
import { Button } from '@/components/ui/Button';
import { Card, FeatureCard } from '@/components/ui/Card';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { HeroCentered } from '@/components/sections/HeroCentered';

// Utilities
import { cn } from '@/lib/utils';

// Design tokens (when needed programmatically)
import { colors, spacing, animation } from '@/design-system/tokens';
```

---

## Do's and Don'ts

### DO

- Use semantic HTML elements
- Follow the design token system
- Test in both light and dark modes
- Ensure keyboard navigation works
- Use descriptive alt text for images
- Lazy load below-the-fold content
- Use the `cn()` utility for conditional classes

### DON'T

- Hardcode color hex values
- Use arbitrary spacing values
- Forget dark mode compatibility
- Skip alt text on images
- Use inline styles
- Import entire icon libraries
- Nest interactive elements

---

## AI-First Development Patterns

### AI Workflow Integration

This boilerplate includes AI-assisted development workflows. Reference these resources:

| Resource | Path | Purpose |
|----------|------|---------|
| Claude Config | `/ai-workflows/CLAUDE.md` | Claude Code configuration |
| Skills | `/ai-workflows/skills/` | Custom Claude commands |
| Hooks | `/ai-workflows/hooks/` | Automated code checks |
| Subagents | `/ai-workflows/subagents/` | Specialized AI agents |
| Prompt Library | `/prompt-library/` | Mega-prompts for common tasks |
| UI Polish Guide | `/ui-polish/ui-polish.md` | Iterative UI refinement |

### Using AI-Powered Components

```tsx
// Dynamic Hero with AI personalization
import { DynamicHero } from '@/components/ai';

<DynamicHero
  baseHeadline="Build premium web experiences"
  baseDescription="The ultimate Next.js boilerplate"
  userContext={{
    industry: 'technology',
    role: 'developer',
  }}
  primaryCTA={{ label: 'Get Started', href: '/start' }}
/>

// Feedback Widget with AI analysis
import { FeedbackWidget } from '@/components/ai';

<FeedbackWidget
  enableAI={true}
  position="bottom-right"
  collectEmail={true}
/>
```

### Full-Stack Integration Patterns

```tsx
// Supabase Client (browser)
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('content').select('*');

// Supabase Server (Server Components, API routes)
import { createServerSupabaseClient } from '@/lib/supabase/server';

const supabase = await createServerSupabaseClient();
const { data } = await supabase.from('content').select('*');

// Authentication
import { useAuth } from '@/lib/supabase/auth';

function Component() {
  const { user, signIn, signOut, isLoading } = useAuth();
  // ...
}
```

### API Route Patterns

```tsx
// Standard API response format
import { NextRequest, NextResponse } from 'next/server';

function apiResponse<T>(data: T | null, error: string | null = null, status = 200) {
  return NextResponse.json({ data, error }, { status });
}

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return apiResponse({ items: data });
  } catch (error) {
    return apiResponse(null, 'Internal server error', 500);
  }
}
```

### New UI Components

Additional components available in `/src/components/ui/`:

| Component | Import | Use Case |
|-----------|--------|----------|
| `Input` | `@/components/ui/Input` | Form inputs with validation states |
| `Badge` | `@/components/ui/Badge` | Status indicators, tags |
| `Modal` | `@/components/ui/Modal` | Dialogs, confirmations |
| `Toast` | `@/components/ui/Toast` | Notifications, alerts |
| `Tabs` | `@/components/ui/Tabs` | Tabbed navigation |
| `Accordion` | `@/components/ui/Accordion` | Expandable content |

### Prompt Engineering Tips

When working with Claude on this project:

1. **Reference design tokens**: "Use colors from tokens.ts"
2. **Specify component patterns**: "Follow the Button pattern in Button.tsx"
3. **Request accessibility**: "Include ARIA labels and keyboard navigation"
4. **Ask for both modes**: "Ensure it works in light and dark mode"

Example prompt structure:

```xml
<context>
Project: Light Brands AI Next.js Boilerplate
Design System: /src/design-system/tokens.ts
Component Pattern: /src/components/ui/Button.tsx
</context>

<task>
Create a [component name] that [description]
</task>

<requirements>
- Use design tokens only
- Support light/dark modes
- Include all interactive states
- Add proper TypeScript types
</requirements>
```

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, type check, build, test |
| `pr-review.yml` | PR | Design token check, a11y check, labeling |
| `deploy.yml` | Push to main | Deploy to Vercel, Lighthouse audit |

### Environment Variables

Required environment variables for full functionality:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Vercel (for deployments)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# AI (optional, for personalization features)
ANTHROPIC_API_KEY=your-claude-api-key
```

---

## Testing Guidelines

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### API Route Testing

```tsx
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('API /api/content', () => {
  it('returns published content', async () => {
    const request = new NextRequest('http://localhost/api/content');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
  });
});
```
