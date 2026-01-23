# 🚀 Start Building Your Website

## Step 1: Quick Setup (2 minutes)

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Start development server
pnpm dev
```

## Step 2: Copy This to Claude

Copy the entire prompt below and paste it to Claude to start building your website:

---

### 📋 COPY FROM HERE ↓

```
I'm starting a new website project using the Light Brands AI Next.js Boilerplate. Please read the project context and help me build my site.

## Boilerplate Overview

Tech: Next.js 14+ App Router, TypeScript, Tailwind CSS v4, Framer Motion, Supabase
Design: Premium tokens (primary blue #5a6df2, secondary violet #a855f7, 4px spacing grid)
Components: Button, Card, Input, Modal, Toast, Tabs, Accordion, Navigation, Footer
Sections: HeroCentered, HeroSplit, HeroMinimal, CTASection (4 variants)

Key Rules:
- Use design tokens only (bg-primary-500, not #5a6df2)
- 4px/8px spacing grid (p-4, gap-6, not p-[18px])
- Support light AND dark modes
- Use cn() for class names
- TypeScript interfaces for all props

## My Website

**Name:** [YOUR WEBSITE NAME]
**Type:** [SaaS / Portfolio / Agency / E-commerce / Blog / Other]
**Goal:** [What should visitors do? Sign up, buy, contact, etc.]

**Pages I need:**
1. Homepage
2. [Page 2]
3. [Page 3]
4. [Add more as needed]

**Sections I want:**
- Hero with [describe what you want]
- [Feature grid / How it works / Benefits]
- [Testimonials / Social proof]
- [Pricing / CTA]
- [FAQ / Contact]

**Style preferences:**
- Sites I like: [Reference URLs or describe the style]
- Feeling: [Professional / Playful / Minimal / Bold]
- Colors: [Use defaults OR specify preferences]

**Do I need:**
- [ ] User authentication
- [ ] Database (Supabase)
- [ ] Contact form
- [ ] Blog

## What I want you to do:

1. Confirm you understand the project
2. Create a simple plan (pages + sections)
3. Start building the homepage

Let's go!
```

### ↑ COPY TO HERE

---

## Step 3: Build With Claude

After pasting the prompt, Claude will:

1. **Confirm understanding** of your project
2. **Create a plan** with pages and components
3. **Build your homepage** using the design system

### Useful Follow-Up Commands

**Build a page:**
```
Build the [Features/Pricing/About] page with:
- [Section 1]
- [Section 2]
- [Section 3]
```

**Create a component:**
```
Create a [ComponentName] that [description].
Follow the Button.tsx pattern.
Include variants: [list them]
```

**Polish a page:**
```
Review [page/component] and improve:
- Spacing and alignment
- Typography hierarchy
- Hover/focus states
- Animations
- Dark mode
```

**Generate content:**
```
Write copy for [section]:
- Headline: [tone/angle]
- Description: [key message]
- CTA: [action]
Brand voice: [personality]
```

---

## Reference Files

| What | Where |
|------|-------|
| Development rules | `/AI-RULES.md` |
| Design tokens | `/src/design-system/tokens.ts` |
| Full AI context | `/.claude/project-context.md` |
| Component examples | `/src/components/ui/` |
| Kickoff templates | `/KICKOFF.md` |

---

## Need More Control?

For detailed project planning, see `/KICKOFF.md` which has:
- Comprehensive project templates
- Example filled-out kickoffs
- Advanced follow-up prompts

---

**Happy building!** 🎉
