# Agent Orchestration Layer

> **The Master Directive for Multi-Agent SDLC Workflows**
>
> A unified system combining BMAD-METHOD planning rigor, ai-coding-config execution power, and foundational system intelligence for autonomous agent-to-agent handoffs.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [The Agent Hierarchy](#the-agent-hierarchy)
3. [Orchestration Principles](#orchestration-principles)
4. [Workflow Routes](#workflow-routes)
5. [Handoff Protocol](#handoff-protocol)
6. [Context Preservation](#context-preservation)
7. [Quality Gates](#quality-gates)
8. [Usage Examples](#usage-examples)

---

## Philosophy

**"One entry point. Infinite possibilities. The right agent for every task."**

This orchestration layer enables:

- **Automatic Routing**: Any development request is routed through the optimal agent sequence
- **Seamless Handoffs**: Agents pass work to each other with full context preservation
- **Complexity Scaling**: Work automatically scales from quick fixes to enterprise implementations
- **Quality Assurance**: Built-in gates ensure nothing ships without proper validation

### Core Tenets

1. **Plan First**: ALWAYS ask for their plan before anything else - if they have one, understand it deeply; if not, help build one
2. **Understand Before Acting**: Ask follow-up questions until you are 100% certain you understand the plan - never assume
3. **Specification First**: Every feature starts with a spec, not code
4. **Right Agent, Right Time**: Specialized agents handle specialized tasks
5. **Context is King**: Full context travels with every handoff
6. **Progressive Disclosure**: Load complexity on-demand, not upfront
7. **Autonomous but Supervised**: Agents work independently within guardrails

---

## The Agent Hierarchy

### Tier 1: Planning Agents (BMAD-Inspired)

These agents handle discovery, requirements, and architecture BEFORE any code is written.

| Agent | Persona | Role | Outputs |
|-------|---------|------|---------|
| **Analyst** | Mary | Research & discovery | Market analysis, user research, competitive intel |
| **Product Manager** | John | Requirements & prioritization | PRDs, user stories, acceptance criteria |
| **Architect** | Winston | System design & standards | Architecture docs, tech decisions, API specs |
| **UX Designer** | Sally | User journeys & interfaces | Wireframes, user flows, accessibility specs |
| **Scrum Master** | Bob | Sprint coordination | Epics, stories, sprint plans |

### Tier 2: Execution Agents (ai-coding-config)

These agents implement, review, and validate the code.

| Agent | Role | Specialty |
|-------|------|-----------|
| **Autonomous Developer** | End-to-end implementation | 95%+ test coverage, full CI validation |
| **Code Consistency Reviewer** | Pattern enforcement | Uniform code style |
| **Logic Reviewer** | Algorithmic validation | Correctness verification |
| **Security Reviewer** | Vulnerability detection | OWASP Top 10, 80%+ confidence |
| **Performance Reviewer** | Optimization | Speed and efficiency |
| **Test Engineer** | Test generation | 90%+ coverage targets |
| **Architecture Auditor** | Structural validation | Coupling, dependencies, patterns |

### Tier 3: Specialist Agents (Local System)

These agents handle domain-specific polish and validation.

| Agent | Invocation | Role |
|-------|------------|------|
| **UI Refinement** | `@ui-refinement` | Visual polish, spacing, animations |
| **Testing** | `@testing` | Comprehensive test suites |

### Tier 4: Utility Agents

Cross-cutting concerns and support functions.

| Agent | Role |
|-------|------|
| **Git Writer** | Version control operations |
| **Debugger** | Problem diagnosis |
| **Library Advisor** | Dependency recommendations |
| **SEO Specialist** | Search optimization |

---

## Orchestration Principles

### Principle 0: Plan First (MANDATORY)

**Before ANY orchestration begins:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MANDATORY PLAN-FIRST PROTOCOL                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ASK FOR THEIR PLAN FIRST                                        │
│     └─► "Do you have a plan for how you'd like this implemented?"  │
│     └─► Do NOT begin implementation                                 │
│     └─► Do NOT skip this step                                       │
│                                                                     │
│  2A. IF THEY HAVE A PLAN → Understand It Deeply                    │
│      └─► Let them share their complete plan                        │
│      └─► Listen without interrupting                               │
│      └─► Then ask follow-up questions:                             │
│          • "Can you tell me more about [specific part]?"           │
│          • "What's your thinking behind [decision]?"               │
│          • "How should [edge case] be handled?"                    │
│          • "What does success look like for this?"                 │
│      └─► Continue until 100% certain you understand their vision   │
│                                                                     │
│  2B. IF THEY DON'T HAVE A PLAN → Help Build One Together           │
│      └─► Guide them through plan creation:                         │
│          • "What problem are we solving?"                          │
│          • "Who are the users and what do they need?"              │
│          • "What are the key features/behaviors?"                  │
│          • "What are the constraints?"                             │
│          • "What edge cases should we handle?"                     │
│      └─► Synthesize answers into a proposed plan                   │
│      └─► Present plan for their approval                           │
│                                                                     │
│  3. CONFIRM THE PLAN                                                │
│     └─► Summarize the plan (theirs or co-created)                  │
│     └─► List assumptions explicitly                                │
│     └─► Ask: "Does this capture what you want? Should I proceed?" │
│     └─► Get explicit approval before proceeding                    │
│                                                                     │
│  4. ONLY THEN: Proceed to Complexity Detection                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**The First Questions Are Always:**

```
1. PLAN:
   "Do you have a plan for how you'd like this implemented?"
   - If YES: Please share it and I'll ask follow-up questions.
   - If NO: Let's build one together.

2. BRAND GUIDELINES (after plan is confirmed):
   "Do you have brand guidelines I should follow?"
   - If YES: Please share them (colors, typography, tone, style).
   - If NO: Let's establish some basic guidelines together.
```

**MANDATORY: Save to Project JSON (Single Source of Truth):**
```
Create/update the project JSON file:

Location: /docs/planning/projects/[project-id].json

This file contains EVERYTHING:
• meta: Project info, status, dates
• plan: Problem, goals, user stories, constraints
• brand: Colors, typography, tone, style
• epics: All features broken into tasks
• routes: API endpoints
• activity: Change log

Template: /docs/planning/projects/_template.json
Schema: /docs/planning/PROJECT-SCHEMA.json

This powers the Dev Dashboard at /admin/dev/tracker

DO NOT proceed until the project JSON is saved.
```

**During Development: Keep JSON Updated:**
```
As you work on tasks:
1. Update task status: pending → in-progress → complete
2. Log significant actions in the activity array
3. The Dev Dashboard reads from this file in real-time
```

### Principle 1: Complexity Detection

Every request is automatically classified:

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLEXITY ROUTER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QUICK (10-30 min)                                         │
│  ├─ Single file changes                                     │
│  ├─ Bug fixes with clear scope                             │
│  ├─ Minor UI adjustments                                    │
│  └─ Route: Developer → Test → Done                         │
│                                                             │
│  BALANCED (30 min - 2 hours)                               │
│  ├─ Multi-file features                                     │
│  ├─ API endpoints with UI                                   │
│  ├─ Component systems                                       │
│  └─ Route: Plan → Develop → Review → Test → Polish         │
│                                                             │
│  DEEP (2+ hours)                                            │
│  ├─ Architectural changes                                   │
│  ├─ New subsystems                                          │
│  ├─ Security-critical features                              │
│  └─ Route: Full SDLC with all planning agents              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Principle 2: Phase Dependencies

Phases execute in strict order with gates:

```
PLAN ──gate──► SCAFFOLD ──gate──► UI ──gate──► LOGIC
                                                  │
                                                  ▼
DEPLOY ◄──gate── POLISH ◄──gate── TEST ◄──gate── INTEGRATION
```

### Principle 3: Parallel Where Possible

Independent work streams run concurrently:

```
                    ┌─── Security Review ───┐
                    │                       │
Feature Complete ───┼─── Code Review ───────┼──► Synthesis ──► Merge
                    │                       │
                    └─── Performance Review ─┘
```

---

## Workflow Routes

### Route 1: Feature Development (BALANCED+)

**Trigger**: "Build a new feature...", "Implement...", "Create..."

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DISCOVERY (Analyst)                                     │
│     └─► Research existing patterns                          │
│     └─► Identify user needs                                 │
│     └─► Output: Discovery Brief                             │
│                                                             │
│  2. SPECIFICATION (Product Manager)                         │
│     └─► Write user stories                                  │
│     └─► Define acceptance criteria                          │
│     └─► Output: Feature Spec → /docs/features/{name}.md    │
│                                      │                      │
│                    ┌─────────────────┘                      │
│                    ▼                                        │
│  3. ARCHITECTURE (Architect)                                │
│     └─► Design data models                                  │
│     └─► Define API contracts                                │
│     └─► Output: Technical Spec                              │
│                                                             │
│  4. IMPLEMENTATION (Autonomous Developer)                   │
│     └─► /dev scaffold                                       │
│     └─► /dev ui                                             │
│     └─► /dev logic                                          │
│     └─► /dev animation                                      │
│     └─► /dev integration                                    │
│                                                             │
│  5. VALIDATION (Multi-Agent Review)                         │
│     └─► @testing [files]                                    │
│     └─► Security Review                                     │
│     └─► Performance Review                                  │
│     └─► Logic Review                                        │
│                                                             │
│  6. POLISH (UI Refinement)                                  │
│     └─► @ui-refinement [path] full-audit                   │
│                                                             │
│  7. DELIVERY                                                │
│     └─► PR Creation                                         │
│     └─► Bot feedback resolution                             │
│     └─► Merge                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Route 2: Bug Fix (QUICK)

**Trigger**: "Fix the bug...", "Debug...", "This is broken..."

```
┌─────────────────────────────────────────────────────────────┐
│                    BUG FIX WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DIAGNOSIS (Debugger)                                    │
│     └─► Reproduce the issue                                 │
│     └─► Identify root cause                                 │
│     └─► Output: Diagnosis Report                            │
│                                                             │
│  2. FIX (Autonomous Developer)                              │
│     └─► Implement fix                                       │
│     └─► Add regression test                                 │
│                                                             │
│  3. VERIFY (/verify-fix)                                    │
│     └─► Run test suite                                      │
│     └─► Confirm fix                                         │
│                                                             │
│  4. COMMIT                                                  │
│     └─► Create commit with fix description                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Route 3: Refactor (BALANCED)

**Trigger**: "Refactor...", "Clean up...", "Simplify..."

```
┌─────────────────────────────────────────────────────────────┐
│                    REFACTOR WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ANALYSIS (Architecture Auditor)                         │
│     └─► Identify code smells                                │
│     └─► Map dependencies                                    │
│     └─► Output: Refactor Plan                               │
│                                                             │
│  2. SIMPLIFY (Simplifier Agent)                             │
│     └─► Reduce complexity                                   │
│     └─► Extract patterns                                    │
│     └─► Remove duplication                                  │
│                                                             │
│  3. VALIDATE                                                │
│     └─► Run existing tests                                  │
│     └─► Code review                                         │
│                                                             │
│  4. COMMIT                                                  │
│     └─► Atomic commits per change                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Route 4: Code Review (ON-DEMAND)

**Trigger**: "Review this code...", "Check this PR..."

```
┌─────────────────────────────────────────────────────────────┐
│                    REVIEW WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PARALLEL REVIEW DISPATCH                                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Code Consistency│  │  Logic Review   │                  │
│  │     Review      │  │                 │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────┴────────┐  ┌────────┴────────┐                  │
│  │ Security Review │  │ Performance Rev │                  │
│  │  (if critical)  │  │  (if applicable)│                  │
│  └────────┬────────┘  └────────┴────────┘                  │
│           │                    │                            │
│           └────────┬───────────┘                            │
│                    ▼                                        │
│           ┌────────────────┐                                │
│           │   SYNTHESIS    │                                │
│           │ Prioritized    │                                │
│           │ Action Items   │                                │
│           └────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Route 5: Architecture Design (DEEP)

**Trigger**: "Design the architecture...", "How should we structure..."

```
┌─────────────────────────────────────────────────────────────┐
│                 ARCHITECTURE WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. RESEARCH (Analyst)                                      │
│     └─► Study similar systems                               │
│     └─► Identify patterns                                   │
│     └─► Output: Research Summary                            │
│                                                             │
│  2. REQUIREMENTS (Product Manager)                          │
│     └─► Clarify constraints                                 │
│     └─► Define non-functionals                              │
│     └─► Output: Requirements Doc                            │
│                                                             │
│  3. DESIGN (Architect)                                      │
│     └─► Create system diagram                               │
│     └─► Define components                                   │
│     └─► Specify interfaces                                  │
│     └─► Output: Architecture Doc                            │
│                                                             │
│  4. VALIDATION (Architecture Auditor)                       │
│     └─► Review for anti-patterns                            │
│     └─► Check coupling                                      │
│     └─► Verify scalability                                  │
│                                                             │
│  5. DOCUMENTATION                                           │
│     └─► ADRs (Architecture Decision Records)                │
│     └─► Diagrams                                            │
│     └─► API specifications                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Handoff Protocol

### The Handoff Packet

Every agent-to-agent handoff includes a standardized context packet:

```yaml
handoff:
  from: "Product Manager"
  to: "Architect"
  timestamp: "2024-01-15T10:30:00Z"

  context:
    task_id: "feature-user-dashboard"
    complexity: "balanced"
    phase: "specification → architecture"

  deliverables:
    - path: "/docs/features/user-dashboard.md"
      type: "feature-spec"
      status: "complete"

  decisions:
    - "Using Supabase for real-time updates"
    - "Dashboard will have 4 main sections"

  blockers: []

  next_steps:
    - "Design data models for user metrics"
    - "Define API endpoints for dashboard data"
    - "Specify component architecture"

  quality_gates_passed:
    - "User stories validated"
    - "Acceptance criteria defined"
    - "Stakeholder approval received"
```

### Handoff Triggers

| From | To | Trigger Condition |
|------|-----|-------------------|
| Analyst | Product Manager | Research complete, needs prioritization |
| Product Manager | Architect | Spec complete, needs technical design |
| Architect | Autonomous Developer | Technical spec approved |
| Developer | Test Engineer | Implementation complete |
| Test Engineer | UI Refinement | Tests passing, needs polish |
| UI Refinement | Security Reviewer | Polish complete, needs audit |
| Security Reviewer | Git Writer | All reviews passed |

### Handoff Syntax

Agents use explicit handoff declarations:

```markdown
## HANDOFF: Developer → Test Engineer

**Task**: user-dashboard implementation complete

**Files Modified**:
- src/components/Dashboard/index.tsx
- src/components/Dashboard/MetricsCard.tsx
- src/app/api/dashboard/route.ts

**Test Requirements**:
- Unit tests for all components
- Integration tests for API
- E2E test for user flow

**Context Preserved**:
- User stories from /docs/features/user-dashboard.md
- API spec from architect review

**Next Agent Action**: @testing src/components/Dashboard/
```

---

## Context Preservation

### Session Persistence

Critical context survives across conversations:

```
~/.claude-sessions/
├── {session-id}/
│   ├── metadata.json      # Task, branch, timestamp
│   ├── context.md         # Decisions, constraints
│   ├── progress.json      # Completed/pending steps
│   ├── files.json         # Key files modified
│   └── handoffs.json      # Handoff history
```

### Commands

| Command | Purpose |
|---------|---------|
| `/session save [name]` | Persist current context |
| `/session resume [name]` | Restore previous context |
| `/session list` | Show available sessions |
| `/handoff-context` | Generate handoff packet |

### Token-Efficient Context Loading

```markdown
## Context Loading Protocol

1. ALWAYS use /load-rules to load only relevant rules
2. Reference specs by path, don't duplicate content
3. Summarize previous phases, don't repeat verbatim
4. Use structured handoff packets for transitions
```

---

## Quality Gates

### Gate 1: Pre-Implementation

Must pass before any code:
- [ ] User stories defined
- [ ] Acceptance criteria clear
- [ ] Technical approach approved
- [ ] Dependencies identified

### Gate 2: Pre-Commit

Must pass before committing:
- [ ] Design tokens validated (no hardcoded values)
- [ ] TypeScript types checked
- [ ] ESLint/Prettier passed
- [ ] Unit tests passing

### Gate 3: Pre-Merge

Must pass before merging:
- [ ] 80%+ test coverage
- [ ] Security review passed (if applicable)
- [ ] Performance benchmarks met
- [ ] Code review approved
- [ ] CI pipeline green

### Gate 4: Pre-Deploy

Must pass before deployment:
- [ ] E2E tests passing
- [ ] Lighthouse 95+ (performance)
- [ ] Accessibility audit passed
- [ ] Documentation updated

---

## Usage Examples

### Example 1: New Feature Request

**User Input**:
```
Build a user notifications system with real-time updates
```

**Orchestrator Response**:
```
COMPLEXITY DETECTED: DEEP (new subsystem with real-time)

WORKFLOW: Full Feature Development

PHASE 1 - DISCOVERY
├─ Routing to: Analyst Agent
├─ Task: Research notification patterns, real-time technologies
└─ Expected Output: Discovery Brief

PHASE 2 - SPECIFICATION
├─ Routing to: Product Manager Agent
├─ Task: Define user stories, notification types, preferences
└─ Expected Output: /docs/features/notifications.md

PHASE 3 - ARCHITECTURE
├─ Routing to: Architect Agent
├─ Task: Design real-time infrastructure, data models
└─ Expected Output: Technical specification

[Phases 4-7 queued...]

Proceeding with Phase 1. Agent: Analyst
```

### Example 2: Quick Bug Fix

**User Input**:
```
The submit button on the contact form isn't working
```

**Orchestrator Response**:
```
COMPLEXITY DETECTED: QUICK (single component issue)

WORKFLOW: Bug Fix

PHASE 1 - DIAGNOSIS
├─ Routing to: Debugger Agent
├─ Action: Investigate contact form submit handler
└─ Files: src/components/ContactForm/

[Automatic progression after diagnosis...]
```

### Example 3: Code Review Request

**User Input**:
```
Review the changes in PR #42
```

**Orchestrator Response**:
```
COMPLEXITY DETECTED: BALANCED (standard review)

WORKFLOW: Multi-Agent Review

DISPATCHING PARALLEL REVIEWS:
├─ Code Consistency Reviewer: Checking patterns
├─ Logic Reviewer: Validating correctness
├─ Security Reviewer: Checking vulnerabilities
└─ Performance Reviewer: Checking efficiency

Synthesis will follow when all reviews complete.
```

---

## Agent Invocation Reference

### Planning Agents

```markdown
@analyst         - Research and discovery
@pm              - Product management
@architect       - System architecture
@ux              - User experience design
@scrum-master    - Sprint coordination
```

### Execution Agents

```markdown
@developer       - Autonomous implementation
@testing         - Test generation
@security        - Security review
@performance     - Performance optimization
@auditor         - Architecture audit
```

### Specialist Agents

```markdown
@ui-refinement   - Visual polish
@simplifier      - Complexity reduction
@debugger        - Problem diagnosis
```

### Workflow Commands

```markdown
/plan-feature [name]           - Start feature planning
/dev [component] [phase]       - Execute development phase
/multi-review [depth]          - Run parallel reviews
/autotask [description]        - Full autonomous execution
/verify-fix                    - Validate bug fix
/session save|resume|list      - Context management
```

---

## Next Steps

See these companion documents:

1. **[AGENT-REGISTRY.md](./AGENT-REGISTRY.md)** - Complete agent catalog with capabilities
2. **[HANDOFF-PROTOCOLS.md](./HANDOFF-PROTOCOLS.md)** - Detailed handoff specifications
3. **[WORKFLOW-ROUTES.md](./WORKFLOW-ROUTES.md)** - All workflow patterns
4. **[START.md](../.claude/START.md)** - Universal entry point (use this!)

---

*This orchestration layer is the synthesis of BMAD-METHOD planning rigor, ai-coding-config execution power, and foundational system intelligence. It enables any development task to flow through the optimal agent sequence automatically.*
