# Light Brands AI - Premium Next.js Boilerplate

A production-ready Next.js 14+ boilerplate with AI-first workflows. Build premium websites faster with Claude.

---

## Start Building in 60 Seconds

### Option 1: Interactive Setup (Recommended)

```bash
pnpm install
pnpm setup      # Interactive wizard
pnpm dev        # Start building
```

### Option 2: Just Paste to Claude

Copy this to Claude and start building:

```
Help me build a website using the Light Brands AI Next.js Boilerplate.

I'm using: Next.js 14+, TypeScript, Tailwind v4, Framer Motion
Design: primary blue, secondary violet, 4px grid
Components: Button, Card, Input, Modal, Navigation, Footer, Hero sections

Rules: Use design tokens (bg-primary-500), 4px spacing, support dark mode

Interview me to understand my project:
1. Website name and what it does?
2. Type? (SaaS, Portfolio, Agency, Product, Blog)
3. What should visitors do?
4. What style? (minimal, bold, friendly, dark)
5. What pages?

Then create a plan and let's build!
```

### Option 3: Detailed Setup

See `PASTE-TO-CLAUDE.md` for the full prompt, or `KICKOFF.md` for comprehensive templates.

---

## Features

- **AI-First Development** - Setup wizard, prompt templates, and guidelines optimized for Claude
- **Premium Design System** - Apple/Vercel-inspired aesthetics with comprehensive design tokens
- **Admin Dashboard** - Full-featured admin panel with content, media, users, analytics, and settings
- **Full-Stack Ready** - Supabase integration for auth, database, and storage
- **20+ Components** - Button, Card, Input, Modal, Toast, Tabs, Navigation, and more
- **Hero Sections** - 3 variants with animations (Centered, Split, Minimal)
- **Dark/Light Mode** - Full theme support with toggle, defaults to dark mode
- **Animations** - GSAP + Framer Motion built-in
- **TypeScript** - Strict type checking throughout
- **Performance** - 90+ Lighthouse scores
- **SEO** - Metadata utilities, structured data, sitemaps
- **CI/CD** - GitHub Actions for lint, test, deploy

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the example landing page.

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── globals.css           # Global styles + Tailwind config
│   ├── layout.tsx            # Root layout with SEO
│   ├── page.tsx              # Example landing page
│   ├── (admin)/              # Admin route group
│   │   └── admin/
│   │       ├── layout.tsx    # Admin layout with sidebar
│   │       ├── page.tsx      # Dashboard
│   │       ├── content/      # Content management
│   │       ├── media/        # Media library
│   │       ├── users/        # User management
│   │       ├── analytics/    # Analytics dashboard
│   │       ├── feedback/     # Feedback management
│   │       └── settings/     # Settings page
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx        # Button with variants
│   │   ├── Card.tsx          # Card variants (Feature, Pricing, Testimonial)
│   │   ├── Navigation.tsx    # Responsive nav with theme toggle
│   │   └── Footer.tsx        # Footer with newsletter
│   ├── admin/                # Admin components
│   │   ├── AdminSidebar.tsx  # Collapsible sidebar navigation
│   │   ├── AdminHeader.tsx   # Header with search and user menu
│   │   ├── DataTable.tsx     # Sortable, filterable data table
│   │   └── Skeleton.tsx      # Loading skeletons
│   └── sections/             # Page sections
│       ├── HeroCentered.tsx  # Centered hero variant
│       ├── HeroSplit.tsx     # Split layout hero
│       ├── HeroMinimal.tsx   # Minimal animated hero
│       └── CTASection.tsx    # CTA section variants
├── design-system/
│   ├── tokens.ts             # Design token definitions
│   ├── theme.css             # CSS variables (light/dark)
│   └── DESIGN-PRINCIPLES.md  # Design guidelines
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── seo.tsx               # SEO utilities
│   ├── theme.tsx             # Theme provider and hook
│   └── admin/
│       └── auth.tsx          # Admin authentication context
└── AI-RULES.md               # AI development guidelines
```

---

## Design System

### Design Tokens

All design tokens are defined in `src/design-system/tokens.ts`:

- **Colors** - Primary, secondary, neutral palettes with 11 shades each
- **Typography** - Font families, sizes, weights, and line heights
- **Spacing** - 4px/8px base grid system
- **Shadows** - Subtle to prominent elevation system
- **Radius** - Consistent border radius scale
- **Animation** - Timing functions and durations

### Using Design Tokens

```tsx
// Always use design tokens via Tailwind classes
<div className="bg-primary-500 text-neutral-900 p-6 rounded-xl">
  <h2 className="text-3xl font-bold tracking-tight">Heading</h2>
  <p className="text-lg text-neutral-600">Body text</p>
</div>

// NEVER hardcode values
<div style={{ backgroundColor: '#5a6df2', padding: '24px' }}> // Bad
```

### Dark/Light Mode

Theme support is built-in with a ThemeProvider context. Dark mode is the default.

```tsx
// These automatically adapt to light/dark mode
<div className="bg-background text-foreground border-border">

// Or use explicit dark: variants
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
```

Toggle theme programmatically:

```tsx
import { useTheme } from '@/lib/theme';

function MyComponent() {
  const { resolvedTheme, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

// Or set specific theme
setTheme('light');  // 'light' | 'dark' | 'system'
```

---

## Components

### Button

```tsx
import { Button } from '@/components/ui/Button';

// Variants: primary, secondary, outline, ghost, gradient, destructive
<Button variant="primary" size="lg" icon={<ArrowRight />}>
  Get Started
</Button>

// As a link
<Button href="/pricing" variant="gradient">
  View Pricing
</Button>
```

### Cards

```tsx
import { FeatureCard, PricingCard, TestimonialCard } from '@/components/ui/Card';

<FeatureCard
  icon={Zap}
  title="Lightning Fast"
  description="Optimized for performance"
  gradient
/>
```

### Hero Sections

```tsx
import { HeroCentered, HeroSplit, HeroMinimal } from '@/components/sections';

<HeroCentered
  badge={{ text: 'New', href: '#' }}
  title="Build Premium Websites"
  titleHighlight="Premium"
  description="Ship faster with our boilerplate"
  primaryCta={{ label: 'Get Started', href: '#' }}
  secondaryCta={{ label: 'Learn More', href: '#' }}
/>
```

### CTA Section

```tsx
import { CTASection } from '@/components/sections/CTASection';

// Variants: simple, gradient, split, centered
<CTASection
  variant="gradient"
  title="Ready to start?"
  description="Get started today"
  primaryCta={{ label: 'Start Free', href: '#' }}
/>
```

---

## Admin Dashboard

A full-featured admin panel is included at `/admin`. Features:

- **Dashboard** - Overview with stats, charts, and activity feed
- **Content Management** - Create, edit, and manage content
- **Media Library** - Upload and organize images and files
- **User Management** - View and manage users
- **Analytics** - Traffic and engagement metrics
- **Feedback** - Customer feedback and support
- **Settings** - App configuration

### Accessing Admin

```bash
# Visit /admin/login
# Demo credentials are pre-filled - click "Try Demo Mode"
```

### Admin Authentication

The admin uses a context-based auth system with Supabase integration:

```tsx
import { useAdminAuth } from '@/lib/admin/auth';

function AdminComponent() {
  const { user, isLoading, isDemo, logout } = useAdminAuth();

  if (isLoading) return <Loading />;
  if (!user) return <Redirect to="/admin/login" />;

  return <Dashboard user={user} />;
}
```

### Demo Mode

When Supabase is not configured, the admin runs in demo mode with sample data. This allows you to explore the interface without backend setup.

---

## SEO

### Metadata Helper

```tsx
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Page Title',
  description: 'Page description',
  pathname: '/page-path',
});
```

### Structured Data

```tsx
import { JsonLd, generateFAQSchema } from '@/lib/seo';

<JsonLd data={generateFAQSchema([
  { question: 'What is this?', answer: 'A boilerplate.' }
])} />
```

---

## Animations

### GSAP

```tsx
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.from('.element', {
  y: 40,
  opacity: 0,
  duration: 0.8,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.element',
    start: 'top 80%',
  },
});
```

### Framer Motion

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
>
  Content
</motion.div>
```

---

## AI Development

When working with AI assistants, point them to:

1. **`AI-RULES.md`** - Comprehensive development guidelines
2. **`src/design-system/DESIGN-PRINCIPLES.md`** - Design rules
3. **`src/design-system/tokens.ts`** - Available design tokens

Key principles:

- Always use design tokens
- Never hardcode colors or spacing
- Test in both light and dark modes
- Follow component patterns

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: GSAP, Framer Motion
- **Icons**: Lucide React
- **Images**: Sharp (via Next.js Image)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 100 |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

---

## Deployment

Deploy instantly on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or build and deploy anywhere:

```bash
npm run build
npm start
```

---

## AI Development Resources

| File | Purpose |
|------|---------|
| `PASTE-TO-CLAUDE.md` | Quick-start prompt to paste to Claude |
| `KICKOFF.md` | Detailed project templates |
| `AI-RULES.md` | Development guidelines for AI |
| `.claude/project-context.md` | Full context file |
| `prompt-library/` | Mega-prompts for common tasks |

### Setup Commands

```bash
pnpm setup          # Interactive setup wizard
pnpm dev            # Start development
pnpm build          # Production build
pnpm lint           # Run linting
pnpm type-check     # TypeScript check
```

---

## Full Documentation

- `README-UPDATES.md` - All AI-first additions
- `ui-polish/ui-polish.md` - UI refinement guide
- `supabase/schema.sql` - Database schema

---

## Tools & Features Deep Dive

### Developer Tools Suite

The admin panel includes powerful developer tools at `/admin/dev`:

| Tool | Route | Description |
|------|-------|-------------|
| **Dev Tracker** | `/admin/dev/tracker` | Epic-based task tracking with phases (Foundation, MVP, Growth), task categorization, dependency tracking, and status visualization |
| **AutoDev** | `/admin/dev/autodev` | AI-powered operations hub for code generation and automation |
| **Feedback Capture** | `/admin/dev/feedback` | Contextual feedback system with visual markers, screenshots, and resolution tracking |

### AI Content Generation

Located at `/admin/content/generator`, the AI content system provides:

- **Generation Types**: Blog posts, social media content, meta descriptions, alt text, content rewrites
- **Tone Options**: Professional, Casual, Technical, Friendly, Authoritative
- **Prompt Templates**: Product announcements, how-to guides, industry insights, case studies
- **Batch Processing**: Queue management with progress tracking for bulk AI operations

### Content Management System

Full CMS capabilities at `/admin/content`:

| Feature | Description |
|---------|-------------|
| **Posts** | Create, edit, publish with status workflows (draft → published → archived) |
| **Scheduled Publishing** | Queue content for future publication |
| **Categories & Tags** | Hierarchical organization with post counts |
| **Media Integration** | Inline media uploads with optimization |
| **Author Attribution** | Multi-author support with role-based permissions |

### Analytics Dashboard

Comprehensive metrics at `/admin/analytics`:

- **Overview Stats**: Total visitors, page views, session duration, bounce rate with trend indicators
- **Visitor Trends**: Time-series visualization with date range filters (7, 30, 90 days, year)
- **Device Breakdown**: Desktop (58%), Mobile (35%), Tablet (7%) distribution
- **Top Pages**: Most visited pages with view counts and performance trends
- **Traffic Sources**: Direct, organic search, referral, and social breakdown
- **Geographic Data**: Top countries by visitor count with percentages

### Feedback System

Complete feedback management at `/admin/feedback`:

**Capture Features:**
- Visual markers on pages showing feedback locations
- Screenshot capture with base64 encoding
- Text context capture (50 lines before/after)
- Element metadata (tag, ID, classes, data-attributes)
- Position tracking (pixel + viewport coordinates)

**Management Features:**
- Categories: Bug, Enhancement, Question, Content
- Priority Levels: Low, Medium, High, Critical
- Status Tracking: New → In Progress → Resolved/Blocked
- Bulk actions for efficient management

### Authentication & User Management

**Demo Mode** (no backend required):
- Email: `demo@lightbrands.dev` / Password: `demo1234`
- Full feature access for testing

**Production Mode** (Supabase):
- Email/password authentication
- OAuth support via callback handler
- Auto-profile creation on signup
- Session persistence with localStorage

**Roles & Permissions:**

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: all features, settings, user management |
| **Editor** | Create/edit content, upload media, view analytics |
| **User** | View published content only |

### API Routes

RESTful endpoints for all major features:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/content` | GET, POST, PATCH, DELETE | Full CRUD for content with status filtering |
| `/api/media` | GET, POST, DELETE | File uploads with image optimization (Sharp) |
| `/api/feedback` | GET, POST | Feedback capture with screenshots |
| `/api/feedback/[id]` | GET, PUT, DELETE | Individual feedback management |
| `/api/ai/personalize` | POST | AI content personalization by industry/role |
| `/api/auth/callback` | GET | OAuth callback handler |

### Media Library

Full asset management at `/admin/media`:

- **Supported Formats**: JPG, PNG, GIF, WebP, SVG, PDF
- **File Size Limit**: 10MB per upload
- **Auto-Optimization**: Images resized to max 2048px at 85% quality via Sharp
- **Metadata Tracking**: Dimensions, alt text, file type, size, upload date
- **Organization**: Grid/list views, search, filter by type
- **Usage Tracking**: Count of content items using each asset

### Database Schema

PostgreSQL via Supabase with 5 core tables:

```
profiles      - User profiles extending auth.users (role, avatar, metadata)
content       - CMS content (posts, pages with status workflow)
media         - Uploaded assets with dimensions and alt text
settings      - Key-value configuration store
analytics_events - Event tracking with session and user context
```

**Security Features:**
- Row-Level Security (RLS) on all tables
- Role-based access control
- Published content visible to all, draft/private protected
- Users can only manage their own uploads

### Design System

100+ predefined design tokens:

- **Colors**: Primary (blue), Secondary (violet), Neutral (11 shades each)
- **Typography**: 8 font sizes with proper scale (10px-72px)
- **Spacing**: 4px base grid system
- **Shadows**: 5-level elevation system (subtle → prominent)
- **Radius**: Consistent border radius scale
- **Animations**: GSAP + Framer Motion with timing presets

### CI/CD Workflows

GitHub Actions automation:

| Workflow | Trigger | Features |
|----------|---------|----------|
| `ci.yml` | Push/PR | Lint, type check, build, test, bundle analysis |
| `pr-review.yml` | PR | Design token validation, a11y audit, auto-labeling |
| `deploy.yml` | Push to main | Vercel deployment, Lighthouse audit |

### AI Workflow Automation

Located in `/ai-workflows/`:

- **Claude Configuration**: `CLAUDE.md` for AI development rules
- **Skills**: Custom commands (`/plan-feature`, `/dev`)
- **Hooks**: Automated checks (design tokens, lint, format)
- **Subagents**: Testing specialist, UI refinement specialist
- **Prompt Library**: Mega-prompts for common tasks

---

## License

MIT
