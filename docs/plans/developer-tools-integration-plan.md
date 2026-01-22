# Developer Tools Integration Plan

**Project:** Local-IDE Admin Dashboard
**Version:** 1.0
**Date:** January 22, 2026
**Status:** Planning

---

## Executive Summary

This plan outlines the integration of four core developer tools from the design-system-v2 project into the local-ide admin dashboard as a new "Developer Tools" section. This creates a clear separation between **Business Operations** (existing tabs: Dashboard, Content, Media, Users, Analytics, Feedback, Settings) and **Development Operations** (new section: Dev Dashboard, Dev Tracker, Feedback Module, AutoDev).

The integration will maintain the local-ide's premium, Apple-inspired aesthetic while bringing over the full functionality of the design-system-v2 developer tools.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Tools to Integrate](#3-tools-to-integrate)
4. [Design System Alignment](#4-design-system-alignment)
5. [Implementation Plan](#5-implementation-plan)
6. [Component Migration Strategy](#6-component-migration-strategy)
7. [Data & State Management](#7-data--state-management)
8. [Routing Structure](#8-routing-structure)
9. [Phase Rollout](#9-phase-rollout)
10. [Technical Considerations](#10-technical-considerations)
11. [Risk Assessment](#11-risk-assessment)

---

## 1. Current State Analysis

### 1.1 Local-IDE Dashboard (Target)

**Tech Stack:**
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion + GSAP
- Supabase (optional)

**Current Admin Sections:**
| Section | Purpose | Type |
|---------|---------|------|
| Dashboard | Overview stats & activity | Business Ops |
| Content | Pages & blog posts | Business Ops |
| Media | File library | Business Ops |
| Users | User management | Business Ops |
| Analytics | Traffic & metrics | Business Ops |
| Feedback | User feedback | Business Ops |
| Settings | Configuration | Business Ops |

**Design Philosophy:**
- Premium, enterprise-grade feel
- Apple-inspired spacing and typography
- Cool-toned color palette (indigo/blue primary)
- Subtle animations with spring physics
- Clean, minimalist design language

### 1.2 Design-System-V2 (Source)

**Tech Stack:**
- React 18 + TypeScript
- Tailwind CSS (custom tokens)
- Context API + useReducer
- localStorage persistence

**Developer Tools:**
| Tool | Purpose | Complexity |
|------|---------|------------|
| Dashboard | Dev command center | Medium |
| Dev Tracker | Task/epic tracking | High |
| Feedback Module | Contextual feedback capture | High |
| AutoDev | AI-powered autonomous ops | Very High |

---

## 2. Architecture Overview

### 2.1 Proposed Navigation Structure

```
Admin Dashboard
├── [Business Operations - Existing]
│   ├── Dashboard
│   ├── Content
│   ├── Media
│   ├── Users
│   ├── Analytics
│   ├── Feedback (user feedback)
│   └── Settings
│
└── [Developer Tools - NEW]
    ├── Dev Dashboard (root)
    ├── Dev Tracker
    ├── Dev Feedback
    └── AutoDev
```

### 2.2 Sidebar Integration Options

**Option A: Collapsible Section (Recommended)**
```
├── Dashboard
├── Content
├── Media
├── Users
├── Analytics
├── Feedback
├── Settings
├── ─────────────────
├── ▼ Developer Tools
│   ├── Dev Dashboard
│   ├── Tracker
│   ├── Dev Feedback
│   └── AutoDev
```

**Option B: Mode Toggle**
- Toggle between "Business" and "Developer" modes
- Entire sidebar changes based on mode
- Cleaner but requires context switching

**Option C: Top-Level Tab**
- "Developer" as equal top-level item
- Sub-navigation appears when selected
- Similar to existing Settings tabs pattern

### 2.3 Recommended Approach: Option A

The collapsible section maintains a single navigation context while clearly delineating business vs. development tools. A visual divider and distinct section header make the separation clear.

---

## 3. Tools to Integrate

### 3.1 Dev Dashboard

**Source:** `/pages/Dashboard.tsx`
**Purpose:** Central command center for development operations

**Features to Bring:**
- [ ] Epic navigation grid (9 epics with progress rings)
- [ ] Quick stats bar (components, epics, specs, features)
- [ ] Live widget section (customizable development widgets)
- [ ] Spec documentation quick links
- [ ] Phase indicators and progress metrics
- [ ] Personalized greeting with AI integration point

**Adaptations Required:**
- Replace VIBEUP branding with local-ide branding
- Adapt color scheme (abyss/aqua/teal → indigo/blue/violet)
- Integrate with local-ide navigation system
- Connect to local project data (epics, tasks, specs)

**Key Components to Migrate:**
```
/components/DashboardComponents.tsx
├── DashboardHeader
├── QuickStatsBar
├── EpicCard
├── ComponentWidget
├── SpecDocLink
├── SectionDivider
└── MiniProfileWidget
```

### 3.2 Dev Tracker

**Source:** `/pages/Tracker.tsx`
**Purpose:** Comprehensive development task and progress tracking

**Features to Bring:**
- [ ] Overview tab with epic statistics and progress visualization
- [ ] Tasks tab with filtering by type (table, endpoint, service, component, test, config)
- [ ] TDD tab with coverage thresholds and test inventory
- [ ] Routes tab with API documentation and examples
- [ ] Tooling tab with commands, AI agents, and coding rules
- [ ] Architecture tab with system diagrams

**Tab Structure:**
| Tab | Icon | Purpose |
|-----|------|---------|
| Overview | 📊 | High-level progress and dependencies |
| Tasks | 📋 | Task breakdown by epic and type |
| TDD | 🧪 | Test coverage and TDD metrics |
| Routes | 🔌 | API route documentation |
| Tooling | 🔧 | Commands, agents, coding rules |
| Architecture | 🏗️ | System architecture diagrams |

**Key Components to Migrate:**
```
/pages/Tracker.tsx
/data/trackerData.ts
├── EpicOverview
├── ProgressRing
├── StatusBadge
├── DependencyGraph
├── TaskList
├── TDDDashboard
├── RoutesTab
├── ToolingStatus
└── ArchitectureTab
```

### 3.3 Dev Feedback Module

**Source:** `/pages/Feedback.tsx`, `/contexts/FeedbackContext.tsx`
**Purpose:** Contextual feedback capture with position tracking

**Features to Bring:**
- [ ] Floating feedback button (always accessible)
- [ ] Click-to-capture mode with DOM context
- [ ] Feedback form (category, priority, title, notes)
- [ ] Screenshot capture capability
- [ ] Feedback markers layer (visual indicators)
- [ ] Feedback dashboard with filtering
- [ ] Navigate-to-feedback functionality

**Key Distinction:**
- **Existing admin Feedback:** User-submitted feedback from public site
- **Dev Feedback:** Developer feedback during development/QA

**Key Components to Migrate:**
```
/pages/Feedback.tsx
/contexts/FeedbackContext.tsx
/data/feedbackStorage.ts
/components/feedback/
├── FeedbackButton
├── FeedbackMode
├── FeedbackModal
├── FeedbackMarkerLayer
├── FeedbackMarker
├── FeedbackDetail
└── FeedbackPreview
```

### 3.4 AutoDev

**Source:** `/pages/Autodev.tsx`, `/contexts/AutodevContext.tsx`
**Purpose:** AI-powered autonomous development operations

**Features to Bring:**
- [ ] Command Center (system health, alerts, recommendations)
- [ ] Sentinel Dashboard (real-time monitoring with 6 metrics)
- [ ] Pulse Dashboard (periodic analysis cycles)
- [ ] Cortex Dashboard (AI intelligence, patterns, predictions)
- [ ] Genesis Dashboard (self-healing rules and autonomy dial)
- [ ] Nexus Dashboard (configuration and audit trail)
- [ ] AI Chat Panel (contextual assistance)

**Tab Structure:**
| Tab | Icon | Color | Purpose |
|-----|------|-------|---------|
| Command | ⌘ | Purple/Indigo | Main dashboard |
| Sentinel | 👁️ | Cyan/Blue | Real-time monitoring |
| Pulse | 💓 | Pink/Rose | Periodic analysis |
| Cortex | 🧠 | Emerald/Teal | AI intelligence |
| Genesis | 🔧 | Orange/Amber | Self-healing |
| Nexus | ⚙️ | Slate/Zinc | Configuration |

**Key Components to Migrate:**
```
/pages/Autodev.tsx
/contexts/AutodevContext.tsx
/data/autodevTypes.ts
/data/autodevStorage.ts
/components/autodev/
├── NeuralBackground
├── ProgressRing
├── Sparkline
├── StatusIndicator
├── GlowCard
├── AnimatedNumber
├── AutonomyDial
├── AIChatPanel
└── Dashboard Components (per tab)
```

---

## 4. Design System Alignment

### 4.1 Color Mapping

| Design-System-V2 | Local-IDE Equivalent | Usage |
|------------------|---------------------|-------|
| `abyss-base` | `neutral-950` / `gray-950` | Dark backgrounds |
| `aqua-light` | `blue-400` / `indigo-400` | Success, complete |
| `teal-light` | `teal-400` / `cyan-400` | Secondary accent |
| `gold-accent` | `amber-400` / `yellow-400` | Warnings, in-progress |
| `purple-glow` | `violet-500` / `purple-500` | AI, special features |

### 4.2 Component Style Mapping

| Source Style | Target Style |
|--------------|--------------|
| Rounded corners (16-20px) | `rounded-2xl` to `rounded-3xl` |
| Border color (white/10) | `border-neutral-200 dark:border-neutral-800` |
| Gradient text | Same approach with local-ide colors |
| Hover glow effects | Adapt to local-ide shadow system |
| Card backgrounds | `bg-white dark:bg-neutral-900` |

### 4.3 Animation Alignment

The local-ide uses Framer Motion with spring physics. Key spring presets:

```typescript
// Local-IDE Spring Presets
const springs = {
  snappy: { stiffness: 500, damping: 35 },
  smooth: { stiffness: 180, damping: 25 },
  bouncy: { stiffness: 300, damping: 12, mass: 0.8 },
  gentle: { stiffness: 100, damping: 18 },
  premium: { stiffness: 250, damping: 28, mass: 0.9 },
};
```

### 4.4 Typography

Both systems use similar typography scales. Maintain local-ide font stack and weights.

---

## 5. Implementation Plan

### 5.1 Directory Structure

```
/src
├── app/(admin)/admin/
│   ├── dev/                          # NEW: Developer Tools section
│   │   ├── layout.tsx                # Dev section layout
│   │   ├── page.tsx                  # Dev Dashboard (root)
│   │   ├── tracker/
│   │   │   └── page.tsx              # Dev Tracker
│   │   ├── feedback/
│   │   │   └── page.tsx              # Dev Feedback
│   │   └── autodev/
│   │       └── page.tsx              # AutoDev
│   └── ... (existing pages)
│
├── components/
│   ├── admin/                        # Existing admin components
│   └── dev/                          # NEW: Developer components
│       ├── DevSidebar.tsx            # Optional: Dev-specific sidebar
│       ├── dashboard/
│       │   ├── EpicCard.tsx
│       │   ├── QuickStats.tsx
│       │   ├── WidgetGrid.tsx
│       │   └── index.ts
│       ├── tracker/
│       │   ├── TaskList.tsx
│       │   ├── ProgressRing.tsx
│       │   ├── RoutesTab.tsx
│       │   └── index.ts
│       ├── feedback/
│       │   ├── FeedbackButton.tsx
│       │   ├── FeedbackModal.tsx
│       │   ├── FeedbackMarker.tsx
│       │   └── index.ts
│       └── autodev/
│           ├── CommandCenter.tsx
│           ├── SentinelDashboard.tsx
│           ├── AutonomyDial.tsx
│           ├── Sparkline.tsx
│           └── index.ts
│
├── contexts/
│   ├── DevFeedbackContext.tsx        # NEW
│   └── AutodevContext.tsx            # NEW
│
├── data/
│   ├── dev/                          # NEW: Dev data
│   │   ├── trackerData.ts
│   │   ├── autodevTypes.ts
│   │   └── autodevStorage.ts
│   └── ... (existing data)
│
└── lib/
    └── dev/                          # NEW: Dev utilities
        ├── feedbackStorage.ts
        └── autodevStorage.ts
```

### 5.2 Sidebar Modification

Update `/src/components/admin/AdminSidebar.tsx`:

```typescript
const navigationItems = [
  // Existing Business Operations
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },

  // Divider
  { type: 'divider' },

  // Developer Tools Section
  { type: 'section', name: 'Developer Tools' },
  { name: 'Dev Dashboard', href: '/admin/dev', icon: Terminal },
  { name: 'Tracker', href: '/admin/dev/tracker', icon: ListTodo },
  { name: 'Dev Feedback', href: '/admin/dev/feedback', icon: Bug },
  { name: 'AutoDev', href: '/admin/dev/autodev', icon: Bot },
];
```

---

## 6. Component Migration Strategy

### 6.1 Migration Approach

For each component:

1. **Copy** - Bring source component to `/components/dev/`
2. **Adapt Styling** - Update Tailwind classes to local-ide design system
3. **Update Imports** - Adjust import paths and dependencies
4. **Integrate Context** - Connect to local-ide context/state management
5. **Test** - Verify functionality and visual consistency

### 6.2 Shared Components to Create

These reusable components will be created in `/components/dev/shared/`:

| Component | Purpose | Used By |
|-----------|---------|---------|
| `ProgressRing` | Circular progress indicator | Dashboard, Tracker, AutoDev |
| `StatusBadge` | Status indicator with color coding | All |
| `Sparkline` | Mini trend chart | AutoDev |
| `GlowCard` | Card with hover glow effect | AutoDev |
| `AnimatedNumber` | Counter animation | Dashboard, AutoDev |

### 6.3 Migration Priority Order

1. **Phase 1:** Dev Dashboard (foundation)
2. **Phase 2:** Dev Tracker (core tracking)
3. **Phase 3:** Dev Feedback (overlay system)
4. **Phase 4:** AutoDev (advanced AI features)

---

## 7. Data & State Management

### 7.1 Context Architecture

```typescript
// /src/contexts/DevToolsContext.tsx
interface DevToolsContextValue {
  // Cross-tool state
  currentProject: Project | null;
  epics: Epic[];
  tasks: Task[];

  // Actions
  refreshData(): Promise<void>;
  selectEpic(epicId: string): void;
}

// /src/contexts/DevFeedbackContext.tsx
interface DevFeedbackContextValue {
  items: FeedbackItem[];
  feedbackMode: boolean;
  toggleFeedbackMode(): void;
  createFeedback(data: FeedbackFormData): Promise<void>;
  // ... (from existing FeedbackContext)
}

// /src/contexts/AutodevContext.tsx
interface AutodevContextValue {
  health: SystemHealth;
  alerts: Alert[];
  recommendations: Recommendation[];
  autonomyConfig: AutonomyConfig;
  // ... (from existing AutodevContext)
}
```

### 7.2 Storage Strategy

| Data Type | Storage | Sync |
|-----------|---------|------|
| Tracker Data | Static TypeScript files initially | Later: Supabase |
| Dev Feedback | localStorage | Later: Supabase |
| AutoDev State | localStorage | Later: Supabase/API |
| User Preferences | localStorage | Later: Supabase |

### 7.3 Demo Mode Support

All developer tools should support demo mode (like existing admin):
- Mock data when no backend connected
- Clear "Demo" indicators
- Full functionality for evaluation

---

## 8. Routing Structure

### 8.1 Route Definitions

| Route | Page | Description |
|-------|------|-------------|
| `/admin/dev` | Dev Dashboard | Main developer command center |
| `/admin/dev/tracker` | Dev Tracker | Task and epic tracking |
| `/admin/dev/tracker/[epicId]` | Epic Detail | Specific epic view (optional) |
| `/admin/dev/feedback` | Dev Feedback | Feedback management |
| `/admin/dev/autodev` | AutoDev | AI autonomous operations |
| `/admin/dev/autodev/[tab]` | AutoDev Tab | Direct link to specific tab |

### 8.2 Layout Hierarchy

```
app/(admin)/
├── layout.tsx                 # Admin outer layout
└── admin/
    ├── layout.tsx             # Main admin layout (sidebar + header)
    ├── dev/
    │   ├── layout.tsx         # Dev section layout (optional)
    │   ├── page.tsx           # Dev Dashboard
    │   ├── tracker/page.tsx   # Tracker
    │   ├── feedback/page.tsx  # Dev Feedback
    │   └── autodev/page.tsx   # AutoDev
    └── ... (existing routes)
```

---

## 9. Phase Rollout

### Phase 1: Foundation (Dev Dashboard)

**Scope:**
- Add Developer Tools section to sidebar
- Create `/admin/dev` route structure
- Migrate Dev Dashboard components
- Adapt styling to local-ide design system

**Deliverables:**
- [ ] Updated AdminSidebar with Developer Tools section
- [ ] Dev Dashboard page with epic grid
- [ ] Quick stats component
- [ ] Basic navigation between dev tools

**Components:**
- `EpicCard`
- `QuickStatsBar`
- `DashboardHeader`
- `WidgetGrid` (placeholder widgets)

### Phase 2: Core Tracking (Dev Tracker)

**Scope:**
- Full Dev Tracker implementation
- All 6 tabs functional
- Task filtering and grouping
- Progress visualization

**Deliverables:**
- [ ] Tracker page with tab navigation
- [ ] Overview tab with epic progress
- [ ] Tasks tab with filtering
- [ ] TDD tab with coverage display
- [ ] Routes tab with API documentation
- [ ] Tooling tab with commands/agents
- [ ] Architecture tab with diagrams

**Components:**
- `ProgressRing`
- `TaskList`
- `StatusBadge`
- `RoutesTab`
- `ToolingStatus`

### Phase 3: Feedback System (Dev Feedback)

**Scope:**
- Contextual feedback capture
- Floating feedback button
- Marker overlay system
- Feedback management dashboard

**Deliverables:**
- [ ] FeedbackContext provider
- [ ] Floating feedback button
- [ ] Click-to-capture mode
- [ ] Feedback form modal
- [ ] Feedback markers layer
- [ ] Feedback dashboard with filters
- [ ] Navigate-to-feedback functionality

**Components:**
- `FeedbackButton`
- `FeedbackModal`
- `FeedbackMarkerLayer`
- `FeedbackDetail`
- `FeedbackCard`

### Phase 4: AI Operations (AutoDev)

**Scope:**
- Full AutoDev dashboard
- All 6 specialized dashboards
- Autonomy configuration
- AI chat panel

**Deliverables:**
- [ ] AutodevContext provider
- [ ] Command Center dashboard
- [ ] Sentinel monitoring dashboard
- [ ] Pulse analysis dashboard
- [ ] Cortex AI intelligence dashboard
- [ ] Genesis self-healing dashboard
- [ ] Nexus configuration dashboard
- [ ] Autonomy dial control
- [ ] AI Chat panel

**Components:**
- `NeuralBackground`
- `AutonomyDial`
- `Sparkline`
- `GlowCard`
- `AnimatedNumber`
- `AIChatPanel`

---

## 10. Technical Considerations

### 10.1 Dependencies to Add

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1"  // For screenshot capture (if not present)
  }
}
```

### 10.2 TypeScript Types

Create comprehensive types in `/src/types/dev/`:

```typescript
// /src/types/dev/tracker.ts
export interface Epic { ... }
export interface Task { ... }
export type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';
export type TaskType = 'table' | 'endpoint' | 'service' | 'component' | 'test' | 'config';

// /src/types/dev/feedback.ts
export interface FeedbackItem { ... }
export type FeedbackCategory = 'bug' | 'enhancement' | 'question' | 'content';

// /src/types/dev/autodev.ts
export interface SystemHealth { ... }
export interface Alert { ... }
export type AlertLevel = 'info' | 'advisory' | 'warning' | 'critical';
```

### 10.3 Performance Considerations

- **Lazy Loading:** Use Next.js dynamic imports for AutoDev dashboards
- **Virtual Lists:** Implement for task lists with many items
- **Memoization:** Use `useMemo` for filtered/computed data
- **Code Splitting:** Separate bundles for each dev tool

### 10.4 Accessibility

- Keyboard navigation for all tabs
- ARIA labels on interactive elements
- Focus management in modals
- Color contrast compliance
- Screen reader announcements for status changes

---

## 11. Risk Assessment

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Style conflicts | Medium | Medium | Scoped CSS, component isolation |
| State management complexity | Medium | High | Clear context boundaries |
| Performance with large datasets | Low | Medium | Virtualization, pagination |
| Browser storage limits | Low | Low | Implement cleanup/archival |

### 11.2 Design Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Visual inconsistency | Medium | Medium | Design review per phase |
| Navigation confusion | Low | High | Clear section separation |
| Feature overload | Medium | Medium | Progressive disclosure |

### 11.3 Integration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feedback overlay conflicts | Medium | Medium | Z-index management |
| Route conflicts | Low | High | Consistent naming convention |
| Context conflicts | Low | Medium | Isolated providers |

---

## Appendix A: Component Inventory

### From design-system-v2 to Migrate

| Source File | Target Location | Priority |
|-------------|-----------------|----------|
| `pages/Dashboard.tsx` | `components/dev/dashboard/` | P1 |
| `components/DashboardComponents.tsx` | `components/dev/dashboard/` | P1 |
| `pages/Tracker.tsx` | `components/dev/tracker/` | P2 |
| `data/trackerData.ts` | `data/dev/trackerData.ts` | P2 |
| `pages/Feedback.tsx` | `components/dev/feedback/` | P3 |
| `contexts/FeedbackContext.tsx` | `contexts/DevFeedbackContext.tsx` | P3 |
| `data/feedbackStorage.ts` | `lib/dev/feedbackStorage.ts` | P3 |
| `components/feedback/*` | `components/dev/feedback/` | P3 |
| `pages/Autodev.tsx` | `components/dev/autodev/` | P4 |
| `contexts/AutodevContext.tsx` | `contexts/AutodevContext.tsx` | P4 |
| `data/autodevTypes.ts` | `types/dev/autodev.ts` | P4 |
| `data/autodevStorage.ts` | `lib/dev/autodevStorage.ts` | P4 |
| `components/autodev/*` | `components/dev/autodev/` | P4 |

---

## Appendix B: Sidebar Navigation Icons

Recommended Lucide icons for Developer Tools section:

| Item | Icon | Import |
|------|------|--------|
| Developer Tools (section header) | `Code2` | `lucide-react` |
| Dev Dashboard | `Terminal` | `lucide-react` |
| Tracker | `ListTodo` or `GitBranch` | `lucide-react` |
| Dev Feedback | `Bug` or `MessageSquareDashed` | `lucide-react` |
| AutoDev | `Bot` or `Cpu` | `lucide-react` |

---

## Appendix C: Color Token Reference

### Local-IDE Design Tokens (from `/src/design-system/tokens.ts`)

```typescript
// Primary colors
primary: {
  50: '#eef2ff',
  100: '#e0e7ff',
  // ...
  500: '#6366f1',  // Main primary
  600: '#4f46e5',
  // ...
  900: '#312e81',
}

// For gradients
gradient: {
  primary: 'linear-gradient(137deg, #3b82f6, #8b5cf6, #d946ef)',
  secondary: 'linear-gradient(137deg, #d946ef, #ec4899, #f43f5e)',
}
```

### Mapping from design-system-v2

```typescript
// Color mapping
const colorMap = {
  'abyss-base': 'neutral-950',
  'aqua-light': 'blue-400',
  'teal-light': 'teal-400',
  'gold-accent': 'amber-400',
  'from-purple-500': 'from-violet-500',
  'to-indigo-500': 'to-indigo-500',
};
```

---

## Next Steps

1. **Review & Approve** this plan
2. **Set up directory structure** for developer tools
3. **Begin Phase 1** with sidebar modification and Dev Dashboard
4. **Iterate** through each phase with design review checkpoints

---

*Plan created for local-ide Developer Tools integration*
