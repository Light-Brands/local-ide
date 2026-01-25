# START HERE

> **The Universal Entry Point for AI-Orchestrated Development**
>
> This single file routes ANY development request through the optimal agent sequence.
> Just describe what you want to build, fix, or improve - the system handles the rest.

---

## CRITICAL: Plan First (MANDATORY)

**Before ANY work begins, the following MUST happen:**

### Step 0: Request Their Plan (ALWAYS FIRST)

When you receive ANY development request:

1. **Ask For Their Plan First**
   ```
   Before we begin, do you have a plan for how you'd like this implemented?

   - If YES: Please share your plan and I'll ask follow-up questions to make sure I fully understand it.
   - If NO: No problem! Let's build one together. I'll ask you some questions to help us create a solid plan.
   ```

2. **If They Have a Plan → Understand It Deeply**
   - Let them share their complete plan first
   - DO NOT interrupt or start working
   - Once they've shared it, ask follow-up questions:
     - "Can you tell me more about [specific part of their plan]?"
     - "What's your thinking behind [specific decision]?"
     - "How do you envision [specific interaction/flow]?"
     - "What should happen when [edge case]?"
   - Continue asking questions until you are **100% certain** you understand their vision

3. **If They Don't Have a Plan → Help Build One**
   - Guide them through creating a plan by asking:
     - "What problem are we trying to solve?"
     - "Who are the users and what do they need?"
     - "What does success look like?"
     - "What are the key features or behaviors?"
     - "What are the constraints (technical, time, etc.)?"
     - "What edge cases should we handle?"
   - Synthesize their answers into a proposed plan
   - Present the plan back to them for approval

4. **Ask For Brand Guidelines**
   ```
   Do you have brand guidelines I should follow?

   - If YES: Please share them (colors, typography, tone, visual style)
   - If NO: Let's establish some basic guidelines together so everything stays consistent.
   ```

5. **If They Don't Have Brand Guidelines → Help Create Them**
   - Guide them through establishing basics:
     - Primary, secondary, and accent colors
     - Typography preferences (fonts, sizes)
     - Tone and voice (formal, casual, playful, professional)
     - Visual style (modern, minimal, bold, classic)
     - Any reference sites or designs they like
   - Document these for consistent use throughout the project

6. **Save to Project JSON (MANDATORY - Single Source of Truth)**
   - ALWAYS create/update the project JSON file before any implementation:
     - Location: `/docs/planning/projects/[project-id].json`
   - This single file contains EVERYTHING:
     - `meta`: Project name, status, dates
     - `plan`: Problem, goals, user stories, constraints
     - `brand`: Colors, typography, tone, style
     - `epics`: All features broken into tasks
     - `activity`: Change log
   - Use the template: `/docs/planning/projects/_template.json`
   - Use the schema: `/docs/planning/PROJECT-SCHEMA.json`
   - This powers the Dev Dashboard at `/admin/dev/tracker`

7. **Confirm Everything Before Proceeding**
   - Share the project.json file location with the user
   - Summarize: "I've saved the project to `/docs/planning/projects/[project-id].json`"
   - Get explicit approval: "Does this capture what you want? Should I proceed?"
   - DO NOT begin implementation until they confirm

8. **During Development: Keep Project JSON Updated**
   - As you work, update task statuses in the JSON
   - Log significant actions in the `activity` array
   - This keeps the Dev Dashboard in sync with actual progress

---

## How to Use

### Option 1: Natural Language (Recommended)

Simply describe what you want:

```
"Build a user notifications system with real-time updates"
"Fix the submit button on the contact form"
"Refactor the authentication module"
"Review the changes in PR #42"
"Design the database schema for user analytics"
```

The orchestrator will:
1. **FIRST: Ask if you have a plan** (MANDATORY)
2. **If no plan: Help you build one together**
3. **If plan exists: Ask follow-up questions to understand it deeply**
4. Detect complexity (quick/balanced/deep)
5. Identify task type (feature/bugfix/refactor/review/architecture)
6. Route through the optimal agent sequence
7. Handle all handoffs automatically
8. Ensure quality gates pass

### Option 2: Explicit Commands

Use commands for direct control:

| Command | Purpose | Complexity |
|---------|---------|------------|
| `/autotask [description]` | Full autonomous execution | Auto |
| `/plan-feature [name]` | Start feature planning | BALANCED+ |
| `/dev [component] [phase]` | Execute development phase | Inherits |
| `/multi-review [quick\|balanced\|deep]` | Parallel code review | Specified |
| `/verify-fix` | Validate bug fix | QUICK |
| `/session save\|resume\|list` | Context management | N/A |

### Option 3: Direct Agent Invocation

Call specific agents:

```
@analyst - Research and discovery
@pm - Product management
@architect - System architecture
@developer - Implementation
@testing [file] - Test generation
@security - Security review
@ui-refinement [path] [focus] - Visual polish
@debugger - Bug diagnosis
```

---

## The Orchestration System

### Complexity Detection

Your request is automatically classified:

| Complexity | Signals | Pipeline |
|------------|---------|----------|
| **QUICK** | Single file, bug fix, style change | Developer → Test → Commit |
| **BALANCED** | Multi-file, component + API, enhancement | PM → Architect → Dev → Test → Review → Polish |
| **DEEP** | New subsystem, architectural, security-critical | Full planning + all agents |

### Task Type Detection

| Type | Trigger Words | Route |
|------|---------------|-------|
| Feature | "build", "create", "implement", "add" | Feature Workflow |
| Bug Fix | "fix", "broken", "doesn't work", "error" | Bug Fix Workflow |
| Refactor | "refactor", "clean up", "simplify" | Refactor Workflow |
| Review | "review", "check", "audit" | Review Workflow |
| Architecture | "design", "architect", "structure" | Architecture Workflow |

---

## Workflow Overview

### Feature Development (Most Common)

```
┌─────────────────────────────────────────────────────────────┐
│                     FEATURE WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QUICK                    BALANCED                DEEP      │
│  ┌──────────────┐        ┌──────────────┐        ┌────────┐│
│  │  Developer   │        │      PM      │        │Analyst ││
│  │     ↓        │        │      ↓       │        │   ↓    ││
│  │   Testing    │        │   Architect  │        │  PM    ││
│  │     ↓        │        │      ↓       │        │   ↓    ││
│  │   Commit     │        │  Developer   │        │Architect│
│  └──────────────┘        │      ↓       │        │   ↓    ││
│                          │   Testing    │        │  UX    ││
│                          │      ↓       │        │   ↓    ││
│                          │   Review     │        │Scrum   ││
│                          │      ↓       │        │   ↓    ││
│                          │   Polish     │        │Developer│
│                          │      ↓       │        │   ↓    ││
│                          │   Commit     │        │Testing ││
│                          └──────────────┘        │   ↓    ││
│                                                  │Review  ││
│                                                  │   ↓    ││
│                                                  │Polish  ││
│                                                  │   ↓    ││
│                                                  │Commit  ││
│                                                  └────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Reference

### Planning Tier

| Agent | Persona | Invocation | Role |
|-------|---------|------------|------|
| Analyst | Mary | `@analyst` | Research, discovery, feasibility |
| Product Manager | John | `@pm` | User stories, specs, priorities |
| Architect | Winston | `@architect` | System design, data models, APIs |
| UX Designer | Sally | `@ux` | Journeys, wireframes, accessibility |
| Scrum Master | Bob | `@scrum-master` | Epics, stories, sprint planning |

### Execution Tier

| Agent | Invocation | Role |
|-------|------------|------|
| Autonomous Developer | `@developer` | End-to-end implementation |
| Test Engineer (Tessa) | `@testing [file]` | Test generation, coverage |
| Security Reviewer | `@security` | OWASP, vulnerabilities |
| Performance Reviewer | `@performance` | Speed, efficiency |
| Architecture Auditor (Victor) | `@auditor` | Code smells, coupling |

### Specialist Tier

| Agent | Invocation | Role |
|-------|------------|------|
| UI Refinement | `@ui-refinement [path] [focus]` | Visual polish |
| Simplifier | `@simplifier` | Complexity reduction |
| Debugger | `@debugger` | Bug diagnosis |

### Focus Areas for UI Refinement

```
@ui-refinement src/components/Button.tsx spacing
@ui-refinement src/components/Card.tsx colors
@ui-refinement src/components/Modal.tsx animation
@ui-refinement src/components/Form.tsx full-audit
```

---

## Development Phases

When using `/dev [component] [phase]`:

| Phase | Purpose | Output |
|-------|---------|--------|
| `scaffold` | File structure | Component shells, types |
| `ui` | Visual layer | Design token compliance |
| `logic` | Interactivity | State, handlers, hooks |
| `animation` | Motion | Micro-interactions |
| `integration` | API connection | Data fetching |
| `test` | Test suite | 80%+ coverage |
| `polish` | Final touches | Production-ready |

---

## Quality Gates

### Every Commit Must Pass

- [ ] Design tokens validated (no hardcoded values)
- [ ] TypeScript clean
- [ ] ESLint/Prettier passed
- [ ] Unit tests passing

### Every PR Must Pass

- [ ] 80%+ test coverage
- [ ] Security review (if applicable)
- [ ] Performance benchmarks met
- [ ] Code review approved

### Every Deploy Must Pass

- [ ] E2E tests passing
- [ ] Lighthouse 95+
- [ ] Accessibility audit passed

---

## Quick Start Examples

### Example 1: Build a Feature

**You say:**
```
Build a user dashboard with activity metrics
```

**System responds:**
```
COMPLEXITY: BALANCED (new component with data)
WORKFLOW: Feature Development

Starting Phase 1: Specification
├─ Agent: Product Manager
├─ Action: Creating feature spec
└─ Output: /docs/features/user-dashboard.md

[Proceeds through all phases automatically...]
```

### Example 2: Fix a Bug

**You say:**
```
The login form shows an error even when credentials are correct
```

**System responds:**
```
COMPLEXITY: QUICK (targeted bug fix)
WORKFLOW: Bug Fix

Phase 1: Diagnosis
├─ Agent: Debugger
├─ Action: Investigating login flow
└─ Focus: Form validation and API response handling

[Diagnoses, fixes, tests, commits...]
```

### Example 3: Code Review

**You say:**
```
Review the authentication changes
```

**System responds:**
```
COMPLEXITY: BALANCED (security-relevant)
WORKFLOW: Multi-Agent Review

Dispatching parallel reviews:
├─ Security Reviewer: Checking auth patterns
├─ Logic Reviewer: Verifying correctness
├─ Code Consistency: Checking patterns
└─ Performance: Checking efficiency

[Reviews run in parallel, synthesizes findings...]
```

---

## Context Management

### Save Your Work

```
/session save my-feature
```

Persists:
- Current task state
- Decisions made
- Files modified
- Handoff history

### Resume Later

```
/session resume my-feature
```

Restores full context and continues from where you left off.

### List Sessions

```
/session list
```

Shows all saved sessions with status.

---

## Best Practices

### 1. Let the System Classify

Don't overthink complexity - describe your task naturally and let the orchestrator route it.

### 2. Trust the Sequence

Agents hand off to each other automatically. You don't need to manage transitions.

### 3. Use Specifications

For any non-trivial feature, the spec (at `/docs/features/{name}.md`) becomes the single source of truth.

### 4. Check Quality Gates

If something fails, the system will tell you what to fix before proceeding.

### 5. Save Context

For multi-session work, use `/session save` before stopping.

---

## System Architecture

```
                         ┌──────────────────────┐
                         │      START.md        │
                         │  (You are here)      │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   ORCHESTRATOR.md    │
                         │  (Routing logic)     │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
   ┌──────────▼──────────┐ ┌───────▼────────┐ ┌──────────▼──────────┐
   │  AGENT-REGISTRY.md  │ │ WORKFLOW-      │ │ HANDOFF-            │
   │  (All agents)       │ │ ROUTES.md      │ │ PROTOCOLS.md        │
   │                     │ │ (All flows)    │ │ (Transitions)       │
   └─────────────────────┘ └────────────────┘ └─────────────────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                         ┌──────────▼───────────┐
                         │    EXECUTION         │
                         │  (Agents working)    │
                         └──────────────────────┘
```

---

## File Locations

| File | Purpose |
|------|---------|
| `.claude/START.md` | This file - universal entry point |
| `docs/orchestration/ORCHESTRATOR.md` | Master orchestration directive |
| `docs/orchestration/AGENT-REGISTRY.md` | Complete agent catalog |
| `docs/orchestration/WORKFLOW-ROUTES.md` | All workflow patterns |
| `docs/orchestration/HANDOFF-PROTOCOLS.md` | Agent-to-agent transitions |
| `ai-workflows/skills/` | Custom commands |
| `ai-workflows/subagents/` | Specialist agents |
| `docs/features/` | Feature specifications |

---

## Getting Help

### See All Commands
```
/help
```

### Understand an Agent
```
What does @architect do?
```

### Debug the System
```
Why did this route to [agent]?
```

---

**Ready to start? Just describe what you want to build.**

*The orchestration system will take it from there.*
