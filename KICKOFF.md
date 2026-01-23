# Project Kickoff Template

> Copy this entire file and paste it to Claude when starting a new website project

---

## 🚀 COPY EVERYTHING BELOW THIS LINE TO START YOUR PROJECT

```
You are building a premium website using the Light Brands AI Next.js Boilerplate. Before we begin development, I need you to understand the project structure and then help me plan and build my website.

## Boilerplate Context

This is a production-ready Next.js 14+ boilerplate with:

**Tech Stack:**
- Next.js App Router with TypeScript
- Tailwind CSS v4 with custom design tokens
- Framer Motion + GSAP for animations
- Supabase for database, auth, and storage
- Lucide icons, Sharp for image optimization

**Design System** (`/src/design-system/tokens.ts`):
- Colors: Primary blue (#5a6df2), Secondary violet (#a855f7), Neutral grays
- Typography: System fonts, scale from 10px-72px, weights 400-800
- Spacing: 4px/8px base grid
- Animations: 200ms default, ease-smooth timing
- Shadows, radius, and z-index scales included

**Available Components** (`/src/components/ui/`):
- Button (primary, secondary, outline, ghost, gradient variants)
- Card (default, elevated, bordered, glass, gradient + FeatureCard, PricingCard, TestimonialCard, Interactive3DCard)
- Input (with validation states, icons, password toggle)
- Badge, Modal, Toast, Tabs, Accordion
- Navigation (desktop/mobile, theme toggle, dropdowns)
- Footer (full and minimal variants)

**Section Components** (`/src/components/sections/`):
- HeroCentered, HeroSplit, HeroMinimal
- CTASection (simple, gradient, split, centered variants)

**AI Components** (`/src/components/ai/`):
- DynamicHero (AI-personalized content)
- FeedbackWidget (AI-analyzed feedback)

**Key Files to Reference:**
- `/AI-RULES.md` - Development guidelines (MUST follow)
- `/src/design-system/DESIGN-PRINCIPLES.md` - Design guidelines
- `/src/lib/utils.ts` - cn() utility for class merging
- `/src/lib/seo.tsx` - SEO utilities and schema generators

**Critical Rules:**
1. NEVER hardcode colors - use design tokens (bg-primary-500, text-neutral-900, etc.)
2. ALWAYS use 4px/8px spacing grid
3. ALWAYS support light AND dark modes
4. Use cn() for conditional class names
5. Use Framer Motion for interactive animations
6. Include proper TypeScript types
7. Add ARIA labels for accessibility

---

## My Website Project

**Website Name:** [YOUR WEBSITE NAME]

**Type:** [e.g., SaaS landing page, Portfolio, E-commerce, Blog, Agency site, Product showcase]

**Industry:** [e.g., Technology, Finance, Healthcare, E-commerce, Creative, Education]

**Target Audience:** [Describe your ideal visitors - their role, age, tech-savviness, goals]

**Brand Personality:** [e.g., Professional & trustworthy, Bold & innovative, Friendly & approachable, Minimal & sophisticated]

**Primary Goal:** [What's the #1 action you want visitors to take?]

**Key Pages Needed:**
1. [Page 1 - e.g., Homepage]
2. [Page 2 - e.g., Features/Services]
3. [Page 3 - e.g., Pricing]
4. [Page 4 - e.g., About]
5. [Page 5 - e.g., Contact]

**Content Sections Needed:** [List the sections you want, e.g., Hero, Features grid, Testimonials, FAQ, CTA, etc.]

**Special Features:**
- [ ] User authentication
- [ ] Blog/Content management
- [ ] Contact form
- [ ] Newsletter signup
- [ ] Pricing tables
- [ ] Testimonials
- [ ] FAQ section
- [ ] Team section
- [ ] Portfolio/Case studies
- [ ] Other: [specify]

**Design Preferences:**
- Reference sites I like: [URLs or descriptions]
- Color preferences: [Keep default blue/violet OR specify preferences]
- Style notes: [Any specific visual preferences]

**Existing Assets:**
- Logo: [Yes/No - describe if yes]
- Brand colors: [If different from default]
- Copy/Content: [Ready/Need help writing]
- Images: [Have them/Need placeholders]

---

## What I Need You To Do

1. **First**, confirm you understand the boilerplate and my project requirements
2. **Then**, create a project plan with:
   - Sitemap and page structure
   - Component list (existing components to use + new ones needed)
   - Data model (if using Supabase)
   - Implementation phases
3. **Finally**, start building when I approve the plan

Start by summarizing what you understand about my project and asking any clarifying questions.
```

---

## 📋 QUICK FILL EXAMPLES

### Example 1: SaaS Landing Page

```
**Website Name:** CloudSync Pro

**Type:** SaaS landing page

**Industry:** Technology / Productivity

**Target Audience:** Small business owners and startup founders, 25-45, moderate tech-savviness, looking to streamline their workflow

**Brand Personality:** Professional & innovative, trustworthy with a modern edge

**Primary Goal:** Get users to start a free trial

**Key Pages Needed:**
1. Homepage (hero, features, testimonials, pricing preview, CTA)
2. Features page (detailed feature breakdown)
3. Pricing page (3 tiers)
4. About page (team, mission, story)
5. Contact page

**Content Sections Needed:**
- Hero with product mockup
- Feature grid (6 features with icons)
- How it works (3 steps)
- Testimonials carousel
- Pricing comparison
- FAQ
- Final CTA

**Special Features:**
- [x] User authentication
- [ ] Blog/Content management
- [x] Contact form
- [x] Newsletter signup
- [x] Pricing tables
- [x] Testimonials
- [x] FAQ section
- [ ] Team section

**Design Preferences:**
- Reference sites: Linear.app, Vercel.com
- Color preferences: Keep default (blue/violet works great)
- Style: Clean, minimal, lots of whitespace, subtle animations

**Existing Assets:**
- Logo: Yes - SVG wordmark
- Brand colors: Using defaults
- Copy/Content: Have headlines, need help with body copy
- Images: Need placeholder product mockups
```

### Example 2: Agency Portfolio

```
**Website Name:** Studio Noir

**Type:** Creative agency portfolio

**Industry:** Design / Creative

**Target Audience:** Marketing directors and brand managers at mid-size companies, looking for premium design partners

**Brand Personality:** Bold, sophisticated, artistic

**Primary Goal:** Get visitors to book a consultation call

**Key Pages Needed:**
1. Homepage (impactful hero, selected work, services overview)
2. Work/Portfolio (case study grid)
3. Services page
4. About page (team, values, process)
5. Contact page

**Content Sections Needed:**
- Full-screen video hero
- Selected work grid (hover effects)
- Services with expandable details
- Client logos
- Team grid
- Process timeline
- Contact with booking

**Special Features:**
- [ ] User authentication
- [x] Blog/Content management (for case studies)
- [x] Contact form
- [ ] Newsletter signup
- [ ] Pricing tables
- [x] Testimonials
- [ ] FAQ section
- [x] Team section
- [x] Portfolio/Case studies

**Design Preferences:**
- Reference sites: BasicAgency.com, Pentagram.com
- Color preferences: Dark mode primary, accent color for highlights
- Style: Editorial, bold typography, dramatic imagery

**Existing Assets:**
- Logo: Yes - animated logo
- Brand colors: Black primary, electric blue accent
- Copy/Content: Ready
- Images: Have high-res project images
```

---

## 🔧 AFTER KICKOFF: Useful Follow-up Prompts

### To Generate a Specific Page:
```
Build the [PAGE NAME] page with these sections:
1. [Section 1]
2. [Section 2]
3. [Section 3]

Use existing components where possible. Follow the design system.
```

### To Create a New Component:
```
Create a [COMPONENT NAME] component that:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Follow the pattern in /src/components/ui/Button.tsx
Include all variants: [list variants]
Support light and dark modes.
```

### To Polish a Page:
```
Review [PAGE/COMPONENT] and improve:
1. Spacing consistency (4px/8px grid)
2. Typography hierarchy
3. Interactive states (hover, focus, active)
4. Animations (entrance, hover effects)
5. Dark mode appearance
6. Mobile responsiveness
```

### To Set Up Supabase:
```
Set up Supabase for my project with:
- Tables: [list what data you need to store]
- Auth: [email only / OAuth providers needed]
- Storage: [what files users will upload]

Generate the schema SQL and update the types.ts file.
```

### To Generate Content:
```
Write compelling copy for the [SECTION NAME] section:
- Headline: [tone/angle]
- Subheadline: [supporting message]
- Body: [key points to cover]
- CTA: [action you want users to take]

Match the brand voice: [brand personality]
```
