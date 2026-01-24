# Light Brands AI - Full Context for AI

> This file contains everything Claude needs to know to build websites with this boilerplate.
> Include this at the start of new conversations or reference it with: "Read /.claude/project-context.md"

---

## Tech Stack Summary

```yaml
Framework: Next.js 14+ (App Router)
Language: TypeScript (strict mode)
Styling: Tailwind CSS v4 + Custom Design Tokens
Animation: Framer Motion + GSAP
Icons: Lucide React
Images: Sharp optimization
Database: Supabase (PostgreSQL)
Auth: Supabase Auth (Email + OAuth)
Storage: Supabase Storage
```

## Design Tokens Quick Reference

### Colors (use these class names, never hex values)

```
Primary (Blue):    primary-50 → primary-950
Secondary (Violet): secondary-50 → secondary-950
Neutral (Grays):   neutral-0 (white) → neutral-950 (near-black)

Semantic:
- bg-background / text-foreground (auto light/dark)
- text-muted-foreground (secondary text)
- border-border (borders)
```

### Spacing (4px grid)

```
p-1 = 4px    p-2 = 8px    p-3 = 12px   p-4 = 16px
p-5 = 20px   p-6 = 24px   p-8 = 32px   p-10 = 40px
p-12 = 48px  p-16 = 64px  p-20 = 80px  p-24 = 96px
```

### Typography

```
text-7xl = 72px (hero only)
text-6xl = 60px (page titles)
text-5xl = 48px (section titles)
text-4xl = 36px (section titles mobile)
text-3xl = 30px (subheadings)
text-2xl = 24px (card titles)
text-xl = 20px (emphasis)
text-lg = 18px (lead paragraphs)
text-base = 16px (body)
text-sm = 14px (secondary)
text-xs = 12px (captions)

Weights: font-normal (400), font-medium (500), font-semibold (600), font-bold (700)
Tracking: tracking-tighter (display), tracking-tight (headings)
```

### Animation

```
Duration: 150ms (micro), 200ms (standard), 300ms (large), 500ms (page)
Easing: ease-smooth (default), ease-spring (playful), ease-bounce (attention)
```

## Component API Quick Reference

### Button
```tsx
<Button
  variant="primary|secondary|outline|ghost|gradient|destructive"
  size="sm|md|lg|xl"
  loading={boolean}
  icon={<Icon />}
  iconPosition="left|right"
  fullWidth={boolean}
  href="/path" // Makes it a link
>
  Label
</Button>
```

### Card
```tsx
<Card variant="default|elevated|bordered|glass|gradient" hover={boolean} href="/path">
  {children}
</Card>

<FeatureCard icon={Icon} title="Title" description="Desc" href="/path" gradient={boolean} />
<PricingCard name="Plan" price={29} features={[]} cta={{ label, href }} popular={boolean} />
<TestimonialCard quote="..." author={{ name, title, avatar }} rating={5} />
```

### Input
```tsx
<Input
  variant="default|filled|ghost"
  inputSize="sm|md|lg"
  state="default|success|error|loading"
  label="Label"
  hint="Helper text"
  error="Error message"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  showPasswordToggle={boolean}
/>
```

### Modal
```tsx
<Modal
  isOpen={boolean}
  onClose={() => {}}
  title="Title"
  description="Description"
  size="sm|md|lg|xl|full"
>
  {children}
  <ModalFooter>
    <Button variant="ghost">Cancel</Button>
    <Button>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Toast (requires ToastProvider in layout)
```tsx
const { toast, success, error, warning, info } = useToast();

success('Saved successfully', { description: 'Your changes have been saved' });
error('Something went wrong');
```

### Tabs
```tsx
<Tabs defaultValue="tab1" variant="default|pills|underline|bordered">
  <TabsList>
    <TabTrigger value="tab1">Tab 1</TabTrigger>
    <TabTrigger value="tab2">Tab 2</TabTrigger>
  </TabsList>
  <TabContent value="tab1">Content 1</TabContent>
  <TabContent value="tab2">Content 2</TabContent>
</Tabs>
```

### Accordion
```tsx
<Accordion type="single|multiple" variant="default|bordered|separated">
  <AccordionItem value="item1">
    <AccordionTrigger value="item1">Question</AccordionTrigger>
    <AccordionContent value="item1">Answer</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Hero Sections
```tsx
<HeroCentered
  badge={{ text: "New", href: "/new" }}
  title="Main headline"
  titleHighlight="highlight" // Word to gradient
  description="Supporting text"
  primaryCTA={{ label: "Get Started", href: "/start" }}
  secondaryCTA={{ label: "Learn More", href: "/about" }}
  trustedBy={[{ name: "Company", logo: "/logo.svg" }]}
/>

<HeroMinimal
  announcement={{ text: "Announcing v2.0", href: "/blog" }}
  title="Headline"
  subtitle="Subheadline"
  primaryCTA={{ label: "Start", href: "/" }}
  secondaryCTA={{ label: "Docs", href: "/docs" }}
/>
```

### CTA Section
```tsx
<CTASection
  variant="simple|gradient|split|centered"
  title="Ready to start?"
  description="Join thousands of users"
  primaryCTA={{ label: "Get Started", href: "/" }}
  secondaryCTA={{ label: "Contact Sales", href: "/contact" }}
/>
```

## File Structure

```
src/
├── app/                      # Pages (App Router)
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   ├── api/                  # API routes
│   └── (routes)/             # Other pages
├── components/
│   ├── ui/                   # Base components
│   ├── sections/             # Page sections
│   └── ai/                   # AI-powered components
├── design-system/
│   ├── tokens.ts             # All design values
│   └── theme.css             # CSS variables
└── lib/
    ├── utils.ts              # cn() helper
    ├── seo.tsx               # SEO utilities
    └── supabase/             # Database client
```

## Common Patterns

### Page Layout
```tsx
export default function Page() {
  return (
    <>
      <Navigation />
      <main>
        <HeroCentered {...heroProps} />
        <section className="section-padding">
          <div className="container-premium">
            {/* Content */}
          </div>
        </section>
        <CTASection {...ctaProps} />
      </main>
      <Footer />
    </>
  );
}
```

### Responsive Classes
```tsx
// Mobile first
className="px-4 sm:px-6 lg:px-8"
className="text-3xl md:text-4xl lg:text-5xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Dark Mode
```tsx
className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
```

### Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
>
```

## Critical Rules (MUST FOLLOW)

1. **No hardcoded colors** - Use `bg-primary-500`, never `bg-[#5a6df2]`
2. **4px spacing grid** - Use `p-4`, `gap-6`, never `p-[18px]`
3. **Mobile-first responsive** - Base styles for mobile, add `md:` `lg:` for larger
4. **Both light/dark modes** - Test appearance in both themes
5. **Use cn() for classes** - `className={cn('base', conditional && 'extra')}`
6. **TypeScript types** - Define interfaces for all props
7. **Accessibility** - ARIA labels, keyboard navigation, focus states

---

## Agent Orchestration System

This project uses an advanced multi-agent orchestration system for AI-assisted development.

### Quick Start

**Read `.claude/START.md`** - The universal entry point for any development task.

### System Overview

```
START.md (Entry Point)
    ↓
ORCHESTRATOR.md (Routing Logic)
    ↓
AGENT-REGISTRY.md (All Agents) + WORKFLOW-ROUTES.md (Patterns) + HANDOFF-PROTOCOLS.md (Transitions)
    ↓
Execution (Agents working with automatic handoffs)
```

### Agent Tiers

| Tier | Agents | Purpose |
|------|--------|---------|
| **Planning** | Analyst, PM, Architect, UX, Scrum Master | Discovery, specs, design |
| **Execution** | Developer, Testing, Security, Performance, Auditor | Implementation, validation |
| **Specialist** | UI Refinement, Simplifier, Debugger | Domain expertise |
| **Utility** | Git Writer, Library Advisor | Support functions |

### Key Commands

```
/autotask [description]        # Full autonomous execution
/plan-feature [name]           # Start feature planning
/dev [component] [phase]       # Execute development phase
@testing [file]                # Generate tests
@ui-refinement [path] [focus]  # Visual polish
/session save|resume|list      # Context management
```

### Complexity Scaling

| Level | Duration | Pipeline |
|-------|----------|----------|
| QUICK | 10-30 min | Developer → Test → Commit |
| BALANCED | 30 min - 2 hrs | PM → Architect → Dev → Test → Review → Polish |
| DEEP | 2+ hours | Full planning with all agents |

### Orchestration Files

```
.claude/
├── START.md                           # Universal entry point
└── project-context.md                 # This file

docs/orchestration/
├── ORCHESTRATOR.md                    # Master directive
├── AGENT-REGISTRY.md                  # Complete agent catalog
├── WORKFLOW-ROUTES.md                 # All workflow patterns
└── HANDOFF-PROTOCOLS.md               # Agent transitions

ai-workflows/
├── skills/                            # Custom commands
│   ├── plan-feature.md                # /plan-feature
│   └── dev.md                         # /dev
└── subagents/                         # Specialist agents
    ├── testing-agent.md               # @testing
    └── ui-refinement-agent.md         # @ui-refinement
```

**For any development task, start with `.claude/START.md`**
